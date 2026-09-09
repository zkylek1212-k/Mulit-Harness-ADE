import { ipcMain } from 'electron'

// ── STUB —— 由 [Task B] Git 中樞 worker 實作 ──────────────────────────
// 用 simple-git，repo 根 = workspace.root（見 ../index.ts）。
// 需 handle 的 channel（契約見 src/preload/index.ts 的 api.git）：
//   git:status () -> GitStatus     （isRepo 先判斷；非 repo 回 isRepo:false 不要 throw）
//   git:log (limit=50) -> GitCommit[]
//   git:diff (path) -> { head, work }   （head = `git show HEAD:path` 內容；work = 現檔內容）
//   git:stage / git:unstage / git:restore (path) -> void
//   git:commit (message) -> void
//   git:branches () -> { current, all }
//   git:checkout (branch) -> void
export function registerGitHandlers(): void {
  ipcMain.handle('git:status', async () => {
    throw new Error('git:status not implemented')
  })
}
