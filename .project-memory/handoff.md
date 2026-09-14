# Latest Handoff

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 修正 Release 資產名稱連字號 (404 根治)、清除更新日誌 HTML 標籤
- Branch: master
- Commit: fix(updater): sanitize release notes html and normalize setup exe filename

## Done
- **Release 資產名稱連字號標準化（徹底根治下載 404）**：
  - 原因：`electron-builder` 在 `latest.yml` 內將空白轉換為 `-`（`Agent-Workbench-0.1.4-setup.exe`），而 GitHub Releases 預設會將檔名空白轉換為 `.`（`Agent.Workbench-0.1.4-setup.exe`），導致客戶端下載時找不到檔案回傳 404。
  - 修復：
    - 在 `electron-builder.yml` 設定 `artifactName: Agent-Workbench-${version}-setup.${ext}`，直接產出連字號檔名。
    - 在 `scripts/release.ps1` 加入自動將空白置換為 `-` 的正規化與複製邏輯，確保上傳至 GitHub 的檔名 100% 與 `latest.yml` 一致。
    - 已直接在 GitHub Releases `v0.1.4` 上傳修正後的 `Agent-Workbench-0.1.4-setup.exe`，實測 `curl.exe` 回傳 HTTP 200 OK。
- **更新日誌 HTML 標籤過濾**：
  - 在 `src/renderer/src/components/SettingsModal.tsx` 加入 `formatReleaseNotes`，自動過濾 GitHub API 回傳的 `<a ...>`、`<br>` 等原始 HTML 標籤，呈現乾淨文字。

## Tests
- `curl.exe -I -L https://github.com/zkylek1212-k/Mulit-Harness-ADE/releases/download/v0.1.4/Agent-Workbench-0.1.4-setup.exe` → HTTP 200 OK（129,488,962 bytes）。
- `npm run typecheck` → pass（TS 零錯誤）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。
