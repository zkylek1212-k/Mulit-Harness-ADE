// 真的 pty.ts、真的 CLI 行程、兩種後端跑同一套情境：node scripts/check-core-pty.cjs
// 中途接上不漏不重複、resize 順序、核准事件、kill、結束碼、輸入、dev server 偵測。
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { EventEmitter } = require('node:events')
const esbuild = require('esbuild')
const { Terminal } = require('@xterm/headless')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const until = async (fn, what, ms = 15000) => {
  const t = Date.now()
  while (Date.now() - t < ms) {
    if (await fn()) return
    await sleep(20)
  }
  throw new Error(`timed out: ${what}`)
}
const alive = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function loadPty() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-pty-check-'))
  const out = path.join(dir, 'pty.cjs')
  const stubs = {
    electron: 'exports.ipcMain={handle(){},on(){}};exports.app={on(){}};',
    index: 'exports.getWorkspaceForEvent=()=>"";',
    conn: 'exports.resolveConnectionEnv=()=>({});',
    settings: 'exports.getCustomCliPath=()=>null;exports.isCliBypassPermissions=()=>false;exports.loadSettings=()=>({});',
    paths: 'exports.findAgentCli=()=>null;exports.findCli=()=>null;'
  }
  await esbuild.build({
    entryPoints: ['src/main/ipc/pty.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: out,
    external: ['@lydell/node-pty', '@xterm/headless', '@xterm/addon-serialize', 'js-yaml'],
    plugins: [
      {
        name: 'stubs',
        setup(b) {
          b.onResolve({ filter: /^electron$/ }, () => ({ path: 'electron', namespace: 'stub' }))
          b.onResolve({ filter: /^\.\.\/index$/ }, () => ({ path: 'index', namespace: 'stub' }))
          b.onResolve({ filter: /^\.\/conn$/ }, () => ({ path: 'conn', namespace: 'stub' }))
          b.onResolve({ filter: /^\.\/settings$/ }, () => ({ path: 'settings', namespace: 'stub' }))
          b.onResolve({ filter: /^\.\.\/ext\/paths$/ }, () => ({ path: 'paths', namespace: 'stub' }))
          b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => ({ contents: stubs[a.path], loader: 'js' }))
        }
      }
    ]
  })
  // 外部模組從 repo 的 node_modules 找
  const code = fs.readFileSync(out, 'utf8')
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', code)(require, mod, mod.exports)
  fs.rmSync(dir, { recursive: true, force: true })
  return mod.exports
}

async function scenario(label, ptys) {
  const ctx = { workspace: process.cwd(), owner: { id: 1 }, subscribeOwner: false }
  const spawn = (script, extra = {}) => ptys.spawnPty({ command: process.execPath, args: ['-e', script], cols: 80, rows: 24, ...extra }, ctx)
  const events = new EventEmitter()
  for (const name of ['approval', 'exit', 'changed']) ptys.ptyEvents.on(name, (...a) => events.emit(name, ...a))

  // 中文、結束碼、最後的輸出
  {
    const id = spawn(`console.log('中文輸出-marker');setTimeout(()=>process.exit(7),200)`)
    let text = ''
    let code = null
    await ptys.subscribePty(id, 'k', { data: (_i, c) => (text += c), exit: (_i, c) => (code = c) })
    await until(() => code !== null, 'exit event')
    assert.equal(code, 7)
    assert.ok(ptys.getPtySession(id) === null, 'session removed')
    assert.ok(text.includes('中文輸出-marker'), `final output in ${JSON.stringify(text).slice(0, 200)}`)
  }

  // 中途接上：快照加後續輸出，內容要連續（不漏、不重複）
  {
    const id = spawn(`let i=0;const t=setInterval(()=>{console.log('seq '+(i++));if(i>=400){clearInterval(t);setTimeout(()=>process.exit(0),800)}},3)`)
    await sleep(350)
    const t = new Terminal({ cols: 80, rows: 24, scrollback: 5000, allowProposedApi: true, windowsPty: { backend: 'conpty' } })
    let done = false
    const writes = []
    const snap = await ptys.subscribePty(id, 'mid', {
      data: (_i, c) => writes.push(c),
      exit: () => (done = true)
    })
    assert.ok(snap && typeof snap.data === 'string', 'a snapshot')
    assert.ok(snap.cols === 80 && snap.rows === 24)
    await new Promise((r) => t.write(snap.data, r))
    await until(() => done, 'run finished', 30000)
    for (const w of writes) await new Promise((r) => t.write(w, r))
    const b = t.buffer.active
    const nums = []
    for (let y = 0; y < b.length; y++) {
      const m = /seq (\d+)/.exec(b.getLine(y).translateToString(true))
      if (m) nums.push(Number(m[1]))
    }
    assert.ok(nums.length > 200, `${nums.length} lines`)
    for (let i = 1; i < nums.length; i++) assert.equal(nums[i], nums[i - 1] + 1, `gap or repeat at ${nums[i - 1]} -> ${nums[i]} (${label})`)
    assert.equal(nums[nums.length - 1], 399, 'reached the end')
  }

  // 輸入
  {
    const id = spawn(`process.stdin.setEncoding('utf8');process.stdin.on('data',d=>{if(d.includes('quit'))process.exit(0);console.log('got:'+d.trim())});console.log('ready')`)
    let text = ''
    let exited = false
    await ptys.subscribePty(id, 'in', { data: (_i, c) => (text += c), exit: () => (exited = true) })
    await sleep(600)
    assert.equal(ptys.writePty(id, 'ping\r'), true)
    await until(() => /got:\s*ping/.test(text.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')), `echo of input in ${JSON.stringify(text).slice(0, 200)}`)
    ptys.writePty(id, 'quit\r')
    await until(() => exited, 'quit')
    assert.equal(ptys.writePty('nope', 'x'), false)
  }

  // resize：尺寸事件要到，資訊要更新
  {
    const id = spawn(`console.log('before');setInterval(()=>{},1000)`)
    const order = []
    await ptys.subscribePty(id, 'rs', { data: (_i, c) => order.push(`data:${c.includes('\x1b[2J') ? 'clear' : 'x'}`), resized: (_i, c, r) => order.push(`resized:${c}x${r}`), exit: () => {} })
    await sleep(400)
    ptys.resizePty(id, 100, 30)
    await until(() => order.some((o) => o === 'resized:100x30'), `resized in ${order}`)
    const info = ptys.getPtySession(id)
    assert.equal(info.cols, 100)
    assert.equal(info.rows, 30)
    const clearAt = order.indexOf('data:clear')
    const resizedAt = order.indexOf('resized:100x30')
    assert.ok(clearAt >= 0 && clearAt < resizedAt, `the clear prelude comes first: ${order.slice(-6)}`)
    ptys.killPty(id)
  }

  // 核准：畫面真的停在選單才算，畫面換了要解除
  {
    const fired = []
    const onApproval = (i) => fired.push(i)
    events.on('approval', onApproval)
    const id = spawn(`console.log('Do you want to proceed?');console.log('\\u276f 1. Yes');console.log('  2. No');setTimeout(()=>{process.stdout.write('\\x1b[2J\\x1b[H');console.log('all done')},1200);setInterval(()=>{},1000)`)
    await ptys.subscribePty(id, 'ap', { data: () => {}, exit: () => {} })
    await until(() => fired.includes(id), 'approval event')
    assert.equal(ptys.getPtySession(id).needsApproval, true)
    assert.ok((ptys.getPtyScreenText(id) || '').includes('Do you want to proceed?'), 'the screen text comes with it')
    await until(() => ptys.getPtySession(id)?.needsApproval === false, 'cleared when the screen changes')
    events.off('approval', onApproval)
    ptys.killPty(id)
  }

  // dev server 網址
  {
    const id = spawn(`console.log('Local: http://localhost:5173/');setInterval(()=>{},1000)`)
    await until(() => ptys.getPtySession(id)?.devPort === 5173, 'dev port')
    ptys.killPty(id)
  }

  // kill：連子行程一起，事件標成使用者關的
  {
    const marker = path.join(os.tmpdir(), `wb-kill-${label}-${process.pid}.txt`)
    fs.rmSync(marker, { force: true })
    const exits = []
    const onExit = (i, code, title, killed) => exits.push({ i, killed })
    events.on('exit', onExit)
    const id = spawn(`const c=require('child_process').spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});require('fs').writeFileSync(${JSON.stringify(marker)},String(c.pid));setInterval(()=>{},1000)`)
    await until(() => fs.existsSync(marker) && fs.readFileSync(marker, 'utf8').length > 0, 'child started')
    const childPid = Number(fs.readFileSync(marker, 'utf8'))
    assert.ok(alive(childPid))
    await sleep(100)
    ptys.killPty(id)
    await until(() => exits.some((e) => e.i === id && e.killed === true), 'exit event')
    await until(() => !alive(childPid), 'the child dies too')
    events.off('exit', onExit)
    fs.rmSync(marker, { force: true })
  }

  // 找不到執行檔
  {
    if (label === 'rust') {
      const id = ptys.spawnPty({ command: path.join(os.tmpdir(), 'definitely-missing.exe'), cols: 80, rows: 24 }, ctx)
      let code = null
      // 接上一個啟動失敗的終端不能一直等下去
      const snap = await Promise.race([ptys.subscribePty(id, 'mi', { data: () => {}, exit: (_i, c) => (code = c) }), sleep(5000).then(() => 'hung')])
      assert.notEqual(snap, 'hung', 'attach must not hang')
      await until(() => ptys.getPtySession(id) === null, 'reported as an exit')
    } else {
      assert.throws(() => ptys.spawnPty({ command: path.join(os.tmpdir(), 'definitely-missing.exe'), cols: 80, rows: 24 }, ctx))
    }
  }
  ptys.ptyEvents.removeAllListeners()
  console.log(`${label}: all terminal scenarios passed`)
}

async function main() {
  await scenario('node-pty', await loadPty())

  process.env.WB_CORE_PTY = 'rust'
  const ptys = await loadPty()
  await scenario('rust', ptys)

  // Rust 才有的：bridge 崩潰時終端要結束，agent 不留下
  const ctx = { workspace: process.cwd(), owner: { id: 1 }, subscribeOwner: false }
  const pidFile = path.join(os.tmpdir(), `wb-crash-${process.pid}.txt`)
  fs.rmSync(pidFile, { force: true })
  const exits = []
  ptys.ptyEvents.on('exit', (i, code) => exits.push({ i, code }))
  const id = ptys.spawnPty({ command: process.execPath, args: ['-e', `require('fs').writeFileSync(${JSON.stringify(pidFile)},String(process.pid));setInterval(()=>{},1000)`], cols: 80, rows: 24 }, ctx)
  await until(() => fs.existsSync(pidFile) && fs.readFileSync(pidFile, 'utf8').length > 0, 'agent started')
  const agentPid = Number(fs.readFileSync(pidFile, 'utf8'))
  const list = execFileSync('tasklist', ['/FI', 'IMAGENAME eq wb-bridge.exe', '/FO', 'CSV', '/NH'], { encoding: 'utf8' })
  const pids = [...list.matchAll(/"wb-bridge\.exe","(\d+)"/g)].map((m) => Number(m[1]))
  assert.ok(pids.length >= 1, list)
  for (const p of pids) execFileSync('taskkill', ['/PID', String(p), '/F'], { stdio: 'ignore' })
  await until(() => exits.some((e) => e.i === id), 'terminal ends when the bridge dies')
  await until(() => !alive(agentPid), 'agent ends with the bridge')
  fs.rmSync(pidFile, { force: true })
  console.log('rust: bridge crash ends terminals and agents')
  console.log('core pty ok')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
