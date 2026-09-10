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

- Updated: 2026-09-10 23:25 Asia/Taipei
- Agent: Antigravity
- Task: 新增點選左側 Dashboard Session 於右側直接跳出對應 CLI 終端並開啟/恢復該 Session
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **點選左側 Dashboard Session 於右側跳出並開啟對應 CLI 終端**：
   - **需求**：使用者在左側儀表板點選任何 session 時，右側終端應立即跳出、切換為停靠右側（`dock: 'right'`），並開啟或恢復對應的 Agent CLI Session。
   - **跨面板通訊設計**（[src/renderer/src/store.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/store.ts)）：
     - 定義 `TerminalOpenSessionRequest` 介面（包含 `id`, `agent`, `title`, `status`, `ensureRightDock`, `nonce`）。
     - 提供 `openTerminalSession(req)` action，自動重設 `centerMaximized: false` 並廣播至全域 store。
   - **右側停靠與佈局防禦**（[src/renderer/src/App.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/App.tsx)）：
     - 監聽 `terminalOpenSession`：若目前停靠為 bottom 或處於最大化視圖，自動切換至 `dock: 'right'`，並確保 `rightW >= LIMITS.rightMin`（340px）。
     - 恪守單一 JSX 結構規則，切換停靠位置時僅動態調整 CSS Grid Areas，完全不造成 TerminalPanel remount，確保活躍終端進程不中斷。
   - **終端喚醒與 Session 恢復機制**（[src/renderer/src/panels/terminal/TerminalPanel.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/TerminalPanel.tsx)）：
     - 擴充 `TerminalSession.args?: string[]` 與 `handleNewTerminal` 參數介面，並於 `TerminalInstance` 中透過 `window.api.pty.spawn` 傳入 CLI 參數。
     - 監聽 `terminalOpenSession` 觸發事件：
       1. **活躍 Session 匹配**：若已有終端匹配（`ptyId`、`id` 或同 Agent 活躍狀態），直接選取該 tab 並呼叫 `term.focus()`，不重複啟動重複進程。
       2. **歷史 Session 恢復**：若無匹配終端，根據 Agent 類型自動注入恢復旗標：
          - Claude Code：注入 `['--resume', req.id]`
          - Antigravity：注入 `['--conversation', req.id]`
          - 標題自動冠上 Session 標題，啟動後直接切換為作用中分頁。
   - **Dashboard 面板互動介面**（[src/renderer/src/panels/dashboard/DashboardPanel.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/DashboardPanel.tsx) 與 [dashboard.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/dashboard.css)）：
     - 將 Session 卡片左半部主要資訊區塊改為點擊熱區（`.dash-session-click-area`），滑鼠懸浮時呈現 Accent 晶透高亮與字體變色。
     - 卡片操作列左側加入專屬主要操作鈕（`.dash-action-btn.dash-action-open`）：
       - 活躍 Session 顯示「`Switch CLI ➔`」
       - 歷史/閒置 Session 顯示「`Resume CLI ➔`」
     - 保留 Token 摘要與展開箭頭獨立點擊開合分析圖表，互不干擾。

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
