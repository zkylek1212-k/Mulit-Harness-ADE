# Latest Handoff

- Updated: 2026-09-10 14:38 Asia/Taipei
- Agent: Antigravity
- Task: Agent terminals 下拉懸浮選單、安裝 apple-design-skill 審查、全站字型統一、拔除終端重複目錄
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **Agent terminals 下拉選單改為頂層懸浮 Popover（`TerminalPanel.tsx`, `terminal.css`）**：
   - 透過 React `createPortal(..., document.body)` 將啟動選單脫離 `.term-strip-tabs` 捲動限制容器。
   - 依據 `getBoundingClientRect()` 動態計算視窗座標，避免右側邊緣溢出。
   - 導入 macOS 原生磨砂毛玻璃 (`blur(28px) saturate(190%)`)、細邊框、陰影及彈出微動畫 (`appleMenuScale`)。
   - 支援點擊選單外或視窗縮放捲動時自動 Dismiss。
2. **安裝 `apple-design-skill` 並完成 UI/UX 審查（`.agents/skills/apple-design`）**：
   - 將 `https://github.com/dickwu/apple-design-skill` 完整部署至工作區 skills。
   - 依照 5 大 Apple HIG 維度（可存取性、平台規範、視覺工藝、互動反饋、文案精煉）進行全站審查，成果記錄於實作計劃與設計反饋中。
3. **全 APP 字型全面統一（`styles.css`, 各面板 CSS 與 TSX）**：
   - 在 `styles.css` 明確宣告 `button, input, select, textarea` 繼承 `var(--font)`，根除 Windows/Chromium 表單元素字型分歧。
   - 統一代碼塊 `code, kbd, samp, pre` 為 `var(--mono)`。
   - 清除並統一 `preview.css`, `memory.css`, `git.css`, `gitGraph.css`, `EditorPanel.css`, `settingsModal.css`, `TerminalPanel.tsx`, `EditorPanel.tsx` 內硬編碼之字型。
4. **Agent terminals 拔除重複 folder 顯示（`TerminalPanel.tsx`, `terminal.css`）**：
   - 徹底移除終端標籤列的 `.term-strip-workspace` 目錄膠囊（左側 Explorer 標題已具備清晰路徑，避免視覺重複）。
   - 淨化 Launchpad 歡迎文案為純淨的 `Launch an interactive Claude Code, Antigravity, or Codex agent session.`。

## Tests
- `npm run typecheck` → pass (代碼與型別 100% 通過)
- `npm run build` → pass (生產環境打包成功，耗時 1m 7s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
