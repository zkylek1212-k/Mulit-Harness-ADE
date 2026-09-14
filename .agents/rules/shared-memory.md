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
- Task: 儀表板排版重構、Browser 本地 Web 測試分頁說明與未啟動引導畫面
- Branch: fix/settings-persistence-and-doc-tools
- Commit: feat(browser): add dev server offline guidance and explain localhost port presets

## Done
- **儀表板側邊欄縮小排版全面重構（防重疊與跑版）**：
  - `src/renderer/src/panels/dashboard/DashboardPanel.tsx`:
    - 資料夾標題重構為雙層結構（上層名稱+Token、下層狀態+切換按鈕），解決文字疊加。
    - Session 卡片按鈕加上 `.dash-action-icon-btn` 與 `.dash-action-label`。
  - `src/renderer/src/panels/dashboard/dashboard.css`:
    - 啟用 CSS Container Query（`@container dash-panel`）。
    - 窄版自動將 `Archive`/`Delete` 轉為圖示按鈕，維持單行排列不折行；消除 `TOKENS` 小標籤放大標題寬度。
    - 切換資料夾按鈕強制 `white-space: nowrap` 避免垂直折行。
- **內建 Web 測試瀏覽器（Browser Panel）引導強化**：
  - `src/renderer/src/panels/browser/TestBrowserPanel.tsx` & `browser.css`:
    - 監聽 `<webview>` 的 `did-fail-load` 事件。
    - 當本機尚未啟動 Web 服務時，取代原本的死白畫面，改為顯示「本地開發伺服器未啟動」專屬引導卡片。
    - 提供清晰繁中/英文說明、重新載入、外部瀏覽器開啟，以及快速切換常見開發 Port（`:5173`, `:3000`, `:8080`, `:8000`）的晶片按鈕。
  - `src/renderer/src/i18n/index.ts`: 新增 `browser` 繁中與英文雙語翻譯。
- **Auto-Updater 404 錯誤淨化與容錯**：
  - `src/main/ipc/updater.ts`: 清空備援查詢成功後的 404 錯誤，乾淨顯示打勾。
- **PowerShell 一鍵安裝腳本**：
  - 根目錄 `install.ps1` 與 `README.md` 更新。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（Vite 生產 bundle 完整構建成功）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
