// 打包版煙霧測試：node scripts/check-packaged.cjs <path to Agent Workbench.exe>
// 依賴搬到 devDependencies 後，最怕打包版少東西：真的啟動 exe，用 CDP 走過 PTY、編輯器與圖表資產。
// 用獨立的 user-data-dir：不碰已安裝的版本，也不會撞單一執行個體鎖。
const { spawn, execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const assert = require('node:assert/strict')
const WebSocket = require('ws')

const exe = process.argv[2]
const PORT = 19333
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-packaged-'))
const proc = spawn(exe, [`--user-data-dir=${data}`, `--remote-debugging-port=${PORT}`], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
      const page = list.find((t) => t.type === 'page' && t.url.includes('index.html'))
      if (page) return page
    } catch {
      /* 還沒起來 */
    }
    await sleep(500)
  }
  throw new Error('the packaged app did not open a window')
}

async function main() {
  const page = await target()
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((r, j) => {
    ws.on('open', r)
    ws.on('error', j)
  })
  let id = 0
  const waiting = new Map()
  const exceptions = []
  ws.on('message', (raw) => {
    const m = JSON.parse(raw)
    if (m.id && waiting.has(m.id)) {
      waiting.get(m.id)(m)
      waiting.delete(m.id)
    }
    if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
  })
  const send = (method, params = {}) => new Promise((r) => {
    const n = ++id
    waiting.set(n, r)
    ws.send(JSON.stringify({ id: n, method, params }))
  })
  await send('Runtime.enable')
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.result.exceptionDetails) throw new Error(`${expression}\n${JSON.stringify(r.result.exceptionDetails).slice(0, 400)}`)
    return r.result.result.value
  }
  for (let i = 0; i < 40 && !(await ev(`document.getElementById('root')?.children.length > 0`)); i++) await sleep(250)
  assert.equal(await ev(`!!window.api`), true, 'preload loaded')
  assert.equal(await ev(`document.getElementById('root').children.length > 0`), true, 'React mounted')

  // PTY：@lydell/node-pty 與 @xterm/headless 必須還在打包版裡
  const output = await ev(`new Promise(async (resolve, reject) => {
    let text = ''
    const id = await window.api.pty.spawn({ command: 'cmd.exe', args: ['/c', 'ping -n 2 127.0.0.1 >nul & echo packaged-pty-ok'], cols: 80, rows: 24, cwd: 'C:/' })
    const off = window.api.pty.onData(id, (chunk) => { text += chunk; if (text.includes('packaged-pty-ok')) { off?.(); resolve(text) } })
    setTimeout(() => reject(new Error('no pty output: ' + text)), 15000)
  })`)
  assert.ok(output.includes('packaged-pty-ok'))

  // 主程序的 IPC：Cowork（js-yaml 等）、設定都要能回應
  const caps = await ev(`window.api.cowork.bypass()`)
  assert.equal(caps.ok, true)
  assert.equal(typeof (await ev(`window.api.settings.get()`)), 'object')

  // 由 Vite 打包的資產：直接讀 asar 的清單，每個都用頁面抓一次（file:// 頁面的 resource timing 是空的）
  const fd = fs.openSync(path.join(path.dirname(exe), 'resources', 'app.asar'), 'r')
  const head = Buffer.alloc(16)
  fs.readSync(fd, head, 0, 16, 0)
  const size = head.readUInt32LE(12)
  const json = Buffer.alloc(size)
  fs.readSync(fd, json, 0, size, 16)
  fs.closeSync(fd)
  const names = Object.keys(JSON.parse(json.toString()).files.out.files.renderer.files.assets.files)
  for (const want of [/^ts.worker/, /^editor.worker/, /^cowork/, /^remote/]) assert.ok(names.some((n) => want.test(n)), `missing asset ${want}`)
  assert.ok(names.some((n) => /flowDiagram|sequenceDiagram|cynefin|mermaid/i.test(n)), 'mermaid chunks are packaged')
  const failed = await ev(`(async () => {
    const bad = []
    for (const n of ${JSON.stringify(names)}) { const r = await fetch(new URL('assets/' + n, location.href)).catch(() => null); if (!r || !r.ok) bad.push(n) }
    return bad
  })()`)
  assert.deepEqual(failed, [], 'every packaged asset loads')
  const assets = names
  assert.deepEqual(exceptions, [], 'no uncaught exception at startup')
  console.log(`packaged ok: pty, IPC, ${Object.keys(assets).length} assets, no uncaught exceptions`)
  ws.close()
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      execFileSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' })
    } catch {
      /* 已結束 */
    }
    await sleep(800)
    fs.rmSync(data, { recursive: true, force: true, maxRetries: 3 })
    process.exit(process.exitCode || 0)
  })
