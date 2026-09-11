# Latest Handoff

- Updated: 2026-09-11 09:15 Asia/Taipei
- Agent: Antigravity
- Task: 實現 Editor 顯示與開啟 Word/Excel/PowerPoint/PDF，並於 Settings 提供自訂外部工具路徑與一鍵自動偵測
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **Editor 面板支援 Word / Excel / PowerPoint / PDF 文件檢視與啟動**：
   - 解決痛點：過去在檔案樹點選二進位 Office 檔案（zip 壓縮 XML）或 PDF 時，Monaco 嘗試讀為 UTF-8 字串造成介面卡頓或出現壓縮亂碼。
   - 新增元件 [DocumentViewer.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/editor/DocumentViewer.tsx) 與 [documentViewer.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/editor/documentViewer.css)：
     - **PDF 支援**：內建 Chromium PDF `<webview>` 嵌入式預覽，使用者可直接在 IDE 內閱讀文件，頂部工具列提供「開啟工具」、「系統預設」、「檔案總管」、「切換資訊卡片」與「設定 ⚙」。
     - **Office 檔案卡片式介面**：針對 Word（藍）、Excel（綠）、PowerPoint（橘紅）呈現 Apple HIG 磨砂玻璃卡片，標示完整檔名、類型標籤、檔案大小（KB/MB 格式化）、修改日期與目前指派工具。
     - **操作按鈕**：一鍵「以 [自訂工具] 開啟」（如 WINWORD.EXE）、「以系統預設程式開啟」、「在檔案總管中顯示」以及「設定開啟工具 ⚙」。
   - [EditorPanel.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/editor/EditorPanel.tsx)：
     - 攔截文件副檔名，不讀取原始文字，並在分頁列下方直接掛載 `DocumentViewer`，同時保有分頁切換、關閉等既有工作區體驗。

2. **Settings Modal 新增「Document Tools」獨立標籤頁**：
   - [SettingsModal.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/components/SettingsModal.tsx) 與 [settingsModal.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/components/settingsModal.css)：
     - 側邊欄加入「Document Tools」按鈕（帶橘黃色檔案圖標）。
     - 分別提供 Word、Excel、PowerPoint、PDF 四大分類卡片：
       - 路徑輸入框。
       - 「Browse...」按鈕：調用 Electron 原生選擇檔案對話框（Windows 支援過濾 `.exe` / `.cmd` / `.bat`）。
       - 「Use Detected」/「Detect」按鈕：快速帶入本機掃描到的路徑。
       - 「Test」按鈕：驗證執行檔路徑是否存在且可執行。
       - 「Clear」按鈕：清空路徑，即時回歸系統預設應用程式。
     - 頂部全域動作：「Auto-Detect Installed Tools」（一鍵掃描電腦內所有 Office 16 與 PDF 工具）與「Reset All to System Default」。

3. **IPC 契約與後端安全處理**：
   - [src/preload/index.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/preload/index.ts)：
     - `WorkbenchSettings` 擴充 `docToolPaths?: DocToolPaths`。
     - `window.api.files` 新增 `openExternal`、`showInFolder`、`stat`、`pickExecutable` 與 `detectDocTools`。
   - [src/main/ipc/files.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/files.ts)：
     - 實作安全路徑解析（`resolveSafePath`），支援自訂執行檔背景 detached spawn 與 `shell.openPath` 兜底。
     - 實作 Windows / macOS 常見 Office（Office 16 / 15 / WPS）及 PDF 檢視器（Edge / Chrome / Acrobat / SumatraPDF）路徑自動偵測。
   - [src/main/ipc/settings.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/settings.ts)：
     - 支援 `docToolPaths` 之載入、防護過濾、保存與跨模組存取 `getCustomDocToolPath`。
   - [src/renderer/src/store.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/store.ts) 與 [src/renderer/src/App.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/App.tsx)：
     - 補齊全域 `settingsModal` 狀態，提供 `openSettings(tab)` 讓 DocumentViewer 等面板能直接跳轉至特定標籤頁。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)
- `npm run build` → pass (Electron + Vite 完整打包通過)
- 本機 Office 偵測實測：Word (`WINWORD.EXE`)、Excel (`EXCEL.EXE`)、PowerPoint (`POWERPNT.EXE`)、PDF (`msedge.exe`) 均精準命中並成功辨識。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
