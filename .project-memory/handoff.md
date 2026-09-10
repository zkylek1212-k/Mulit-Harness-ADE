# Latest Handoff

- Updated: 2026-09-10 12:05 Asia/Taipei
- Agent: Antigravity
- Task: 9 項重大升級（CLI 路徑設定、Git Graph、Preview 分頁、Customized 掃描反饋、Codex 下載整合、Apple 氣泡終端 UI、編輯預覽效能優化、側邊 Dashboard 與 Token 消耗分析）
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **CLI 路徑自訂設定（`SettingsModal.tsx` + `src/main/ipc/settings.ts`）**：
   - 支援為 `claude`、`antigravity` (agy)、`codex` 自訂絕對路徑或可執行檔，持久化於 `.workbench/settings.json`。
   - 提供「Use Detected」快速填入系統掃描路徑，與即時「Test」按鈕驗證版本與有效性。
   - `pty.ts` 自動對 Windows `.ps1` 腳本補上 PowerShell ExecutionPolicy Bypass 包裝。
2. **Git Commit Graph（`GitGraphView.tsx` + `src/main/ipc/git.ts`）**：
   - 解析 `git log` 分支拓撲，使用 SVG 渲染平滑 Bézier 曲線分支泳道、著色 Commit 節點與 Ref 標籤。
   - 在 GitPanel 頂部提供 Apple Segmented 切換 `[ Changes | Git Graph ]`。
3. **Preview 多分頁瀏覽（`PreviewPanel.tsx`）**：
   - 點選多個檔案會開啟獨立 Preview 分頁，不會覆蓋前一個檔案，可自由切換與關閉。
4. **Customized Rescan 執行反饋（`CustomizedPanel.tsx` + `customized.css`）**：
   - 新增動態旋轉動畫（`cz-spinning`）、按鈕顯示 `Scanning...`、完成後顯示「Last rescanned at HH:MM:SS」。
5. **Codex CLI 整合與一鍵下載（`src/main/ipc/ext.ts`）**：
   - 狀態改為完全支援（`supported: true, pending: false`）；未安裝時卡片提供「⬇ Download & Install Codex」一鍵安裝。
6. **Agent Terminal Apple 氣泡感 UI/UX（`TerminalPanel.tsx` + `terminal.css`）**：
   - 依據 Apple Human Interface Guidelines 與 `apple-ui-designer` 風格：
     - 頂部浮動膠囊 Dock：橘色 Claude 氣泡、紫色 Antigravity 膠囊、綠色 Codex 氣泡、透明磨砂 Shell 膠囊。
     - Launchpad / Control Center 空狀態卡片：4 格毛玻璃懸浮卡片，一鍵啟動。
     - Safari 風格膠囊分頁（Pill Tabs）：呼吸燈待審批指示器、平滑 hover 關閉鈕。
7. **Editor 與 Preview 開檔卡頓優化**：
   - `EditorPanel.tsx`：記憶體已有 Model 時優先切換，不再觸發 loading 遮罩與重讀磁碟。
   - `PreviewPanel.tsx`：建立文字內容緩存 Map 與 `useMemo` 渲染，切換零延遲。
8. & 9. **左側 Dashboard 與 Token 消耗細節分析（`DashboardPanel.tsx` + `src/main/ipc/dashboard.ts`）**：
   - 左側側邊欄擴充 `[ Dashboard | Files | Git ]`。
   - 總覽 Workspace 總消耗量、預估 API 費用與會話數。
   - 三大 Agent 即時卡片：活躍會話脈衝標籤、消耗統計、費用試算。
   - Session 狀態卡片與 Apple Health 分段計量條（藍色 Context/Prompt、綠色 Tool、紫色 Generation），展開可查看詳細百分比與 Token 消耗去向分析。

## Tests
- `npm run typecheck` → pass (代碼與型別 100% 通過)
- `npm run build` → pass (Vite 生產環境打包 46s 完成，包含本地離線 Monaco 與 Web Worker)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
