// 量測頁：Electron 與 Tauri 原型共用，差別只在 window.benchHost 怎麼送資料。
// 量的是「後端讀到 PTY 輸出 → xterm 真的消化完」的延遲，以及 renderer 的掉幀。
/* global Terminal */
const stats = { lat: [], frames: [], bytes: 0, chunks: 0, ctrlRtt: [] }
const terms = new Map()

function term(id) {
  let t = terms.get(id)
  if (!t) {
    const el = document.createElement('div')
    el.className = 'cell'
    document.getElementById('grid').appendChild(el)
    t = new Terminal({ cols: 80, rows: 12, scrollback: 2000, fontSize: 10 })
    t.open(el)
    terms.set(id, t)
  }
  return t
}

// 額度制流量控制：xterm 消化完才還額度，後端不會無上限往前塞
function onData(id, bytes, t0) {
  stats.chunks++
  stats.bytes += bytes.length
  term(id).write(bytes, () => {
    stats.lat.push(window.benchHost.now() - t0)
    window.benchHost.ack(id, bytes.length)
  })
}

let last = performance.now()
function frame(now) {
  stats.frames.push(now - last)
  last = now
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

const pct = (a, p) => {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  return Number(s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2))
}

window.benchReset = () => {
  stats.lat = []
  stats.frames = []
  stats.bytes = 0
  stats.chunks = 0
  stats.ctrlRtt = []
}

window.benchCtrlPing = async () => {
  const t0 = performance.now()
  await window.benchHost.ping()
  stats.ctrlRtt.push(performance.now() - t0)
}

window.benchReport = () => ({
  terminals: terms.size,
  chunks: stats.chunks,
  mb: Number((stats.bytes / 1048576).toFixed(1)),
  latency_ms: { p50: pct(stats.lat, 0.5), p99: pct(stats.lat, 0.99), max: pct(stats.lat, 1) },
  frame_ms: { p50: pct(stats.frames, 0.5), p99: pct(stats.frames, 0.99) },
  long_frames: stats.frames.filter((f) => f > 50).length,
  frames: stats.frames.length,
  ctrl_rtt_ms: { p50: pct(stats.ctrlRtt, 0.5), p99: pct(stats.ctrlRtt, 0.99) }
})

window.benchOnData = onData
