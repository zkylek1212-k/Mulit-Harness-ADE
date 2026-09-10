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

- Updated: 2026-09-10 17:56 Asia/Taipei
- Agent: Antigravity
- Task: 亮色主題 Git Graph / Preview 配色修正、多分頁水平捲軸、Popover 實底防重疊、Antigravity IDE 風格 Agent Terminals (@/add/delete/split、中下停靠、拔除原生Shell)
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **Git Graph 亮色主題色彩修復（問題 1）**：
   - `gitGraph.css` & `GitGraphView.tsx`：將原本寫死的深黑底色（`#18181a`、`#1e1e22`）改為系統主題變數 `var(--bg)`、`var(--bg2)`、`var(--border)`、`var(--fg)`，SVG Commit 節點描邊亦動態隨主題適配，解決淺色模式下死黑與文字辨識度不良問題。
2. **中間視窗分頁列水平捲軸支援（問題 2）**：
   - `EditorPanel.css` & `preview.css`：為 `.editor-tabs` 與 `.preview-tabs-bar` 補上 `overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;`，並將各分頁項目的 `flex-shrink` 設為 `0`，避免開啟大量分頁時標籤被壓縮變形甚至字體截斷，支援滑鼠滾輪橫向捲動。
3. **Handoff 與視窗切割浮動選單改為 100% 實底（問題 3）**：
   - `terminal.css`：為 `.term-popover-portal`、`.term-split-popover`、`.term-handoff-popover` 以及 `.term-launch-popover-portal` 統一套用 100% 不透明實底 `background: var(--bg2)`，搭配 `var(--border-strong)` 與精緻陰影，徹底杜絕 Windows xterm 畫布上方模糊滲透導致文字與底層重疊的問題。
4. **Markdown Preview 亮色模式配色修復（問題 4）**：
   - `preview.css`：分離 `:root[data-theme='dark']` 與 `:root:not([data-theme='dark'])`，亮色模式重構高對比代碼高亮色彩（關鍵字 `#a31515`、字串 `#0451a5`、數字 `#098658`、變數 `#001080`），Tab 列背景使用 `var(--bg2)` 與 `var(--border)` 清晰分界。
5. **Agent Terminals 全面重構（Antigravity IDE 風格）（問題 5）**：
   - `TerminalPanel.tsx`：
     - 拔除全部原生系統 Shell（PowerShell、CMD、Bash、pwsh），終端僅專注於 Agent CLI：`claude`、`antigravity`、`codex`。
     - 整合 Antigravity IDE 四大核心控制項：
       - `@`：新增 `@ Agent` 挑選器浮動選單，點選即可快速開立 `@claude`、`@antigravity`、`@codex`，且終端分頁名稱均以 `@` 開頭（如 `@claude`）。
       - `add` (`+`)：提供快捷的新增分頁按鈕。
       - `delete` (`🗑` & `×`)：各 Tab 支援獨立關閉，右側動作列新增專屬 `IconTrash` 刪除/殺死作用中 Agent Process 按鈕。
       - `split` (`◫`)：支援 Single、Split V、Split H、Grid 佈局，選單採用實底 Popover。
     - 移除 Launchpad 上的 Native Shell 卡片，3 張 Agent 卡片採三欄式居中排版。
   - `layout.ts`：
     - `DEFAULT_LAYOUT.dock` 預設為 `'bottom'`（編輯器正下方開啟）。
     - 於 `loadLayout` 中增加相容遷移機制，確保更新後即刻在中下方停靠生效。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境全 bundle 構建成功，46.23s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。

<!-- END AUTO-MEMORY -->
