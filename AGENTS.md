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

- Updated: 2026-09-10 23:10 Asia/Taipei
- Agent: Antigravity
- Task: 修復 Terminal Launchpad 歡迎卡片排版與基準線一致性
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **修復 Terminal Launchpad 歡迎卡片（Empty State）的排版一致性**：
   - **問題根源**：原卡片外部包裹層 `.term-launchpad-content` 寬度被鎖在 `640px`，導致 5 張卡片平均可用寬度僅約 98px，觸發多個詞彙突兀折行（如 `auto-` \n `wrap`、`Command` \n `Prompt`、`powershell ·` \n `direct pty`）；且因各卡片行數與高度不一致，導致底部按鈕（`Launch Session →` / `Launch Shell →`）與中繼標籤參差不齊。
   - [terminal.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/terminal.css)：
     - 將容器最大寬度調升至 `860px`，並加入 CSS Container Query（`container-type: inline-size`），在終端面板於不同 dock 寬度下智慧切換為 5 欄、3 欄或 2 欄。
     - 鎖定卡片內部各層格位高度（Icon 32px、Name 20px、Sub 18px、Meta 18px），設定 `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`，保證每一列水平絕對齊平。
     - 底部按鈕以 `margin-top: auto;` 嚴格錨定至卡片底部，並加入 hover 箭頭微動效。
   - [TerminalPanel.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/TerminalPanel.tsx)：
     - 整理文案結構（如 `Windows PowerShell` 與 `Windows CMD` 對稱），確保 5 張卡片之資訊架構一體化。
2. **修復 Settings 中的 CLI Path Test（解決路徑含空格被 cmd 截斷的問題）**：
   - [src/main/ipc/settings.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/settings.ts)：以 `execAsync` 執行雙引號包裹指令，解決 Windows 含空格路徑截斷問題。
   - [src/renderer/src/components/SettingsModal.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/components/SettingsModal.tsx)：當自訂路徑為空時優先取用 `detectedPaths` 進行版本測試。

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
