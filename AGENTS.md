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

- Updated: 2026-09-10 23:40 Asia/Taipei
- Agent: Antigravity
- Task: 解析並修復 Antigravity CLI 連接 Session 出現 conversation not found 問題
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **解析 Antigravity CLI 連接 Session 出現 "conversation not found" 成因**：
   - **根本成因**：
     - **Antigravity IDE**（桌面 GUI）與 **Antigravity CLI**（`agy.exe`）的對話儲存架構是分開的。
     - IDE 的對話記錄存放於 `~/.gemini/antigravity-ide/brain/<UUID>`（以 `transcript.jsonl` 記錄）。
     - CLI（`agy`）的對話記錄獨立存放在 `~/.gemini/antigravity-cli/conversations/<UUID>.db`（以 SQLite 資料庫管理）。
     - 儀表板點擊 IDE 的 session ID 嘗試以 `agy --conversation <UUID>` 啟動時，`agy` 在其 CLI 資料庫中找不到該 ID，因而輸出 `warning: conversation "<UUID>" not found`。
2. **防禦修正與自動降級**（[src/main/ipc/pty.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/pty.ts)）：
   - 在 `pty:spawn` 啟動 `agy` 或 `antigravity` 時，自動檢查 `--conversation <id>` 對應的 `.db` 檔是否存在於 `~/.gemini/antigravity-cli/conversations/`。
   - 若為真實 CLI 會話，完整保留參數並無縫 resume；若為 IDE 會話或遺失檔案，自動過濾掉 `--conversation <id>`，避免 CLI 終端跳出警告紅字，而是乾淨啟動並綁定當前專案工作區。

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
