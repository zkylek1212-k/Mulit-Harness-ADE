# Latest Handoff

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 建立 PowerShell 一鍵安裝腳本、README 安裝說明更新，並對齊 Logo 與更新檢查動畫
- Branch: fix/settings-persistence-and-doc-tools
- Commit: docs(readme): add one-line quick installer and releases guide

## Done
- **PowerShell 一鍵安裝腳本 (`install.ps1`)**：
  - 支援 TLS 1.2/1.3，適用 Windows 10/11 預設環境。
  - 自動呼叫 GitHub Releases API (`zkylek1212-k/Mulit-Harness-ADE`) 抓取最新版本安裝檔 (`Agent Workbench-*-setup.exe`)。
  - 下載至 `$env:TEMP` 並自動啟動安裝精靈；支援 `-Silent` 背景靜默安裝、`-DownloadOnly` 僅下載、`-Portable` 免安裝包支援。
  - 具備 API 速率限制與未上傳 binary 時的降級與提示引導。
- **更新 `README.md` 安裝說明**：
  - 英文與繁體中文雙語同步新增「Installation / 安裝指南」章節。
  - 方法一：提供 PowerShell 單行指令 `irm https://raw.githubusercontent.com/zkylek1212-k/Mulit-Harness-ADE/master/install.ps1 | iex`。
  - 方法二：提供 GitHub Releases 最新發行包直接下載連結。
  - 方法三：保留原有的原始碼 clone 與開發者編譯步驟。
- **對齊應用程式 Logo 與更新按鈕動畫**：
  - `src/renderer/src/components/Icons.tsx`:
    - 新增向量 `IconAppLogo`，完整重現深色圓形基底、青色核心原子核與三條旋轉 30°/90° 的軌域電子環，與 Windows 桌面圖示完全一致。
    - 新增 `IconRefresh` 重整圖示。
  - `src/renderer/src/components/settingsModal.css`:
    - 新增 `@keyframes macosSpin` 與 `.macos-spin`，使檢查更新按鈕於進行中平滑旋轉。
  - `src/renderer/src/components/SettingsModal.tsx`:
    - 品牌卡替換為 `IconAppLogo`；檢查按鈕替換為 `IconRefresh` 並於檢查中旋轉。
    - 自動更新開關對齊 macOS 設定列樣式（`.macos-row` / `.apple-toggle`）。
- **修復主行程啟動 TDZ 異常**：
  - `src/main/ipc/settings.ts`: 在 `getWorkspaceSettingsPath()` 存取 `workspace` 時加上 `try...catch` 防護，避免主行程初始化階段觸發 `ReferenceError`。

## Tests
- `powershell -ExecutionPolicy Bypass -File .\install.ps1 -Tag "v0.1.1"` → pass（成功識別 Release 物件並安全處理）。
- `npm run typecheck` → pass（TS 零錯誤）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。
