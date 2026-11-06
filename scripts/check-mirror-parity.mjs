// 鏡像對照：同一段位元組，vt100（Rust 候選）和 @xterm/headless（現行）畫面要一樣。
// 核准偵測與手機畫面都靠鏡像，這裡不一致就是 5B 的回歸。
// usage: node scripts/check-mirror-parity.mjs <path to mirror_text exe>
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { Terminal } = require('@xterm/headless')

const exe = process.argv[2]
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mirror-'))
const COLS = 40
const ROWS = 8

const cases = {
  'plain and colour': '\x1b[32mhello\x1b[0m\r\nworld',
  'cursor moves': 'abcdef\x1b[1;3HX\x1b[2;5HY',
  'erase line and screen': 'first\r\nsecond\x1b[1A\x1b[2K\rreplaced\x1b[2;1H\x1b[0Jbottom',
  'CJK wide chars': '中文測試 ok\r\n主席也接任務',
  'wide char at the wrap edge': 'x'.repeat(39) + '中文',
  'line wrap': 'y'.repeat(95),
  'scroll past the bottom': Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\r\n'),
  'scroll region': '\x1b[2;5r\x1b[5;1Ha\r\nb\r\nc\r\nd\r\ne\x1b[r',
  'alternate screen': 'main\x1b[?1049halt screen\x1b[?1049l',
  'alternate screen left open': 'main\x1b[?1049halt screen',
  'tabs': 'a\tb\tc',
  'insert and delete chars': 'abcdef\x1b[1;2H\x1b[2@XY\x1b[1;6H\x1b[1P',
  'approval menu (Claude style)': '╭────────╮\r\n│ Do you want to proceed? │\r\n╰────────╯\r\n ❯ 1. Yes\r\n   2. No\r\n\r\nPress Enter to confirm',
  'osc title is invisible': '\x1b]0;my title\x07visible',
  'emoji': 'ok ✅ done 🎉 end'
}

async function xterm(text) {
  const t = new Terminal({ cols: COLS, rows: ROWS, scrollback: 0, allowProposedApi: true })
  await new Promise((r) => t.write(text, r))
  const b = t.buffer.active
  return Array.from({ length: t.rows }, (_, y) => b.getLine(b.baseY + y)?.translateToString(true) || '')
}
const norm = (lines) => {
  const out = lines.map((l) => l.replace(/\s+$/, ''))
  while (out.length && !out[out.length - 1]) out.pop()
  return out.join('\n')
}

let same = 0
const diffs = []
for (const [name, text] of Object.entries(cases)) {
  const file = path.join(dir, 'c.bin')
  fs.writeFileSync(file, text)
  const rust = norm(execFileSync(exe, [file, String(COLS), String(ROWS)], { encoding: 'utf8' }).split('\n'))
  const js = norm(await xterm(text))
  if (rust === js) same++
  else diffs.push({ name, rust, js })
}
console.log(`mirror parity: ${same}/${Object.keys(cases).length} identical`)
for (const d of diffs) console.log(`--- ${d.name}\nvt100:\n${d.rust}\nxterm:\n${d.js}`)

// 真實錄製的 ConPTY（含 resize）：每個事件之後都比對畫面
const events = JSON.parse(fs.readFileSync(path.join('scripts', 'fixtures', 'claude-resize-conpty.json'), 'utf8'))
const firstResize = events.find((e) => e[0] !== 'd')
let cols = 120
let rows = 30
const eventFile = path.join(dir, 'events.txt')
fs.writeFileSync(eventFile, events.map((e) => (e[0] === 'd' ? `d ${Buffer.from(e[1], 'utf8').toString('hex')}` : `r ${e[1]} ${e[2]}`)).join('\n'))
const rustScreens = execFileSync(exe, ['--events', eventFile, String(cols), String(rows)], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).split('\u0001\n')
const t = new Terminal({ cols, rows, scrollback: 0, allowProposedApi: true })
let recSame = 0
let firstDiff = null
for (let i = 0; i < events.length; i++) {
  const e = events[i]
  if (e[0] === 'd') await new Promise((r) => t.write(e[1], r))
  else t.resize(e[1], e[2])
  const b = t.buffer.active
  const js = norm(Array.from({ length: t.rows }, (_, y) => b.getLine(b.baseY + y)?.translateToString(true) || ''))
  const rust = norm((rustScreens[i] || '').split('\n'))
  if (rust === js) recSame++
  else firstDiff ??= { i, event: e[0], rust: rust.slice(0, 700), js: js.slice(0, 700) }
}
fs.rmSync(dir, { recursive: true, force: true })
console.log(`recorded ConPTY session: ${recSame}/${events.length} screens identical (first non-data event: ${JSON.stringify(firstResize).slice(0, 40)})`)
if (firstDiff) console.log(`first difference at event ${firstDiff.i} (${firstDiff.event})\nvt100:\n${firstDiff.rust}\nxterm:\n${firstDiff.js}`)
process.exit(diffs.length || recSame !== events.length ? 1 : 0)
