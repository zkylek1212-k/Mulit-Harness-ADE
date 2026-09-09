import { ipcMain } from 'electron'

// ── STUB —— 由 [Task A] Editor 中樞 worker 實作 ────────────────────────
// 需 handle 的 channel（契約見 src/preload/index.ts 的 api.files）：
//   files:read (path) -> string
//   files:write (path, content) -> void
//   files:list (dir) -> FsEntry[]   （用 fs.readdir withFileTypes；隱藏 .git/node_modules）
//   files:workspaceRoot () -> string   （回 workspace.root，見 ../index.ts）
//   files:pickWorkspace () -> string|null   （dialog.showOpenDialog，選到就更新 workspace.root）
// 路徑安全：一律限制在 workspace.root 內（防跨目錄讀寫）。
export function registerFileHandlers(): void {
  ipcMain.handle('files:read', async () => {
    throw new Error('files:read not implemented')
  })
}
