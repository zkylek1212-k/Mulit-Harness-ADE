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
- Task: 點擊 Session 卡片資料夾按鈕自動切換至 Files 面板並無縫切換工作區根目錄
- Branch: feat/mobile-dispatch
- Commit: pending memory commit

## Done
- **Session 卡片資料夾按鈕連動切換工作區與 Files 側邊欄**：
  - `src/main/ipc/files.ts`: 新增 `files:setWorkspaceRoot` IPC 處理常式，直接設定主行程 `workspace.root`、重設檔案監聽器 `initWorkspaceWatcher()` 並即時向視窗廣播 `files:treeChange`。
  - `src/preload/index.ts`: 補齊型別與 IPC 暴露 `setWorkspaceRoot: (path: string) => Promise<boolean>`。
  - `src/renderer/src/store.ts`:
    - 定義全域 `SidebarTab = 'dashboard' | 'files' | 'git'` 與 `fileTreeTick` 變更計數器。
    - 實作 `switchWorkspace(path: string)`：安全呼叫後端切換工作區根目錄、將狀態中的 `workspaceRoot` 更新、自動切換側邊欄至 `'files'`，並遞增 `fileTreeTick` 與 `gitTick`。
  - `src/renderer/src/App.tsx`:
    - 側邊欄分頁切換改為連動全域 `sidebarTab`。
    - 加入自動展開邏輯：若側邊欄為摺疊狀態，當 `sidebarTab` 變更時自動展開側邊欄，確保切換至 Files 時使用者能直接看見檔案清單。
  - `src/renderer/src/panels/filetree/FileTreePanel.tsx`:
    - 監聽 `workspaceRoot` 變更，在路徑切換時自動重新載入新目錄之檔案樹 `refreshTree(workspaceRoot, false)`。
  - `src/renderer/src/panels/dashboard/DashboardPanel.tsx`:
    - `SessionCard`：將資料夾標籤改為 `<button type="button" className="dash-session-workspace">`，加入 `handleWorkspaceClick`，並嚴格阻斷事件冒泡 (`e.stopPropagation()`)，點擊時執行 `switchWorkspace(session.workspacePath)`。
    - 在資料夾群組標頭新增快捷切換按鈕 `.dash-folder-switch-btn` (`切換資料夾 ➔`)。
  - `src/renderer/src/panels/dashboard/dashboard.css`:
    - 為 `.dash-session-workspace` 與 `.dash-folder-switch-btn` 導入 Apple HIG 互動微動畫（微幅上浮、按壓縮放 0.96、聚焦輪廓與主題高亮）。
  - `src/renderer/src/i18n/index.ts`:
    - 補充 `switchFolder` 中英文在地化語系文字。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（Vite + Electron SSR/Renderer 打包編譯無誤）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
