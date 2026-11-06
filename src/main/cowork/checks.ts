// Cowork 自己跑的驗證指令：argv 不經 shell、在 worktree 裡執行，有逾時與輸出上限。
// 不經 shell 只避免 shell 解析，不限制指令本身的權限：這些指令等於執行專案程式碼，要使用者核准才會跑。
import { execFile } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { runProcess } from './runner'
import { maskSecrets, type CheckRun } from '../../shared/cowork'

const CHECK_TIMEOUT_MS = 10 * 60_000
const CHECK_MAX_BYTES = 8 * 1024 * 1024
const KEEP_OUTPUT = 8000
const RUNNABLE = /\.(exe|cmd|bat|com|ps1)$/i

/**
 * 把指令解析成完整路徑。Windows 不經 shell 時 `npm` 回 ENOENT、`npm.cmd` 回 EINVAL（2026-11-06 實測），
 * 所以一定要先解析，再交給 launchPlan 依副檔名決定怎麼啟動。
 * where 會先找目前目錄：cwd 刻意不用 worktree，否則 agent 放一個 npm.cmd 就能換掉核准過的指令。
 * 明確寫出路徑（./scripts/x）的才相對於 worktree，而且不能跨出去。
 */
export async function resolveCheckCommand(cmd: string, worktree: string): Promise<{ resolved: string } | { error: string }> {
  const name = cmd.trim()
  if (!name) return { error: 'empty command' }
  if (path.isAbsolute(name)) return fs.existsSync(name) ? { resolved: name } : { error: `not found: ${name}` }
  if (/[\\/]/.test(name)) {
    const abs = path.resolve(worktree, name)
    const rel = path.relative(path.resolve(worktree), abs)
    if (rel.startsWith('..') || path.isAbsolute(rel)) return { error: `path leaves the worktree: ${name}` }
    return { resolved: abs }
  }
  const finder = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'where.exe') : 'which'
  const found = await new Promise<string[]>((resolve) => {
    execFile(finder, process.platform === 'win32' ? [name] : ['-a', name], { cwd: os.tmpdir(), windowsHide: true, timeout: 15_000 }, (err, stdout) => {
      resolve(err ? [] : stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))
    })
  })
  // where 會同時列出沒副檔名的 sh 腳本（npm）和 npm.cmd：只有後者能在 Windows 啟動
  const pick = process.platform === 'win32' ? found.find((f) => RUNNABLE.test(f)) : found[0]
  return pick ? { resolved: pick } : { error: `command not found: ${name}` }
}

export async function runCheck(argv: string[], cwd: string, o: { signal?: AbortSignal; timeoutMs?: number; now: () => number; tree?: string }): Promise<CheckRun> {
  const at = o.now()
  const r = await resolveCheckCommand(argv[0], cwd)
  if ('error' in r) return { argv, cwd, code: null, output: '', ms: 0, ok: false, error: r.error, at, tree: o.tree }
  const res = await runProcess(
    { command: r.resolved, args: argv.slice(1), cwd, stdin: '', timeoutMs: Math.max(1000, Math.min(CHECK_TIMEOUT_MS, o.timeoutMs ?? CHECK_TIMEOUT_MS)), maxBytes: CHECK_MAX_BYTES },
    o.signal
  )
  const output = maskSecrets(`${res.stdout}${res.stderr ? `\n${res.stderr}` : ''}`).slice(-KEEP_OUTPUT)
  const error = res.spawnError || (res.timedOut ? 'timed out' : res.cancelled ? 'cancelled' : res.truncated ? 'too much output' : undefined)
  return { argv, resolved: r.resolved, cwd, code: res.code, output, ms: res.ms, ok: !error && res.code === 0, ...(error ? { error } : {}), at, tree: o.tree }
}

export function describeCheck(c: CheckRun): string {
  const why = c.error || `exit ${c.code}`
  const tail = c.output.trim().split(/\r?\n/).slice(-6).join('\n')
  return `${c.argv.join(' ')} -> ${why}${tail ? `\n${tail}` : ''}`
}
