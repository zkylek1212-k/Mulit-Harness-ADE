# Latest Handoff

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: Dashboard 數字來源解析與摺疊按鈕純圖示化（消除文字占版面）
- Branch: feat/mobile-dispatch
- Commit: pending memory commit

## Done
- **摺疊/展開按鈕純圖示化**：
  - `src/renderer/src/panels/dashboard/DashboardPanel.tsx`: 移除「Expand All」與「Collapse All」之多餘文字 `<span>`，改以純 Apple HIG 風格的雙向箭頭圖示呈現（`aria-label` 與原生 `title` 保留完整無障礙提示），精簡版面水平佔位。
  - `src/renderer/src/panels/dashboard/dashboard.css`: `.dash-folder-tool-btn` 重構為 24x24 正方形微型圖示按鈕，具備按壓回饋（`transform: scale(0.93)`）與邊框懸浮反饋。
- **Dashboard 遙測數字來源完整溯源與解析**：
  - 詳盡剖析頂部橫幅（`18.38M Tokens`、`1 Active`、`61 Sessions`）以及三大 Agent（Claude Code 41 個對話 16.00M、Antigravity 20 個對話 2.37M、Codex 0 個）之原始日誌路徑、計算公式與先前 Tool Tokens 為 0 之成因。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（Vite / Electron 生產環境打包編譯通過）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。
