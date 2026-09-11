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

- Updated: 2026-09-11 11:36 Asia/Taipei
- Agent: Antigravity
- Task: 統一 Dashboard Agent Usage 為「已使用百分比（Used Percentage）」呈現
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **後端統一 Usage 計算邏輯（Used Percentage / 100k 配額基數）**：
   - [src/main/ipc/dashboard.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/dashboard.ts)：
     - 解決先前 Antigravity 誤設為剩餘量 14.2k（14% remaining）而 Claude 為 86.5k（86% used）之不一致問題。
     - 引入 `STANDARD_QUOTA = 100000`（100k tokens 標準容量配額）。
     - 統一輸出 `usedPct = Math.min(100, Math.round((total / quota) * 100))` 與 `quotaLimit` 欄位。
     - Claude 與 Antigravity 皆統一依據已使用量呈現（例如 86.5k 即為 86% used）。
   - [src/preload/index.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/preload/index.ts)：
     - `AgentUsageSummary` 新增 `usedPct?: number` 與 `quotaLimit?: number`。

2. **前端 Usage 膠囊與計量條呈現全面統一**：
   - [src/renderer/src/panels/dashboard/DashboardPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/DashboardPanel.tsx)：
     - 替換原先的工作區佔比，改為明確的已使用百分比膠囊：`.dash-agent-usage-pill`（明確標註例如 `86% used`，Tooltip 提示 `86% used (14% remaining of 100k quota)`）。
     - Apple Health 分割進度條（`.dash-agent-meter-track`）之寬度依照 `usedPct` 縮放：Prompt、Tools、Output 填滿前 86% 的進度，剩餘 14% 自然保留為未填滿之背景軌道，具備極佳的容量直觀辨識度。
     - 統計副標（`.dash-agent-stat-sub`）明確標註 `86% used · ~14.4k / session`。
   - [src/renderer/src/panels/dashboard/dashboard.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/dashboard.css)：
     - 增加 `.dash-agent-usage-pill` 的精緻莫蘭迪邊框與柔和背景樣式。

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
