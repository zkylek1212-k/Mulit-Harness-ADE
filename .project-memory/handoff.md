# Latest Handoff

- Updated: 2026-09-10 19:17 Asia/Taipei
- Agent: Antigravity
- Task: 終端標籤列回歸單排優雅整合（充分利用水平空間、移除多餘第二排）
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **終端面板頂欄回歸單排統一佈局（Single Unified Strip）**：
   - `TerminalPanel.tsx`：移除 `.term-tabs-row` 獨立第二排，將 `Terminals` 標籤、`+ ▾` 新增下拉選單、`@` Prompt Dispatcher、以及所有 Session Tabs 與右側控制項整合於單一頂部列。
   - `terminal.css`：
     - `.term-unified-strip`：採用單排彈性佈局（高度 38px），兼顧緊湊美觀與充足垂直操作區域。
     - `.term-strip-left`：左側群組緊湊收納 `Terminals`、`+ ▾` 與 `@ Prompt`，防止折行與擠壓。
     - `.term-strip-divider`：在控制組與分頁頁籤間加入細緻的垂直 Apple 分隔線。
     - `.term-strip-tabs`：佔據中間彈性伸展區域（`flex: 1 1 auto; min-width: 0; overflow-x: auto;`），支援平滑橫向滾動與極細原生捲軸，分頁名稱限制為 `max-width: 150px`。
     - `.term-strip-actions`：加入 `margin-left: auto;`，確保動作按鈕（彈出視窗、清空緩衝、刪除、Handoff、分割多重視窗）恆定優雅靠右對齊。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境構建成功，44.55s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
