# Latest Handoff

- Updated: 2026-09-10 23:13 Asia/Taipei
- Agent: Antigravity
- Task: 設立左側欄最小寬度防禦並優化卡片文字溢出保護
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **設立左側側邊欄（Sidebar）最小寬度限制（防止卡片文字跑掉）**：
   - **問題根源**：原先 `LIMITS.leftMin` 為 0，且 `nudgeLeft` 允許拖曳縮小至 160px；當左側欄被拖至過窄時，Dashboard 中的 Agent 卡片（原固定 3 等分）會被擠壓至 40-50px，造成「tokens consumed」及名稱等文字破版溢出。
   - [src/renderer/src/layout.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/layout.ts)：
     - 將 `LIMITS.leftMin` 從 0 調升為 `260px`（與右側欄 `rightMin: 260px` 對稱）。
     - `DEFAULT_LAYOUT.leftW` 調升為 `280px`。
     - `loadLayout()` 讀取本機快取時，自動修正低於 260px 的舊設定。
   - [src/renderer/src/App.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/App.tsx)：
     - `nudgeLeft` 拖曳約束下限改為 `LIMITS.leftMin`（260px），小於 90px 時觸發智慧收合。
     - 展開按鈕 `btn-expand-left` 自動復原為至少 260px。
     - `<aside className="col col-left" ...>` 注入 `minWidth: isLeftCollapsed ? 0 : LIMITS.leftMin` 雙重保險。
   - [src/renderer/src/panels/dashboard/dashboard.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/dashboard.css)：
     - `.dash-agents-grid` 改用 `grid-template-columns: repeat(auto-fit, minmax(95px, 1fr));`，使卡片能依側欄寬度智慧適應。
     - 卡片加入 `overflow: hidden;`，統計文字 `.dash-agent-stat-label` 加上 `overflow: hidden; text-overflow: ellipsis; max-width: 100%;`，徹底防止文字跑出卡片邊界。
2. **修復 Terminal Launchpad 歡迎卡片（Empty State）的排版一致性與置中擴展**：
   - [terminal.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/terminal.css)：將卡片容器重構為 Flexbox 置中流式擴展架構（`display: flex; flex-wrap: wrap; justify-content: center;`），卡片鎖定 Apple 標準尺寸（`width: 148px; min-height: 172px;`），保證以中央為軸向外展開，孤行卡片居中對齊。
3. **修復 Settings 中的 CLI Path Test（解決路徑含空格被 cmd 截斷的問題）**：
   - [src/main/ipc/settings.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/settings.ts)：以 `execAsync` 執行雙引號包裹指令，解決 Windows 含空格路徑截斷問題。

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
