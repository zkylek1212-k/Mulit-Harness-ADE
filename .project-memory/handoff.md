# Latest Handoff

- Updated: 2026-09-11 10:48 Asia/Taipei
- Agent: Antigravity
- Task: 修正 light+Morandi 終端機文字太淺與對比度問題，補齊 16 色 ANSI 調色板與啟用 xterm minimumContrastRatio
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **解決 Light Morandi Terminal 文字太淺/混入背景痛點**：
   - 深入根本原因：xterm 預設 16 色 ANSI 調色板是針對黑色背景設計（ANSI white 為 `#e5e5e5`、brightWhite 為 `#ffffff`、yellow 為 `#e5e500`、cyan 為 `#00e5e5`）。在 PowerShell / CLI 輸出白色、黃色命令或淡青色時，文字直接落在 `#ece7df` 上導致對比度僅 1.1:1，近乎全白隱形。
   - [src/renderer/src/panels/terminal/TerminalPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/terminal/TerminalPanel.tsx)：
     - 為 `light-morandi` 建立專屬 16 色莫蘭迪深度調色板：
       - `foreground`: `#202427`（深玄青，對比度 13:1）
       - `white`: `#353c43`（深石墨灰，對比度 8.7:1，徹底解決 CLI 預設 white 隱形問題）
       - `brightWhite`: `#181b1e`（對比度 14.2:1，高亮加粗文字清晰銳利）
       - `yellow`: `#744e12`（深大地焦糖琥珀，對比度 5.8:1，替代刺眼淺黃）
       - `cyan`: `#205c60`（深鼠尾青，對比度 5.9:1）
       - `green`: `#2b5f32`、`red`: `#94382d`、`blue`: `#275279`、`magenta`: `#6c3b72` 均達到 5.5:1+
     - 啟用 xterm 核心功能 `minimumContrastRatio: 4.5`：
       - 即使任何 CLI 程式輸出自訂 24-bit RGB 或 256 色碼（如 faint gray、淡黃），xterm 即時動態調整輝度，強制保證任何文字至少具備 4.5:1 WCAG AA 對比度，絕不淡化失真。
     - 補齊 `dark-morandi`、`light`、`dark` 之完整 16 色 ANSI 調色板與即時動態重繪（`term.refresh(0, rows - 1)`）。

2. **強化 Light Morandi 全域文字階層清晰度**：
   - [src/renderer/src/styles.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/styles.css)：
     - `--fg`: 由 `#2c3136` 微調至 `#202428`（提升至 13:1 對比度）。
     - `--fg-dim`: 由 `#69717a`（4.0:1）微調至 `#59626b`（5.0:1，突破 WCAG AA 門檻）。
     - `--accent`: 微調至 `#486a6d`（5.0:1），確保圖標、邊框與重點元件清晰易讀。

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
