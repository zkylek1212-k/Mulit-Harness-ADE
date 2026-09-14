# Latest Handoff

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 優化 install.ps1 支援即時下載進度條與靜默安裝狀態動畫，解決無進度條與 iexirm 黏貼問題
- Branch: master
- Commit: pending

## Done
- **解決安裝指令無進度條問題（下載階段 + 靜默安裝階段）**：
  - `install.ps1`:
    - **下載階段**：改寫為 `Download-FileWithProgress`。優先使用 Windows 10/11 內建的 `curl.exe -fL --progress-bar`，提供即時動態 `#=#=# ... 100%` 進度條與百分比；若 `curl` 不可用，自動降級為 `.NET HttpWebRequest` 串流下載，搭配 PowerShell `Write-Progress` 頂部進度條與行內百分比/容量回顯，徹底告別過去 `WebClient.DownloadFile` 靜默無回應卡頓假象。
    - **靜默安裝階段**：在 `-Silent` 執行 NSIS 安裝期間，新增動態轉圈 Spinner (`| / - \`) 與已耗時秒數顯示（`Installing Agent Workbench... / (4s elapsed)`），並在結束時顯示總耗時與安裝路徑，讓使用者清楚掌握進度。
    - **環境變數簡便模式**：支援 `$env:INSTALL_SILENT=1` 與 `$env:INSTALL_DOWNLOAD_ONLY=1`，方便單行 `irm ... | iex` 搭配環境變數執行。
- **解決 `iexirm` 報錯原因**：
  - 診斷出因使用者在 PowerShell 貼上指令時重複貼上兩次且無換行，導致 `... | iex` 與 `irm ...` 黏在一起變成 `iexirm`。在 `README.md` 補齊簡潔指令與提示。
- **明確標註 npm run release 僅限專案維護者**：
  - 在 `README.md` 中英文版與 `scripts/release.ps1` 標頭標註 `(Maintainers only)` 與安全說明，告知外部人員此指令需本機 `gh` 倉庫寫入權限，無法隨意發布或更動專案。

## Tests
- 實測 `powershell -ExecutionPolicy Bypass -Command "& .\install.ps1 -DownloadOnly"`：成功透過 `curl.exe` 呈現平滑即時百分比進度條。
- 實測靜默安裝 spinner 邏輯：字符旋轉與秒數計算運作正常。
- `npm run typecheck` → pass（0 errors）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。
