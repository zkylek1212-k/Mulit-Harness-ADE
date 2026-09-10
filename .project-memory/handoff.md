# Latest Handoff

- Updated: 2026-09-10 18:30 Asia/Taipei
- Agent: Antigravity
- Task: 全面 Apple UI/UX 重構（macOS Sequoia 設定視窗、@ Agent Prompt Dispatcher 提示派發器與全介面審查）
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **設定視窗全面重構為 Apple / macOS Sequoia System Settings 標準**：
   - `SettingsModal.tsx` & `settingsModal.css`：
     - 採用正統 macOS 雙欄式視窗佈局（220px 側邊欄 + 內容滾動區）。
     - 左側標頭配備 macOS 紅黃綠視窗控制按鈕（Traffic Lights，紅鈕支援 Hover 關閉與 Esc 快速鍵）。
     - 側邊導航採用 Apple 圓角矩形多彩圖示（Squircle Icons：藍色 Appearance、綠色 CLI & Agents、紫色 Extensions）。
     - 項目展示採用 Apple Inset Grouped Lists（內嵌分組圓角 11px，細緻分隔線）。
     - 整合 Apple 滑動開關（`.apple-toggle`）即時切換 CLI 啟用狀態。
     - 可執行檔自訂路徑收折至 Disclosure Drawer（點選箭頭展開），兼顧簡潔視覺與進階設定。
2. **明確區隔 `+` 與 `@` 功能，`@` 升級為 Apple Spotlight 風格之 Agent Prompt Dispatcher**：
   - `+` (New Terminal Session)：專注於建立新的互動式終端分頁（系統 PowerShell、Command Prompt 或 Agent 原始交互 Shell）。
   - `@` (Prompt Agent Dispatcher)：點擊開啟如 Raycast / Spotlight / Apple Intelligence 浮動派發 HUD：
     - 提供已啟用的 Agent 膠囊切換標籤（`@claude`、`@antigravity`、`@codex`）。
     - 現代化輸入框直接輸入想問的問題或任務描述。
     - 支援勾選「附加當前終端輸出（Attach terminal output buffer）」，快速帶入錯誤日誌或終端上下文。
     - 快捷鍵支援：`Enter` 送出、`Shift+Enter` 換行、`Esc` 關閉。
     - 送出時若該 Agent 尚未開啟終端，自動為使用者建立 session 並派發指令，聚焦該分頁。
3. **全域 Apple UI/UX 審查與設計細節升級**：
   - `styles.css`：維持統一 SF Pro / Apple 系統字型棧，修飾控制項最小觸控區域與平滑 transition。
   - `Icons.tsx`：補充 Apple 風格的 `IconSparkles`、`IconSend`、`IconChevronRight` 等向量圖示。
   - Launchpad 空白狀態卡片與各 Popover 下拉選單皆具備液態毛玻璃（Liquid Glass / Backdrop Blur）與高對比狀態提示。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境構建成功，43.30s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
