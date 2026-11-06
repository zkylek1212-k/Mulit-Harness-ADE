// 終端負載量測（Electron）：node_modules/.bin/electron scripts/bench-terminals.cjs <terminals> [--json out.json]
// 管線照 src/main/ipc/pty.ts：node-pty → main 的 headless 鏡像 → IPC → renderer 的 xterm。
// Tauri 原型（core/apps/prototype）用同一個量測頁與假 CLI，兩邊的數字才能直接比。
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')
const { execFileSync } = require('node:child_process')
const { monitorEventLoopDelay } = require('node:perf_hooks')
const pty = require('@lydell/node-pty')
const { Terminal: Headless } = require('@xterm/headless')

const N = Number(process.argv.find((a) => /^\d+$/.test(a)) || 4)
const jsonIdx = process.argv.indexOf('--json')
const jsonOut = jsonIdx > 0 ? process.argv[jsonIdx + 1] : null
const RATE = 256 * 1024
const WARMUP_MS = 5000
const SAMPLE_MS = 20000
const ROOT = path.resolve(__dirname, '..')
const CREDIT = 1024 * 1024

app.whenReady().then(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-bench-'))
  for (const f of ['page.js']) fs.copyFileSync(path.join(__dirname, 'bench', f), path.join(dir, f))
  fs.copyFileSync(path.join(ROOT, 'node_modules/@xterm/xterm/lib/xterm.js'), path.join(dir, 'xterm.js'))
  fs.copyFileSync(path.join(ROOT, 'node_modules/@xterm/xterm/css/xterm.css'), path.join(dir, 'xterm.css'))
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    `<!doctype html><link rel="stylesheet" href="xterm.css"><style>#grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px}.cell{height:150px;overflow:hidden}</style><div id="grid"></div><script src="xterm.js"></script><script src="page.js"></script>`
  )
  fs.writeFileSync(
    path.join(dir, 'preload.js'),
    `const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('benchHost', {
  now: () => Date.now(),
  ack: (id, n) => ipcRenderer.send('ack', id, n),
  ping: () => ipcRenderer.invoke('ping')
})
ipcRenderer.on('data', (_e, id, bytes, t0) => window.postMessage({ id, bytes, t0 }, '*'))
`
  )
  const win = new BrowserWindow({ width: 1280, height: 800, webPreferences: { preload: path.join(dir, 'preload.js'), contextIsolation: true, backgroundThrottling: false } })
  await win.loadFile(path.join(dir, 'index.html'))
  await win.webContents.executeJavaScript(`window.addEventListener('message', (e) => window.benchOnData(e.data.id, e.data.bytes, e.data.t0)); true`)

  ipcMain.handle('ping', () => 1)
  const loop = monitorEventLoopDelay({ resolution: 5 })
  const procs = []
  const credit = new Map()
  ipcMain.on('ack', (_e, id, n) => {
    const c = credit.get(id)
    if (!c) return
    c.left += n
    if (c.paused && c.left > 0) {
      c.paused = false
      c.proc.resume()
    }
  })
  for (let i = 0; i < N; i++) {
    const proc = pty.spawn(process.platform === 'win32' ? process.env.BENCH_NODE || 'node.exe' : 'node', [path.join(__dirname, 'bench', 'flood.cjs'), String(RATE), String((WARMUP_MS + SAMPLE_MS) / 1000 + 5)], { cols: 80, rows: 24, cwd: ROOT })
    const mirror = new Headless({ cols: 80, rows: 24, scrollback: 2000, allowProposedApi: true })
    const c = { left: CREDIT, paused: false, proc }
    credit.set(i, c)
    proc.onData((d) => {
      const t0 = Date.now()
      mirror.write(d)
      c.left -= Buffer.byteLength(d)
      if (c.left <= 0 && !c.paused) {
        c.paused = true
        proc.pause()
      }
      win.webContents.send('data', i, d, t0)
    })
    procs.push(proc)
  }
  await new Promise((r) => setTimeout(r, WARMUP_MS))
  await win.webContents.executeJavaScript('window.benchReset(); true')
  loop.enable()
  const ping = setInterval(() => win.webContents.executeJavaScript('window.benchCtrlPing()').catch(() => {}), 200)
  await new Promise((r) => setTimeout(r, SAMPLE_MS))
  clearInterval(ping)
  loop.disable()
  const report = await win.webContents.executeJavaScript('window.benchReport()')
  let mem = null
  try {
    mem = JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'bench', 'mem.ps1'), String(process.pid)], { encoding: 'utf8' }))
  } catch (e) {
    mem = { error: e.message }
  }
  const metrics = app.getAppMetrics().reduce((s, m) => s + m.memory.workingSetSize, 0) / 1024
  const out = {
    shell: 'electron',
    electron: process.versions.electron,
    terminals: N,
    rate_kib_s: RATE / 1024,
    ...report,
    backend_loop_ms: { p50: Number((loop.percentile(50) / 1e6).toFixed(2)), p99: Number((loop.percentile(99) / 1e6).toFixed(2)), max: Number((loop.max / 1e6).toFixed(2)) },
    memory: mem,
    electron_metrics_mb: Number(metrics.toFixed(1))
  }
  console.log(JSON.stringify(out))
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(out, null, 2))
  for (const p of procs) {
    try {
      execFileSync('taskkill', ['/PID', String(p.pid), '/T', '/F'], { stdio: 'ignore' })
    } catch {
      /* 已結束 */
    }
  }
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    /* Windows 偶爾還有 handle */
  }
  app.exit(0)
})
