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

- Updated: 2026-09-10 23:10 Asia/Taipei
- Agent: Antigravity
- Task: 修復 Terminal Launchpad 歡迎卡片排版與基準線一致性
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **修復 Terminal Launchpad 歡迎卡片（Empty State）的排版一致性與置中擴展**：
   - **問題根源**：原先使用 CSS Grid 固定欄數（`repeat(5, 1fr)` 或 `repeat(3, 1fr)`），當啟用的 CLI 只有 4 個（或在折行時），最後一列的孤立卡片會被強行靠左對齊，右側留出大片突兀空白，整體視覺無法以中央為軸心向外展開；且先前內容層過窄觸發單詞斷行。
   - [terminal.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/terminal.css)：
     - 將卡片容器從 CSS Grid 重構為 **Flexbox 置中流式擴展架構**（`display: flex; flex-wrap: wrap; justify-content: center;`）。
     - 每張卡片鎖定為均勻的 Apple 標準尺寸（`width: 148px; flex: 0 0 148px; min-height: 172px;`）。
     - 不論啟用 1、2、3、4 或 5 張卡片，抑或視窗縮放折行，所有行均永遠以正中心為軸心對稱向兩側展開（無任何向左單邊傾斜的失衡情況）。
     - 鎖定卡片內部各層格位高度（Icon 32px、Name 20px、Sub 18px、Meta 18px），設定 `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`，保證每一列水平絕對齊平。
     - 底部按鈕以 `margin-top: auto;` 嚴格錨定至卡片底部，並加入 hover 箭頭微動效。
   - [TerminalPanel.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/TerminalPanel.tsx)：
     - 整理文案結構（如 `Windows PowerShell` 與 `Windows CMD` 對稱），確保卡片資訊架構一體化。
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
