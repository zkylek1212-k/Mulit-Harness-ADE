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

- Updated: 2026-09-11 11:56 Asia/Taipei
- Agent: Antigravity
- Task: 實現 Dashboard Agent 支援 5 小時（5hrs）與每週（weekly）使用量百分比與重設倒數
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **使用量模型全面升級為雙視窗模型（5hrs Session + Weekly Limit）**：
   - 使用者明確指明：Agent 的使用量不應是粗糙單一的 100k 偽百分比，而需依照訂閱配額視窗顯示 **5hrs 與 weekly 的使用量百分比**。
   - [src/preload/index.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/preload/index.ts)：
     - 新增 `WindowUsage` 介面（`usedPct`, `resetsAt`, `resetsInSeconds`, `tokens`, `label`）。
     - 在 `AgentUsageSummary` 中加入 `fiveHour: WindowUsage` 與 `weekly: WindowUsage` 雙視窗欄位。
2. **多 Agent 雙視窗使用量即時計算與端點抓取（IPC Core）**：
   - [src/main/ipc/dashboard.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/dashboard.ts)：
     - **Claude Code**：
       - 優先請求 Anthropic OAuth API 端點 `https://api.anthropic.com/api/oauth/usage`（與 `usage_hud.py` 機制一致），提取 `five_hour` 與 `seven_day`（weekly）的 `utilization` 及 `resets_at`。
       - 離線/無 token 時自動切換為本地 5 小時與 7 天真實會話滾動計算，並推算距下次視窗重設剩餘時間。
     - **Antigravity / Gemini**：
       - 自動掃描 `~/.gemini/antigravity-ide/brain/` 最近 5 小時與 7 天的會話日誌與 Token 消耗量，精準計算 5h 與 Weekly 百分比及滾動重設時間。
     - **Codex**：
       - 遞迴檢索 `~/.codex/sessions` 中的 `rate_limits`（`primary` 5h 與 `secondary` weekly 視窗配額），未安裝時平穩呈現 0% 待命狀態。
3. **Apple HIG 雙進度視窗卡片設計（UI/UX）**：
   - [src/renderer/src/panels/dashboard/DashboardPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/DashboardPanel.tsx)：
     - 卡片頂部狀態徽章改為雙膠囊：`5h: XX%` 與 `Wk: YY%`，並依用量自動著色（安全綠/警告橙/高危紅）。
     - 卡片主體新增專屬 `.dash-agent-windows-box`，直觀顯示 **5h Window** 與 **Weekly** 的雙滑動條與重設倒數（如 `in 2h 15m`、`in 3d 4h`）。
     - 保留 Total Tokens 數值與 3 欄 Breakdown 微型網格（`In` / `Tools` / `Out`），資訊層次分明、無文字擠壓。
   - [src/renderer/src/panels/dashboard/dashboard.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/dashboard.css)：
     - 新增 `.dash-window-pill`、`.dash-agent-windows-box`、`.dash-agent-window-row`、`.dash-agent-window-track`、`.dash-agent-window-bar` 等細膩毛玻璃樣式與色調類別。

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
