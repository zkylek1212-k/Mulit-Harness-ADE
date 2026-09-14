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
- Task: 自動化 Release 發布腳本（npm run release）與 GitHub Releases 發布 v0.1.3
- Branch: fix/settings-persistence-and-doc-tools
- Commit: feat(release): add automated release publisher script and npm run release workflow

## Done
- **一鍵式自動化發布腳本（`scripts/release.ps1` & `npm run release`）**：
  - 驗證本機已安裝且已登入的 `gh`（GitHub CLI）。
  - 自動讀取 `package.json` 中的目標版本號（如 `v0.1.3`）。
  - 執行完整 TS 檢查（`typecheck`）與 electron-builder 打包（`npm run dist`），支援 `-SkipBuild` 參數快速略過已建置產物。
  - 自動壓縮綠色免安裝目錄 `release/win-unpacked` 成 `release/Agent-Workbench-<version>-portable.zip`。
  - 自動透過 `gh release create` / `gh release upload --clobber` 將安裝檔（`.exe`）、免安裝包（`.zip`）、區塊校驗檔（`.blockmap`）與自動更新清單（`latest.yml`）直接發布至 GitHub Releases。
  - 支援選填 `-GoogleDrivePath` 參數，若有需要可額外同步備份一份至 Google 雲端硬碟本地目錄。
- **README 與 package.json 更新**：
  - `package.json`: 註冊 `"release": "powershell -ExecutionPolicy Bypass -File ./scripts/release.ps1"`。
  - `README.md`: 在繁體中文與英文建置說明章節中加入「自動化發布至 GitHub Releases（Automated Release）」指引與指令。
- **Release v0.1.3 實測驗證成功**：
  - 成功建立並上傳至 GitHub Release `v0.1.3`：
    - `Agent Workbench-0.1.3-setup.exe` (123.49 MB)
    - `Agent-Workbench-0.1.3-portable.zip` (168.77 MB)
    - `latest.yml`
    - `Agent Workbench-0.1.3-setup.exe.blockmap`
  - 使用者快速安裝指令：`irm https://raw.githubusercontent.com/zkylek1212-k/Mulit-Harness-ADE/master/install.ps1 | iex`

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `powershell -ExecutionPolicy Bypass -File ./scripts/release.ps1 -SkipBuild` → pass（所有 4 項 Release Assets 成功上傳至 GitHub Releases）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
