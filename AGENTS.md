# Agent Instructions

Canonical cross-agent memory is `.project-memory/`.

## Startup — run this ONE command first, every session

```bash
bash .project-memory/status.sh
```

It prints tier-1 memory (`INDEX.md` + `handoff.md`) and reports whether the branch is behind the
remote. Do not read those two files separately — the command already gave you their contents.

Then:
1. Inspect `git status --short` and `git branch --show-current`.
2. Summarise the current context in <=3 bullets.
3. Read `.project-memory/PROTOCOL.md` on first entry to this repo, for Git/worktree/merge tasks,
   for memory-file changes, or when the rules are unclear.
4. Read `STATE.md` / `DECISIONS.md` only when the task needs macro status or architecture history.

## Before finishing

Apply the memory-update criteria in `PROTOCOL.md`: rewrite `handoff.md` when the work meets the
threshold; skip it entirely for read-only questions, trivial explanations, and no-change reviews.

Then commit the memory yourself — an uncommitted handoff does not exist for anyone else:

```bash
bash .project-memory/commit-handoff.sh "docs(memory): <one-line summary>"
```

It is pathspec-limited to memory files, so the user's staged source changes are left untouched.
It pushes only when `MEM_AUTOPUSH=1`; otherwise say clearly that the handoff is not pushed yet.

## Never

- Auto pull/rebase/merge/reset/force-push without user authorization. `git fetch` is read-only and fine.
- Commit the user's SOURCE code on your own initiative — committing shared memory is fine, that is not.
- Commit secrets, tokens, passwords, API keys, or private keys.
- Rewrite historical decisions — supersede them instead.

<!-- BEGIN AUTO-MEMORY (generated from .project-memory/handoff.md - do not edit) -->

## Current shared memory (tier 1 - auto-generated, do not edit here)

You already have the current handoff below. Do NOT re-read `.project-memory/handoff.md`.
Read `STATE.md` / `DECISIONS.md` / `PROTOCOL.md` only on demand.
For the freshest copy plus a remote-drift check, run `bash .project-memory/status.sh`.

---

# Latest Handoff

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 修正安裝版設定持久化 EPERM 與 Document Tool 驗證超時
- Branch: fix/settings-persistence-and-doc-tools
- Commit: fix(settings): persist settings to userData and fix doc tool validation

## Done
- **修正安裝版設定檔持久化 (EPERM 權限錯誤)**：
  - `src/main/ipc/settings.ts`:
    - 新增 `getGlobalSettingsPath()` 優先存儲至 `app.getPath('userData')/settings.json`（`%APPDATA%`），保證無需管理員權限即可正常讀寫。
    - 新增 `isProtectedPath()` 辨識 `C:\Program Files`、`C:\Windows` 與應用程式安裝目錄。
    - `saveSettings` 先寫入 `userData`，若當前工作區非保護目錄則非同步同步至 `.workbench/settings.json`（避免拋出中斷性 EPERM）。
    - 支援 `lastWorkspace` 記錄與還原。
  - `src/main/index.ts`:
    - 初始化 `workspace.root` 時改用 `determineInitialWorkspace()`，由 `lastWorkspace` 或安全的使用者目錄（Documents/Home）啟動，防止從 `C:\Program Files` 安裝路徑啟動時將安裝目錄誤當作使用者工作區。
  - `src/main/ipc/files.ts`:
    - 在 `pickWorkspace` 與 `setWorkspaceRoot` 成功時呼叫 `saveLastWorkspace(workspace.root)`。
  - `src/main/ipc/dashboard.ts` & `src/main/ipc/ext.ts`:
    - 在寫入快取與狀態檔前加入 `isProtectedPath(workspace.root)` 防護。
  - `src/renderer/src/components/SettingsModal.tsx` & `src/renderer/src/i18n/index.ts`:
    - 儲存設定時加入例外捕捉與錯誤提示橫幅，底部提示語系說明設定存儲於全域設定與工作區。
- **修復 Document Tool 測試「成功開啟卻顯示 Verification Failed」**：
  - **根本原因**：Office / PDF 軟體為 Windows GUI 桌面程式（`IMAGE_SUBSYSTEM_WINDOWS_GUI`），執行 `--version` 會拉起視窗但永不結束退出，導致 Node.js `exec` 超過 6 秒逾時報錯。
  - `src/preload/index.ts`: 新增 `testDocToolPath(path: string)`。
  - `src/main/ipc/settings.ts`: 實作 `settings:testDocToolPath`，改為檢查路徑存在性與執行檔屬性（< 5ms 完成），不呼叫 `--version`；同時於 `testCliPath` 增加常見 GUI 文件工具之攔截防護。
  - `src/renderer/src/components/SettingsModal.tsx`: 文件工具測試改呼叫 `testDocToolPath`。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（Vite 生產 bundle 與 SSR 編譯打包成功）。
- `npm run dist` → pass（安裝程式 `Agent Workbench-0.1.3-setup.exe` 成功打包）。
- Node/Electron 單元驗證腳本 → pass（`isProtectedPath`, `determineInitialWorkspace`, `saveSettings` 無 EPERM 驗證通過）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
