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

- Updated: 2026-09-10 18:53 Asia/Taipei
- Agent: Antigravity
- Task: 獨立 Agent / Terminal 頁籤至第二排（避免與右側控制鈕擠壓排版）
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **Agent / Terminal 頁籤獨立第二排（解決與控制項擠壓導致標題被截斷問題）**：
   - `TerminalPanel.tsx`：將原本終端頂部單一行拆分為兩排式結構：
     - **第一排（全域工具與動作列 `.term-unified-strip`）**：
       - 左側：`Terminals` 標題、新增終端下拉選單（`+`）、`@` Prompt Agent CLI 快速派發按鈕。
       - 右側：獨立視窗彈出、清空緩衝（Ctrl+L）、刪除 active session（垃圾桶）、跨 Agent Handoff、多視窗 Split 分割下拉選單與審批提示。
     - **第二排（專用分頁頁籤列 `.term-tabs-row`，僅在 `sessions.length > 0` 時顯示）**：
       - 橫跨終端面板 100% 全寬度，各終端分頁（如 `@claude`, `@antigravity`, `PowerShell` 等）擁有充裕橫向空間，不再與動作按鈕擠壓。
       - 支援平滑橫向捲動（`overflow-x: auto`）、細緻原生捲軸、完整顯示分頁名稱（`max-width: 220px`，不再截成 `@antig...`）。
   - `terminal.css`：新增 `.term-strip-left` 與 `.term-tabs-row` 樣式，設定 `min-height: 34px`、微調 Apple 膠囊分頁樣式與 `flex-shrink: 0` 防擠壓。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境構建成功，45.03s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。

<!-- END AUTO-MEMORY -->
