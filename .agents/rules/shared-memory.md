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

- Updated: 2026-09-11 11:30 Asia/Taipei
- Agent: Antigravity
- Task: Dashboard Agent Usage 卡片用量指標、Token 分佈條與即時過濾
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **後端 Agent Token 聚合計算（IPC Dashboard）**：
   - [src/main/ipc/dashboard.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/dashboard.ts)：
     - 實作 `computeAgentUsage(agentId, fallbackTokens)` 聚合邏輯：
       - 精確統計歸屬特定 Agent 的所有歷史與即時會話。
       - 分流彙總 `promptTokens`、`toolReadTokens`、`completionTokens`，若無分項則提供平滑分佈推估。
       - 計算各 Agent 的活躍進程數（`activeSessions`）與總會話數（`totalSessions`）。
   - [src/preload/index.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/preload/index.ts)：
     - `AgentUsageSummary` 介面包含 `promptTokens`、`toolTokens`、`completionTokens`、`totalTokens`、`activeSessions`、`totalSessions` 等完整欄位。

2. **Dashboard Agent Trio 卡片 Usage 視覺升級（Apple HIG & 莫蘭迪）**：
   - [src/renderer/src/panels/dashboard/DashboardPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/DashboardPanel.tsx)：
     - **總量佔比膠囊（`.dash-agent-share-pill`）**：計算該 Agent 佔當前 Workspace 總 Token 的百分比（例 `85%`），提供滑鼠 Hover Tooltip。
     - **平均會話消耗（`.dash-agent-stat-sub`）**：計算平均每場 Session 消耗 Token（例 `~14.4k / session`）。
     - **Apple Health 風格分割計量條（`.dash-agent-meter-track`）**：
       - 分割呈現 Input (Prompt, Amber)、Tools (Mint)、Output (Completion, Purple) 的佔比進度。
       - Tooltip 清楚列出三個維度的具體 Token 數與百分比。
     - **三段式 Token 標籤晶片（`.dash-agent-breakdown-row`）**：
       - 包含微型彩色指標點、類別標籤與等寬字體 Token 數值（`In 11.2k`、`Tools 2.8k`、`Out 1.4k`）。
     - **互動式 Agent 過濾篩選**：
       - 點擊任一 Agent 卡片可直接過濾下方會話清單，只顯示該 Agent 的 Sessions。
       - 在 Session 標頭提供 `.dash-active-filter-badge`，點擊隨時一鍵清除過濾。

3. **樣式優化與莫蘭迪色彩適配**：
   - [src/renderer/src/panels/dashboard/dashboard.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/dashboard.css)：
     - 擴大卡片最小寬度 `minmax(130px, 1fr)` 確保資訊舒適舒展。
     - 增加 `.dash-agent-card.selected` 各 Agent 專屬莫蘭迪柔光發光邊框與輕底色。
     - 補齊 `.dash-agent-meter-track`、`.dash-agent-breakdown-row`、`.dash-agent-chip`、`.dot-prompt`、`.dot-tools`、`.dot-comp` 與 `.dash-active-filter-badge`。

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
