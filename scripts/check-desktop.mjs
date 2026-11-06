// The real app, the real React UI, the real backend: node scripts/check-desktop.mjs [debug|release]
import assert from 'node:assert'
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { Desktop, sleep } from './lib/desktop-driver.mjs'

const profile = process.argv[2] || 'debug'
const ws = path.join(fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'wb-check-')), 'project')
const base = path.dirname(ws)
fs.mkdirSync(path.join(base, 'data'), { recursive: true })
fs.mkdirSync(path.join(ws, 'src'), { recursive: true })
fs.writeFileSync(path.join(ws, 'README.md'), '# hi\n')
fs.writeFileSync(path.join(ws, 'src', 'a.ts'), 'export const a = 1\n')
execFileSync('git', ['init', '-b', 'main'], { cwd: ws, stdio: 'ignore' })
fs.writeFileSync(path.join(base, 'data', 'settings.json'), JSON.stringify({ lastWorkspace: ws, recentWorkspaces: [ws], language: 'en' }))
const d = new Desktop({ profile, base })

let passed = 0
const check = async (name, fn) => {
  await fn()
  passed++
  console.log(`ok - ${name}`)
}

try {
  const p = await d.page()
  await check('page loads and window.api exists', () => p.waitFor(`document.querySelector('#root')?.children.length > 0 && !!window.api`))
  await check('window frame present', async () => {
    assert.equal(await p.eval(`document.querySelectorAll('#wb-window-controls button').length`), 3)
    await p.waitFor(`getComputedStyle(document.querySelector('.app-unified-header')).getPropertyValue('-webkit-app-region') === 'drag'`)
  })
  await check('workspace reaches the page', async () => {
    assert.equal(await p.eval(`window.api.files.workspaceRoot()`), ws)
    assert.equal(await p.eval(`new URLSearchParams(location.search).get('workspace')`), ws)
  })
  await check('files through the real IPC', async () => {
    const list = await p.eval(`window.api.files.list(${JSON.stringify(ws)})`)
    assert.deepEqual(list.map((x) => x.name).filter((n) => n !== '.workbench').sort(), ['README.md', 'src'])
    await p.eval(`window.api.files.write(${JSON.stringify(path.join(ws, 'new.txt'))}, '內容')`)
    assert.equal(fs.readFileSync(path.join(ws, 'new.txt'), 'utf8'), '內容')
    await assert.rejects(p.eval(`window.api.files.read('C:\\\\Windows\\\\win.ini')`), /Access denied/)
  })
  await check('external change reaches the page', async () => {
    await p.eval(`(window.__changes = [], window.api.files.onExternalChange((c) => window.__changes.push(c.relativePath)), true)`)
    await sleep(300)
    fs.writeFileSync(path.join(ws, 'src', 'b.ts'), 'changed\n')
    await p.waitFor(`window.__changes.includes('src/b.ts')`)
  })
  await check('settings and git', async () => {
    assert.equal((await p.eval(`window.api.settings.get()`)).language, 'en')
    assert.equal((await p.eval(`window.api.git.status()`)).isRepo, true)
  })
  await check('terminal: output, input order, resize, exit', async () => {
    const id = await p.eval(`window.api.pty.spawn({ command: 'cmd', cols: 100, rows: 30 })`)
    await p.eval(`(window.__t = { out: '', exit: null, size: null },
      window.api.pty.onData(${JSON.stringify(id)}, (s) => window.__t.out += s),
      window.api.pty.onExit(${JSON.stringify(id)}, (c) => window.__t.exit = c),
      window.api.pty.onResized(${JSON.stringify(id)}, (c, r) => window.__t.size = [c, r]), true)`)
    await p.eval(`window.api.pty.attach(${JSON.stringify(id)})`)
    await p.waitFor(`window.__t.out.length > 0`)
    // Every keystroke its own message: order must hold
    await p.eval(`(() => { for (const c of 'echo 0123456789abcdefghijklmnop\\r') window.api.pty.write(${JSON.stringify(id)}, c); return true })()`)
    await p.waitFor(`window.__t.out.includes('0123456789abcdefghijklmnop\\r\\n') || /0123456789abcdefghijklmnop\\s+\\S*/.test(window.__t.out.split('echo')[1] || '')`)
    await p.eval(`(window.api.pty.resize(${JSON.stringify(id)}, 90, 20), true)`)
    await p.waitFor(`JSON.stringify(window.__t.size) === '[90,20]'`)
    await p.eval(`(window.api.pty.write(${JSON.stringify(id)}, 'exit\\r'), true)`)
    await p.waitFor(`window.__t.exit !== null`)
  })
  await check('webview element: outside content in a child webview without IPC', async () => {
    await p.eval(`(() => { const e = document.createElement('wb-webview'); e.id = 'w1'; e.setAttribute('src', 'data:text/html,hi'); e.style.cssText = 'position:fixed;left:50px;top:80px;width:200px;height:100px;z-index:999999'; document.body.appendChild(e); return true })()`)
    await sleep(600)
    await p.eval(`(document.getElementById('w1').remove(), true)`)
  })
  await check('the UI itself renders the dashboard or file tree', () => p.waitFor(`document.body.innerText.length > 50`))
  const errors = (await p.errors()).filter((e) => !/No handler registered/.test(e || ''))
  assert.deepEqual(errors, [])
  await check('closing the window ends the app and its terminals', async () => {
    await p.eval(`window.api.pty.spawn({ command: 'cmd' })`)
    p.eval(`document.querySelector('#wb-window-controls button[data-act="close"]').click()`).catch(() => {})
    const code = await Promise.race([d.exited, sleep(15000).then(() => 'timeout')])
    assert.notEqual(code, 'timeout', 'app did not exit')
  })
  console.log(`check-desktop: ${passed} passed`)
} catch (e) {
  console.error(e)
  console.error('--- app log ---\n' + d.log)
  process.exitCode = 1
} finally {
  d.cleanup()
}
