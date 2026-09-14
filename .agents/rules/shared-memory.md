# Shared Project Memory

This workspace uses `.project-memory/` as the canonical cross-agent memory.

## Startup — run this ONE command first, every session

```bash
bash .project-memory/status.sh
```

It prints tier-1 memory (`INDEX.md` + `handoff.md`) and reports remote drift. Do not read those two
files separately — you already have their contents.

Then inspect `git status --short` and `git branch --show-current`, and summarise the context in
<=3 bullets before substantial work. Read `.project-memory/PROTOCOL.md` on first entry to this repo,
for Git/worktree work, for memory changes, or when uncertain. Read `STATE.md` and `DECISIONS.md`
only on demand.

## Before finishing

Apply the memory-update criteria in `PROTOCOL.md`. Rewrite `handoff.md` when the work meets the
threshold; skip memory updates for read-only questions and trivial, no-change work.

Then commit the memory yourself — an uncommitted handoff does not exist for anyone else:

```bash
bash .project-memory/commit-handoff.sh "docs(memory): <one-line summary>"
```

It is pathspec-limited to memory files, so staged source changes are left untouched. It pushes only
when `MEM_AUTOPUSH=1`; otherwise say clearly that the handoff is not pushed yet.

## Never

Do not auto pull, rebase, merge, reset, or force-push without user authorization.
Do not commit the user's source code on your own initiative — committing shared memory is fine.
Never store secrets in project memory. Never rewrite historical decisions — supersede them.

<!-- BEGIN AUTO-MEMORY (generated from .project-memory/handoff.md - do not edit) -->

## Current shared memory (tier 1 - auto-generated, do not edit here)

You already have the current handoff below. Do NOT re-read `.project-memory/handoff.md`.
Read `STATE.md` / `DECISIONS.md` / `PROTOCOL.md` only on demand.
For the freshest copy plus a remote-drift check, run `bash .project-memory/status.sh`.

---

# Latest Handoff

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 實作 Auto-Updater 自動更新系統（支援安裝版與免安裝版）
- Branch: fix/settings-persistence-and-doc-tools
- Commit: feat(updater): add auto-update system for installed and portable distributions

## Done
- **實作 Auto-Updater 自動更新推送與管理系統**：
  - `electron-builder.yml`: 新增 GitHub Releases `publish` 配置（repo: `zkylek1212-k/Mulit-Harness-ADE`）。
  - `package.json`: 安裝並配置 `electron-updater`。
  - `src/main/ipc/updater.ts`:
    - 新增 `isInstalledApp()` 精確判斷 NSIS 安裝版 vs 免安裝綠色目錄。
    - 封裝 `autoUpdater` 事件監聽（`update-available`、`download-progress`、`update-downloaded`）。
    - 提供 GitHub Releases API 直接查詢備援（適用免安裝版與開發模式）。
    - 提供完整 IPC Handlers：`updater:getStatus`、`updater:check`、`updater:download`、`updater:install`、`updater:openRelease`。
  - `src/preload/index.ts`: 暴露 `window.api.updater`，支援即時事件廣播監聽與手動操作；定義 `UpdaterStatus` 與 `UpdateInfo`。
  - `src/renderer/src/components/SettingsModal.tsx` & `settingsModal.css`:
    - 新增「關於與更新 (About & Updates)」分頁，含品牌資訊與發行版本類型標籤（安裝版 vs 免安裝版）。
    - 提供即時「檢查更新」按鈕、更新日誌預覽、下載進度條。
    - 安裝版支援一鍵背景下載與重啟覆蓋升級（`quitAndInstall`）；免安裝版提供一鍵導向最新 Release 包下載。
    - 新增啟動時自動檢查更新開關。
    - 有新版時側邊欄分頁徽章紅點提醒。
  - `src/renderer/src/components/Icons.tsx`: 新增 `IconInfo`、`IconDownload`、`IconSpark`。
  - `src/renderer/src/i18n/index.ts`: 繁體中文與英文完整語系支援。
- **整合 PR #4 (Codex / Antigravity 會話恢復與 Token 顯示修正)**：
  - `src/renderer/src/panels/terminal/TerminalPanel.tsx`:
    - 修復 Codex 會話恢復缺少參數：改為 `args = ['resume', req.id]`。
    - 新增 Antigravity 終端恢復提示 `▸ Resuming Antigravity session...`。
  - `src/main/ipc/dashboard.ts`:
    - 新增 `scanAntigravityCliConversations()`：直接掃描 `~/.gemini/antigravity-cli/conversations/*.db`。
    - 新增 `estimateTokensFromBlob()`：從 Protobuf 二進位 .db 中掃描 UTF-8 可讀文字估算 Token。
  - `src/main/ipc/pty.ts`:
    - 在 `onData` 與 `onExit` 加入 `event.sender.isDestroyed()` 防護，修復分離終端視窗關閉時導致主行程崩潰的 bug。
- **修正安裝版設定檔持久化 (EPERM 權限錯誤)**：
  - `src/main/ipc/settings.ts`: 優先存儲至 `app.getPath('userData')/settings.json`（`%APPDATA%`），保證讀寫權限。
  - `src/main/index.ts`: 初始化工作區防止將 `C:\Program Files` 誤當作專案目錄。
- **修復 Document Tool 測試「成功開啟卻顯示 Verification Failed」**：
  - `src/preload/index.ts` & `src/main/ipc/settings.ts`: 新增 `testDocToolPath`，改為檢查路徑與執行檔屬性，不執行 `--version`，徹底解決 GUI 程式 6 秒逾時報錯。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（Vite 生產 bundle 與 SSR 編譯打包成功）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
