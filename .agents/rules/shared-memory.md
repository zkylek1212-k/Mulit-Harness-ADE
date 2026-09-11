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

- Updated: 2026-09-11 11:03 Asia/Taipei
- Agent: Antigravity
- Task: 實作 Agent 終端修改檔案時自動在 Editor 開啟分頁、即時熱重載與 Agent 標記徽章（Like Antigravity IDE）
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **實作後端檔案即時監控與外部變更推播（Workspace File Watcher）**：
   - [src/main/ipc/files.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/files.ts)：
     - 使用 Node 原生 `fs.watch(workspace.root, { recursive: true })` 建立輕量高效的目錄監控。
     - 智慧排除暫存與依賴目錄：`.git`、`node_modules`、`out`、`dist`、`.workbench`、`.project-memory`、`.gemini`、`.system_generated`、`.vscode`、`*.lock`、`*.tmp` 等。
     - 白名單支援所有代碼與文件副檔名（`.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css`, `.html`, `.md`, `.py`, `.rs`, `.go`, `.yaml`, `.docx`, `.xlsx`, `.pptx`, `.pdf` 等）。
     - 防抖機制（Debounce 300ms）：避免 Agent 連續寫入多個 chunk 造成多餘觸發。
     - IDE 內部寫入抑制名單（`suppressedByIdeWrite`）：當使用者在 Editor 內手動 Ctrl+S 存檔時，自動抑制 1000ms，防範將使用者自己的存檔誤判為外部變更。
     - 工作區切換響應：`pickWorkspace` 成功切換時自動重新掛載 watcher。
     - 透過 `files:externalChange` IPC 事件向前端推播變更路徑與狀態。

2. **IPC 契約與設定管理擴充**：
   - [src/preload/index.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/preload/index.ts)：
     - 在 `api.files` 新增 `onExternalChange(cb)` 事件監聽函式。
     - 在 `WorkbenchSettings` 新增 `autoOpenAgentModifiedFiles?: boolean`（預設為 `true`）。
   - [src/main/ipc/settings.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/settings.ts)：
     - `loadSettings()` 支援載入與持久化 `autoOpenAgentModifiedFiles`。

3. **前端狀態管理與自動開檔聯動**：
   - [src/renderer/src/store.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/store.ts)：
     - 在 `WorkbenchState` 新增 `agentModifiedFiles: Set<string>` 與 `fileReloadTick: Record<string, number>`。
     - 全域註冊 `onExternalChange`：
       - 自動調用 `bumpGit()`，同步刷新左側 Git Panel。
       - 標記該檔案至 `agentModifiedFiles`。
       - 檢查設定 `autoOpenAgentModifiedFiles`（預設為開）：
         - 若該檔案尚未在 `openTabs`，自動加入分頁並切換為 Active Tab！
         - 遞增 `fileReloadTick[path]`，促使 Editor 即時自動熱重載磁碟上的最新內容。
     - 提供 `clearAgentModified(path)` 於使用者選取/編輯該檔案時清除高亮。

4. **Editor UI 體驗與 Apple HIG 微型徽章**：
   - [src/renderer/src/panels/editor/EditorPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/editor/EditorPanel.tsx)：
     - 響應 `fileReloadTick`：若檔案正在編輯器中且使用者無未存檔變更（`!isDirty`），自動重載最新文字，並提示「Updated by Agent」。
     - 在分頁 Tab 顯示專屬 `.editor-tab-agent-badge` 徽章，點選分頁時自動清除。
   - [src/renderer/src/panels/editor/EditorPanel.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/editor/EditorPanel.css)：
     - 設計 Apple 莫蘭迪紫色系微型徽章與柔和發光動畫（`agentPulse`），頂部帶有高亮細線（`.agent-modified`）。
   - [src/renderer/src/components/SettingsModal.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/components/SettingsModal.tsx)：
     - 在「Appearance」分頁新增「Editor & Agent Integration」開關，使用者可自由選擇是否自動開啟 Agent 變更的檔案。

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
