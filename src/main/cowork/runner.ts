// 跑一次 headless CLI：prompt 走 stdin、輸出有上限、逾時與取消都會連子行程一起收掉。
// 只用 node 內建模組，scripts/check-cowork.mts 可以直接拿假 CLI 測。
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { coreEnabled, coreRunProcess, CoreUnavailableError } from '../core/bridge'

export interface RunSpec {
  command: string
  args: string[]
  cwd: string
  stdin: string
  timeoutMs: number
  /** stdout、stderr 各自的上限；超過就終止行程 */
  maxBytes: number
  env?: NodeJS.ProcessEnv
  /** 收到輸出時通知（給 UI 顯示「還活著」） */
  onActivity?: (totalBytes: number) => void
  onSpawn?: () => void
  /** stdout 每一完整行的即時檢查；回傳理由就立刻終止（agy 的工具白名單） */
  onStdoutLine?: (line: string) => string | null
}

export interface RunResult {
  code: number | null
  stdout: string
  stderr: string
  timedOut: boolean
  cancelled: boolean
  truncated: boolean
  ms: number
  /** 根本沒跑起來（找不到執行檔、參數不安全…） */
  spawnError?: string
  /** onStdoutLine 判定違規而終止的理由 */
  guardReason?: string
}

// cmd.exe 在引號內仍會展開 %VAR%，引號本身也拆不乾淨；含這些字元的參數不交給 cmd
const CMD_UNSAFE = /["%\r\n]/

/** 依副檔名決定怎麼啟動。.cmd/.bat 一定要經 cmd.exe，.ps1 要經 PowerShell */
export function launchPlan(command: string, args: string[]): { file: string; args: string[]; verbatim: boolean } | { error: string } {
  const lower = command.toLowerCase()
  if (process.platform === 'win32' && (lower.endsWith('.cmd') || lower.endsWith('.bat'))) {
    // npm shims only forward to a native binary or Node entrypoint. Bypass cmd.exe
    // so JSON schemas and TOML values arrive unchanged, including quotes and %.
    try {
      const shim = readFileSync(command, 'utf8')
      const target = shim.match(/"%dp0%[\\/](node_modules[\\/][^"\r\n]+\.(exe|[cm]?js))"\s+%\*\s*$/im)
      if (target) {
        const entry = path.resolve(path.dirname(command), target[1])
        if (existsSync(entry)) {
          if (target[2].toLowerCase() === 'exe') return { file: entry, args, verbatim: false }
          const node = path.join(path.dirname(command), 'node.exe')
          return { file: existsSync(node) ? node : 'node.exe', args: [entry, ...args], verbatim: false }
        }
      }
    } catch {
      /* Non-npm scripts still use the guarded cmd.exe path below. */
    }
    const all = [command, ...args]
    const bad = all.find((a) => CMD_UNSAFE.test(a))
    if (bad !== undefined) return { error: `refusing to pass an argument containing quotes, % or newlines to cmd.exe: ${bad.slice(0, 80)}` }
    const line = all.map((a) => `"${a}"`).join(' ')
    return { file: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', `"${line}"`], verbatim: true }
  }
  if (process.platform === 'win32' && lower.endsWith('.ps1')) {
    return {
      file: 'powershell.exe',
      args: ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', command, ...args],
      verbatim: false
    }
  }
  return { file: command, args, verbatim: false }
}

/** 連子行程一起終止。Windows 的 kill() 只收得掉最外層，CLI 再開的子行程會變孤兒 */
export function killTree(pid: number | undefined): void {
  if (!pid) return
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    } else {
      process.kill(-pid, 'SIGKILL')
    }
  } catch {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      /* 已經結束 */
    }
  }
}

/** 走 Rust（WB_CORE_PROC=rust）。行程與輸出上限在那邊；逐行檢查還是在這裡，所以 guard 的規則不用寫兩份 */
async function runProcessRust(spec: RunSpec, signal?: AbortSignal): Promise<RunResult | null> {
  const t0 = Date.now()
  const decoders = [new StringDecoder('utf8'), new StringDecoder('utf8')]
  const parts = ['', '']
  let total = 0
  let lineBuf = ''
  let guardReason: string | undefined
  let handle: Awaited<ReturnType<typeof coreRunProcess>>
  try {
    handle = await coreRunProcess(
      {
        command: spec.command,
        args: spec.args,
        cwd: spec.cwd,
        stdin: spec.stdin,
        timeoutMs: spec.timeoutMs,
        maxBytes: spec.maxBytes,
        // 一律帶上現在的環境：bridge 的環境停在它啟動那一刻
        env: (spec.env || process.env) as Record<string, string>
      },
      {
        onSpawn: () => spec.onSpawn?.(),
        onOutput: (stream, bytes) => {
          const d = decoders[stream].write(bytes)
          parts[stream] += d
          total += bytes.length
          spec.onActivity?.(total)
          if (stream !== 0 || !spec.onStdoutLine || guardReason) return
          lineBuf += d
          let i: number
          while ((i = lineBuf.indexOf('\n')) >= 0) {
            const line = lineBuf.slice(0, i)
            lineBuf = lineBuf.slice(i + 1)
            const why = spec.onStdoutLine(line)
            if (why) {
              guardReason = why
              handle?.cancel()
              break
            }
          }
        }
      }
    )
  } catch (e) {
    if (e instanceof CoreUnavailableError) return null // 沒送出：退回 TS
    throw e
  }
  const onAbort = (): void => handle.cancel()
  if (signal) {
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }
  try {
    const r = await handle.result
    return {
      code: r.code,
      stdout: parts[0] + decoders[0].end(),
      stderr: parts[1] + decoders[1].end(),
      timedOut: r.timedOut,
      // guard 終止不算使用者取消
      cancelled: r.cancelled && !guardReason,
      truncated: r.truncated,
      ms: r.ms,
      ...(r.spawnError ? { spawnError: r.spawnError } : {}),
      ...(guardReason ? { guardReason } : {})
    }
  } catch (e) {
    // bridge 中斷：不知道 CLI 做到哪裡，不重試也不改走 TS，以免重複付費呼叫
    return { code: null, stdout: parts[0], stderr: parts[1], timedOut: false, cancelled: false, truncated: false, ms: Date.now() - t0, spawnError: (e as Error).message }
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }
}

export async function runProcess(spec: RunSpec, signal?: AbortSignal): Promise<RunResult> {
  if (coreEnabled('proc')) {
    const r = await runProcessRust(spec, signal)
    if (r) return r
  }
  return runProcessTs(spec, signal)
}

function runProcessTs(spec: RunSpec, signal?: AbortSignal): Promise<RunResult> {
  const t0 = Date.now()
  const plan = launchPlan(spec.command, spec.args)
  if ('error' in plan) {
    return Promise.resolve({ code: null, stdout: '', stderr: '', timedOut: false, cancelled: false, truncated: false, ms: 0, spawnError: plan.error })
  }
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let outBytes = 0
    let errBytes = 0
    let timedOut = false
    let cancelled = false
    let truncated = false
    let settled = false
    let guardReason: string | undefined
    let lineBuf = ''

    let child: ReturnType<typeof spawn>
    try {
      child = spawn(plan.file, plan.args, {
        cwd: spec.cwd,
        env: spec.env || process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
        windowsVerbatimArguments: plan.verbatim,
        // 非 Windows 開新行程群組，killTree 才能用 -pid 一次收掉整組
        detached: process.platform !== 'win32'
      })
    } catch (e) {
      resolve({ code: null, stdout, stderr, timedOut, cancelled, truncated, ms: Date.now() - t0, spawnError: (e as Error).message })
      return
    }

    child.once('spawn', () => spec.onSpawn?.())
    const stop = (): void => killTree(child.pid)
    const timer = setTimeout(() => {
      timedOut = true
      stop()
    }, spec.timeoutMs)
    const onAbort = (): void => {
      cancelled = true
      stop()
    }
    if (signal) {
      if (signal.aborted) onAbort()
      else signal.addEventListener('abort', onAbort, { once: true })
    }

    child.stdout!.setEncoding('utf8')
    child.stderr!.setEncoding('utf8')
    child.stdout!.on('data', (d: string) => {
      outBytes += Buffer.byteLength(d)
      if (outBytes > spec.maxBytes) {
        if (!truncated) {
          truncated = true
          stop()
        }
        return
      }
      stdout += d
      spec.onActivity?.(outBytes + errBytes)
      if (spec.onStdoutLine && !guardReason) {
        lineBuf += d
        let i: number
        while ((i = lineBuf.indexOf('\n')) >= 0) {
          const line = lineBuf.slice(0, i)
          lineBuf = lineBuf.slice(i + 1)
          const why = spec.onStdoutLine(line)
          if (why) {
            guardReason = why
            stop()
            break
          }
        }
      }
    })
    child.stderr!.on('data', (d: string) => {
      errBytes += Buffer.byteLength(d)
      if (errBytes > spec.maxBytes) {
        if (!truncated) {
          truncated = true
          stop()
        }
        return
      }
      stderr += d
      spec.onActivity?.(outBytes + errBytes)
    })

    const finish = (code: number | null, spawnError?: string): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      resolve({ code, stdout, stderr, timedOut, cancelled, truncated, ms: Date.now() - t0, spawnError, guardReason })
    }
    child.on('error', (e) => finish(null, e.message))
    child.on('close', (code) => finish(code))

    // stdin 寫失敗（行程一啟動就掛）不該讓整個 main 崩潰
    child.stdin!.on('error', () => {})
    child.stdin!.end(spec.stdin, 'utf8')
  })
}
