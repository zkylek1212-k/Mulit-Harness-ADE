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

- Updated: 2026-09-10 18:40 Asia/Taipei
- Agent: Antigravity
- Task: 設定亮暗雙色主題全面適應、移除紅黃綠三鈕改用簡潔右上角關閉鈕、全域排版文字與線條精確對齊
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **設定視窗亮色適應（解決亮色模式下選單為黑色的問題）**：
   - `styles.css`：在 `:root` 與 `:root[data-theme='dark']` 補齊 `--border-subtle`、`--shadow-modal` 與 `--bg-surface` 語義化變數。
   - `settingsModal.css`：徹底清除原本硬編碼的暗色背景（`#1e1e22`）與半透明白色邊框（`rgba(255, 255, 255, 0.08)`），全面改採語義化變數。
   - 亮色模式下視窗呈現 Apple 系統淺色外觀（`#ffffff` 主體、`#f5f5f7` 側邊欄、細緻 `rgba(0, 0, 0, 0.08)` 分隔線與 Apple 淺色主題卡片）；暗色模式自動切換為深灰石墨色。
2. **移除設定左上角紅黃綠縮放關閉三鈕**：
   - `SettingsModal.tsx`：移除 `.macos-traffic-lights` 區塊，側邊欄保留簡約優雅的 `Settings` 標題。
   - 右側內容區頂部統一加入 Apple 原生圓形關閉按鈕（`IconClose`，支援 Hover 動畫、點擊與 `Esc` 快捷鍵退出）。
3. **全域排版文字與線條對齊審查（修復段線與不對齊問題）**：
   - **Path 收折抽屜全寬對齊**：移除舊版 `54px` 左側縮排所導致的割裂斷線，改為與分組列表左右邊界完全貼合的連續邊框（`border-top: 1px solid var(--border)`），內嵌標籤與可執行檔路徑輸入框垂直精確對齊。
   - **頂層控制列與 Tabbar 對齊**：`styles.css` 統一 `.btn-icon` 為 28px 彈性垂直置中，修飾 `.segmented`、`.dock-switch` 與各 panel tabbar 的文字行高與水平邊界。
   - **Agent Dispatcher HUD 雙色調適應**：終端派發浮動視窗同步支援亮色與暗色材質，消除白色邊框外溢。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境構建成功，35.61s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。

<!-- END AUTO-MEMORY -->
