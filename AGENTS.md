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

- Updated: 2026-09-10 23:16 Asia/Taipei
- Agent: Antigravity
- Task: 設立右側欄（Terminal 停靠右側）最小寬度防禦（340px）避免按鈕與卡片文字溢出
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **設立右側欄（Terminal 停靠右側）最小寬度限制（防止按鈕撞擊與文字跑掉）**：
   - **問題根源**：原先 `LIMITS.rightMin` 設為 260px，當終端停靠在右側欄且使用者將分割線向右拖拉過窄時，頂層統一工具列按鈕群（Popout、Clear、Handoff、Split、Agent Selector 等）以及 Launchpad 歡迎卡片（至少需要容納 2 張 148px 卡片並排）會被過度擠壓，造成標題工具列圖示擁擠重疊或卡片文字被強行折行破版。
   - [src/renderer/src/layout.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/layout.ts)：
     - 將 `LIMITS.rightMin` 從 260px 調升至 `340px`。
     - `loadLayout()` 讀取本機快取時，自動修正儲存於 localStorage 且小於 340px 的舊數值。
   - [src/renderer/src/App.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/App.tsx)：
     - `<section className="col col-term" ...>` 注入 `minWidth: !isBottom ? LIMITS.rightMin : 0`，徹底防止右側欄寬度失守。
   - [src/renderer/src/panels/terminal/terminal.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/terminal.css)：
     - `.term-unified-strip` 加入 `overflow: hidden;`，避免工具列超長溢出。
     - `.launchpad-card` 加入 `min-width: 140px; overflow: hidden;`，確保卡片本體及內部元件絕不破版外溢。
2. **設立左側側邊欄（Sidebar）最小寬度限制（防止卡片文字跑掉）**：
   - [src/renderer/src/layout.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/layout.ts)：將 `LIMITS.leftMin` 調升為 `260px`，`DEFAULT_LAYOUT.leftW` 調升為 `280px`。
   - [src/renderer/src/App.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/App.tsx)：`nudgeLeft` 與 `<aside className="col col-left" ...>` 嚴格約束 `minWidth: 260px`。
   - [src/renderer/src/panels/dashboard/dashboard.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/dashboard.css)：卡片文字加入 `text-overflow: ellipsis; max-width: 100%;` 與 `overflow: hidden;` 雙重保護。
3. **修復 Terminal Launchpad 歡迎卡片（Empty State）的排版一致性與置中擴展**：
   - [terminal.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/terminal.css)：以 Flexbox 置中流式擴展，卡片鎖定 Apple 標準尺寸（`width: 148px; min-height: 172px;`），孤行居中對齊。
4. **修復 Settings 中的 CLI Path Test（解決路徑含空格被 cmd 截斷的問題）**：
   - [src/main/ipc/settings.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/settings.ts)：以 `execAsync` 執行雙引號包裹指令，解決 Windows 含空格路徑截斷問題。

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
