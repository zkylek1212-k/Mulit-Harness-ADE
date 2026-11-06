// Tauri side of the shared bench page: Channels for PTY data, plain commands for control.
const { invoke, Channel } = window.__TAURI__.core

// Credits come back in batches: one IPC per chunk would itself be load.
const pending = new Map()
let timer = null
function flushAcks() {
  timer = null
  for (const [id, n] of pending) invoke('ack', { id, n })
  pending.clear()
}

window.benchHost = {
  now: () => Date.now(),
  ack: (id, n) => {
    pending.set(id, (pending.get(id) || 0) + n)
    if (!timer) timer = setTimeout(flushAcks, 16)
  },
  ping: () => invoke('ping')
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function run() {
  const cfg = await invoke('config')
  const ch = new Channel()
  ch.onmessage = (buf) => {
    // [u32 id][u64 t0 ms] then the raw bytes (little endian)
    const view = new DataView(buf)
    const id = view.getUint32(0, true)
    const t0 = Number(view.getBigUint64(4, true))
    window.benchOnData(id, new Uint8Array(buf, 12), t0)
  }
  // Candidate replacement for <webview>: a child webview, created while the terminals run
  if (cfg.child_url) await invoke('child_webview', { url: cfg.child_url })
  await invoke('start', { channel: ch })
  await sleep(cfg.warmup_ms)
  window.benchReset()
  const ping = setInterval(() => window.benchCtrlPing(), 200)
  await sleep(cfg.sample_ms)
  clearInterval(ping)
  await invoke('finish', { report: JSON.stringify(window.benchReport()) })
}
run().catch((e) => invoke('fail', { message: String(e) }))
