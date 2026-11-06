// node --experimental-strip-types scripts/check-remote-files.mts
import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as http from 'node:http'
import { RemoteFiles, listWorkspaceFiles, readWorkspaceText, workspacePath } from '../src/main/remote/files.ts'

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'workbench-remote-files-'))
const root = path.join(temp, 'workspace'), outside = path.join(temp, 'outside')
fs.mkdirSync(root); fs.mkdirSync(outside)
fs.writeFileSync(path.join(outside, 'private.txt'), 'outside workspace')
fs.mkdirSync(path.join(root, 'docs'))
fs.mkdirSync(path.join(root, 'node_modules'))
fs.symlinkSync(outside, path.join(root, 'escape'), 'junction')
fs.writeFileSync(path.join(root, 'README.md'), '# 手機唯讀預覽')
fs.writeFileSync(path.join(root, 'docs', 'view.html'), '<link rel="stylesheet" href="theme.css"><h1>Preview</h1>')
fs.writeFileSync(path.join(root, 'docs', 'theme.css'), 'h1 { color: teal }')
fs.writeFileSync(path.join(root, 'docs', 'report.pdf'), '%PDF-1.4\nPDF bytes for range checks\n%%EOF')
fs.writeFileSync(path.join(root, 'binary.dat'), Buffer.from([0, 1, 2]))
fs.writeFileSync(path.join(root, 'large.txt'), Buffer.alloc(1024 * 1024 + 1, 65))
let paired = true
const files = new RemoteFiles((device, workspace) => paired && device === 'phone' && workspace === root)
// 記下伺服器實際送出的標頭：本機若有 AdGuard 之類的過濾軟體，連 127.0.0.1 的回應標頭也會被改寫（CSP 尤其），不能只看 fetch 收到的
const sent = new Map<string, Record<string, unknown>>()
const server = http.createServer((req, res) => {
  const writeHead = res.writeHead.bind(res)
  res.writeHead = ((...args: unknown[]) => {
    const headers = args.find((a) => a && typeof a === 'object') as Record<string, unknown> | undefined
    sent.set(req.url || '', { ...res.getHeaders(), ...Object.fromEntries(Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), v])) })
    return (writeHead as (...a: unknown[]) => http.ServerResponse)(...args)
  }) as typeof res.writeHead
  files.serve(req, res)
})
try {
  const list = listWorkspaceFiles(root, '')
  assert.equal(list[0].name, 'docs')
  assert.ok(!list.some(e => e.name === 'escape' || e.name === 'node_modules'))
  assert.equal(readWorkspaceText(root, 'README.md'), '# 手機唯讀預覽')
  for (const bad of ['../outside/private.txt', path.join(outside, 'private.txt'), 'escape/private.txt']) {
    assert.throws(() => workspacePath(root, bad))
  }
  assert.throws(() => readWorkspaceText(root, 'binary.dat'))
  assert.throws(() => readWorkspaceText(root, 'large.txt'))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  const htmlUrl = files.issueUrl('localhost', root, 'docs/view.html', 'phone')
  const htmlPath = new URL(htmlUrl).pathname
  const html = await fetch(base + htmlPath)
  assert.equal(html.status, 200)
  assert.match(html.headers.get('content-type')!, /text\/html/)
  const csp = String(sent.get(htmlPath)?.['content-security-policy'])
  assert.match(csp, /sandbox allow-scripts/)
  assert.match(csp, /connect-src 'none'/)
  assert.match(await html.text(), /Preview/)
  const css = await fetch(base + new URL('theme.css', htmlUrl).pathname)
  assert.equal(css.status, 200)
  assert.match(await css.text(), /teal/)
  const pdfPath = new URL(files.issueUrl('localhost', root, 'docs/report.pdf', 'phone')).pathname
  const pdf = await fetch(base + pdfPath, { headers: { Range: 'bytes=0-7' } })
  assert.equal(pdf.status, 206)
  assert.equal(pdf.headers.get('content-type'), 'application/pdf')
  assert.match(pdf.headers.get('content-range')!, /^bytes 0-7\//)
  assert.equal(await pdf.text(), '%PDF-1.4')
  assert.equal((await fetch(base + pdfPath, { headers: { Range: 'bytes=99999-' } })).status, 416)
  assert.equal((await fetch(base + htmlPath, { method: 'POST', body: 'edit' })).status, 405)
  assert.equal(fs.readFileSync(path.join(root, 'docs', 'view.html'), 'utf8').includes('edit'), false)
  const grantPrefix = htmlPath.split('/').slice(0, 3).join('/')
  assert.equal((await fetch(base + grantPrefix + '/escape/private.txt')).status, 404)
  assert.equal((await fetch(base + '/_files/forged/README.md')).status, 403)
  paired = false
  assert.equal((await fetch(base + htmlPath)).status, 403, 'revoked phone cannot reuse preview URL')
  paired = true
  files.clear()
  assert.equal((await fetch(base + htmlPath)).status, 403, 'stopping bridge invalidates preview grants')
  console.log('remote files: directory/text/HTML assets/PDF ranges/read-only/traversal/symlink/revocation passed')
} finally {
  await new Promise<void>(resolve => server.close(() => resolve()))
  assert.equal(path.dirname(temp), fs.realpathSync(os.tmpdir()))
  fs.rmSync(temp, { recursive: true, force: true })
}
