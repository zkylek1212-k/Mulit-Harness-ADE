// The real TS handlers and the Rust backend answer the same calls on identical fixtures, and the answers must match.
// node --experimental-strip-types --no-warnings scripts/check-core-parity.mts
import { registerHooks } from 'node:module'
import { spawn, execFileSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import assert from 'node:assert'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import './ts-resolve.mjs'

const target = process.env.CARGO_TARGET_DIR || path.join(process.env.LOCALAPPDATA || '', 'wb-cargo-target')
const exe = process.env.WB_IPC_PATH || path.join(target, 'debug', 'wb-ipc.exe')
const base = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'wb-parity-'))
const NOW = Date.now() - 3 * 3600_000 // Three hours ago: stable status, inside the background-task window

function mkFixture(root: string): { home: string; data: string; ws: string } {
  const home = path.join(root, 'home')
  const data = path.join(root, 'data')
  const ws = path.join(root, 'ws')
  const w = (rel: string, body: string, at = NOW): string => {
    const f = path.join(root, rel)
    fs.mkdirSync(path.dirname(f), { recursive: true })
    fs.writeFileSync(f, body)
    fs.utimesSync(f, new Date(at), new Date(at))
    return f
  }
  const ts = new Date(NOW).toISOString()
  const j = (o: unknown): string => JSON.stringify(o)
  fs.mkdirSync(data, { recursive: true })
  // Project files
  w('ws/README.md', '# hello\n')
  w('ws/src/a.ts', 'export const a = 1\n')
  w('ws/src/中文.md', '內容\n')
  w('ws/.workbench/extensions.yaml', 'version: 1\nskills:\n  - id: my-skill\n    path: skills/my-skill\n    targets: [claude, antigravity]\n  - id: ../evil\n    path: skills/my-skill\n    targets: [claude]\nmcp:\n  - id: srv\n    command: npx\n    args: [-y, thing]\n    env: { TOKEN: "${conn:tok}", PLAIN: "1" }\n    targets: [claude, antigravity]\nplugins: []\n')
  w('ws/skills/my-skill/SKILL.md', '---\nname: My Skill\ndescription: does things\nmetadata:\n  version: "1.2"\n---\nbody\n')
  w('ws/agents/one.yaml', 'launcher:\n  id: one\n  name: One\n  cli: claude\n  args: [--foo]\n  env: { A: 1, PATH: evil, NODE_OPTIONS: evil }\n')
  w('ws/agents/bad.yaml', 'launcher:\n  id: bad\n  cli: /evil/program\n')
  // Claude
  const slug = ws.replace(/[^A-Za-z0-9]/g, '-')
  w(`home/.claude/projects/${slug}/s1.jsonl`, [
    j({ type: 'user', cwd: ws, timestamp: ts, message: { content: 'first question\nsecond line' } }),
    j({ timestamp: ts, attachment: { type: 'model', identity: { marketingName: 'Opus Test' } } }),
    j({ timestamp: ts, message: { id: 'm1', usage: { input_tokens: 10, cache_creation_input_tokens: 5, cache_read_input_tokens: 100, output_tokens: 7 }, content: [{ type: 'tool_use', id: 'tu1', name: 'Bash', input: { command: 'npm test\nmore' } }] } }),
    j({ timestamp: ts, message: { id: 'm1', usage: { input_tokens: 10, cache_creation_input_tokens: 5, cache_read_input_tokens: 100, output_tokens: 7 } } }),
    j({ timestamp: ts, message: { content: [{ type: 'tool_result', tool_use_id: 'tu1', content: 'Command running in background with ID: x' }] } }),
    j({ timestamp: ts, type: 'queue-operation', content: '<task-notification><tool-use-id>tu1</tool-use-id><status>completed</status><summary>all "good"</summary></task-notification>' }),
    '{broken'
  ].join('\n'))
  w('home/.claude/projects/C--no-such-place/s2.jsonl', j({ type: 'user', timestamp: ts, message: { content: [{ type: 'text', text: 'array' }, { type: 'text', text: 'content' }] } }))
  w('home/.claude/settings.json', j({ enabledPlugins: { 'pl@market': false } }))
  w('home/.claude/skills/alpha_skill/SKILL.md', '---\nname: Alpha Skill\n---\n')
  w('home/.claude/plugins/installed_plugins.json', j({ version: 2, plugins: { 'pl@market': [{ installPath: path.join(home, 'plug'), version: '3.0' }] } }))
  w('home/plug/skills/inner/SKILL.md', '---\ndescription: inner skill\n---\n')
  w('home/plug/.mcp.json', j({ mcpServers: { plugmcp: { command: 'node' } } }))
  w('home/.claude.json', j({ mcpServers: { globalmcp: { url: 'http://x' } }, projects: { [ws]: { mcpServers: { projmcp: { command: 'p' } } } } }))
  // Codex
  const id = '11111111-2222-3333-4444-555555555555'
  w(`home/.codex/sessions/2026/01/01/rollout-2026-${id}.jsonl`, [
    j({ type: 'session_meta', timestamp: ts, payload: { cwd: ws } }),
    j({ type: 'response_item', payload: { role: 'user', content: [{ type: 'input_text', text: '<skip me>' }, { type: 'input_text', text: 'codex title\nmore' }] } }),
    j({ timestamp: ts, payload: { base_instructions: { provenance: { model: 'gpt-x' } }, info: { total_token_usage: { input_tokens: 100, cached_input_tokens: 40, output_tokens: 10 } } } }),
    j({ timestamp: ts, payload: { type: 'custom_tool_call', name: 'exec', call_id: 'c1', input: 'await exec_command({ cmd: "sleep 100" })' } }),
    j({ timestamp: ts, payload: { type: 'custom_tool_call_output', call_id: 'c1', output: 'ok' } }),
    j({ timestamp: ts, payload: { type: 'item_completed', item: { type: 'CommandExecution', command: ['sh', 'sleep 100'], status: 'completed', exit_code: 3 } } }),
  ].join('\n'))
  w('home/.codex/config.toml', '[mcp_servers.tomlsrv]\ncommand = "tool"\n[mcp_servers.tomlsrv.env]\nX = "1"\n[plugins."cp@mk"]\nenabled = true\n[plugins."off@mk"]\nenabled = false\n')
  w('home/.codex/session_index.jsonl', '')
  // Antigravity
  w('home/.gemini/antigravity-cli/brain/b1/.system_generated/logs/transcript.jsonl', [
    j({ type: 'USER_INPUT', created_at: ts, content: `<USER_REQUEST>agy title\nnext</USER_REQUEST> ${ws}` }),
    j({ type: 'PLANNER_RESPONSE', source: 'MODEL', created_at: ts, thinking: 'y'.repeat(7), content: '中'.repeat(7) }),
    j({ type: 'GENERIC', created_at: ts, content: `Created At: now\nTool is running as a background task with task id: t1\nTask Description: long job ${ws}` }),
    j({ type: 'SYSTEM_MESSAGE', created_at: ts, content: 'Task id "t1" finished with result: The command exited with code 2' }),
  ].join('\n'))
  w('home/.gemini/antigravity-cli/conversations/conv1.db', `binary\0stuff ${ws.replace(/\\/g, '\\\\')} more`)
  w('home/.gemini/config/plugins/gp/plugin.json', j({ name: 'GP', version: '1', description: 'g' }))
  w('home/.gemini/config/plugins/gp/skills/SKILL.md', '---\nname: gp skill\n---\n')
  w('home/.gemini/config/mcp_config.json', '')
  // Settings, including values a repo must not be able to set
  w('data/settings.json', j({ cliPaths: { claude: 'C:\\no\\such\\claude.exe', codex: 'codex' }, cliEnabled: { codex: true }, language: 'zh-TW', recentWorkspaces: [ws, 'C:\\Windows\\System32'], cliBypassPermissions: false, cowork: { limits: { maxPlanningCalls: 999 }, participants: ['claude', 'claude', 'nope'] } }))
  w('ws/.workbench/settings.json', j({ cliBypassPermissions: true, cliPaths: { claude: 'evil.exe' }, cliEnabled: { claude: false }, language: 'en', cowork: { limits: { maxPlanningCalls: 30 } } }))
  w('data/dashboard-state.json', j({ archivedIds: ['b1'], deletedIds: ['nothing'], archivedWorkspaces: [], deletedWorkspaces: [] }))
  // Repo
  const git = (...a: string[]): void => { execFileSync('git', a, { cwd: ws, stdio: 'ignore' }) }
  git('init', '-b', 'main')
  git('config', 'user.email', 't@e.st')
  git('config', 'user.name', 'T')
  git('config', 'core.autocrlf', 'false')
  git('add', 'README.md', 'src/a.ts')
  git('commit', '-m', 'one')
  fs.appendFileSync(path.join(ws, 'README.md'), 'more\n')
  fs.writeFileSync(path.join(ws, 'src/b.ts'), 'new\n')
  git('checkout', '-b', 'feature')
  git('add', 'src/b.ts')
  git('commit', '-m', 'two\tTabbed')
  git('checkout', 'main')
  return { home, data, ws }
}

// ── TS side: the real handlers with a stubbed electron ──
const tsRoot = path.join(base, 'ts', 'root')
const rsRoot = path.join(base, 'rs', 'root')
const tsFx = mkFixture(tsRoot)
const rsFx = mkFixture(rsRoot)
// Same-named deep folders so paths differ only by the root
process.env.USERPROFILE = tsFx.home
process.env.HOME = tsFx.home

const handlers = new Map<string, (...a: any[]) => any>()
const fakeWin = { id: 1, webContents: { id: 1, isDestroyed: () => false, send() {} }, isDestroyed: () => false, setTitle() {} }
const electronStub = `
const g = globalThis.__wbElectron
export const app = g.app
export const ipcMain = g.ipcMain
export const BrowserWindow = g.BrowserWindow
export const dialog = g.dialog
export const shell = g.shell
export const Notification = g.Notification
export const Menu = g.Menu
export const safeStorage = g.safeStorage
export const nativeImage = g.nativeImage
export const nativeTheme = g.nativeTheme
export default g
`
;(globalThis as any).__wbElectron = {
  app: {
    isPackaged: false,
    getPath: (k: string) => (k === 'userData' ? tsFx.data : k === 'exe' ? process.execPath : tsFx.home),
    setPath() {},
    getVersion: () => '0.0.0',
    getName: () => 'agent-workbench',
    getAppPath: () => process.cwd(),
    setAppUserModelId() {},
    requestSingleInstanceLock: () => true,
    on() {},
    once() {},
    quit() {},
    whenReady: () => new Promise(() => {}),
    setJumpList() {},
    setUserTasks() {},
    addRecentDocument() {},
    clearRecentDocuments() {}
  },
  ipcMain: { handle: (c: string, f: any) => handlers.set(c, f), on: (c: string, f: any) => handlers.set(c, f) },
  BrowserWindow: Object.assign(function () {}, { fromWebContents: () => fakeWin, getFocusedWindow: () => fakeWin, getAllWindows: () => [fakeWin], fromId: () => fakeWin }),
  dialog: {},
  shell: { openPath: async () => '', showItemInFolder() {}, openExternal() {} },
  Notification: Object.assign(function () {}, { isSupported: () => false }),
  Menu: { setApplicationMenu() {} },
  safeStorage: { isEncryptionAvailable: () => false, encryptString: (s: string) => Buffer.from(s), decryptString: (b: Buffer) => b.toString() },
  nativeImage: { createFromPath: () => ({}) },
  nativeTheme: {}
}
registerHooks({
  resolve(spec, ctx, next) {
    if (spec === 'electron') return { url: `data:text/javascript,${encodeURIComponent(electronStub)}`, shortCircuit: true }
    if (spec === 'electron-updater') return { url: `data:text/javascript,${encodeURIComponent('export const autoUpdater={on(){},checkForUpdates(){},setFeedURL(){}};export default {autoUpdater}')}`, shortCircuit: true }
    // Compared elsewhere; index.ts only needs them to load
    const stubs: Record<string, string> = {
      './ipc/updater': 'export const registerUpdaterHandlers = () => {}',
      './remote': 'export const registerRemoteHandlers = () => {}; export const stopRemote = () => {}',
      './ipc/cowork': 'export const registerCoworkHandlers = () => {}; export const shutdownCowork = () => {}',
      './ipc/memsync': 'export const registerMemSyncHandlers = () => {}',
      './jumplist': 'export const initJumpList = () => {}; export const parseCommandLineArgs = () => ({})'
    }
    if (stubs[spec]) return { url: `data:text/javascript,${encodeURIComponent(stubs[spec])}`, shortCircuit: true }
    // Terminals are covered by check-core-pty; no pty runs here
    if (spec === '@xterm/headless') return { url: `data:text/javascript,${encodeURIComponent('export class Terminal {}')}`, shortCircuit: true }
    if (spec === '@xterm/addon-serialize') return { url: `data:text/javascript,${encodeURIComponent('export class SerializeAddon {}')}`, shortCircuit: true }
    if (spec === '@lydell/node-pty') return { url: `data:text/javascript,${encodeURIComponent('export function spawn() { throw new Error("no pty") }')}`, shortCircuit: true }
    if (spec.includes('?nodeWorker')) return { url: `data:text/javascript,${encodeURIComponent('export default function(){throw new Error("no worker")}')}`, shortCircuit: true }
    if (spec.includes('?raw')) return { url: `data:text/javascript,${encodeURIComponent('export default ""')}`, shortCircuit: true }
    if (spec.includes('?asset')) return { url: `data:text/javascript,${encodeURIComponent('export default ""')}`, shortCircuit: true }
    if (ctx.parentURL?.startsWith('data:') && (spec.startsWith('.') || spec.startsWith('/'))) throw new Error(`relative import from data url: ${spec}`)
    return next(spec, ctx)
  }
})

const main = await import('../src/main/index.ts')
const { registerFileHandlers } = await import('../src/main/ipc/files.ts')
const { registerGitHandlers } = await import('../src/main/ipc/git.ts')
const { registerSettingsHandlers } = await import('../src/main/ipc/settings.ts')
const { registerDashboardHandlers } = await import('../src/main/ipc/dashboard.ts')
const { registerExtHandlers } = await import('../src/main/ipc/ext.ts')
const { registerConnHandlers } = await import('../src/main/ipc/conn.ts')
const { registerPtyHandlers } = await import('../src/main/ipc/pty.ts')
registerFileHandlers()
registerGitHandlers()
registerSettingsHandlers()
registerDashboardHandlers()
registerExtHandlers()
registerConnHandlers()
registerPtyHandlers()
main.setWorkspaceForWindow(fakeWin as any, tsFx.ws)

async function callTs(channel: string, args: unknown[]): Promise<{ ok: unknown } | { err: string }> {
  try {
    const h = handlers.get(channel)
    if (!h) throw new Error(`no handler ${channel}`)
    const r = await h({ sender: fakeWin.webContents }, ...args)
    return { ok: r === undefined ? null : JSON.parse(JSON.stringify(r)) }
  } catch (e) {
    return { err: (e as Error).message }
  }
}

// ── Rust side ──
const child = spawn(exe, [], { env: { ...process.env, USERPROFILE: rsFx.home, HOME: rsFx.home, WB_DATA_DIR: rsFx.data }, stdio: ['pipe', 'pipe', 'inherit'] })
const pending = new Map<number, (m: any) => void>()
createInterface({ input: child.stdout! }).on('line', (l) => {
  const m = JSON.parse(l)
  if (m.id !== undefined) {
    pending.get(m.id)?.(m)
    pending.delete(m.id)
  }
})
let nextId = 1
function rust(channel: string, args: unknown[], window = 1): Promise<any> {
  const id = nextId++
  return new Promise((resolve) => {
    pending.set(id, resolve)
    child.stdin!.write(JSON.stringify({ id, window, channel, args }) + '\n')
  })
}
async function callRs(channel: string, args: unknown[]): Promise<{ ok: unknown } | { err: string }> {
  const m = await rust(channel, args)
  return m.error !== undefined ? { err: m.error } : { ok: m.result }
}
await rust('test:openWindow', [rsFx.ws])

const esc = (s: string): string[] => [s, s.replace(/\\/g, '/'), s.replace(/\\/g, '\\\\'), s.replace(/\\/g, '/').toLowerCase(), s.replace(/[^A-Za-z0-9]/g, '-')]
function norm(v: unknown, root: string): unknown {
  let text = JSON.stringify(v)
  for (const form of esc(root).concat(esc(root).map((f) => JSON.stringify(f).slice(1, -1)))) text = text.split(form).join('<ROOT>')
  return JSON.parse(text)
}
/** Sets are order-free in the TS code too (readdir order, Map insertion by scan order) */
function sortDeep(v: any): any {
  if (Array.isArray(v)) {
    const a = v.map(sortDeep)
    return a.every((x) => x && typeof x === 'object' && 'id' in x) ? a.sort((x, y) => String(x.id).localeCompare(String(y.id))) : a
  }
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortDeep(v[k])]))
  return v
}

let failed = 0
let passed = 0
async function same(channel: string, args: (fx: typeof tsFx) => unknown[] = () => [], opts: { errorOnly?: boolean; pick?: (v: any) => any } = {}): Promise<void> {
  const [a, b] = await Promise.all([callTs(channel, args(tsFx)), callRs(channel, args(rsFx))])
  const pick = (r: any): any => ('ok' in r ? { ok: opts.pick ? opts.pick(r.ok) : r.ok } : { err: true })
  const na = sortDeep(norm(pick(a), tsRoot))
  const nb = sortDeep(norm(pick(b), rsRoot))
  try {
    assert.deepStrictEqual(nb, na)
    passed++
  } catch (e) {
    failed++
    console.error(`DIFF ${channel} ${JSON.stringify(args(tsFx)).slice(0, 80)}\n  ts: ${JSON.stringify(na).slice(0, 1500)}\n  rs: ${JSON.stringify(nb).slice(0, 1500)}`)
  }
}

// Read-only surface
await same('settings:get')
await same('settings:getRecentWorkspaces')
await same('settings:testDocToolPath', () => ['C:\\no\\such.exe'])
await same('settings:testDocToolPath', () => [''])
await same('settings:testCliPath', () => [''])
await same('settings:testCliPath', () => ['cmd'])
await same('files:workspaceRoot')
await same('files:list', (f) => [f.ws])
// Accepted difference: Node's ICU sorted the Chinese name first here, Rust sorts Latin first. Same entries.
await same('files:list', (f) => [path.join(f.ws, 'src')], { pick: (l) => [...l].sort((a: any, b: any) => (a.name < b.name ? -1 : 1)) })
await same('files:list', () => ['C:\\Windows'])
await same('files:read', (f) => [path.join(f.ws, 'src', '中文.md')])
await same('files:read', () => ['C:\\Windows\\win.ini'])
await same('files:read', () => ['..\\..\\secret'])
await same('files:exists', (f) => [path.join(f.ws, 'README.md')])
await same('files:exists', (f) => [path.join(f.ws, 'nope')])
await same('files:stat', (f) => [path.join(f.ws, 'src', 'a.ts')], { pick: (v) => ({ size: v.size, isFile: v.isFile }) })
await same('files:detectDocTools')
await same('git:status')
await same('git:log', () => [5], { pick: (l) => l.map((c: any) => ({ message: c.message, author: c.author })) })
await same('git:graph', () => [5], { pick: (l) => l.map((c: any) => ({ parents: c.parents.length, refs: c.refs, message: c.message, author: c.author })) })
await same('git:branches')
await same('git:diff', () => ['README.md'])
await same('git:commit', () => [''])
await same('dashboard:usage')
await same('dashboard:bgTasks', (f) => [f.ws])
await same('dashboard:bgTasks', () => ['C:\\unrelated'])
await same('dashboard:data', () => [true], { pick: (d) => ({ ...d, sessions: d.sessions.map((s: any) => ({ ...s, lastActiveTime: 0, startTime: 0 })) }) })
await same('dashboard:data', () => [false], { pick: (d) => ({ agents: d.agents, usage: d.usageByRange }) })
await same('ext:manifest')
await same('ext:inventory')
await same('ext:agents', () => [], { pick: (l) => l.map((a: any) => ({ agent: a.agent, counts: a.counts, label: a.label })) })
await same('ext:planSync')
await same('ext:getAgentInstallInfo', () => ['claude'])
await same('ext:getAgentInstallInfo', () => ['antigravity'])
await same('ext:getAgentInstallInfo', () => ['codex'])
await same('ext:customList', () => ['skill'])
await same('pty:launchers', () => [], { pick: (l) => l.map((x: any) => ({ id: x.id, name: x.name, cli: x.cli, env: x.env, hasExtras: x.hasExtras, args: x.args.filter((a: string) => a.startsWith('--')) })) })
await same('conn:list')

// Writes: same effect on disk and the same answers afterwards
await same('files:write', (f) => [path.join(f.ws, 'new', 'deep', 'x.txt'), '內容'])
await same('files:read', (f) => [path.join(f.ws, 'new', 'deep', 'x.txt')])
await same('files:write', () => ['C:\\Windows\\evil.txt', 'x'])
await same('git:stage', () => ['README.md'])
await same('git:status')
await same('git:unstage', () => ['README.md'])
await same('git:status')
await same('git:checkout', () => ['feature'])
await same('git:branches')
await same('git:checkout', () => ['main'])
await same('git:stage', () => ['new/deep/x.txt'])
await same('git:commit', () => ['third commit'])
await same('git:log', () => [1], { pick: (l) => l.map((c: any) => c.message) })
await same('settings:set', () => [{ language: 'en', autoCheckUpdates: false, cliEnabled: { codex: false }, cliPaths: { powershell: 'pwsh' } }])
await same('settings:get')
await same('settings:set', () => [{ customAgent: { enabled: true, command: '' } }])
await same('settings:set', () => [{ customAgent: { enabled: true, command: 'x', resources: { skill: 'relative' } } }])
await same('settings:removeRecentWorkspace', (f) => [f.ws])
await same('settings:getRecentWorkspaces')
await same('settings:clearRecentWorkspaces')
await same('settings:getRecentWorkspaces')
await same('dashboard:archiveSession', () => ['s1', true])
await same('dashboard:deleteSessions', () => [['s2'], ])
await same('dashboard:data', () => [true], { pick: (d) => d.sessions.map((s: any) => ({ id: s.id, a: s.isArchived })) })
await same('dashboard:archiveWorkspace', (f) => [f.ws, true, ['x1']])
await same('dashboard:data', () => [true], { pick: (d) => ({ w: d.userWorkspaces, a: d.archivedWorkspaces, s: d.sessions.map((s: any) => ({ id: s.id, a: s.isArchived })) }) })
await same('dashboard:archiveWorkspace', (f) => [f.ws, false])
await same('dashboard:deleteWorkspace', (f) => [f.ws])
await same('dashboard:data', () => [true], { pick: (d) => ({ w: d.userWorkspaces, d: d.deletedWorkspaces, s: d.sessions.map((s: any) => s.id) }) })
await same('dashboard:unmarkWorkspace', (f) => [f.ws])
await same('dashboard:data', () => [true], { pick: (d) => ({ w: d.userWorkspaces, d: d.deletedWorkspaces, s: d.sessions.map((s: any) => s.id) }) })
await same('ext:toggleItem', () => ['plugin', 'pl', true, 'claude'])
await same('ext:inventory')
await same('ext:toggleItem', () => ['skill', 'alpha-skill', false])
await same('ext:inventory')
await same('ext:applySync', () => [], { pick: (r) => r.written.map((x: string) => path.basename(x)).sort() })
await same('ext:planSync')
await same('ext:trustWorkspace')
await same('ext:saveManifest', () => [{ version: 1, skills: [], mcp: [], plugins: [{ id: 'p', targets: ['claude'] }] }])
await same('ext:manifest')
await same('files:setWorkspaceRoot', () => ['C:\\no\\such'])
await same('conn:remove', () => ['missing'])

child.stdin!.end()
child.kill()
fs.rmSync(base, { recursive: true, force: true, maxRetries: 5 })
console.log(`parity: ${passed} calls match, ${failed} differ`)
process.exit(failed ? 1 : 0)
