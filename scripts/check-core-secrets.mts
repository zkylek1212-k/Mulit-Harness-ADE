// 機密遷移：node --experimental-strip-types scripts/check-core-secrets.mts
// 用真的 DPAPI（wb-bridge）與假的 safeStorage。每個步驟注入失敗：舊資料都要還在，而且不會只搬一半。
import './ts-resolve.mjs'
import assert from 'node:assert'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const { migrateSealedFile, migrateCredentialFile, osProtect, osUnprotect, DPAPI_PREFIX } = await import('../src/main/core/secrets.ts')
const { bridgePath } = await import('../src/main/core/bridge.ts')
assert.ok(fs.existsSync(bridgePath()), `build wb-bridge first: ${bridgePath()}`)

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-secrets-'))
const fakeSafe = (plain: string): string => Buffer.from(`SAFE:${plain}`).toString('base64')
const decrypt = (b64: string): string => {
  const s = Buffer.from(b64, 'base64').toString()
  if (!s.startsWith('SAFE:')) throw new Error('not safeStorage data')
  return s.slice(5)
}
const tools = { decrypt, protect: osProtect, unprotect: osUnprotect }

// 來回：含中文、PEM、空字串
for (const plain of ['-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n', '中文密碼', '']) {
  const sealed = osProtect(plain)
  assert.notEqual(Buffer.from(sealed, 'base64').toString(), plain)
  assert.equal(osUnprotect(sealed), plain)
}
assert.throws(() => osUnprotect(Buffer.from('not a blob').toString('base64')), 'garbage is rejected')

// remote/secrets.json
const file = path.join(tmp, 'secrets.json')
const write = (): void =>
  fs.writeFileSync(file, JSON.stringify({ caCert: 'CERT', caKey: { enc: 'safe', data: fakeSafe('CA-KEY') }, serverCert: 'S', serverKey: { enc: 'safe', data: fakeSafe('SERVER') }, vapidPublic: 'V', vapidPrivate: { enc: 'safe', data: fakeSafe('VAPID') } }))
write()
const original = fs.readFileSync(file, 'utf8')
assert.equal(migrateSealedFile(file, tools), 3)
let now = JSON.parse(fs.readFileSync(file, 'utf8'))
assert.equal(now.caKey.enc, 'dpapi')
assert.equal(osUnprotect(now.caKey.data), 'CA-KEY', 'the same key, so phones keep trusting the CA')
assert.equal(osUnprotect(now.vapidPrivate.data), 'VAPID')
assert.equal(now.caCert, 'CERT', 'public parts are untouched')
assert.ok(!fs.readFileSync(file, 'utf8').includes('CA-KEY'), 'no plaintext on disk')
assert.equal(fs.readFileSync(`${file}.pre-dpapi`, 'utf8'), original, 'pre-migration backup')
assert.ok(!fs.existsSync(`${file}.migrating`))
// 重跑：沒事可做，備份不被覆蓋
const after = fs.readFileSync(file, 'utf8')
assert.equal(migrateSealedFile(file, tools), 0)
assert.equal(fs.readFileSync(file, 'utf8'), after)
assert.equal(fs.readFileSync(`${file}.pre-dpapi`, 'utf8'), original)

// 注入失敗：解不開、加密失敗、讀回不一致。原檔都不能變，也不能留下半成品被當真
fs.rmSync(`${file}.pre-dpapi`)
for (const [name, bad] of [
  ['decrypt', { ...tools, decrypt: () => { throw new Error('locked') } }],
  ['protect', { ...tools, protect: () => { throw new Error('dpapi down') } }],
  ['read back', { ...tools, unprotect: () => 'something else' }]
] as const) {
  write()
  const before = fs.readFileSync(file, 'utf8')
  assert.throws(() => migrateSealedFile(file, bad), undefined, name)
  assert.equal(fs.readFileSync(file, 'utf8'), before, `${name}: the old file stays`)
}
// 中斷後重跑（暫存檔還在）可以完成
write()
fs.writeFileSync(`${file}.migrating`, 'half written')
assert.equal(migrateSealedFile(file, tools), 3)
now = JSON.parse(fs.readFileSync(file, 'utf8'))
assert.equal(osUnprotect(now.serverKey.data), 'SERVER')

// 檔案不存在：沒事
assert.equal(migrateSealedFile(path.join(tmp, 'missing.json'), tools), 0)

// 新舊混合：只搬舊格式（遷移到一半寫入的新值不動）
const mixed = path.join(tmp, 'mixed.json')
const fresh = osProtect('NEW')
fs.writeFileSync(mixed, JSON.stringify({ a: { enc: 'dpapi', data: fresh }, b: { enc: 'safe', data: fakeSafe('OLD') }, c: { enc: 'plain', data: 'linux' } }))
assert.equal(migrateSealedFile(mixed, tools), 1)
const m = JSON.parse(fs.readFileSync(mixed, 'utf8'))
assert.equal(m.a.data, fresh)
assert.equal(osUnprotect(m.b.data), 'OLD')
assert.deepEqual(m.c, { enc: 'plain', data: 'linux' })

// <workspace>/.workbench/credentials.enc
const cred = path.join(tmp, 'credentials.enc')
fs.writeFileSync(cred, JSON.stringify({ github: fakeSafe('token-1'), db: fakeSafe('中文') }))
assert.equal(migrateCredentialFile(cred, tools), 2)
const c = JSON.parse(fs.readFileSync(cred, 'utf8'))
assert.ok(c.github.startsWith(DPAPI_PREFIX))
assert.equal(osUnprotect(c.db.slice(DPAPI_PREFIX.length)), '中文')
assert.equal(migrateCredentialFile(cred, tools), 0)

fs.rmSync(tmp, { recursive: true, force: true })
console.log('core secrets ok')
