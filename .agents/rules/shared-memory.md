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

- Updated: 2026-09-11 11:20 Asia/Taipei
- Agent: Antigravity
- Task: Dashboard Session 支援拖曳開啟終端與跨 Agent 拖曳 Handoff 任務
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **Dashboard SessionCard 拖曳互動與手柄視覺優化**：
   - [src/renderer/src/panels/dashboard/DashboardPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/DashboardPanel.tsx)：
     - 在 `SessionCard` 啟用 `draggable={true}`，支援 `onDragStart` 與 `onDragEnd`。
     - 攜帶結構化資料酬載：`type: 'agent-session'`、`id`、`agent`、`title`、`status`、`workspace`、`workspacePath`、`model`、`totalTokens`。
     - 封裝為標準 `application/x-agent-session` MIME 類型，並同步注入記憶體狀態以確保拖曳懸浮時即時辨識。
     - 在卡片左側新增 Apple 風格 `IconGripVertical` 拖曳手柄（`.dash-drag-grip`），並提供清晰 Tooltip 說明支援拖曳開啟或交接任務。
   - [src/renderer/src/panels/dashboard/dashboard.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/dashboard.css)：
     - 增加 `cursor: grab; cursor: grabbing;` 游標反饋。
     - 增加 `.dash-session-card.dragging` 半透明（0.38）、虛線 Accent 邊框與柔和深景投影動畫。

2. **跨面板拖曳狀態管理（Store Layer）**：
   - [src/renderer/src/store.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/store.ts)：
     - 定義並匯出 `DraggedSessionPayload` 介面。
     - 提供 `setDraggedSession(session)` 與 `getDraggedSession()`，讓 TerminalPanel 能在 `dragover` / `dragenter` 階段即時讀取來源 Agent 與任務資訊（突破瀏覽器安全策略在 dragover 無法讀取 dataTransfer.getData 的限制）。

3. **Terminal 接收端 Apple Liquid Glass 懸浮感應層**：
   - [src/renderer/src/panels/terminal/TerminalPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/TerminalPanel.tsx)：
     - 在 `.term-stage` 建立防閃爍計數器（`dragCounterRef`）與 `handleStageDragEnter/Leave/Over/Drop`。
     - 智慧判斷操作模式：
       - 若當前終端（或目標 Tab）為**不同 Agent** → 模式切換為 `handoff`。
       - 若為**相同 Agent** 或終端空白 → 模式切換為 `open`。
     - 渲染極致毛玻璃懸浮膠囊（`.term-drag-pill`），動態呈現目標 Agent、來源 Agent、任務標題與操作提示（`HANDOFF` vs `OPEN`）。
   - [src/renderer/src/panels/terminal/terminal.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/terminal.css)：
     - 設計符合 Apple HIG 與莫蘭迪調色之 `.term-drag-overlay` 與 `.term-drag-pill`，帶有毛玻璃模糊（`backdrop-filter: blur(12px)`）、細緻微光邊框與彈出縮放動畫（`macosScaleUp`）。

4. **分頁 Tab 拖曳命中與 Cross-Agent 任務交接**：
   - [src/renderer/src/panels/terminal/TerminalPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/TerminalPanel.tsx)：
     - 在 `.term-unified-tab` 實作個別分頁拖曳監聽：
       - 拖曳至不同 Agent 的分頁時：觸發 `.drag-handoff-target`，並動態浮現 `⇄ Handoff` 莫蘭迪呼吸發光徽章。
       - 拖曳至相同 Agent 的分頁時：觸發 `.drag-open-target`。
     - 放開拖曳（Drop）時自動執行 Cross-Agent Handoff：
       - 抓取來源 Session 之 ID、標題、工作區名稱、路徑、模型等完整元數據。
       - 若來源 Session 正於任一終端執行中，自動調用 `readTerm` 截取最近 35 行終端輸出。
       - 結構化組裝交接提示詞（`[Cross-Agent Handoff: Task Transfer from @agent]`），透過 `sendToSession` 注入目標終端執行，並自動切換 Focus 與彈出系統通知。
   - 分頁列空白處 Drop：自動於終端新開分頁並恢復（`--resume` / `--conversation`）該 Session。

5. **空白 Launchpad 卡片拖曳支援**：
   - 當終端尚無任何 Session 時，拖曳卡片至特定 CLI 卡片（如將 `@claude` 拖至 `@antigravity`）：
     - 自動調用 `handleLaunchAndHandoff` 啟動目標 Agent，並直接將任務交接提示詞注入新建立的終端中！

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (Electron + Vite 完整打包通過)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。

<!-- END AUTO-MEMORY -->
