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

- Updated: 2026-09-11 Asia/Taipei
- Agent: Claude (Opus 4.8)
- Task: 修復 Git Graph / Recent Commits 點擊無法開啟 commit diff（讀取失敗）
- Branch: master
- Commit: Uncommitted（原始碼未提交；本輪僅提交 .project-memory/）

## Done
- **Root cause**：點 commit 後 editor 分頁 id 變成 `commit:<hash>:<path>`，`activeCommitDiff` 帶有真正的 diff 資訊；但 [EditorPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/editor/EditorPanel.tsx) 的載入邏輯在 `viewMode==='diff'` 時完全沒看 `activeCommitDiff`，無條件呼叫 `git.diff(activeFilePath)`，把假路徑 `commit:...` 丟給 git → 讀取失敗。`commitFileDiff` IPC 從未被呼叫。
- **Fix**（`EditorPanel.tsx`）：
  1. 從 `useWorkbench()` 解構出 `activeCommitDiff`，並在其本地 prop 型別加上 `activeCommitDiff?: GitCommitDiffTarget | null`；`@/store` import 補 `type GitCommitDiffTarget`。
  2. diff 載入分支：有 `activeCommitDiff` 時改呼叫 `git.commitFileDiff(commitHash, filePath, parentHash)`，把 `original→head`、`modified→work` 餵給 DiffEditor；否則維持原本 `git.diff`。
  3. diff 模式的 Retry 按鈕同步支援 commit 分支。
  4. 標題檔名與 language 改用真實路徑 `activeCommitDiff.filePath`（非 `commit:hash:` tabId）。
  5. useEffect deps 加入 `activeCommitDiff`。

## Not done
- 尚未在實機（Electron）驗證點 Git Graph 節點 / Recent Commits 後 diff 是否正確顯示。

## Next agent should
- 啟動 app，切到 Git 面板 → Git Graph 點節點、以及 Changes 視圖下方 Recent Commits 點 commit，確認中央 editor 出現 side-by-side diff 且無錯誤條；再點 inspector 內個別檔案確認可切換單檔 diff。
- 若要保留此修復，記得 commit `src/renderer/src/panels/editor/EditorPanel.tsx`（原始碼本輪未提交）。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。未跑實機/單元測試。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。

<!-- END AUTO-MEMORY -->
