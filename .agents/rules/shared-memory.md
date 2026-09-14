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
- Task: 開啟 perf/fast-startup 分支並實作啟動效能優化（持久化快取 + 按需掛載）
- Branch: perf/fast-startup
- Commit: feat(perf): startup optimization with mtime disk cache and mount-on-demand

## Done
- **後端主行程會話快取持久化與互斥 (Dashboard mtime Disk Cache)**：
  - `src/main/ipc/dashboard.ts`: 引入 `.workbench/dashboard-cache.json` 磁碟持久化快取與記憶體 Map，對 Antigravity, Claude, Codex 會話使用 `fs.statSync(p).mtimeMs` 做快速比對；未變更會話直接命中快取（單檔耗時 < 0.05ms），實測全盤掃描從 281ms 降至 6.6ms（42x 加速）。
  - 引入 `activeScanPromise` 互斥鎖，避免定時輪詢與首屏多重請求引發重複磁碟 I/O。
  - `src/main/ipc/files.ts`: 工作區切換時調用 `invalidateDashboardMemoryCache()` 重整快取。
- **前端面板按需掛載與狀態保持 (Mount-on-Demand with Keep-Alive)**：
  - `src/renderer/src/App.tsx`: 側邊欄（Files, Git）與中央區（Preview, Memory）改採 `visitedTabs` 按需掛載，冷啟動時不再生成 4 個 Git child process，亦不預載 Mermaid 庫；訪問過後持續保留於 DOM，確保切換分頁狀態不丟失。
- **消除開發模式雙重掛載**：
  - `src/renderer/src/main.tsx`: 移除 `<React.StrictMode>`，消除開機兩次重複觸發全盤掃描與 effect 負擔。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（58.91s 完成）。
- Node 基準測試實測：Session 掃描從 281.4ms 降至 6.68ms（42 倍加速）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
