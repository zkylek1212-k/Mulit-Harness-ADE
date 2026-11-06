// Cowork 的 git 操作：讀基線、建立唯讀規劃用的快照、偵測副作用、清掉快照。
// 只用 node 內建模組，scripts/check-cowork.mts 可以直接在暫存 repo 上測。
import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

export function git(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    // fsmonitor 是 repo 設定就能指定的執行點：harness 自己的 git 指令一律關掉
    execFile('git', ['-c', 'core.fsmonitor=false', ...args], { cwd, maxBuffer: 32 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
      if (err) reject(new Error((stderr || err.message).trim()))
      else resolve(stdout)
    })
  })
}

export interface Baseline {
  root: string
  commonDir: string
  branch: string
  head: string
  /** 未提交的檔案（含 untracked）；規劃以 head 快照進行，這些不會被看到 */
  dirty: string[]
  /** merge／rebase 進行中之類的狀態提醒 */
  warnings: string[]
}

/** 讀工作區的 git 基線。不是 git repo、還沒有 commit 都會丟出可讀的錯誤 */
export async function readBaseline(dir: string): Promise<Baseline> {
  let root: string
  try {
    root = (await git(dir, ['rev-parse', '--show-toplevel'])).trim()
  } catch {
    throw new Error('not-a-git-repo')
  }
  let head: string
  try {
    head = (await git(root, ['rev-parse', '--verify', 'HEAD'])).trim()
  } catch {
    throw new Error('no-commits')
  }
  const commonDir = path.resolve(root, (await git(root, ['rev-parse', '--git-common-dir'])).trim())
  const gitDir = path.resolve(root, (await git(root, ['rev-parse', '--git-dir'])).trim())
  const branch = (await git(root, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim()
  const status = await git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all'])
  const dirty: string[] = []
  const parts = status.split('\0')
  for (let i = 0; i < parts.length; i++) {
    const entry = parts[i]
    if (entry.length < 4) continue
    dirty.push(entry.slice(3))
    // rename／copy 後面多一段原路徑
    if (entry[0] === 'R' || entry[0] === 'C') i++
  }
  const warnings: string[] = []
  for (const [file, label] of [
    ['MERGE_HEAD', 'merge-in-progress'],
    ['rebase-merge', 'rebase-in-progress'],
    ['rebase-apply', 'rebase-in-progress'],
    ['CHERRY_PICK_HEAD', 'cherry-pick-in-progress']
  ] as const) {
    if (fs.existsSync(path.join(gitDir, file)) && !warnings.includes(label)) warnings.push(label)
  }
  return { root: path.resolve(root), commonDir, branch, head, dirty, warnings }
}

/**
 * 快照放在 repo 的 git common dir 底下（<commonDir>/cowork/<runId>/snapshot）。
 * 不放 userData 的原因：codex 的 Windows sandbox 讀不到使用者目錄（2026-10-07 實測），
 * 放在 repo 旁邊才跟 repo 本身同一套權限。.git 底下也不會被專案檔案樹監看。
 */
export function snapshotDirFor(commonDir: string, runId: string): string {
  return path.join(commonDir, 'cowork', runId, 'snapshot')
}

/** 以 --shared 複製（物件走 alternates，不實際複製），再 checkout 到基線 commit */
export async function createSnapshot(root: string, dir: string, commit: string): Promise<void> {
  if (fs.existsSync(dir)) removeTree(dir)
  fs.mkdirSync(path.dirname(dir), { recursive: true })
  await git(path.dirname(dir), ['clone', '--quiet', '--shared', '--no-checkout', '--', root, dir])
  await git(dir, ['-c', 'advice.detachedHead=false', 'checkout', '--quiet', '--detach', commit])
}

/**
 * 回傳快照相對基線的所有變動；空陣列代表乾淨。
 * --ignored 也要看：新快照沒有被忽略的檔，寫進 out/ 之類的目錄一樣算副作用。
 */
export async function snapshotChanges(dir: string, commit: string): Promise<string[]> {
  const changes: string[] = []
  const head = (await git(dir, ['rev-parse', 'HEAD'])).trim()
  if (head !== commit) changes.push(`HEAD moved: ${commit.slice(0, 12)} -> ${head.slice(0, 12)}`)
  const status = await git(dir, ['status', '--porcelain=v1', '--untracked-files=all', '--ignored'])
  for (const line of status.split(/\r?\n/)) if (line.trim()) changes.push(line)
  return changes
}

/** 只刪 mustBeUnder 底下的路徑，絕不遞迴刪到 repo 本身或外部連結指向的位置 */
export function removeSnapshot(dir: string, mustBeUnder: string): void {
  if (!fs.existsSync(dir)) return
  const real = fs.realpathSync(dir)
  const base = fs.realpathSync(mustBeUnder)
  const rel = path.relative(base, real)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`refusing to delete ${real}: not under ${base}`)
  }
  removeTree(real)
  // 順手把空掉的 run 目錄與 cowork 目錄收掉
  for (let p = path.dirname(real); p !== base && p.startsWith(base); p = path.dirname(p)) {
    try {
      fs.rmdirSync(p)
    } catch {
      break
    }
  }
  try {
    fs.rmdirSync(base)
  } catch {
    /* 還有其他 run 的快照 */
  }
}

/** Windows 上 git 會把部分檔案設成唯讀，直接 rm 會 EPERM：先解除唯讀再刪 */
function removeTree(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 })
  } catch {
    const walk = (p: string): void => {
      for (const e of fs.readdirSync(p, { withFileTypes: true })) {
        const full = path.join(p, e.name)
        if (e.isDirectory() && !e.isSymbolicLink()) walk(full)
        else
          try {
            fs.chmodSync(full, 0o666)
          } catch {
            /* 盡力而為 */
          }
      }
    }
    walk(dir)
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 })
  }
}

/**
 * scope 路徑若經由 symlink／junction 跨出工作樹就回傳說明，否則 null。
 * 路徑本身還不存在（任務要新建的檔）時，檢查已存在的最長前綴。
 */
export function scopeEscapes(treeRoot: string, relPath: string): string | null {
  const base = fs.realpathSync(treeRoot)
  let probe = path.resolve(treeRoot, relPath)
  while (!fs.existsSync(probe)) {
    const parent = path.dirname(probe)
    if (parent === probe) return null
    probe = parent
  }
  const real = fs.realpathSync(probe)
  const rel = path.relative(base, real)
  if (rel.startsWith('..') || path.isAbsolute(rel)) return `${relPath} resolves outside the repository (${real})`
  return null
}

// ── 背景執行用的 worktree（放在 repo 內的 .cowork/<runId>/，git worktree list 與分支清單都看得到） ──

/** 把 .cowork/ 加進本機的 .git/info/exclude：主工作區的 git status 保持乾淨，也不動 repo 追蹤的 .gitignore */
export function excludeCoworkDir(commonDir: string): void {
  const file = path.join(commonDir, 'info', 'exclude')
  let text = ''
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch {
    /* 還沒有這個檔 */
  }
  if (text.split(/\r?\n/).some((l) => l.trim() === '.cowork/')) return
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.appendFileSync(file, `${text && !text.endsWith('\n') ? '\n' : ''}# Agent Workbench Cowork worktrees\n.cowork/\n`)
}

export async function addWorktree(repoRoot: string, dir: string, branch: string, base: string): Promise<void> {
  fs.mkdirSync(path.dirname(dir), { recursive: true })
  // 分支已存在就失敗（不覆寫使用者或上一場會議的分支）
  await git(repoRoot, ['worktree', 'add', '-b', branch, dir, base])
}

/** 主工作區有 node_modules、且 worktree 會忽略它時，用 junction 連過去（不用再安裝；也不會被 commit） */
export async function linkNodeModules(repoRoot: string, worktree: string): Promise<boolean> {
  const src = path.join(repoRoot, 'node_modules')
  const dst = path.join(worktree, 'node_modules')
  if (!fs.existsSync(src) || fs.existsSync(dst)) return false
  try {
    await git(worktree, ['check-ignore', '-q', 'node_modules'])
  } catch {
    return false // 沒被忽略：連過去會被 git add -A 收進 commit
  }
  fs.symlinkSync(src, dst, 'junction')
  return true
}

/** repo 沒設 user.name／user.email 時（commit、cherry-pick、merge 都需要）用的身分；有設就用使用者的 */
async function identity(dir: string): Promise<string[]> {
  const has = async (k: string): Promise<boolean> => !!(await git(dir, ['config', k]).catch(() => '')).trim()
  if ((await has('user.name')) && (await has('user.email'))) return []
  return ['-c', 'user.name=Agent Workbench Cowork', '-c', 'user.email=cowork@agent-workbench.invalid']
}

/** 指定只跑核准時匯出的 hook 副本；沒有副本（舊紀錄）就維持 git 原本的行為 */
function hookArgs(hooksDir?: string): string[] {
  return hooksDir ? ['-c', `core.hooksPath=${hooksDir.replace(/\\/g, '/')}`] : []
}

/** 把 worktree 的所有變動 commit；沒有變動回 null */
export async function commitAll(dir: string, message: string, hooksDir?: string): Promise<string | null> {
  await git(dir, ['add', '-A'])
  try {
    await git(dir, ['diff', '--cached', '--quiet'])
    return null
  } catch {
    /* 有變動 */
  }
  await git(dir, [...hookArgs(hooksDir), ...(await identity(dir)), 'commit', '-q', '-m', message])
  return (await git(dir, ['rev-parse', 'HEAD'])).trim()
}

/**
 * 這一輪改了哪些檔（相對 worktree，含新增、刪除；改名拆成刪舊＋加新）。
 * 先 git add -A 再看 index：和接下來 commitAll 收進去的內容一致，也看得到 agent 自己 stage 的檔。
 */
export async function changedFiles(dir: string): Promise<string[]> {
  await git(dir, ['add', '-A'])
  const out = await git(dir, ['diff', '--cached', '--name-only', '--no-renames', '-z'])
  return out.split('\0').filter(Boolean)
}

/** 把指定的檔還原成 HEAD 的內容；HEAD 沒有的（新增的）直接刪掉。路徑必須是 changedFiles 回傳的相對路徑 */
export async function revertFiles(dir: string, files: string[]): Promise<void> {
  if (!files.length) return
  const base = fs.realpathSync(dir)
  for (const f of files) {
    const abs = path.resolve(base, f)
    const rel = path.relative(base, abs)
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`refusing to revert a path outside the worktree: ${f}`)
    await git(dir, ['reset', '-q', '--', f]).catch(() => '')
    const inHead = await git(dir, ['cat-file', '-e', `HEAD:${f}`]).then(() => true, () => false)
    if (inHead) await git(dir, ['checkout', 'HEAD', '--', f])
    else fs.rmSync(abs, { force: true })
  }
}

export async function hasChanges(dir: string): Promise<boolean> {
  return (await git(dir, ['status', '--porcelain', '--untracked-files=all'])).trim().length > 0
}

/** cherry-pick 一串 commit；衝突就還原並回報是哪一個 */
export async function cherryPickAll(dir: string, commits: string[], hooksDir?: string): Promise<{ ok: true } | { ok: false; commit: string; message: string }> {
  const id = await identity(dir)
  for (const c of commits) {
    try {
      // 已經在這條線上的 commit 不重複套用
      await git(dir, ['merge-base', '--is-ancestor', c, 'HEAD'])
      continue
    } catch {
      /* 還沒有 */
    }
    try {
      await git(dir, [...hookArgs(hooksDir), ...id, 'cherry-pick', '--allow-empty', '--keep-redundant-commits', c])
    } catch (e) {
      try {
        await git(dir, ['cherry-pick', '--abort'])
      } catch {
        /* 沒有進行中的 cherry-pick */
      }
      return { ok: false, commit: c, message: (e as Error).message.slice(0, 500) }
    }
  }
  return { ok: true }
}

export async function diffStat(dir: string, base: string, head: string): Promise<string> {
  return (await git(dir, ['diff', '--no-ext-diff', '--no-textconv', '--stat', `${base}..${head}`])).trim().slice(0, 8000)
}

/**
 * 把核准的 commit 合併回使用者的分支：主工作區必須乾淨、而且目前就在原本的來源分支上；
 * 衝突就 merge --abort 還原，不自動選邊。用 commit 不用分支名，核准之後分支再動也不會合到別的內容。
 */
export async function mergeBranch(
  repoRoot: string,
  expectBranch: string,
  commit: string,
  message: string,
  hooksDir?: string
): Promise<{ ok: true; commit: string } | { ok: false; reason: 'wrong-branch' | 'dirty' | 'conflict'; message: string }> {
  const current = (await git(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim()
  if (current !== expectBranch) return { ok: false, reason: 'wrong-branch', message: current }
  // 只看已追蹤檔案：未追蹤的檔案（例如 app 自己的 .workbench/）不擋；真的會被覆寫時 git merge 自己會拒絕
  const dirty = (await git(repoRoot, ['status', '--porcelain', '--untracked-files=no'])).trim()
  if (dirty) return { ok: false, reason: 'dirty', message: dirty.split(/\r?\n/).slice(0, 20).join('\n') }
  try {
    await git(repoRoot, [...hookArgs(hooksDir), ...(await identity(repoRoot)), 'merge', '--no-ff', '-m', message, commit])
  } catch (e) {
    try {
      await git(repoRoot, ['merge', '--abort'])
    } catch {
      /* 沒有進行中的 merge */
    }
    return { ok: false, reason: 'conflict', message: (e as Error).message.slice(0, 500) }
  }
  return { ok: true, commit: (await git(repoRoot, ['rev-parse', 'HEAD'])).trim() }
}

/** 移除這場會議的 worktree（分支保留，git 紀錄還在）；只動 base（預設 <repo>/.cowork）底下的路徑 */
export async function removeWorktrees(repoRoot: string, root: string, dirs: string[], worktreeBase?: string): Promise<void> {
  const base = path.resolve(worktreeBase || path.join(repoRoot, '.cowork'))
  for (const d of dirs) {
    const rel = path.relative(base, path.resolve(d))
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) continue
    // junction 先拆掉，免得 worktree remove 跟著進到主工作區的 node_modules
    const nm = path.join(d, 'node_modules')
    try {
      if (fs.lstatSync(nm).isSymbolicLink()) fs.unlinkSync(nm)
    } catch {
      /* 沒有 */
    }
    try {
      await git(repoRoot, ['worktree', 'remove', '--force', d])
    } catch {
      /* 已不在；下面的 prune 會清紀錄 */
    }
  }
  await git(repoRoot, ['worktree', 'prune']).catch(() => '')
  const relRoot = path.relative(base, path.resolve(root))
  if (relRoot && !relRoot.startsWith('..') && !path.isAbsolute(relRoot)) {
    fs.rmSync(root, { recursive: true, force: true })
  }
  try {
    fs.rmdirSync(base)
  } catch {
    /* 還有別場會議的 worktree */
  }
}

// ── 核准內容、hook 信任、git 設定防護 ─────────────────────────────────

const sha256 = (data: string | Buffer): string => createHash('sha256').update(data).digest('hex')

/** 目前設定的 hook 路徑（相對路徑以 repo 根目錄為準）；null = 預設的 .git/hooks */
export async function configuredHooksPath(repoRoot: string): Promise<string | null> {
  const v = (await git(repoRoot, ['config', '--get', 'core.hooksPath']).catch(() => '')).trim()
  return v || null
}

/**
 * 把基線的 hook 匯出成一份副本；harness 的 commit、cherry-pick、merge 只跑這份。
 * 不能一律關掉（本 repo 的 pre-commit 是防止記憶檔外洩的防線），也不能照跑：
 * worktree 裡被改過的 tracked hook、分支帶進來的 post-merge 都會被 git 執行（2026-11-06 以 Git 2.53 實測）。
 */
export async function exportBaselineHooks(repoRoot: string, commit: string, dest: string): Promise<string> {
  fs.rmSync(dest, { recursive: true, force: true })
  fs.mkdirSync(dest, { recursive: true })
  const configured = await configuredHooksPath(repoRoot)
  const write = (name: string, data: Buffer): void => {
    const file = path.join(dest, path.basename(name))
    fs.writeFileSync(file, data)
    fs.chmodSync(file, 0o755)
  }
  if (configured && !path.isAbsolute(configured)) {
    const rel = configured.replace(/\\/g, '/').replace(/\/+$/, '')
    const names = (await git(repoRoot, ['ls-tree', '--name-only', '-z', commit, '--', `${rel}/`])).split('\0').filter(Boolean)
    for (const n of names) {
      const data = await gitBuffer(repoRoot, ['cat-file', 'blob', `${commit}:${n}`]).catch(() => null)
      if (data) write(n, data)
    }
    if (names.length) return dest
  }
  const dir = configured && path.isAbsolute(configured) ? configured : path.resolve(repoRoot, (await git(repoRoot, ['rev-parse', '--git-path', 'hooks'])).trim())
  if (fs.existsSync(dir)) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isFile() && !e.name.endsWith('.sample')) write(e.name, fs.readFileSync(path.join(dir, e.name)))
    }
  }
  return dest
}

function gitBuffer(cwd: string, args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile('git', ['-c', 'core.fsmonitor=false', ...args], { cwd, encoding: 'buffer', maxBuffer: 32 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
      if (err) reject(new Error(String(stderr || err.message).trim()))
      else resolve(stdout)
    })
  })
}

/**
 * 影響 git 行為的本機設定與 hook 內容 hash：設定來源（含 include）、worktree 專屬設定、repo 外的 hook 目錄。
 * 這是變動偵測，擋不住同權限的 agent 先改再還原；worktree 不是安全邊界。
 * tracked 的 hook 目錄在工作樹裡，改動會出現在 diff：由 hookPathsIn 列為高風險，並靠基線副本確保不被執行。
 */
export async function gitGuardState(dir: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const add = (p: string): void => {
    const key = path.resolve(p).replace(/\\/g, '/').toLowerCase()
    try {
      out[key] = sha256(fs.readFileSync(p))
    } catch {
      /* 讀不到就不列入 */
    }
  }
  const top = path.resolve((await git(dir, ['rev-parse', '--show-toplevel'])).trim())
  const origins = await git(dir, ['config', '--local', '--list', '--show-origin', '--includes']).catch(() => '')
  for (const line of origins.split(/\r?\n/)) {
    const m = /^file:(.+?)\t/.exec(line)
    if (m) add(path.resolve(dir, m[1]))
  }
  add(path.resolve(dir, (await git(dir, ['rev-parse', '--git-path', 'config'])).trim()))
  const wtConfig = path.resolve(dir, (await git(dir, ['rev-parse', '--git-path', 'config.worktree'])).trim())
  if (fs.existsSync(wtConfig)) add(wtConfig)
  const hooks = path.resolve(dir, (await git(dir, ['rev-parse', '--git-path', 'hooks'])).trim())
  const rel = path.relative(top, hooks)
  const inTree = rel && !rel.startsWith('..') && !path.isAbsolute(rel)
  if (!inTree && fs.existsSync(hooks)) {
    for (const e of fs.readdirSync(hooks, { withFileTypes: true })) {
      if (e.isFile() && !e.name.endsWith('.sample')) add(path.join(hooks, e.name))
    }
  }
  return out
}

/** 基線之後新增或改動的項目（路徑可讀就好）；移除也算 */
export function diffGuard(base: Record<string, string>, now: Record<string, string>): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(now)) if (base[k] !== v) out.push(k)
  for (const k of Object.keys(base)) if (!(k in now)) out.push(k)
  return out
}

/** 這些檔在 index 裡的內容識別（含新增、刪除與二進位）；要先 git add -A。內容一變，舊核准就失效 */
export async function scopeContentHash(dir: string, files: string[]): Promise<string> {
  const parts: string[] = []
  for (const f of [...files].sort()) {
    const line = (await git(dir, ['ls-files', '-s', '--', f])).trim()
    parts.push(`${f}\0${line || 'deleted'}`)
  }
  return sha256(parts.join('\n'))
}

/** 內容不變時 patch-id 也不變，即使基底不同：用來判斷要不要重新審查 */
export async function patchId(dir: string, base: string, head: string): Promise<string> {
  const diff = await gitBuffer(dir, ['diff', '--no-ext-diff', '--no-textconv', `${base}..${head}`])
  if (!diff.length) return ''
  return new Promise((resolve, reject) => {
    const p = spawn('git', ['-c', 'core.fsmonitor=false', 'patch-id', '--stable'], { cwd: dir, windowsHide: true })
    let out = ''
    p.stdout.setEncoding('utf8').on('data', (d: string) => (out += d))
    p.on('error', reject)
    p.on('close', () => resolve(out.trim().split(/\s+/)[0] || ''))
    p.stdin.on('error', () => {})
    p.stdin.end(diff)
  })
}

export async function diffText(dir: string, base: string, head: string, maxChars: number): Promise<{ text: string; truncated: boolean }> {
  const text = await git(dir, ['diff', '--no-ext-diff', '--no-textconv', `${base}..${head}`])
  return text.length > maxChars ? { text: text.slice(0, maxChars), truncated: true } : { text, truncated: false }
}

export async function changedPaths(dir: string, base: string, head: string): Promise<string[]> {
  return (await git(dir, ['diff', '--no-ext-diff', '--name-only', '--no-renames', '-z', `${base}..${head}`])).split('\0').filter(Boolean)
}

/** 目前 worktree 內容的 tree id（會 git add -A）：check 前後比對，確認驗證與提交的是同一份內容 */
export async function treeOf(dir: string): Promise<string> {
  await git(dir, ['add', '-A'])
  return (await git(dir, ['write-tree'])).trim()
}

/** 只算不動工作區：把 commit 合到 target 的結果 */
export async function mergeTree(repoRoot: string, target: string, commit: string): Promise<{ ok: true; tree: string } | { ok: false; message: string }> {
  try {
    return { ok: true, tree: (await git(repoRoot, ['merge-tree', '--write-tree', target, commit])).trim().split(/\r?\n/)[0] }
  } catch (e) {
    return { ok: false, message: (e as Error).message.slice(0, 800) }
  }
}

/** 暫時的 worktree，內容是指定的 tree：拿來驗證「合併結果」 */
export async function addTreeWorktree(repoRoot: string, dir: string, base: string, tree: string): Promise<void> {
  fs.mkdirSync(path.dirname(dir), { recursive: true })
  await git(repoRoot, ['worktree', 'add', '--detach', dir, base])
  await git(dir, ['read-tree', '-u', '--reset', tree])
}

/** checks 弄髒了 harness 自己的 worktree 時還原（已忽略的檔與依賴不動） */
export async function resetWorktree(dir: string): Promise<void> {
  await git(dir, ['reset', '-q', '--hard'])
  await git(dir, ['clean', '-q', '-fd'])
}

export async function revParse(cwd: string, ref: string): Promise<string> {
  return (await git(cwd, ['rev-parse', '--verify', ref])).trim()
}
