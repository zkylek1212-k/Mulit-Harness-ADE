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

- Updated: 2026-09-10 23:50 Asia/Taipei
- Agent: Antigravity
- Task: 修復 Preview 預覽面板分頁未隨工作區同步關閉與 Commit 虛擬路徑 ENOENT 錯誤
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **修復 Preview 預覽面板分頁與工作區不同步（檔案已關閉仍殘留頁籤）**（[src/renderer/src/panels/preview/PreviewPanel.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/preview/PreviewPanel.tsx)）：
   - **根本成因**：
     - `PreviewPanel` 先前使用了孤立的內部 `previewTabs` / `currentPath` state，並未同步全域 `store.ts` 的 `openTabs` 與 `activeFilePath`。
     - 當在 Editor 或其他面板關閉檔案時，`store.ts` 已移除該檔案，但 `PreviewPanel` 仍殘留舊檔案路徑，且回退邏輯 `currentPath || activeFilePath` 導致關閉失敗。
   - **修正方案**：
     - `PreviewPanel` 改以全域 `useWorkbench()` 中的 `openTabs` 作為單一真相來源，動態過濾支援預覽的檔案。
     - 關閉分頁時直接呼叫 `closeTab(p)`，點選分頁時直接呼叫 `selectTab(p)`，實現跨面板 100% 雙向同步。
     - 當檔案全部關閉時，乾淨回到 Empty State，徹底清除殘留標題與錯誤訊息。
2. **支援 Git Commit 虛擬比對分頁即時預覽**：
   - 當使用者點選 Git Graph 檢視 Markdown 歷史版本（虛擬路徑 `commit:${hash}:${filePath}`）並切換至 Preview 時，自動透過 `window.api.git.commitFileDiff(hash, relPath)` 擷取該 Commit 歷史版本內容渲染，解決原先直接傳入硬碟路徑導致 `files:read ENOENT` 的紅色報錯。
   - 分頁標籤與工具列自動顯示人性化短雜湊標記（如 `shared-memory.md (51e14f8)`）。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。

<!-- END AUTO-MEMORY -->
