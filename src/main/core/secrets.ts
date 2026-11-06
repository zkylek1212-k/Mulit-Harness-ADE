// 機密從 Electron safeStorage 遷到 DPAPI（Rust 的 wb-secrets）。換到 Tauri 之後 safeStorage 就沒了，
// 所以要在 Electron 階段先搬。單向：搬完不提供切回 TS 的開關。
// 走一次性的 CLI 模式：現有 API 是同步的，機密只經過 stdin／stdout，不進任何 frame、log 或 argv。
// 不 import electron：解 safeStorage 由呼叫端傳入，scripts/check-core-secrets.mts 才能測。
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import { bridgePath } from './bridge'

export function osProtect(plain: string): string {
  return execFileSync(bridgePath(), ['secret', 'protect'], { input: Buffer.from(plain, 'utf8'), windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }).toString('base64')
}

export function osUnprotect(sealed: string): string {
  return execFileSync(bridgePath(), ['secret', 'unprotect'], { input: Buffer.from(sealed, 'base64'), windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }).toString('utf8')
}

export const secretsOnDpapi = (): boolean => process.env.WB_CORE_SECRETS === 'rust'

export interface MigrateTools {
  /** 解開舊格式 */
  decrypt: (sealedBase64: string) => string
  protect: (plain: string) => string
  unprotect: (sealedBase64: string) => string
}

/**
 * 通用的遷移：find 找出舊格式的值，replace 回傳換成新格式的整份資料。
 * 暫存檔寫好、讀回驗證後才原子替換；任何一步失敗就保留原檔，不會只搬一半。
 * 舊檔另存 .pre-dpapi（只寫一次）：之後若有新資料寫進新格式，它就只是遷移前的備份，不能當最新資料讀回來。
 * 回傳搬了幾個值。
 */
export function migrateJsonFile<T>(file: string, tools: MigrateTools, plan: (data: T, convert: (sealed: string) => string) => { next: T; count: number }): number {
  let raw: string
  try {
    raw = fs.readFileSync(file, 'utf8')
  } catch {
    return 0
  }
  const data = JSON.parse(raw) as T
  const converted: { plain: string; sealed: string }[] = []
  const { next, count } = plan(data, (old) => {
    const plain = tools.decrypt(old)
    const sealed = tools.protect(plain)
    if (tools.unprotect(sealed) !== plain) throw new Error('re-encrypted value does not read back')
    converted.push({ plain, sealed })
    return sealed
  })
  if (!count) return 0
  const backup = `${file}.pre-dpapi`
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, raw, { mode: 0o600 })
  const tmp = `${file}.migrating`
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), { encoding: 'utf8', mode: 0o600 })
  const back = JSON.parse(fs.readFileSync(tmp, 'utf8')) as T
  plan(back, () => {
    throw new Error('old-format value left after migration')
  })
  for (const c of converted) if (tools.unprotect(c.sealed) !== c.plain) throw new Error('verification failed')
  fs.renameSync(tmp, file)
  return count
}

export interface SealedValue {
  enc: 'safe' | 'plain' | 'dpapi'
  data: string
}

/** userData/remote/secrets.json：{ caKey: {enc, data}, ... } */
export function migrateSealedFile(file: string, tools: MigrateTools): number {
  return migrateJsonFile<Record<string, unknown>>(file, tools, (data, convert) => {
    const next: Record<string, unknown> = { ...data }
    let count = 0
    for (const [k, v] of Object.entries(data)) {
      const s = v as SealedValue | undefined
      if (s && typeof s === 'object' && s.enc === 'safe') {
        next[k] = { enc: 'dpapi', data: convert(s.data) }
        count++
      }
    }
    return { next, count }
  })
}

export const DPAPI_PREFIX = 'dpapi:'

/** <workspace>/.workbench/credentials.enc：{ name: base64 }，新格式加前綴 */
export function migrateCredentialFile(file: string, tools: MigrateTools): number {
  return migrateJsonFile<Record<string, string>>(file, tools, (data, convert) => {
    const next: Record<string, string> = {}
    let count = 0
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string' && !v.startsWith(DPAPI_PREFIX)) {
        next[k] = DPAPI_PREFIX + convert(v)
        count++
      } else next[k] = v
    }
    return { next, count }
  })
}
