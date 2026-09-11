# Latest Handoff

- Updated: 2026-09-11 11:42 Asia/Taipei
- Agent: Antigravity
- Task: 修復 Dashboard Agent 卡片文字擠壓重疊（Breakdown 改為 3 欄微型網格）
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **重構 Breakdown 為 3 欄微型網格（徹底杜絕文字重疊）**：
   - [src/renderer/src/panels/dashboard/DashboardPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/DashboardPanel.tsx)：
     - 將原先單行 Flex 擠壓的 `.dash-agent-breakdown-row` 重構為獨立 3 欄 CSS Grid `.dash-agent-breakdown-grid`。
     - 每一欄由標籤在上方（`● In`、`● Tools`、`● Out`）與等寬數值在下方（`115.8k`、`1.19M`、`198.3k`）垂直堆疊。
     - 每一欄具備獨立 `1fr` 空間與 `text-overflow: ellipsis`，徹底解決大數值（如 `1.19M`）與相鄰文字互相撞擊重疊的跑版問題。
   - [src/renderer/src/panels/dashboard/dashboard.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/dashboard.css)：
     - 新增 `.dash-agent-breakdown-grid`、`.dash-agent-breakdown-col`、`.dash-agent-col-label`、`.dash-agent-col-val`。
     - 卡片 Grid 最小寬度調整為 `minmax(145px, 1fr)`，確保 3 張卡片或折行時都有最佳呼吸感。
     - 數字行 `.dash-agent-stat-number-row` 增加間距與防擠壓 `flex-shrink: 0`，避免 `1.50M` 與 `TOKENS` 碰觸。
     - 卡片頭部建立 `.dash-agent-brand` 彈性容器，讓 Agent 名稱、會話數與狀態膠囊平穩對齊。

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
