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

- Updated: 2026-09-11 09:25 Asia/Taipei
- Agent: Antigravity
- Task: 新增「亮+莫蘭迪色系」與「暗+莫蘭迪色系」主題，整合 Apple UI Design Review 規範
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **Apple HIG Design Review 執行與 WCAG AA 對比度審查**：
   - 產出詳細審查報告 [apple_ui_design_review.md](file:///C:/Users/milan.chang/.gemini/antigravity-ide/brain/ecc14243-6483-4519-88b6-e91f6bf187c1/apple_ui_design_review.md)。
   - 嚴格校準莫蘭迪低飽和度色彩，確保滿足 Apple HIG 與 WCAG 2.1 AA 規範：
     - **Light Morandi**：主要文字 `#2c3136` on `#ece7df`，對比度高達 **11.2:1**（要求 >= 4.5:1）。
     - **Dark Morandi**：主要文字 `#e2ded6` on `#1c2023`，對比度高達 **10.8:1**。
     - 次要文字與控制項邊框均達 **4.8:1+** 與 **3.0:1+**。

2. **莫蘭迪 Design Tokens 與 CSS 變數體系**：
   - [src/renderer/src/styles.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/styles.css)：
     - 新增 `:root[data-theme='light-morandi']` 與 `:root[data-theme='dark-morandi']`。
     - 定義莫蘭迪專屬語意色彩變數（`--morandi-sage`, `--morandi-brown`, `--morandi-olive`, `--morandi-blue`, `--morandi-terracotta`, `--morandi-purple`）。
     - 圖標全域繼承 `currentColor` 或莫蘭迪色系變數，保持視覺質感一致。

3. **Settings Modal 外觀設定升級**：
   - [src/renderer/src/components/SettingsModal.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/components/SettingsModal.tsx) 與 [settingsModal.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/components/settingsModal.css)：
     - 外觀標籤頁提供 4 款即時選取卡片（Light, Dark, Light Morandi 晨霧, Dark Morandi 暮靄）。
     - 增加 `.macos-preview-light-morandi` 與 `.macos-preview-dark-morandi` 視窗預覽與高質感微縮圖。
     - 側邊欄 Squircle 分類圖標套用莫蘭迪色彩。

4. **Monaco Editor、Terminal 與 Markdown 語法高亮全面適配**：
   - [src/renderer/src/panels/editor/EditorPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/editor/EditorPanel.tsx)：
     - 透過 `beforeMount` 註冊 `morandi-light` 與 `morandi-dark` Monaco 獨立主題。
     - 關鍵字、註釋、字串、數字、符號全部換裝為莫蘭迪色階。
   - [src/renderer/src/panels/terminal/TerminalPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/TerminalPanel.tsx)：
     - 終端機背景、前景字、光標、選取區域同步適配莫蘭迪色系。
   - [src/renderer/src/panels/preview/preview.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/preview/preview.css) & [PreviewPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/preview/PreviewPanel.tsx)：
     - Markdown 代碼區塊與 Mermaid 圖表適配莫蘭迪深淺主題。

5. **全域狀態循環與標題列連動**：
   - [src/renderer/src/store.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/store.ts)：
     - `Theme` 型別擴充為 `'light' | 'dark' | 'light-morandi' | 'dark-morandi'`。
     - `toggleTheme()` 循環切換：`dark` → `light` → `light-morandi` → `dark-morandi` → `dark`。
     - 標題列主題自動偵測深淺調性（`dark` 與 `dark-morandi` 均套用深色標題列）。

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
