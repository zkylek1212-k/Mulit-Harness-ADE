# Latest Handoff

- Updated: 2026-09-17 Asia/Taipei
- Agent: Antigravity
- Task: 導入純粹 Auto Check（啟動時自動檢查更新）開關、徹底杜絕未經同意之自動下載、開關即時持久化，並發布 v0.1.13 Release
- Branch: master
- Commit: 32e3017
- Release: v0.1.13 (Published on GitHub Releases)

## Done
1. **Agent 一鍵下載安裝服務擴充**（`src/main/ipc/ext.ts`, `src/preload/index.ts`）：
   - 新增 `getAgentInstallInfo(id)` 與 `runInstallAgent(id)`：
     - **Claude Code**: `npm install -g @anthropic-ai/claude-code`，預期路徑 Windows `%APPDATA%\npm\claude.cmd` / Unix npm bin。
     - **Antigravity CLI**: 官方腳本 `irm https://antigravity.google/cli/install.ps1 | iex`（Unix: `curl -fsSL https://antigravity.google/cli/install.sh | bash`），預期路徑 Windows `%LOCALAPPDATA%\agy\bin\agy.exe`。
     - **Codex CLI**: `npm install -g @openai/codex`（備用 PowerShell 腳本安裝），預期路徑 Windows `%APPDATA%\npm\codex.cmd`。
   - 在 preload API 暴露 `getAgentInstallInfo` 與 `installAgent` IPC 契約。
2. **安裝入口遷移與整合**（`CustomizedPanel.tsx`, `SettingsModal.tsx`）：
   - 從 `Setting -> Extension`（`CustomizedPanel`）中徹底移除原本孤立的 Codex 下載按鈕與邏輯。
   - 將一鍵下載安裝按鈕 `[ ⬇ Install / 下載安裝 ]` 統一移至 `Setting -> CLI & Agents` 各 agent 工具之設定抽屜（drawer）中。
   - 安裝完成後自動觸發 `handleDetectCli(id)` 進行環境探測並自動帶入最新安裝之路徑。
3. **Apple HIG 規範確認對話框**（`SettingsModal.tsx`, `settingsModal.css`）：
   - 在正式執行任何安裝命令前，強制跳出 Apple HIG 風格之 Alert Sheet 確認對話框。
   - 明確向使用者列出「目標安裝路徑（Target Path）」與「執行安裝指令（Command）」，並附環境變數提醒。
   - 採用毛玻璃背景（`backdrop-filter: blur(12px)`）、macOS 卡片微陰影、平滑縮放進場動畫（`scaleIn`）及按鈕樣式。
4. **修復 Codex 及裸指令 CLI Test 失敗問題**（`src/main/ipc/settings.ts`, `src/preload/index.ts`, `SettingsModal.tsx`）：
   - 原先在 `settings:testCliPath` 中，若輸入為裸指令（如 `codex`、`agy`、`claude`），僅檢查工作目錄相對路徑而未進行全域候選目錄解析，且若 Electron 啟動時尚未重載 PATH 或以雙引號字串呼叫 cmd.exe 引號轉義易失敗。
   - 整合 `findCli(target)` 進行實體執行檔解析，Windows 平台改以 `execFileAsync('cmd.exe', ['/c', target, '--version'])` 執行 `.cmd`/`.bat` 批次腳本與 `powershell.exe` 執行 `.ps1`，徹底避免引號剝離錯誤。
   - 回傳 `resolvedPath`，並在測試成功時自動回填 `detectedPaths`。
5. **CLI Detect & Test Pass 狀態持久化記憶**（`src/main/ipc/settings.ts`, `src/preload/index.ts`, `SettingsModal.tsx`）：
   - 在 `WorkbenchSettings` 新增 `cliTestResults: Record<string, CliTestRecord>`。
   - 點擊「測試（Test）」或「自動偵測（Detect）」成功後，背景立即自動保存 `{ ok: true, version, testedPath, testedAt }`。
   - 下次使用者再開啟設定視窗時，自動載入已通過的驗證結果，各 CLI 抽屜立即顯示綠色打勾通過標記 `✓ 有效的執行檔: <version>`。
   - 當使用者手動修改輸入框內容時，自動失效並清除該 CLI 的舊有驗證快取。
6. **多語系支援**（`src/renderer/src/i18n/index.ts`）：
   - 完善英文與繁體中文之按鈕與對話框語句。
7. **導入純粹 Auto Check（啟動時自動檢查更新）開關並杜絕自動下載**（`src/main/ipc/updater.ts`, `src/renderer/src/components/SettingsModal.tsx`, `i18n/index.ts`）：
   - 提供清晰單一的「啟動時自動檢查更新」Apple HIG 開關（非 auto-update，不含自動下載）。
   - 切換開關時即時寫入設定檔（Instant Persistence），開關設定絕對真實有效。
   - 後端開機 5 秒檢查前嚴格校驗 `settings.autoCheckUpdates`，若關閉則徹底跳過，不發送任何聯網請求。
   - 移除 `autoUpdater.on('update-available')` 偷跑無條件下載安裝包的邏輯：即便檢查到新版，也絕不自動下載，只提示新版並由使用者點擊「下載更新」才開始下載。

## Tests
- `npm run typecheck` → pass（0 errors，tsconfig.json & tsconfig.node.json 均通過）。
- `npm run build` → pass（Vite 與 Electron 生產環境打包編譯成功）。

## 工作樹狀態
- 待使用者驗收 `Setting -> CLI & Agents` 各項功能。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- **main 端以 mtime 推狀態的邏輯不要砍掉**（曾提議改成永不回傳 active，使用者明確否決）：那是唯一能讓「App 外面自己跑的 CLI」顯示 active 的來源。誤判用 renderer 的 `closedAgentSessions` 修正，不要動 main。
- `.project-memory/`、`.agents/`、`AGENTS.md` 均在 `.gitignore` 中，屬本地記憶與技能，絕勿加入版控。
