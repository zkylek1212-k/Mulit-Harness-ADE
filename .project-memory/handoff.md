# Latest Handoff

- Updated: 2026-09-10 13:45 Asia/Taipei
- Agent: Antigravity
- Task: 修正 CLI 啟動、品牌 Mark、Claude 插件掃描、Dashboard 歸檔/刪除、縮放超出與 Terminal UX/捲軸
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **Claude / Codex CLI 啟動修復（`paths.ts`, `pty.ts`, `settings.ts`）**：
   - 解決 Windows 下 `where.exe` 優先返回無副檔名 shell script (`claude`) 導致 `%1 is not a valid Win32 application` 的問題。
   - `findCli` 優先尋找 `.exe`, `.cmd`, `.bat`, `.ps1`。
   - `resolveCommand` 自動針對 `.cmd` 補上 `cmd.exe /c` 包裝，針對 `.ps1` 補上 `powershell.exe -ExecutionPolicy Bypass`。
2. **專屬品牌 Mark 替換（`AgentMark.tsx`）**：
   - 替換所有隨意愛心符號，為 Claude (Anthropic spark #D97706)、Antigravity (DeepMind diamond #7C3AED)、Codex (OpenAI rosette #10A37F)、Shell (Terminal icon) 繪製官方向量 SVG Mark。
   - 應用於 Dashboard 卡片、Terminal 頂部膠囊 Dock、Safari Pill Tabs、Launchpad 卡片。
3. **Claude 技能 / 插件 / MCP 正確對齊（`inventory.ts`）**：
   - 修復 `installed_plugins.json` 原本因型別判斷 (`typeof x === 'string'`) 導致整個插件列表被忽略的 bug。
   - 支援掃描使用者的獨立技能 (`~/.claude/skills/*/SKILL.md`)、外掛插件中內建的技能 (`<installPath>/skills/*/SKILL.md`)、以及插件 MCP 配置 (`<installPath>/.mcp.json`)。
4. **Dashboard 移除金額顯示 & Session 歸檔 / 刪除（`DashboardPanel.tsx` + `dashboard.ts`）**：
   - 移除所有金錢與價格顯示，專注於 Token 數量與百分比去向。
   - 支援 Session 歸檔（Archive）與刪除（Delete），狀態持久化儲存於 `.workbench/dashboard-state.json`。
   - 提供 `[ Active Sessions | Archived ]` 分類切換標籤與確認提示。
5. **欄位縮放文字超出修正（`styles.css` + `App.tsx` + 各 Panel）**：
   - 解決縮小時 Segmented 控制項與卡片內容文字擠出邊界的問題，加入 `min-width: 0`、`flex-shrink: 1`、`text-overflow: ellipsis`。
6. **Agent Terminal 底部停靠捲軸問題修復（`terminal.css` + `App.tsx`）**：
   - 解決停靠底部時 Launchpad 卡片或終端內容因高度限制被截斷且無法往下滾動的問題。
   - Launchpad 加入 `overflow-y: auto` 與 `margin: auto 0`，小高度下自然頂端對齊並允許平滑滾動。
   - 修復 `.term-surface` 與 `.xterm-viewport` 的捲軸渲染與高度繼承。
7. **Agent Terminal UX 操作體驗大幅提升（`TerminalPanel.tsx` + `terminal.css`）**：
   - 頂部工具列新增一鍵「Clear」清除終端緩衝區。
   - Safari Pill Tabs 旁邊新增「＋」快速新增分頁按鈕。
   - 點選終端任何空白處自動聚焦（`session.term.focus()`）。
   - Launchpad 改為緊湊響應式設計，支援毛玻璃動態 hover 與即時啟動。

## Tests
- `npm run typecheck` → pass (代碼與型別 100% 通過)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
