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

- Updated: 2026-09-11 10:56 Asia/Taipei
- Agent: Antigravity
- Task: 修正 Dashboard 活躍會話誤判為 Completed 與去除冗餘假卡片，並在 Session 卡片顯示所屬 Workspace
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **修復活躍 Session 顯示 Completed 的根本問題與消除孤立佔位卡片**：
   - 根本原因分析：
     - 在 [src/main/ipc/dashboard.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/dashboard.ts) 的 `scanAntigravitySessions` 與 `scanClaudeSessions` 中，歷史日誌掃描硬寫死為 `status: 'completed'`。
     - 同時，PTY 在啟動終端進程時，於最外層無差別生成了一張虛構的佔位卡片 `Terminal: antigravity (PID: ...)`（固定 15.4k tokens），導致真實執行中的會話（包含標題與 139k tokens）被排在下方且標為 `Completed`，產生雙重錯亂。
   - 解決方案：
     - 實作智慧 PTY 行程認領（Claiming）：當有 `antigravity` / `agy` 或 `claude` 的 PTY 進程正在執行時，自動與最新更新的未歸檔 session 關聯，將其 `status` 正確設定為 `'active'`，`lastActiveTime` 即時更新。
     - 消除冗餘假卡片：已被認領的 PTY 行程不再額外生成 `Terminal: ... (PID: ...)` 佔位卡片，只有未與任何會話關聯的純終端（如一般 Bash/PowerShell）才獨立呈現。
     - 合併清單排序規則強化：`active` 會話永遠排在最頂端，其次按 `lastActiveTime` 倒序排列。

2. **在 Session 卡片與刪除對話框完整支援顯示所屬 Workspace**：
   - [src/preload/index.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/preload/index.ts)：
     - 在 `AgentSessionInfo` 介面增加 `workspace?: string` 與 `workspacePath?: string` 欄位。
   - [src/main/ipc/dashboard.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/dashboard.ts)：
     - 實作 `extractAntigravityWorkspace`：精準從 `transcript.jsonl` 前置日誌中解析 `[URI] -> [CorpusName]`、`Cwd`、`Active Document` 等，匹配或還原專案名稱與完整路徑。
     - 實作 `extractClaudeWorkspace`：從專案資料夾名稱中提取專案工作區名稱。
     - Standalone PTY Sessions 亦帶入當前 `workspace.root`。
   - [src/renderer/src/panels/dashboard/DashboardPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/DashboardPanel.tsx)：
     - 在 `SessionCard` 的 `dash-session-meta-line` 渲染包含資料夾圖示的 Workspace 膠囊徽章，並提供 hover 顯示完整路徑的 tooltip。
     - 在 `AppleAlertDialog` 刪除確認對話框中亦同步顯示工作區資訊。
   - [src/renderer/src/panels/dashboard/dashboard.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/dashboard/dashboard.css)：
     - 加入 `.dash-session-workspace` 樣式，符合 Apple HIG 莫蘭迪微圓角與高對比階層質感。

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
