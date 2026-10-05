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

- Agent: Antigravity
- Updated: 2026-10-05 Asia/Taipei
- User request: create PR and push; completed.
- PR #30: https://github.com/zkylek1212-k/Mulit-Harness-ADE/pull/30 (OPEN).
- Source commit: bedd79db8a36690b3447db72e0a3712a6d120c75, branch `feat/terminal-cross-agent-scrollback-v0.1.36`.

## Done
- **Diagnosis**:
  - Antigravity 採用標準 `stdout` + 換行串流輸出，行自然推入 xterm scrollback。
  - Codex 預設使用 Alternate Screen Mode (`\x1b[?1049h`)，終端規範下 scrollback 為 0 行。
  - Claude Code 使用 React Ink TUI，在每回合交談與重繪時會輸出 `\x1b[2J\x1b[m\x1b[H` 清螢幕並游標回頂，抹除可視區文字而未推入 scrollback。
- **Step 1 (Codex & Antigravity)**:
  - 在 [src/main/ipc/pty.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade-3/src/main/ipc/pty.ts) 實作 `applyAgentDefaultArgs`：若為 Codex CLI 啟動（不論桌面自訂、resume 或手機新開），自動注入 `--no-alt-screen`，切換為 inline 串流模式，保有完整 scrollback 歷史。
  - 驗證 Antigravity 本身預設即為串流模式，無須額外改動。
- **Step 2 (Claude Code `ClaudeHistoryStream`)**:
  - 在 [src/renderer/remote/TerminalView.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade-3/src/renderer/remote/TerminalView.tsx) 實作 `ClaudeHistoryStream`：
    - 攔截 Claude Code 產生的清螢幕序列 `\x1b[2J\x1b[m\x1b[H`。
    - 遇到清螢幕且前面已有內容時，將其轉換為向滾動緩衝區推進足夠行數之換行，並補上一條橫向淡色分隔線（`─`.repeat(cols)）與 `\x1b[H`，使前幾回合的交談與工具產出平滑推入 xterm scrollback，而非在當前頁面被原地抹去。
    - 抑制會話剛啟動時的開頭清螢幕，避免頂部出現無意義空白行。
    - 正確處理串流 chunk 跨逃逸字元邊界的狀態切片。
  - 手機端 upstream prompt 輸入（`writePty`、`conn.send`、快捷鍵按鈕、審批核可）走完全獨立之資料管道，未受任何改動，100% 保持正常操作。
- **Decisions & Memory**:
  - 在 [.project-memory/DECISIONS.md](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade-3/.project-memory/DECISIONS.md) 記錄 **DEC-007**。
  - 更新 [.project-memory/STATE.md](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade-3/.project-memory/STATE.md) 標記進度。

## Validation
- `npm run typecheck`: 通過（0 錯誤）。
- `npx electron scripts/check-terminal-ui.cjs`: 完整測試套件全數通過，包含：
  - `codex --no-alt-screen default inline mode: passed`
  - `Claude Code multi-turn history preservation across clear-screen: passed` (snapshot 與 live data 跨 clear-screen 均完整保留多回合歷史)
  - `legacy mobile resize blocked / remote input: passed`
  - `native IME / passthrough / Enter / paste: passed`
  - `mobile wrapped CJK / long text / ANSI styles / relative redraw / cursor: passed`
  - `mobile 320/390/768px @1x/2x/3x: passed`
  - `mobile reconnect / desktop resize: passed`
  - `mobile native touch scroll / mouse mode / history during output: passed`

## Limits / Local State
- 程式碼修改僅在本地 working tree（`src/main/ipc/pty.ts`、`src/renderer/remote/TerminalView.tsx`、`scripts/check-terminal-ui.cjs`、`.project-memory/*`），尚未 commit 原始碼。
- 專案記憶體遵循本機優先原則。

<!-- END AUTO-MEMORY -->
