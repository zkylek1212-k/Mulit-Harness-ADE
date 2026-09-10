# Latest Handoff

- Updated: 2026-09-10 16:45 Asia/Taipei
- Agent: Antigravity
- Task: Browser 開關與分頁修復、右上角視窗控制項亮暗雙主題色彩同步、Terminal Split 懸浮下拉選單重構、全新透明可預覽 Agent Handoff 體驗
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **Browser 標籤切換與生命週期修復（問題 1）**：
   - `App.tsx` & `styles.css`：移除原先在 `.segmented` 內塞入變形 `+ Browser` 與孤立關閉按鈕的做法，消除按鈕變形與位移，將 `Browser` 恢復為乾淨俐落的第一公民分頁。
   - `TestBrowserPanel.tsx` & `browser.css`：面板導航列右側加入細緻的 Apple 風格 `[Exit]` 快速返回按鈕；修正外層避免使用 `hidden`（`display: none`）導致 Electron `<webview>` 凍結黑屏的渲染問題，並補齊 `did-fail-load` 監聽防止載入失敗持續轉圈。
2. **視窗右上角控制項亮暗主題同步（問題 2）**：
   - `src/main/index.ts`：預設 titleBarOverlay 色彩由 `#161618` 修正為與標題列完全相同的 `#1e1e20`，消除深色模式下細微色差區塊；新增 `window:setTitleBarTheme` IPC 處理函式。
   - `src/preload/index.ts` & `src/renderer/src/store.ts`：透過 `window.api.window.setTitleBarTheme` 在主題切換及開機套用時動態更新 overlay。深色模式為 `#1e1e20` / `#f5f5f7`，淺色模式即時切換為 `#ffffff` / `#1d1d1f`，徹底解決亮色模式下控制項死黑問題。
3. **Terminal Split 懸浮下拉選單重構（問題 3）**：
   - `TerminalPanel.tsx` & `terminal.css`：移除橫排佔用逾 200px 寬度的四顆按鈕分頁膠囊，改為僅佔約 70px 的 Apple 下拉按鈕（顯示當前排版圖標、簡稱與微型箭頭）；點擊透過 `createPortal` 彈出細緻毛玻璃浮動 Popover 選單，包含各模式專屬 SVG 向量圖標（`Single`、`Split V`、`Split H`、`Grid`）與勾選狀態。
4. **直覺且透明的 Agent Handoff 互動體驗（問題 4）**：
   - `TerminalPanel.tsx` & `terminal.css`：徹底拔除原先突兀且盲送的 HTML 原生 `<select>` 下拉標籤；工具列新增專屬 `IconHandoff` Apple 風格動作按鈕（有 active session 即可使用，包含僅開 1 個 session 的情境）。
   - 點擊彈出專屬交棒 Popover 卡片：清楚呈現「來源 Agent ➜ 目標 Agent」、支援直接交棒給「執行中 Agent」或「直接新開 Claude / Antigravity / Codex」、清楚標註附帶之終端上下文（尾端 35 行）、提供可選的自訂指示備註輸入框，並支援快速「Quick Send ➔」一鍵交棒。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境構建成功，41.67s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
