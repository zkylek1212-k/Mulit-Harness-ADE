# Latest Handoff

- Updated: 2026-09-10 23:35 Asia/Taipei
- Agent: Antigravity
- Task: 新增點選 Git 節點（點）開啟中央 Editor / Diff 差異檢視功能
- Branch: master
- Commit: Uncommitted

## Done（本輪）
1. **Git 節點與歷史 Commit 點選開啟 Editor / Diff 差異檢視**：
   - **需求**：使用者在 Git 面板點選 Git Graph 拓撲圖上的點（圓圈節點）或 Commit 項目時，能夠自動於中央 Editor 開啟該 Commit 的差異比較（Diff Editor）。
   - **IPC 契約與後端實作**（[src/preload/index.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/preload/index.ts) 與 [src/main/ipc/git.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/git.ts)）：
     - 定義 `GitCommitFileChange` 與 `GitCommitDetail` 介面。
     - 實作 `git:commitDetails`：解析 `git show --name-status` 取得完整 Commit 雜湊、父母節點、作者、日期、訊息與變更檔案（狀態標記 `A`/`M`/`D`/`R`）。
     - 實作 `git:commitFileDiff`：藉由 `git.show([`${parent}:${relPath}`])` 與 `git.show([`${hash}:${relPath}`])` 取出比對前後的歷史原始內容，內建二進位檔案防禦過濾。
   - **全域跨面板比對狀態**（[src/renderer/src/store.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/store.ts)）：
     - 定義 `GitCommitDiffTarget` 與 `activeCommitDiff` 狀態。
     - 提供 `openCommitDiff(target)` action：自動產生虛擬比對分頁 `commit:${hash}:${filePath}`，加入 `openTabs`，切換至 `viewMode: 'diff'`，並自動解除中央區域最大化。
     - 提供 `selectTab` 與優化 `closeTab`，支援虛擬 Commit 分頁無縫切換與關閉。
   - **Git 拓撲圖與 Inspector 面板升級**（[src/renderer/src/panels/git/GitGraphView.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/git/GitGraphView.tsx)、[GitPanel.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/git/GitPanel.tsx) 與 [gitGraph.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/git/gitGraph.css)）：
     - SVG `<g className="git-graph-node">` 圓點加入加大透明點擊感應區（r=14）、hover 光暈與點擊處理常式。
     - 點擊點或列時呼叫 `handleSelectCommit`，自動在中央打開該 Commit 第一個變更檔案的 Diff。
     - Git Graph 下方自動停靠/展開 Apple 風格的 Commit Inspector 卡片，陳列該次 Commit 的所有異動檔案（含 `M`/`A`/`D` 彩色徽章），點選任一檔案即可即時切換比對。
     - 「Recent Commits」清單項目同步支援點擊開啟比對。
   - **中央 Editor 差異視圖升級**（[src/renderer/src/panels/editor/EditorPanel.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/editor/EditorPanel.tsx) 與 [EditorPanel.css](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/editor/EditorPanel.css)）：
     - 分頁標籤顯示檔案名稱與 Commit 短雜湊（例如 `handoff.md (e159872)`）。
     - 頂部工具列標示 `Commit Diff` 專屬紫色/靛青徽章與 Commit 訊息。
     - 若 Commit 包含多個變更檔案，工具列自動呈現極簡檔案切換下拉選單，可在 Editor 內直接切換該 Commit 的所有檔案。
     - 呼叫 `git:commitFileDiff` 載入 Monaco `DiffEditor`，設定 `readOnly: true` 保護歷史節點。

## Tests
- `npm run typecheck` → pass (TypeScript 零錯誤通過)

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
