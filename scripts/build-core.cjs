// 編譯 Rust 核心給打包用：輸出放 build/bin，electron-builder 會帶進 resources。
// target 目錄可以用 CARGO_TARGET_DIR 指到雲端同步資料夾外。
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const target = process.env.CARGO_TARGET_DIR || path.join(root, 'core', 'target')
execFileSync('cargo', ['build', '-p', 'wb-bridge', '--release'], { cwd: path.join(root, 'core'), stdio: 'inherit', env: { ...process.env, CARGO_TARGET_DIR: target } })
fs.mkdirSync(path.join(root, 'build', 'bin'), { recursive: true })
fs.copyFileSync(path.join(target, 'release', 'wb-bridge.exe'), path.join(root, 'build', 'bin', 'wb-bridge.exe'))
console.log('wb-bridge ready in build/bin')
