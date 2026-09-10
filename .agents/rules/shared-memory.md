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

- Updated: 2026-09-10 23:03 Asia/Taipei
- Agent: Antigravity
- Task: 修復 Settings Path Test 在 Windows 含空格使用者路徑下被截斷的問題
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **修復 Settings 中的 CLI Path Test（解決路徑含空格被 cmd 截斷的問題）**：
   - **問題根源**：使用者的 Windows 家目錄包含空格（`C:\Users\Kyle Zhang\...`）。先前 `settings:testCliPath` 使用 `execFile(cmd, args, { shell: true })`，在 Windows 下 Node.js `shell: true` 不會對包含空格的 `cmd` 加上雙引號，導致 `cmd.exe` 將其拆解為 `C:\Users\Kyle`，造成 `'C:\Users\Kyle' is not recognized` 測試失敗；然而 Terminal 使用原生 `node-pty`（`CreateProcessW`）直接調用 Win32 API 自動處理引號，因此終端能正常開啟。
   - `src/main/ipc/settings.ts`：將 `testCliPath` 重構為以 `execAsync` 執行標準雙引號包裹指令（如 `"${target}" --version`），徹底解決 Windows 含空格路徑截斷問題。
   - `src/renderer/src/components/SettingsModal.tsx`：更新 `handleTestPath`，當使用者未輸入自訂路徑（留空動態模式）時，優先取用 `detectedPaths` 進行實體檔案版本測試，避免直接傳入未解析的裸名稱。

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
