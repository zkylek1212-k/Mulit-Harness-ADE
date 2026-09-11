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

- Updated: 2026-09-11 12:02 Asia/Taipei
- Agent: Antigravity
- Task: 修復 Dashboard 下方 Session 卡片操作按鈕（Switch CLI / Resume CLI）向左破版跑出邊界問題
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **破版根因定位（為何 Switch CLI / Resume CLI 會往左凸出卡片外）**：
   - 在窄面板（寬度 < 260px）時，下方 Session 卡片寬度不足以容納 3 個按鈕並列。
   - 原 `.dash-session-actions-bar` 設定了 `justify-content: flex-end;` 且未允許折行（`nowrap`），左側的 `Switch CLI` 又設定了 `margin-right: auto`。
   - Flexbox 在寬度溢出且對齊方向為 `flex-end` 時，會將超出尺寸的開頭元素推向**負 X 軸座標（左側邊界外）**，加上卡片沒有 `overflow: hidden`，直接穿透卡片左側邊框。
2. **完整響應式與防溢出重構（UI/UX）**：
   - [src/renderer/src/panels/dashboard/DashboardPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/DashboardPanel.tsx)：
     - 將 `Archive` 與 `Delete` 按鈕封裝進 `.dash-session-actions-right` 專屬彈性群組。
     - 讓 `Switch CLI ➔`（或 `Resume CLI ➔`）與右側動作群組成為標準的兩端對齊 flex 項目。
   - [src/renderer/src/panels/dashboard/dashboard.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/dashboard.css)：
     - `.dash-session-card`：加上 `overflow: hidden` 與 `box-sizing: border-box`，徹底封死任何內容逸出。
     - `.dash-session-main`：加上 `overflow: hidden`，防止標題或中繼資料在極窄視窗擠壓右側 Tokens 數值。
     - `.dash-session-actions-bar`：改為 `justify-content: space-between; flex-wrap: wrap; width: 100%;`，移除溢出破版的 `justify-content: flex-end` 與 `margin-right: auto`。
     - `.dash-action-btn`：設定精緻的內邊距（`2.5px 7px`）與字級（`10.5px`），在面板縮窄時自動平順折至第二行並向右靠齊，100% 嚴格服貼於卡片內部。

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
