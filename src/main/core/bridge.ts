// Electron 這邊接 Rust 核心（core/apps/wb-bridge）。Phase 7 切到 Tauri 後整個檔案移除。
//
// 切換規則（計劃 4B）：
// - 每個模組用環境變數選後端（WB_CORE_GIT=rust），在操作開始前決定，預設走 TS。
// - bridge 起不來 = 請求沒送出，呼叫端可以退回 TS。
// - 請求送出後 bridge 才掛：結果不明，一律回報錯誤，不重試、不改走 TS，以免重複執行 Git 寫入或付費呼叫。
// 不 import electron：scripts/check-*.mts 也要能用。
import { spawn, type ChildProcess } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

export const CORE_PROTOCOL = 1

export type CoreModule = 'git' | 'proc' | 'pty'

export function coreEnabled(mod: CoreModule): boolean {
  return process.env[`WB_CORE_${mod.toUpperCase()}`] === 'rust'
}

export function bridgePath(): string {
  if (process.env.WB_BRIDGE_PATH) return process.env.WB_BRIDGE_PATH
  const resources = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath
  const packaged = resources ? path.join(resources, 'wb-bridge.exe') : ''
  if (packaged && fs.existsSync(packaged)) return packaged
  const target = process.env.CARGO_TARGET_DIR || path.join(process.env.LOCALAPPDATA || '', 'wb-cargo-target')
  return path.join(target, 'release', process.platform === 'win32' ? 'wb-bridge.exe' : 'wb-bridge')
}

/** bridge 起不來，請求沒有送出：可以安全地退回 TS */
export class CoreUnavailableError extends Error {
  code = 'core-unavailable'
}

/** 請求送出後 bridge 中斷：不知道做了沒，不得重試 */
export class CoreResultUnknownError extends Error {
  code = 'core-result-unknown'
}

interface Pending {
  resolve: (v: any) => void
  reject: (e: Error) => void
  onOutput?: (stream: number, bytes: Buffer) => void
  onSpawn?: (pid: number) => void
}

function encode(msg: unknown): Buffer {
  const payload = Buffer.from(JSON.stringify(msg), 'utf8')
  const head = Buffer.alloc(5)
  head[0] = 1
  head.writeUInt32LE(payload.length, 1)
  return Buffer.concat([head, payload])
}

/** 一個 Rust 終端的事件；全部照串流順序送達 */
export interface CorePtyHandlers {
  onData: (bytes: Buffer) => void
  onResized: (cols: number, rows: number) => void
  onExit: (code: number) => void
  onSnapshot: (req: number, cols: number, rows: number, data: string) => void
  onApproval: (waiting: boolean, screen: string) => void
}

class CoreBridge {
  ptys = new Map<number, CorePtyHandlers>()
  private child: ChildProcess | null = null
  private buf: Buffer = Buffer.alloc(0)
  private pending = new Map<number, Pending>()
  private nextId = 1
  private ready: Promise<void> | null = null
  private stderrTail = ''
  private starting = false

  private start(): Promise<void> {
    if (this.ready) return this.ready
    this.ready = new Promise<void>((resolve, reject) => {
      const file = bridgePath()
      if (!fs.existsSync(file)) {
        this.ready = null
        reject(new CoreUnavailableError(`wb-bridge not found: ${file}`))
        return
      }
      const child = spawn(file, [], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
      this.child = child
      this.starting = true
      this.buf = Buffer.alloc(0)
      let helloSeen = false
      const onHello = (protocol: number): void => {
        helloSeen = true
        this.starting = false
        if (protocol !== CORE_PROTOCOL) {
          child.kill()
          reject(new CoreUnavailableError(`wb-bridge protocol ${protocol}, expected ${CORE_PROTOCOL}`))
          return
        }
        resolve()
      }
      child.stdout!.on('data', (d: Buffer) => this.onData(d, onHello))
      // 診斷只留尾巴，避免無上限累積；內容不含機密（機密不走這條路）
      child.stderr!.setEncoding('utf8').on('data', (d: string) => {
        this.stderrTail = (this.stderrTail + d).slice(-2000)
      })
      child.stdin!.on('error', () => {})
      child.on('error', (e) => {
        if (!helloSeen) reject(new CoreUnavailableError(e.message))
        this.onGone(e.message)
      })
      child.on('exit', (code) => {
        if (!helloSeen) reject(new CoreUnavailableError(`wb-bridge exited with ${code}: ${this.stderrTail}`))
        this.onGone(`exit ${code}`)
      })
      this.syncRef()
    })
    return this.ready
  }

  private onGone(why: string): void {
    this.child = null
    this.ready = null
    this.starting = false
    const err = new CoreResultUnknownError(`wb-bridge stopped (${why}). The result of the running operation is unknown.`)
    for (const p of this.pending.values()) p.reject(err)
    this.pending.clear()
    // 終端也一樣：不知道跑到哪，job object 已經把 agent 收掉，告訴使用者結束了
    const ptys = [...this.ptys.values()]
    this.ptys.clear()
    for (const h of ptys) h.onExit(-1)
  }

  private onData(d: Buffer, onHello: (protocol: number) => void): void {
    this.buf = this.buf.length ? Buffer.concat([this.buf, d]) : d
    while (this.buf.length >= 5) {
      const len = this.buf.readUInt32LE(1)
      if (this.buf.length < 5 + len) return
      const kind = this.buf[0]
      const payload = this.buf.subarray(5, 5 + len)
      this.buf = this.buf.subarray(5 + len)
      if (kind === 2) {
        const id = Number(payload.readBigUInt64LE(0))
        this.pending.get(id)?.onOutput?.(payload[8], Buffer.from(payload.subarray(9)))
        continue
      }
      if (kind === 3) {
        const h = this.ptys.get(payload.readUInt32LE(0))
        if (!h) continue
        const type = payload[4]
        const body = payload.subarray(5)
        if (type === 0) h.onData(Buffer.from(body))
        else {
          const j = JSON.parse(body.toString('utf8'))
          if (type === 1) h.onSnapshot(j.req, j.cols, j.rows, j.data)
          else if (type === 2) h.onResized(j.cols, j.rows)
          else if (type === 3) {
            const sid = payload.readUInt32LE(0)
            this.ptys.delete(sid)
            h.onExit(j.code)
            this.syncRef()
            // Rust 端也放掉，不然長時間使用會一直累積
            this.send('pty.forget', { sid }).catch(() => {})
          }
        }
        continue
      }
      const m = JSON.parse(payload.toString('utf8'))
      if (m.event === 'hello') onHello(m.protocol)
      else if (m.event === 'pty.approval') this.ptys.get(m.sid)?.onApproval(m.waiting, m.screen)
      else if (m.event === 'proc.spawn') this.pending.get(m.id)?.onSpawn?.(m.pid)
      else if (m.id !== undefined) {
        const p = this.pending.get(m.id)
        if (!p) continue
        this.pending.delete(m.id)
        this.syncRef()
        if (m.error) p.reject(new Error(m.error.message))
        else p.resolve(m.result)
      }
    }
  }

  /** 沒有進行中的請求就不要讓 bridge 撐著這個行程不結束 */
  private syncRef(): void {
    const c = this.child as (ChildProcess & { stdout: any; stderr: any; stdin: any }) | null
    if (!c) return
    const on = this.pending.size > 0 || this.starting || this.ptys.size > 0
    for (const h of [c, c.stdout, c.stderr, c.stdin]) {
      if (on) h?.ref?.()
      else h?.unref?.()
    }
  }

  async call<T>(method: string, params: unknown, hooks?: Pick<Pending, 'onOutput' | 'onSpawn'>): Promise<{ id: number; result: Promise<T> }> {
    await this.start() // 這裡失敗 = CoreUnavailableError，請求沒有送出
    const id = this.nextId++
    const result = new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, ...hooks })
    })
    // 必須在寫入前 ref：等回覆的這段時間，bridge 是唯一讓事件迴圈活著的東西
    this.syncRef()
    this.child!.stdin!.write(encode({ id, method, params }))
    return { id, result }
  }

  pid(): number | undefined {
    return this.child?.pid
  }

  /** 不等回覆的訊息；順序與送出順序相同 */
  async send(method: string, params: unknown): Promise<number> {
    await this.start()
    const id = this.nextId++
    this.child!.stdin!.write(encode({ id, method, params }))
    return id
  }

  syncRefNow(): void {
    this.syncRef()
  }

  cancel(target: number): void {
    const id = this.nextId++
    this.child?.stdin?.write(encode({ id, method: 'cancel', params: { target } }))
  }

  /** 正常結束：獨立程式保留。bridge 崩潰或這個行程崩潰時，job object 會連 agent 一起收掉 */
  async shutdown(): Promise<void> {
    if (!this.child) return
    await this.call('shutdown', {}).then((r) => r.result).catch(() => {})
  }
}

let shared: CoreBridge | null = null
const core = (): CoreBridge => (shared ||= new CoreBridge())

/** 測試與診斷用 */
export function corePid(): number | undefined {
  return shared?.pid()
}

export function coreShutdown(): Promise<void> {
  return shared ? shared.shutdown() : Promise.resolve()
}

/** 一般呼叫 */
export async function coreCall<T>(method: string, params: unknown): Promise<T> {
  return (await core().call<T>(method, params)).result
}

/**
 * 依開關選後端。bridge 起不來才退回 TS（請求沒送出，不會重複）；送出後的任何錯誤都原樣往上丟。
 */
export async function route<T>(mod: CoreModule, method: string, params: unknown, ts: () => Promise<T>): Promise<T> {
  if (!coreEnabled(mod)) return ts()
  let sent
  try {
    sent = await core().call<T>(method, params)
  } catch (e) {
    if (e instanceof CoreUnavailableError) return ts()
    throw e
  }
  return sent.result
}

let nextSid = 1

export interface CorePty {
  sid: number
  pid: () => number
  write: (data: string) => void
  resize: (cols: number, rows: number, prelude: string) => void
  kill: () => void
  /** 回傳接上當下的畫面；attached 在快照那個串流位置同步呼叫，之後的輸出一段不漏、也不重複 */
  attach: (scrollback: number, attached: () => void) => Promise<{ data: string; cols: number; rows: number } | null>
}

/**
 * 同步回傳，實際啟動非同步：pty.ts 的 spawnPty 是同步 API。這裡的 send 走同一條 chain，順序不會亂。
 * 啟動失敗（找不到執行檔）透過 onSpawnError 回報，不是例外。
 */
export function coreSpawnPty(params: Record<string, unknown>, handlers: CorePtyHandlers, onSpawnError: (message: string) => void): CorePty {
  const c = core()
  const sid = nextSid++
  let pid = 0
  c.ptys.set(sid, handlers)
  const waiting = new Map<number, { resolve: (v: { data: string; cols: number; rows: number }) => void; attached: () => void }>()
  const onSnapshot = handlers.onSnapshot
  handlers.onSnapshot = (req, cols, rows, data) => {
    const w = waiting.get(req)
    if (w) {
      waiting.delete(req)
      w.attached()
      w.resolve({ data, cols, rows })
    } else onSnapshot(req, cols, rows, data)
  }
  c.call<{ pid: number }>('pty.spawn', { sid, ...params })
    .then((r) => r.result)
    .then(
      (r) => {
        pid = r.pid
      },
      (e: Error) => {
        c.ptys.delete(sid)
        onSpawnError(e.message)
      }
    )
  const fire = (method: string, p: Record<string, unknown>): void => {
    c.send(method, { sid, ...p }).catch(() => {})
  }
  return {
    sid,
    pid: () => pid,
    write: (data) => fire('pty.write', { data }),
    resize: (cols, rows, prelude) => fire('pty.resize', { cols, rows, prelude }),
    kill: () => fire('pty.kill', {}),
    attach: async (scrollback, attached) => {
      const { id, result } = await c.call<null>('pty.attach', { sid, scrollback })
      return new Promise((resolve) => {
        waiting.set(id, { resolve, attached })
        // 終端已經不在（例如啟動失敗）：沒有快照可等，回 null，跟找不到 pty 一樣
        result.catch(() => {
          waiting.delete(id)
          resolve(null)
        })
      })
    }
  }
}

export function coreLooksLikeApproval(screen: string): Promise<boolean> {
  return coreCall('pty.looksLikeApproval', { screen })
}

export interface CoreProcHandle {
  result: Promise<{ code: number | null; timedOut: boolean; cancelled: boolean; truncated: boolean; ms: number; spawnError: string | null }>
  cancel: () => void
}

export async function coreRunProcess(
  params: { command: string; args: string[]; cwd: string; stdin: string; timeoutMs: number; maxBytes: number; env: Record<string, string> },
  hooks: { onOutput: (stream: number, bytes: Buffer) => void; onSpawn: () => void }
): Promise<CoreProcHandle> {
  const c = core()
  const { id, result } = await c.call<any>('proc.run', params, { onOutput: hooks.onOutput, onSpawn: () => hooks.onSpawn() })
  return { result, cancel: () => c.cancel(id) }
}
