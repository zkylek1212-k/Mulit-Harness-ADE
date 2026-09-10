# Latest Handoff

- Updated: 2026-09-10 18:05 Asia/Taipei
- Agent: Antigravity
- Task: 中間視窗下方終端全面整合支援 PowerShell 與 CMD、雙重啟動選單（+ / @）、5 欄式 Launchpad 卡片
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **中下終端支援原生 PowerShell 與 Command Prompt (CMD)**：
   - `TerminalPanel.tsx`：定義 `BUILTIN_SHELLS`（Windows 下提供 `powershell` 與 `cmd`，Unix 下提供 `bash` 與 `pwsh`），將其加入 `DIRECT_IDS`，分頁名稱自動解析為 `PowerShell`、`Command Prompt`。
   - `terminal.css`：新增 `.card-powershell` 與 `.card-cmd` 專屬懸停光暈與邊框色彩，`.term-launchpad-cards` 網格佈局升級為 5 欄式自適應排列。
2. **直覺的雙重啟動選單交互（+ / @）**：
   - `+` (Add Menu)：點擊展開整合式浮動選單，清晰區隔 **System Terminals**（PowerShell、Command Prompt）與 **AI Agents**（@claude、@antigravity、@codex）以及自訂 Launchers，100% 實底防重疊。
   - `@` (Agent Picker)：專注於 AI Agent CLI 的快速切換與開啟，分頁與選單維持 Antigravity IDE 風格。
3. **Empty State Launchpad 全新呈現**：
   - 0 Session 時直觀呈現 5 大卡片：`@claude`、`@antigravity`、`@codex`、`PowerShell`、`Command Prompt`，一鍵點擊即可開立原生 Shell 或 AI Agent。
4. **跨 Session Handoff 支援**：
   - 支援將 PowerShell / CMD 執行的終端輸出（例如報錯日誌）直接一鍵 Handoff 交棒給任何 AI Agent 進行修復或後續分析。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境構建成功，31.99s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
