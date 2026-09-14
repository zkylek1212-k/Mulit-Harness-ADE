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
- Task: 合併 PR #4、發布自動化、儀表板防跑版、Web 測試離線引導、版本推進至 v0.1.4
- Branch: fix/settings-persistence-and-doc-tools
- Commit: feat(v0.1.4): release automation, auto-updater, responsive dashboard, and bump version to v0.1.4

## Done
- **合併 PR #4 (by Jerrywu-TT)**：
  - 修正 Codex 會話恢復未傳入 `resume` 參數。
  - 對接 Antigravity CLI 原生資料庫會話 ID，支援真正 resume。
  - 加入 `estimateTokensFromBlob` 啟發式計算二進位 DB 的 Token 數量。
  - PTY 增加 `isDestroyed()` 避免已關閉 WebContents 崩潰。
- **一鍵式自動化發布腳本（`scripts/release.ps1` & `npm run release`）**：
  - 驗證本機已安裝且已登入的 `gh`（GitHub CLI）。
  - 自動讀取 `package.json` 中的目標版本號（如 `v0.1.4`）。
  - 執行完整 TS 檢查（`typecheck`）與 electron-builder 打包（`npm run dist`）。
  - 自動壓縮綠色免安裝目錄 `release/win-unpacked` 成 `release/Agent-Workbench-<version>-portable.zip`。
  - 自動透過 `gh release create` / `gh release upload --clobber` 將安裝檔（`.exe`）、免安裝包（`.zip`）、區塊校驗檔（`.blockmap`）與自動更新清單（`latest.yml`）直接發布至 GitHub Releases。
- **儀表板窄版防跑版與側邊欄防重疊**：
  - 雙層資料夾標題結構 + CSS Container Query（極窄時按鈕動態轉為圖示）。
- **內建 Web 測試瀏覽器離線智慧引導**：
  - 伺服器離線時展示友善引導卡片與常用 Port（:5173, :3000, :8080, :8000）按鈕。
- **版本推進至 v0.1.4**：
  - 更新 `package.json`、`package-lock.json`、`CHANGELOG.md`。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `powershell -ExecutionPolicy Bypass -File ./scripts/release.ps1` → 預備執行 v0.1.4 打包與 GitHub Releases 發布。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
