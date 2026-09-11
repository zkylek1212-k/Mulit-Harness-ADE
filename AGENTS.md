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

- Updated: 2026-09-11 13:26 Asia/Taipei
- Agent: Antigravity
- Task: 取消 Dashboard Agent 卡片 Usage 速率限制百分比與進度條，重構為純 Token 統計與分佈
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **取消 Usage 速率限制百分比資訊，改為純 Token 統計與分佈**：
   - 根據使用者決策「取消usage 用量資訊只顯示token」，移除 Agent 卡片頂部 `5h: XX%` / `Wk: YY%` 膠囊標籤以及雙視窗滾動使用進度條（`dash-agent-windows-box`）。
   - 移除後端 `src/main/ipc/dashboard.ts` 中對 5h/Weekly 視窗的推算與假設配額除法，避免產生不實的 82%、100% 紅色警告。
2. **Apple HIG 風格 Token 統計與分佈長條圖**：
   - [src/renderer/src/panels/dashboard/DashboardPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/DashboardPanel.tsx)：
     - 大字醒目呈現各 Agent 累積真實 Total Tokens。
     - 增加細緻的三段式分佈條（Segmented Meter）：分別以琥珀色（Prompt / In）、薄荷綠（Tools）、紫色（Completion / Out）呈現實際使用比例。
     - 三欄微型數值網格：清楚標示 `● In`、`● Tools`、`● Out` 的真實 Token 數字與佔比。
   - [src/renderer/src/panels/dashboard/dashboard.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/dashboard.css)：
     - 清理廢棄的 `.dash-window-pill` 與 `.dash-agent-windows-box` 樣式。
     - 精確設定 `.dash-agent-tokens-meter` 與 `.dash-agent-tokens-seg`，支援平滑寬度動畫與圓角收邊。
   - [src/main/ipc/dashboard.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/dashboard.ts)：
     - 移除 `fetchClaudeUsageWindows`、`fetchAntigravityUsageWindows`、`fetchCodexUsageWindows` 及遞迴 rate_limits 提取函式。
     - 統計邏輯直接基於實際掃描到的本地會話紀錄（Antigravity、Claude 與活躍終端行程），回傳精準真實的 tokens 分佈。

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
