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
- Task: 設定新增語言選擇功能（支援 English 與繁體中文）
- Branch: feat/mobile-dispatch
- Commit: pending memory commit

## Done
- **雙語 i18n 系統與翻譯架構**：
  - `src/renderer/src/i18n/index.ts`: 新增零依賴、型別安全之雙語模組，定義 `Language = 'en' | 'zh-TW'`，建立涵蓋所有面板之雙語字典，並匯出 `useTranslation()` Hook 與 `t()` 函式。
  - **English 模式嚴格純英文**：移除淺深色莫蘭迪主題名稱中硬編碼之中文（`Light Morandi`、`Dark Morandi`），修正 Dashboard 之「展開全部/摺疊全部」為 `Expand All / Collapse All`，消除所有中文字串洩漏。
  - **繁體中文模式**：採用台灣慣用之標準繁體中文（如「偏好設定」、「工作目錄變更」、「暫存變更」、「當前工作區」等），專有名詞與 CLI 指令保留英文。
- **後端設定契約與持久化**：
  - `src/preload/index.ts`: 在 `WorkbenchSettings` 新增 `language?: 'en' | 'zh-TW'`。
  - `src/main/ipc/settings.ts`: 在 `loadSettings()` 與 `settings:set` 讀寫 `language` 欄位並儲存於 `.workbench/settings.json`。
  - `src/main/ipc/dashboard.ts`: Token 分類常數統一為英文（`Context & System Prompt`、`Tool Execution & Files`、`Thinking & Generation`），杜絕後端硬編碼中文。
- **全域狀態與即時同步**：
  - `src/renderer/src/store.ts`: `WorkbenchState` 支援 `language`，初始自動載入 `localStorage ('wb-language')` 或瀏覽器語系，提供 `setLanguage()` 同步更新狀態、`localStorage` 與後端設定檔，免重啟即時切換。
- **Settings Modal 語言切換介面**：
  - `src/renderer/src/components/SettingsModal.tsx`: 在 Appearance 頁籤最上方新增 Apple HIG 風格雙卡片選擇器（`English` 與 `繁體中文`），點擊即刻生效。
  - `src/renderer/src/components/settingsModal.css`: 實作 `.macos-lang-cards` 等現代化選單樣式。
- **全域面板對接 i18n**：
  - `App.tsx`、`DashboardPanel.tsx`、`FileTreePanel.tsx`、`EditorPanel.tsx`、`GitPanel.tsx` 全面接軌 `t()`。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（Vite / Electron 生產環境打包編譯通過）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
