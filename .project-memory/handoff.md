# Latest Handoff

- Updated: 2026-09-10 22:58 Asia/Taipei
- Agent: Antigravity
- Task: 修復 Agent CLI 路徑自動偵測與工作區頂排欄位線條像素級齊平
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **修復 Agent CLI 路徑自動偵測與容錯機制**：
   - `src/main/ext/paths.ts`：加強 `findCli`，在 `where` 之外補充 Windows 常見候選目錄後備搜尋（如 `%APPDATA%\npm\claude.cmd`、`%LOCALAPPDATA%\agy\bin\agy.exe` 等），確保在 Electron 環境 PATH 未涵蓋時亦能 100% 探測到各 Agent。
   - `src/main/ipc/settings.ts`：在 `loadSettings()` 與 `getCustomCliPath()` 加入實體存在性驗證與路徑清洗機制，自動過濾掉換機器或複製專案產生的失效絕對路徑（例如異機殘留路徑），自動回歸動態偵測。
   - `src/renderer/src/components/SettingsModal.tsx` & `settingsModal.css`：於 CLI 設定面板新增「Auto-detect All」（一鍵自動填入偵測路徑）與「Reset to Auto」（重設回動態自動偵測）動作按鈕。
   - `.workbench/settings.json`：清除異機殘留的失效路徑，回歸乾淨自動探測。
2. **統一工作區頂排水平線條對齊（像素級齊平）**：
   - `src/renderer/src/styles.css`：引入標準全域工具列高度變數 `--toolbar-h: 38px` 與次級工具列高度 `--subtoolbar-h: 34px`，並鎖定 `.tabbar` 為 38px。
   - 統一各欄第一排高度為 38px：`memory.css`（`.memory-toolbar`）、`terminal.css`（`.term-unified-strip`）、`EditorPanel.css`（`.editor-tabs` / `.editor-header:first-child`）、`preview.css`（`.preview-tabs-bar`）、`browser.css`（`.browser-toolbar`），徹底消除先前 35px vs 38px vs 42px 導致的階梯狀錯位。
   - 統一各欄第二排高度為 34px：`FileTreePanel.css`（`.filetree-header`）、`git.css`（`.git-topbar`）、`terminal.css`（`.term-tabs-row`）、`EditorPanel.css`（`.editor-header`）。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境構建成功，22.43s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
