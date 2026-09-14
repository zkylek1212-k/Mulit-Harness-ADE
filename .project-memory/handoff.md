# Latest Handoff

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 設定新增語言選擇功能（支援 English 與繁體中文）
- Branch: feat/mobile-dispatch
- Commit: pending memory commit

## Done
- **雙語 i18n 系統與翻譯架構**：
  - `src/renderer/src/i18n/index.ts`: 新增零依賴、型別安全之雙語模組，定義 `Language = 'en' | 'zh-TW'`，建立涵蓋所有面板之雙語字典，並匯出 `useTranslation()` Hook 與 `t()` 函式。
  - **English 模式嚴格純英文**：移除淺深色莫蘭迪主題名稱中硬編碼之中文（`Light Morandi`、`Dark Morandi`），修正 Dashboard 之「展開全部/摺疊全部」為 `Expand All / Collapse All`，消除所有中文字串洩漏。
  - **繁體中文模式**：採用台灣慣用之標準繁體中文（如「偏好設定」、「工作目錄變更」、「暫存變更」、「當前工作區」等），專有名詞與 CLI 指令保留英文。
- **後端設定契約與持久化**：
  - `src/preload/index.ts`: 在 `WorkbenchSettings` 新增 `language?: 'en' | 'zh-TW'`。
  - `src/main/ipc/settings.ts`: 在 `loadSettings()` 與 `settings:set` 讀寫 `language` 欄位並儲存於 `.workbench/settings.json`。
  - `src/main/ipc/dashboard.ts`: Token 分類常數統一為英文（`Context & System Prompt`、`Tool Execution & Files`、`Thinking & Generation`），杜絕後端硬編碼中文。
- **全域狀態與即時同步**：
  - `src/renderer/src/store.ts`: `WorkbenchState` 支援 `language`，初始自動載入 `localStorage ('wb-language')` 或瀏覽器語系，提供 `setLanguage()` 同步更新狀態、`localStorage` 與後端設定檔，免重啟即時切換。
- **Settings Modal 語言切換介面**：
  - `src/renderer/src/components/SettingsModal.tsx`: 在 Appearance 頁籤最上方新增 Apple HIG 風格雙卡片選擇器（`English` 與 `繁體中文`），點擊即刻生效。
  - `src/renderer/src/components/settingsModal.css`: 實作 `.macos-lang-cards` 等現代化選單樣式。
- **全域面板對接 i18n**：
  - `App.tsx`、`DashboardPanel.tsx`、`FileTreePanel.tsx`、`EditorPanel.tsx`、`GitPanel.tsx` 全面接軌 `t()`。

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
