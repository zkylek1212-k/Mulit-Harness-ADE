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

- Updated: 2026-09-10 14:25 Asia/Taipei
- Agent: Antigravity
- Task: Apple UI/UX 精緻化、獨立終端視窗、空間精簡、目錄嚴格連動與雙層縮放
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **移除 Browser 分頁 Emoji 符號（`App.tsx`, `TestBrowserPanel.tsx`）**：
   - 將中央分頁標籤 `⚡ Test Browser` 改為純淨的 `Browser`。
   - 移除網址列與裝置切換按鈕中的 Emoji 符號（改為 `Desktop`, `Tablet`, `Mobile`）。
2. **Agent Workspace 與左側目錄嚴格連動（`store.ts`, `FileTreePanel.tsx`, `TerminalPanel.tsx`）**：
   - 全域狀態新增 `workspaceRoot` 與 `setWorkspaceRoot()`。
   - 左側開啟或切換目錄時自動同步至全域與後端；終端面板自動響應，徹底移除終端控制列上的 `Change` 按鈕。
3. **統一 Apple SF-Symbols 向量圖標系統（`Icons.tsx`, 全站面板）**：
   - 建立專屬向量圖標庫 `src/renderer/src/components/Icons.tsx`。
   - 全面替換文字 emoji 與特殊符號（收折/展開、右停靠/底停靠、彈出/收回視窗、設定、日/月主題、增/關/清/交接/縮放）。
4. **Apple UI/UX 深度打磨（`styles.css`, `terminal.css`）**：
   - 採用 macOS 原生層級的深炭灰階（`#161618` 畫布底層、`#1e1e20` 面板、`#28282c` 浮動層）。
   - 導入超細 `1px solid rgba(255, 255, 255, 0.08)` 邊框與毛玻璃材質。
5. **中間視窗縮放機制（視窗級與內容級）（`App.tsx`, `EditorPanel.tsx`, `EditorPanel.css`）**：
   - **視窗級（Focus Mode 專注模式 `⤢`）**：中央列提供最大化/專注按鈕，一鍵將左欄縮至 0、隱藏終端，中間獨佔 100% 畫面（維持單一 JSX 結構，終端進程不中斷）。
   - **內容級（Zoom Controls）**：Editor 標題列新增 `－ 100% ＋` 快速字級控制器，並開啟 Monaco `mouseWheelZoom: true`。
6. **澄清並拔除「Agent runtime」與「Local AI process workspace」裝飾標籤（`TerminalPanel.tsx`）**：
   - 徹底移除容易令人困惑的靜態無功能裝飾文字，簡化為俐落的 `Terminals` 與 `New Agent Session`。
7. **Agent Terminals 拉出成獨立原生視窗（`main/index.ts`, `preload/index.ts`, `TerminalPanel.tsx`, `App.tsx`）**：
   - Electron 主行程支援 `createTerminalWindow()`，載入 `?mode=terminal-detached` 全螢幕終端視圖。
   - 終端控制列提供彈出圖標（`IconPopout`）；獨立視窗中可一鍵 Attach 回主視窗，支援雙螢幕全螢幕監控。
8. **徹底根治工具列擁擠（Apple Progressive Disclosure）**：
   - 將原本佔位 180px 的 4 個啟動按鈕收斂為單一 Apple 風格的 `[ ＋ ▾ ]` 分割下拉選單。
   - 清除按鈕與交接按鈕改為微向量圖標，釋放大量橫向負空間。

## Tests
- `npm run typecheck` → pass (代碼與型別 100% 通過)
- `npm run build` → pass (Vite 生產環境打包通過，耗時 1m)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。

<!-- END AUTO-MEMORY -->
