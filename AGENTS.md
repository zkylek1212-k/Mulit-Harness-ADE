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
- Task: 升級版本至 v0.1.5，優化 install.ps1 即時進度條與發布安全標註，推送到 GitHub
- Branch: master
- Commit: chore(release): bump version to v0.1.5

## Done
- **解決安裝指令無進度條問題（下載階段 + 靜默安裝階段）**：
  - `install.ps1`:
    - **下載階段**：改寫為 `Download-FileWithProgress`。優先使用 Windows 10/11 內建的 `curl.exe -fL --progress-bar`，提供即時動態 `#=#=# ... 100%` 進度條與百分比；若 `curl` 不可用，自動降級為 `.NET HttpWebRequest` 串流下載，搭配 PowerShell `Write-Progress` 頂部進度條與行內百分比/容量回顯，徹底告別過去 `WebClient.DownloadFile` 靜默無回應卡頓假象。
    - **靜默安裝階段**：在 `-Silent` 執行 NSIS 安裝期間，新增動態轉圈 Spinner (`| / - \`) 與已耗時秒數顯示（`Installing Agent Workbench... / (4s elapsed)`），並在結束時顯示總耗時與安裝路徑，讓使用者清楚掌握進度。
    - **環境變數簡便模式**：支援 `$env:INSTALL_SILENT=1` 與 `$env:INSTALL_DOWNLOAD_ONLY=1`，方便單行 `irm ... | iex` 搭配環境變數執行。
- **解決 `iexirm` 報錯原因**：
  - 診斷出因使用者在 PowerShell 貼上指令時重複貼上兩次且無換行，導致 `... | iex` 與 `irm ...` 黏在一起變成 `iexirm`。在 `README.md` 補齊簡潔指令與提示。
- **明確標註 npm run release 僅限專案維護者**：
  - 在 `README.md` 中英文版與 `scripts/release.ps1` 標頭標註 `(Maintainers only)` 與安全說明，告知外部人員此指令需本機 `gh` 倉庫寫入權限，無法隨意發布或更動專案。
- **修復 PowerShell 5.1 Unicode 字元解析報錯**：
  - `scripts/release.ps1` 內的原生 Unicode 符號（`✓`、`•`、`🎉`）在 Windows PowerShell 5.1 預設 ANSI 編碼環境下會被誤讀為雙引號 `“`，導致字串閉合中斷並引發 `Unexpected token 'MB'` 語法解析錯誤。已全數替換為標準 ASCII 符號（`[OK]`、`*`），徹底解決解析錯誤。

## Tests
- 實測 `powershell -ExecutionPolicy Bypass -Command "& .\install.ps1 -DownloadOnly"`：成功透過 `curl.exe` 呈現平滑即時百分比進度條。
- 實測靜默安裝 spinner 邏輯：字符旋轉與秒數計算運作正常。
- `npm run typecheck` → pass（0 errors）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
