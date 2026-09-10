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

- Updated: 2026-09-10 19:22 Asia/Taipei
- Agent: Antigravity
- Task: 終端頁籤採用獨立專屬第二排（徹底消除多終端開啟時的水平擁擠感）
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **終端頂層工具列與專屬分頁頁籤雙層架構（Two-Row Split Architecture）**：
   - `TerminalPanel.tsx`：
     - **第一排（全域工具列 `.term-unified-strip`，高度 35px）**：
       - 左側收納全域功能按鈕：`Terminals` 標題、`+ ▾` 新增終端下拉選單、`@ Prompt` Agent CLI 提示派發器。
       - 右側收納操作控制群：獨立視窗彈出、清空緩衝（Ctrl+L）、刪除 active session（垃圾桶）、跨 Agent Handoff、多重視窗分割（Split Dropdown）與待審批提示氣泡。
     - **第二排（專屬分頁頁籤列 `.term-tabs-row`，高度 32px，僅在 `sessions.length > 0` 時顯示）**：
       - 橫跨終端面板 100% 完整寬度，各終端分頁（如 `@claude`, `@antigravity`, `PowerShell`, `Command Prompt`）擁有寬敞無阻的專屬橫向空間。
       - 分頁標籤名稱最大寬度提升至 `200px`，不再受到頂部動作按鈕的水平擠壓。
       - 支援平滑橫向滾動與 2px 極細原生捲軸。
   - `terminal.css`：
     - 優化 `.term-unified-strip` 與 `.term-tabs-row` 的微觀間距、Apple 膠囊外觀與雙層線條對齊。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境構建成功，37.63s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。

<!-- END AUTO-MEMORY -->
