import { ipcMain } from 'electron'

// ── STUB —— 由 [Task D] 終端殼 worker 實作 ────────────────────────────
// 用 node-pty spawn 官方 CLI；xterm 在 renderer。cwd 一律鎖 workspace.root（見 ../index.ts）。
// launcher 定義來自 agents/*.yaml（js-yaml 解析），型別 CliLauncher 見 preload。
// 需 handle 的 channel（契約見 src/preload/index.ts 的 api.pty）：
//   pty:spawn (PtySpawnOptions) -> id   （回一個 pty session id，字串）
//        - 有 launcherId 就查 agents/*.yaml 取 command/args/env；否則用 opts.command/args。
//        - 監聽 pty.onData -> webContents.send(`pty:data:${id}`, data)
//        - 監聽 pty.onExit -> webContents.send(`pty:exit:${id}`, code)
//   pty:write (id, data)  [ipcMain.on]
//   pty:resize (id, cols, rows)  [ipcMain.on]
//   pty:kill (id)  [ipcMain.on]
//   pty:launchers () -> CliLauncher[]   （掃 agents/*.yaml）
// 安全：cwd 不得逸出 workspace.root；app 關閉時 kill 全部 pty。
export function registerPtyHandlers(): void {
  ipcMain.handle('pty:launchers', async () => [])
}
