// bridge 的故障情境：node --experimental-strip-types scripts/check-core-bridge.mts
// 崩潰時不重複執行、不留孤兒、輸出洪水不擋控制訊息、父行程死掉時全部收掉。
import './ts-resolve.mjs'
import assert from 'node:assert'
import { execFileSync, spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

process.env.WB_CORE_GIT = 'rust'
process.env.WB_CORE_PROC = 'rust'
const here = path.dirname(fileURLToPath(import.meta.url))
const bridge = await import('../src/main/core/bridge.ts')
const { runProcess } = await import('../src/main/cowork/runner.ts')
const gitx = await import('../src/main/cowork/git.ts')
assert.ok(fs.existsSync(bridge.bridgePath()), `build wb-bridge first: ${bridge.bridgePath()}`)

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-bridge-check-'))
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
const alive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
const waitGone = async (pid: number, ms = 8000): Promise<boolean> => {
  const t = Date.now()
  while (Date.now() - t < ms) {
    if (!alive(pid)) return true
    await sleep(100)
  }
  return false
}
const waitFile = async (f: string, ms = 8000): Promise<string> => {
  const t = Date.now()
  while (Date.now() - t < ms) {
    if (fs.existsSync(f) && fs.statSync(f).size > 0) return fs.readFileSync(f, 'utf8')
    await sleep(50)
  }
  throw new Error(`no ${f}`)
}
const node = process.execPath
const spec = (args: string[], extra: Record<string, unknown> = {}) => ({ command: node, args, cwd: tmp, stdin: '', timeoutMs: 30000, maxBytes: 64 * 1024 * 1024, ...extra })

// 跨 frame 切開的 UTF-8 不能變亂碼
{
  const r = await runProcess(spec(['-e', `process.stdout.write('中文測試'.repeat(50000))`]))
  assert.equal(r.code, 0, JSON.stringify(r).slice(0, 300))
  assert.equal(r.stdout, '中文測試'.repeat(50000))
  console.log('utf-8 across frames ok')
}

// 逐行 guard：違規就停，guardReason 不算使用者取消
{
  const lines: string[] = []
  const r = await runProcess({
    ...spec(['-e', `let i=0;setInterval(()=>console.log('line '+(i++)),5)`]),
    onStdoutLine: (l: string) => {
      lines.push(l)
      return lines.length >= 3 ? 'too many lines' : null
    }
  })
  assert.equal(r.guardReason, 'too many lines')
  assert.equal(r.cancelled, false)
  console.log('line guard ok')
}

// 大量輸出中取消：控制訊息要插隊，不能等輸出排完
{
  const ac = new AbortController()
  const t0 = Date.now()
  let bytes = 0
  const p = runProcess({ ...spec(['-e', `const b='x'.repeat(65536);const f=()=>{while(process.stdout.write(b)){};process.stdout.once('drain',f)};f()`]), onActivity: (n: number) => (bytes = n) }, ac.signal)
  while (bytes < 2 * 1024 * 1024 && Date.now() - t0 < 10000) await sleep(20)
  assert.ok(bytes >= 2 * 1024 * 1024, `flood never reached the client: ${bytes}`)
  const c0 = Date.now()
  ac.abort()
  const r = await p
  assert.equal(r.cancelled, true)
  assert.ok(Date.now() - c0 < 5000, `cancel took ${Date.now() - c0} ms`)
  // 洪水當下控制訊息也要通：另一個請求不該被擋住
  console.log(`cancel under flood ok (${Date.now() - c0} ms)`)
}
{
  const ac = new AbortController()
  const p = runProcess(spec(['-e', `const b='x'.repeat(65536);const f=()=>{while(process.stdout.write(b)){};process.stdout.once('drain',f)};f()`]), ac.signal)
  await sleep(500)
  const c0 = Date.now()
  const head = await gitx.git(here, ['rev-parse', '--is-inside-work-tree'])
  assert.equal(head.trim(), 'true')
  const rtt = Date.now() - c0
  ac.abort()
  await p
  console.log(`control during flood ok (${rtt} ms)`)
}

// bridge 中途崩潰：回報結果不明，不重跑 CLI，agent 也一起結束
{
  const marker = path.join(tmp, 'runs.txt')
  const pidFile = path.join(tmp, 'pid.txt')
  const script = `require('fs').appendFileSync(${JSON.stringify(marker)},'run\\n');require('fs').writeFileSync(${JSON.stringify(pidFile)},String(process.pid));setInterval(()=>{},1000)`
  const p = runProcess(spec(['-e', script]))
  const agentPid = Number(await waitFile(pidFile))
  assert.ok(alive(agentPid))
  const bridgePid = await bridge.coreCall<{ protocol: number }>('ping', {}).then(() => bridge.corePid())
  assert.ok(bridgePid)
  execFileSync('taskkill', ['/PID', String(bridgePid), '/F'], { stdio: 'ignore' })
  const r = await p
  assert.match(String(r.spawnError), /unknown/i, JSON.stringify(r))
  assert.equal(fs.readFileSync(marker, 'utf8'), 'run\n', 'the paid CLI call is not repeated')
  assert.ok(await waitGone(agentPid), 'the agent did not die with the bridge')
  // 下一個請求自動起新的 bridge
  const again = await runProcess(spec(['-e', `console.log('ok')`]))
  assert.equal(again.code, 0)
  assert.notEqual(bridge.corePid(), bridgePid)
  console.log('bridge crash: reported as unknown, no retry, no orphan, recovers ok')
}

// 崩潰時正在進行的 git 寫入：不會改走 TS 再做一次
{
  const repo = path.join(tmp, 'repo')
  fs.mkdirSync(repo)
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repo })
  execFileSync('git', ['config', 'user.email', 't@t'], { cwd: repo })
  execFileSync('git', ['config', 'user.name', 't'], { cwd: repo })
  fs.writeFileSync(path.join(repo, 'a.txt'), 'a')
  const c1 = await gitx.commitAll(repo, 'first')
  assert.ok(c1)
  const count = (): number => Number(execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim())
  assert.equal(count(), 1)
  fs.writeFileSync(path.join(repo, 'b.txt'), 'b')
  await bridge.coreCall('ping', {})
  const pid = bridge.corePid()!
  const p = gitx.commitAll(repo, 'second')
  execFileSync('taskkill', ['/PID', String(pid), '/F'], { stdio: 'ignore' })
  const outcome = await p.then(
    (v) => ({ ok: v }),
    (e) => ({ err: e.code as string })
  )
  // 回覆可能已經到了，也可能沒有；無論如何這個 commit 最多只有一次
  if ('err' in outcome) assert.equal(outcome.err, 'core-result-unknown')
  assert.ok(count() <= 2, 'at most one commit')
  console.log(`git write during crash ok (${JSON.stringify(outcome).slice(0, 60)})`)
}

// 父行程死掉（Electron 崩潰）：bridge 跟 agent 都要結束
{
  const pidFile = path.join(tmp, 'orphan.txt')
  const childScript = path.join(tmp, 'parent.mts')
  const agentScript = `require('fs').writeFileSync(${JSON.stringify(pidFile)},String(process.pid));setInterval(()=>{},1000)`
  fs.writeFileSync(
    childScript,
    `import { pathToFileURL } from 'node:url'
await import(pathToFileURL(${JSON.stringify(path.join(here, 'ts-resolve.mjs'))}).href)
const { runProcess } = await import(pathToFileURL(${JSON.stringify(path.join(here, '../src/main/cowork/runner.ts'))}).href)
const bridge = await import(pathToFileURL(${JSON.stringify(path.join(here, '../src/main/core/bridge.ts'))}).href)
const p = runProcess({ command: process.execPath, args: ['-e', ${JSON.stringify(agentScript)}], cwd: ${JSON.stringify(tmp)}, stdin: '', timeoutMs: 60000, maxBytes: 1000000 })
await new Promise((r) => setTimeout(r, 300))
await bridge.coreCall('ping', {})
console.log(bridge.corePid())
await p
`
  )
  const parent = spawn(node, ['--experimental-strip-types', '--no-warnings', childScript], { stdio: ['ignore', 'pipe', 'inherit'], env: process.env })
  let out = ''
  parent.stdout.setEncoding('utf8').on('data', (d: string) => (out += d))
  const agentPid = Number(await waitFile(pidFile, 15000))
  const t = Date.now()
  while (!out.trim() && Date.now() - t < 10000) await sleep(50)
  const bridgePid = Number(out.trim())
  assert.ok(bridgePid > 0, out)
  assert.ok(alive(agentPid) && alive(bridgePid))
  execFileSync('taskkill', ['/PID', String(parent.pid), '/F'], { stdio: 'ignore' })
  assert.ok(await waitGone(bridgePid), 'bridge survived its parent')
  assert.ok(await waitGone(agentPid), 'agent survived the crash')
  console.log('parent crash: bridge and agent end ok')
}

// bridge 不存在：還沒送出，可以退回 TS
{
  const saved = process.env.WB_BRIDGE_PATH
  await bridge.coreShutdown()
  process.env.WB_BRIDGE_PATH = path.join(tmp, 'no-such-bridge.exe')
  const r = await runProcess(spec(['-e', `console.log('ts fallback')`]))
  assert.equal(r.code, 0)
  assert.match(r.stdout, /ts fallback/)
  assert.ok((await gitx.git(here, ['rev-parse', 'HEAD'])).trim().length >= 40)
  if (saved) process.env.WB_BRIDGE_PATH = saved
  else delete process.env.WB_BRIDGE_PATH
  console.log('missing bridge falls back to TS ok')
}

await bridge.coreShutdown()
try {
  fs.rmSync(tmp, { recursive: true, force: true })
} catch {
  /* Windows 偶爾還有 handle */
}
console.log('core bridge ok')
