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

- Updated: 2026-09-09 19:30 Asia/Taipei
- Agent: Claude Code
- Task: Phase 4 面板深度整合 + 安裝 ShareProjectMem
- Branch: master
- Commit: Uncommitted

## Done
- 安裝 ShareProjectMem：`.project-memory/`、`AGENTS.md`、`.agents/rules/shared-memory.md`、
  `.githooks/pre-commit`、`.githooks/post-merge`，並設 `core.hooksPath .githooks`
- 終端待審批紅點：`src/renderer/src/panels/terminal/approvalDetect.ts` 偵測提示字串，
  分頁顯示脈動紅點，工具列顯示待審批數
- OS 原生通知：`src/main/ipc/notify.ts`，待審批（非當前分頁時）與任務結束會發通知，
  點通知把視窗帶到前景
- handoff 路徑跳轉：`src/renderer/src/panels/memory/MemoryPanel.tsx` 會把本檔提到、
  且工作區真實存在的路徑做成可點擊，點了在中央 Monaco 開啟
- 新增 `files:exists` IPC（`src/main/ipc/files.ts`），改掉用例外當流程控制的寫法，
  消除開機時 `.project-memory/*.md` 的 ENOENT 噪音
- 修掉 `src/renderer/src/panels/terminal/TerminalPanel.tsx` 的 ptyId 閉包 bug
  （resize 事件先前從未真正送到 pty）

## Not done
- Phase 3 硬體 MCP：Python USB／BIOS Log 腳本尚未包成 MCP server
- 三家 CLI 未實機驗證（本機是否已安裝 codex / antigravity 未確認）
- 尚未打包發佈

## Next agent should
1. 確認本機有哪幾家 CLI 可執行，逐一在終端殼開起來，記下各家真實的審批提示字串，
   回填 `src/renderer/src/panels/terminal/approvalDetect.ts` 的 `APPROVAL_PATTERNS`
2. 把既有 Python 硬體腳本包成 MCP server，建 `.mcp/hardware.json`，
   在 `agents/claude_dev.yaml` 的 `args` 以 `--mcp-config` 註冊給 CLI
3. 驗證 CLI 呼叫硬體工具後，結果能寫回本檔並在 Memory 面板即時看到

## Tests
- `npm run typecheck` → pass
- `npm run build` → pass
- 實機啟動 Electron → 視窗正常、renderer 載入、IPC 正常

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態，
  改動會牽動全部 panel，動之前先確認沒有其他 agent 正在平行改 panel
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來

<!-- END AUTO-MEMORY -->
