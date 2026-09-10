# Latest Handoff

- Updated: 2026-09-10 23:52 Asia/Taipei
- Agent: Antigravity
- Task: 調整中央工作區頂部標籤順序為 Editor / Preview / Memory / Browser
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **調整中央頂部 Segmented 標籤與內容面板順序**（[src/renderer/src/App.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/App.tsx)）：
   - 將頂部中央的工作區切換分段按鈕順序由原先的 `Editor / Preview / Browser / Memory` 調整為：
     `Editor / Preview / Memory / Browser`。
   - 同步調換底層 DOM 面板節點順序，保持一致的使用者體驗與導航邏輯。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
