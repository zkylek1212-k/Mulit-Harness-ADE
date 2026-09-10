# Latest Handoff

- Updated: 2026-09-10 18:15 Asia/Taipei
- Agent: Antigravity
- Task: 設定中新增 CLI 開關（enable/disable）並與 Agent Terminal 顯示選項即時連動
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **設定中新增 CLI Enable/Disable 開關與路徑設定**：
   - `SettingsModal.tsx` & `settingsModal.css`：
     - 整合 5 大 CLI 工具（`@claude`、`@antigravity`、`@codex`、`PowerShell`、`Command Prompt`）。
     - 每個卡片標頭新增 Apple 風格滑動開關（`.apple-toggle`），附帶 `Enabled` / `Disabled` 狀態膠囊標籤。
     - 當關閉開關時，卡片透明度降低（`opacity: 0.55`），停用輸入框與測試按鈕。
     - 存檔後呼叫 `bumpSettings()`，即時觸發終端面板刷新，無需重啟應用。
2. **IPC 與設定資料模型升級**：
   - `src/preload/index.ts`：`WorkbenchSettings` 新增 `cliEnabled?: Record<string, boolean>`，擴充 `cliPaths`。
   - `src/main/ipc/settings.ts`：更新 `loadSettings()`（預設值全為 `true` 向下相容）、`saveSettings()`、`isCliEnabled()`。支援 `powershell` 與 `cmd` 的原生測試（`cmd /c ver` 與 `powershell -NoProfile -Command`）。
   - `src/renderer/src/store.ts`：`WorkbenchState` 加入 `settingsTick`，並導出 `bumpSettings()` 供即時跨元件響應。
3. **終端面板（TerminalPanel）全面連動**：
   - `@` (Agent Picker)：僅列出啟用的 AI Agents；若全部關閉，顯示防呆提示並停用按鈕。
   - `+` (Add Menu)：系統終端與 AI Agents 分區依啟用狀態動態篩選，若分區為空則自動隱藏分隔與標頭。
   - Empty State Launchpad（0 Sessions）：動態過濾卡片，僅顯示已啟用的 CLI 卡片；若全部關閉，提供提示引導至設定開啟。
   - Handoff Modal：新 Agent 啟動選項僅提供已啟用的 Agent。
   - 終端建立 Fallback：若預設或被呼叫的 CLI 已被禁用，自動順位退回至第一個啟用的 CLI。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境構建成功，39.02s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
