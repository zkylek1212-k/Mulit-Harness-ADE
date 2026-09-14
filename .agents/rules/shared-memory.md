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
- Task: 專案進版至 v0.1.1 並補齊完整 Release Description 與 Changelog
- Branch: feat/workbench-enhancements
- Commit: chore(release): bump version to v0.1.1 and add changelog

## Done
- **進版至 v0.1.1 與版本發布描述**：
  - `package.json` & `package-lock.json`：版本號由 `0.1.0` 進版至 `0.1.1`，更新專案描述以精確反映 Codex/Claude 遙測與雙語系支援。
  - `CHANGELOG.md`：建立標準 Keep a Changelog 格式變更日誌，詳細記錄 v0.1.1 與 v0.1.0 之功能亮點、新增項目與問題修復（PR #2 Codex 遙測整合、資料夾分組與一鍵工作區切換、中英雙語系 i18n、遙測精準度校準、終端捲動修正）。
  - `README.md`：更新中英文功能清單（文件預覽、儀表板與遙測、雙語系）並加入版本紀錄與變更日誌連結。
  - `.project-memory/STATE.md`：里程碑正式標記為 `v0.1.1` 完成。
- **整合外部 PR #2 (Codex 擴充掃描與真實會話 Token 統計)**：
  - `src/main/ext/paths.ts` & `src/main/ext/inventory.ts`: 引入 Codex 的 `skillsDir` 與 `pluginsDir` 路徑設定，新增 `scanCodex()` 解析 `~/.codex/config.toml` (MCP 與 Plugins) 以及 `~/.codex/skills/` 下的 SKILL.md。
  - `src/main/ipc/dashboard.ts`: 引入 `scanCodexSessions()`，遞迴讀取 `~/.codex/sessions/**/rollout-*.jsonl` 與 `~/.codex/session_index.jsonl`，計算真實累計 Token 數與會話標題。
  - **架構融合與衝突解決**：將 Codex 掃描結果無縫併入工作台的智慧 PTY 行程匹配（優先級 1~3）、資料夾分組系統與中英文雙語系標準化 Token 分類。
- **Session 卡片資料夾按鈕連動切換工作區與 Files 側邊欄**：
  - `src/main/ipc/files.ts`: 新增 `files:setWorkspaceRoot` IPC，即時廣播 `files:treeChange`。
  - `src/renderer/src/store.ts`: 實作 `switchWorkspace(path: string)`，自動切換至 Files 面板並遞增計數觸發重整。
  - `src/renderer/src/App.tsx`: 側邊欄收合時點擊自動展開。
  - `src/renderer/src/panels/filetree/FileTreePanel.tsx`: 監聽工作區切換並自動重新整理。
  - `src/renderer/src/panels/dashboard/DashboardPanel.tsx`: SessionCard 與資料夾群組標頭新增切換按鈕，嚴格阻斷冒泡並引入 Apple HIG 動畫。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
