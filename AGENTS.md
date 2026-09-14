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
- Task: 左側儀表板縮小排版跑版修復、自適應優化與更新器 404 錯誤淨化
- Branch: fix/settings-persistence-and-doc-tools
- Commit: fix(dashboard): implement responsive two-row folder layout and container query action bar

## Done
- **儀表板側邊欄縮小排版全面重構（防重疊與跑版）**：
  - `src/renderer/src/panels/dashboard/DashboardPanel.tsx`:
    - 資料夾標題重構為雙層結構：
      - 上層（`.dash-folder-top`）：專注資料夾身份（折疊箭頭、圖示、名稱、當前工作區標記）與右側 Token 總量，設定 `min-width: 0` 與 `text-overflow: ellipsis`。
      - 下層（`.dash-folder-sub`）：專注狀態與動作（Active 綠燈標籤、Session 數量、以及右側切換資料夾按鈕）。
    - Session 卡片右側資訊重整為 `.dash-session-right-col`，並為操作按鈕加上 `.dash-action-icon-btn` 與 `.dash-action-label`。
  - `src/renderer/src/panels/dashboard/dashboard.css`:
    - 在 `.dash-root` 啟用 CSS Container Query（`container-type: inline-size; container-name: dash-panel;`）。
    - 解決「切換資料夾」按鈕文字被壓成四行垂直文字：加上 `white-space: nowrap; flex-shrink: 0;`。
    - 徹底根絕文字融合重疊 bug：為所有文字容器設定嚴格的 `min-width: 0`、`flex: 1` 與 `overflow: hidden`。
    - 窄版自適應（`@container dash-panel (max-width: 330px)`）：
      - `Archive` 與 `Delete` 自動隱藏文字標籤，縮成精美帶 Tooltip 的 Icon 按鈕。
      - 主要按鈕 `>_ Switch CLI ➔` 佔據彈性寬度，三顆按鈕保證維持**單行整齊排列，永不折行**。
      - 隱藏 Session 卡片重複的 `TOKENS` 小標籤，讓主要標題字數空間擴增 2.5 倍以上。
    - 超窄版自適應（`@container dash-panel (max-width: 290px)`）：緊湊調整頂部 3 欄 Token 統計（In / Tools / Out）。
- **Auto-Updater 404 錯誤淨化與容錯**：
  - `src/main/ipc/updater.ts`: 新增 `formatUpdaterError()`，過濾原生幾十行 HTTP Header 與 stack trace；在 GitHub REST API 備援查詢成功且確認為最新版時，自動清空先前 `latest.yml` 的 404 錯誤，畫面乾淨顯示「✓ You are on the latest version!」。
- **PowerShell 一鍵安裝腳本與說明**：
  - 專案根目錄建立 `install.ps1`，並同步更新 `README.md`（英文與繁體中文雙語）。

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
