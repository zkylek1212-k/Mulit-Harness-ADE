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

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 新增 CLI 啟動權限 Bypass Mode（Claude, Codex, Antigravity 略過審批開關）
- Branch: feat/cli-bypass-mode
- Commit: pending user commit

## Done
- **新增 CLI 啟動權限 Bypass Mode 全域開關**：
  - `src/preload/index.ts`: 在 `WorkbenchSettings` 新增 `cliBypassPermissions?: boolean` 欄位（預設 `false`）。
  - `src/main/ipc/settings.ts`: 於 `loadSettings` 與 `settings:set` 完整持久化至 `.workbench/settings.json`，並匯出 `isCliBypassPermissions()`。
- **PTY 子行程參數自動注入**：
  - `src/main/ipc/pty.ts`: 實作 `getAgentBypassArgs` 與 `applyAgentBypassArgs`。當啟用 Bypass 模式時，啟動 CLI 自動帶入指定參數且防止重複注入：
    - Claude Code: `claude --permission-mode bypassPermissions`
    - Codex: `codex --dangerously-bypass-approvals-and-sandbox`
    - Antigravity: `agy --dangerously-skip-permissions`
  - `pty:launchers` 與 `pty:spawn` 皆支援此注入邏輯，相容 Windows `.ps1`、`.cmd`、直接執行檔等多種環境。
- **macOS Sequoia 風格設定面板 UI 與雙語系**：
  - `src/renderer/src/components/SettingsModal.tsx` & `settingsModal.css`: 在 CLI 分頁新增專屬區塊，配備 Apple HIG 盾牌圖標、Toggle 開關、警告通知橫幅與各 Agent 指令代碼預覽卡片。
  - `src/renderer/src/components/Icons.tsx`: 新增 `IconShield` 元件。
  - `src/renderer/src/i18n/index.ts`: 繁體中文與英文完整語系支援。
- **終端面板即時狀態連動**：
  - `src/renderer/src/panels/terminal/TerminalPanel.tsx` & `terminal.css`: 在 Launchpad 啟動卡片與 `+` 下拉選單中，若 Bypass 模式啟用即時展示橘色 `Bypass` 徽章。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（所有 chunk 編譯打包成功）。
- `scratch/test_bypass.ts` → pass（getAgentBypassArgs, applyAgentBypassArgs 與 settings 持久化雙向測試完全通過）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
