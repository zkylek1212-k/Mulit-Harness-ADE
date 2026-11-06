// 慢手機：連上原型的 WebSocket 後，停住底層 socket 一段時間（等於手機斷網或很慢），再恢復。
// 看佇列有沒有上限、會不會拖慢其他人、落後後能不能靠快照接回來。ws.pause() 不夠：資料已進 node 的緩衝。
// usage: node scripts/bench/ws-slow.cjs <port> <term> <seconds> <stall seconds, 0 = fast>
const WebSocket = require('ws')
const [port, term, seconds, delay] = process.argv.slice(2).map(Number)
const ws = new WebSocket(`ws://127.0.0.1:${port}`)
let messages = 0
let bytes = 0
let resyncs = 0
let first = null
ws.on('open', () => {
  ws.send(String(term))
  if (delay) {
    setTimeout(() => ws._socket.pause(), 300)
    setTimeout(() => ws._socket.resume(), delay * 1000)
  }
})
ws.on('message', (data, isBinary) => {
  messages++
  bytes += data.length
  if (first === null) first = data.length
  if (!isBinary && String(data).startsWith('resync')) resyncs++
})
ws.on('error', (e) => console.log(JSON.stringify({ error: e.message })))
setTimeout(() => {
  console.log(JSON.stringify({ term, delay, messages, mb: Number((bytes / 1048576).toFixed(2)), first_message_bytes: first, resyncs }))
  process.exit(0)
}, seconds * 1000)
