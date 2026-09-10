# Latest Handoff

- Updated: 2026-09-10 15:30 Asia/Taipei
- Agent: Antigravity
- Task: 統一頂層無邊框視窗與對齊、Customized/Theme 整併至設定 Modal、Terminal Launchpad 置中與 split 凍結修復、Dashboard 與 Browser Apple HIG 重塑
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **視窗合體與頂部線條精確對齊（紅圈 1 & 4）**：
   - `src/main/index.ts`：啟用 `titleBarStyle: 'hidden'` 配合 Windows 原生 `titleBarOverlay`，消除多餘 OS 標題列，打造一體成型 Frameless 視窗。
   - `App.tsx` & `styles.css`：抽出 `.app-unified-header`，讓左右三欄完全從同一水平線開始，底部具備連續一致的分割線；修正 `.tabbar` 與 `.left-segmented` 的 `box-sizing`，徹底解決 `Git` 標籤被邊界截斷擠壓問題。
2. **Customized 資訊卡高度統一與文字摺疊溢出修復（紅圈 2 & 5）**：
   - `customized.css` & `CustomizedPanel.tsx`：將三位 Agent 總覽卡片設為統一網格與固定高度 `140px`，內容過長自動捲動；清單中 Skills/MCP/Plugins 長標題加上 `ellipsis`，並將佔用 ~360px 的 Agent 狀態膠囊改為精緻圖標微型 Chip，徹底解決寬度擠壓導致文字單字斷行的 bug。
3. **Terminal Launchpad 置中與 Split 分割卡死修復（紅圈 3）**：
   - `TerminalPanel.tsx` & `terminal.css`：Launchpad 改為彈性置中，4 張啟動卡片均勻居中分佈；加入 `effectiveSplitMode` 自動回退機制，當 session 數 <= 1 時強制為單一視窗，徹底根除上下分割關閉後下半部變成死區無法操作的嚴重 bug。
4. **Browser 面板關閉支援與預設混淆改善（修改項目 1）**：
   - `App.tsx`：增加可關閉的 `browserOpen` 狀態與 `[×]` 快捷關閉按鈕，關閉後頂部提供 `+ Browser` 快速開啟。
   - `TestBrowserPanel.tsx` & `browser.css`：將原先橫排容易被誤認為開了一堆分頁的 4 個 quick port 藥丸，整併為優雅的 Apple 下拉選單 `Ports ▾`。
5. **Customized 與亮暗模式切換整併進 Settings（修改項目 2）**：
   - `SettingsModal.tsx` & `settingsModal.css`：新增 segmented 分頁（`General & Appearance` 與 `Extensions & Agents`）。外觀設定提供精緻的 Light/Dark 卡片切換；點選擴充時 modal 動態展開並直接嵌入完整 `CustomizedPanel`。頂部工作列拔除獨立按鈕，版面回歸極簡。
6. **Dashboard 面板 Apple HIG 重構（修改項目 3）**：
   - `DashboardPanel.tsx` & `dashboard.css`：全面移除生硬的彩虹邊框與漸層，換上細膩磨砂質感卡片；拔除 Emoji 按鈕，改用精緻向量 SVG `IconArchive` 與 `IconTrash`；微調 Apple Health 經典三色健康度條（Amber/Mint/Purple）。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (生產環境構建成功，53.56s)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
