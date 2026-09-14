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

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 檔案自動讀取更新、Session 資料夾分組摺疊與一鍵摺疊/展開、幽靈 Session 修正
- Branch: feat/mobile-dispatch
- Commit: pending memory commit

## Done
- **檔案自動讀取更新 (Auto-Refresh File Tree)**：
  - `src/main/ipc/files.ts`: 新增 `triggerTreeChange()` 防抖通知，監聽工作區任意檔案/目錄異動並在 `files:write` 存檔後自動廣播 `files:treeChange`。
  - `src/preload/index.ts`: 在 `files` 介面新增 `onTreeChange` 監聽契約。
  - `src/renderer/src/store.ts`: 新增 `fileTreeTick` 與 `bumpFileTree()`，全域監聽 `onTreeChange` 自動推進計數器。
  - `FileTreePanel.tsx`: 訂閱 `fileTreeTick`、`gitTick` 與視窗 `focus` 事件，自動靜默重新拉取 root 及所有已展開資料夾子項目，維持使用者樹狀展開狀態不跳動。
- **Session 資料夾分組、摺疊與一鍵摺疊/展開**：
  - `DashboardPanel.tsx`: 依 Session 的真實執行資料夾（`workspacePath` / `workspace`）自動分組歸類；當前 IDE 開啟之工作區自動置頂並標記 `Current Workspace`。
  - 每個資料夾群組可單獨展開/收合，並於頂部提供「展開全部」與「摺疊全部」一鍵操作按鈕。
  - `dashboard.css`: 實作 Apple HIG 風格之資料夾群組外框、標頭、徽章與展開箭頭動畫。
- **幽靈 Session 與假 Token 徹底修正**：
  - `src/main/ipc/dashboard.ts`: 移除 `slice(0, 2)` 隨意抓取電腦中無關專案的 fallback 機制；Claude 會話精準從 `.jsonl` 訊息的 `cwd` 提取真實執行路徑。
  - Antigravity 會話精確匹配 `[URI]` 或 `"Cwd"`，未指定者標記為獨立會話，不再任意冠上當前工作區路徑。
  - 移除一般終端（PowerShell/CMD/Bash）被偽造為帶有 15,400 假 Token 的 Agent Session 卡片；移除寫死之 11,500 / 12,000 假 Token 基準值。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（產出 production bundle，Vite / Electron 編譯通過）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
