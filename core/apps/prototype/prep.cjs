// Fill dist/ for the prototype from the shared bench page and the repo's xterm. Run before building.
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../../..')
const dist = path.join(__dirname, 'dist')
fs.mkdirSync(dist, { recursive: true })
fs.copyFileSync(path.join(root, 'scripts/bench/page.js'), path.join(dist, 'page.js'))
fs.copyFileSync(path.join(root, 'node_modules/@xterm/xterm/lib/xterm.js'), path.join(dist, 'xterm.js'))
fs.copyFileSync(path.join(root, 'node_modules/@xterm/xterm/css/xterm.css'), path.join(dist, 'xterm.css'))
fs.copyFileSync(path.join(__dirname, 'host.js'), path.join(dist, 'host.js'))
fs.writeFileSync(
  path.join(dist, 'index.html'),
  '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="xterm.css"><style>#grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px}.cell{height:150px;overflow:hidden}</style><div id="grid"></div><script src="xterm.js"></script><script src="page.js"></script><script src="host.js"></script>'
)
fs.mkdirSync(path.join(__dirname, 'icons'), { recursive: true })
fs.copyFileSync(path.join(root, 'build/icon.ico'), path.join(__dirname, 'icons/icon.ico'))
console.log('prototype dist ready')
