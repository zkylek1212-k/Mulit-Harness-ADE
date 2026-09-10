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

- Updated: 2026-09-10 14:05 Asia/Taipei
- Agent: Antigravity
- Task: 8 項重構（左側欄折疊至 0、Cross-Session 通訊、嵌入 Test Browser、工作目錄同步提示、Customized 開關、無框頂部融合、Launchboard 風格 Terminal UX）
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **左側欄位最小化與一鍵收折（`layout.ts`, `App.tsx`, `styles.css`）**：
   - `LIMITS.leftMin` 降至 `0`，支援拖曳小於 75px 自動吸附至 0（`leftCollapsed: true`）。
   - 左側欄頂部提供 `⇤` 一鍵收折按鈕；收折後中央導航列左側自動浮現 `» Sidebar` 快捷展開按鈕，流暢無卡頓。
2. **三 Agent CLI 跨 Session 溝通與交接（`pty.ts`, `TerminalPanel.tsx`, `preload/index.ts`）**：
   - 後端新增 `pty:pipe` IPC 頻道。
   - 終端頂部工具列提供 `↗ Hand off to…` 下拉選單，可將目前活躍 Agent 的最新執行輸出與狀態自動格式化為 Handoff Prompt，直接注入目標 Agent 終端並無縫切換焦點。
3. **嵌入式 Test Browser 測試瀏覽器（`TestBrowserPanel.tsx`, `browser.css`, `main/index.ts`, `App.tsx`）**：
   - Electron 主行程啟用 `webviewTag: true`。
   - 中央區新增 `[ Editor | Preview | ⚡ Test Browser | Memory | Customized ]` 分頁。
   - 提供智慧網址列、常用 Localhost Port 快速標籤（`:5173`, `:3000`, `:8080`, `:8000`）、歷史上一頁/下一頁/重新載入、外部瀏覽器開啟。
   - 支援 Desktop (100%)、Tablet (768px)、Mobile (390px) 與旋轉（Rotate）響應式裝置預覽。
4. **CLI 工作目錄連動與視覺化（`TerminalPanel.tsx`）**：
   - 終端控制列與 Launchpad 即時顯示目前同步的 `📁 Workspace: <folder>` 路徑。
   - 提供 `Change` 按鈕呼叫原生選取器，變更後新建的 Agent 終端皆在此工作區啟動。
5. **Customized 技能 / MCP / 外掛開關（`CustomizedPanel.tsx`, `customized.css`, `ext.ts`, `preload/index.ts`）**：
   - 後端新增 `ext:toggleItem` IPC，將停用清單持久化於 `.workbench/customized-state.json`；若為 Claude plugin 則自動連動同步至 `~/.claude/settings.json` 的 `enabledPlugins`。
   - 前端每一項提供 Apple-style `[ ON | OFF ]` 膠囊滑動開關，停用項目半透明置灰。
6. **最上方無框融合設計（`App.tsx`, `styles.css`）**：
   - 完全移除原本獨立的 44px `.titlebar` 視窗橫條。
   - 將 `Agent Workbench ●` 品牌名與收折按鈕融合至左欄頂部；將 Dock 停靠切換、`⚙ Settings` 與 `☀︎/☾` 主題切換直接融合至中央分頁列右側。
   - 畫面垂直有效空間省下 44px。
7. & 8. **參考 Launchboard 重構 Agent Terminals UX（`TerminalPanel.tsx`, `terminal.css`）**：
   - 徹底廢除雙層工具列，將原本散亂的浮動膠囊 Dock 與 Safari Pill Tabs 合併為單一優雅的 Apple / Launchboard 控制列。
   - 整合即時分頁、一鍵快速啟動膠囊（`＋ Claude`, `Antigravity`, `Codex`, `Shell`）、工作區路徑、Hand-off 下拉、Clear 清除與分屏切換。
   - Launchpad 空狀態採用 Launchboard 經典黑灰層次與等寬字體 process card，點選任意區域即可即時啟動程序。

## Tests
- `npm run typecheck` → pass (代碼與型別 100% 通過)
- `npm run build` → pass (Vite 生產環境打包 45.44s 完成)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。

<!-- END AUTO-MEMORY -->
