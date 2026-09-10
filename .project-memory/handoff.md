# Latest Handoff

- Updated: 2026-09-10 19:31 Asia/Taipei
- Agent: Antigravity
- Task: 重構 Dashboard 刪除對話框為 Apple HIG 原生警告彈窗（AppleAlertDialog）
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **建立 Apple HIG 標準警告視窗元件（AppleAlertDialog）**：
   - `src/renderer/src/components/AppleAlertDialog.tsx` & `appleAlertDialog.css`：
     - 徹底摒棄瀏覽器原生未美化的 `window.confirm`，改以正統 Apple / macOS HIG Alert Dialog 標準實作。
     - **材質與外觀**：Apple 液態毛玻璃（Frosted Glass Backdrop `backdrop-filter: blur(16px)`）、深灰/淺白雙色調適應、圓角 16px 與雙層柔和陰影。
     - **結構排版**：頂部配備 Apple 圓角矩形圖示徽章（`.apple-alert-icon-wrap`，Destructive 採紅色系 `color-mix` 柔和外觀與 `IconTrash`）、粗體標題（15px / 600）、說明文字與內嵌分組卡片（Inset Grouped Preview）。
     - **操作按鈕**：依據 Apple HIG 規範，左側為次要動作 `Cancel`（Esc 快捷鍵），右側為主要/破壞性動作 `Delete Record`（Enter 快捷鍵），支援焦點與 hover 漸變動畫。
2. **Dashboard 面板無縫整合**：
   - `DashboardPanel.tsx`：將 `handleDelete` 從 `window.confirm` 升級為受控狀態 `sessionToDelete`，點擊刪除按鈕立即觸發 AppleAlertDialog，並於彈窗內清楚展示被刪除 Session 之 Agent 標籤、名稱、ID 與 Token 總量。
   - `dashboard.css`：新增 `.dash-alert-session-preview` 內嵌預覽卡片樣式。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境構建成功，48.77s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
