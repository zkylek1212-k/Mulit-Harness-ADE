# Latest Handoff

- Updated: 2026-09-10 23:55 Asia/Taipei
- Agent: Antigravity
- Task: 全面完成 Git 節點 Diff 檢視、CLI 會話銜接防禦、Preview 分頁同步修復與標籤順序優化
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **點選 Git 節點即時開啟中央 Editor / Diff 差異檢視**：
   - IPC 契約與後端實作（[src/preload/index.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/preload/index.ts) 與 [src/main/ipc/git.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/git.ts)）：
     - `git:commitDetails`：解析 `git show --name-status` 取得完整雜湊、父節點、作者、時間與變更檔案清單（含 `M`/`A`/`D`/`R` 狀態）。
     - `git:commitFileDiff`：透過 `git.show([`${parent}:${relPath}`])` 與 `git.show([`${hash}:${relPath}`])` 讀取歷史檔案內容，包含二進位安全過濾。
   - 全域跨面板比對狀態（[src/renderer/src/store.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/store.ts)）：
     - 實作 `openCommitDiff(target)`，生成虛擬比對分頁 `commit:${hash}:${filePath}`，加入 `openTabs` 並切換至 `diff` 模式。
   - Git Graph 拓撲與 Inspector 卡片（[GitGraphView.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/git/GitGraphView.tsx) 與 [GitPanel.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/git/GitPanel.tsx)）：
     - 拓撲節點提供加大透明點擊半徑（r=14）與 hover 光暈效果；下方自動停靠 Commit Inspector 卡片展示所有異動檔案與狀態徽章，點選立即切換比對。
   - Editor 差異檢視器（[EditorPanel.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/editor/EditorPanel.tsx)）：
     - Monaco `DiffEditor` 唯讀保護、頂部顯示 Commit 訊息與紫色標籤，並提供多檔案下拉式快速切換。

2. **Antigravity CLI 連接 Session 出現 "conversation not found" 根本解決**：
   - 成因定位：Antigravity IDE（`~/.gemini/antigravity-ide/brain/<uuid>`，JSONL）與 Antigravity CLI（`~/.gemini/antigravity-cli/conversations/<uuid>.db`，SQLite）對話儲存庫獨立。
   - 防禦實作（[src/main/ipc/pty.ts](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/main/ipc/pty.ts)）：
     - 在 `pty:spawn` 啟動 `agy` 或 `antigravity` 時自動檢查 `--conversation <id>` 對應的 `.db` 檔是否存在。
     - 若為真實 CLI 會話完整保留參數以無縫 resume；若為 IDE 會話或不存在紀錄，自動過濾掉 `--conversation`，避免警告紅字，乾淨啟動並綁定工作區。

3. **修復 Preview 預覽面板分頁與工作區不同步及 Commit 虛擬路徑 ENOENT 報錯**（[PreviewPanel.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/preview/PreviewPanel.tsx)）：
   - 移除孤立的 `previewTabs` / `currentPath`，改以全域 `useWorkbench().openTabs` 作為單一真相來源，關閉/選取分頁直接聯動 `closeTab` / `selectTab`。
   - 支援 `commit:...` 虛擬路徑：透過 `git:commitFileDiff` 讀取歷史 Markdown 渲染，解決直接讀盤導致的 `ENOENT` 錯誤。
   - 檔案全關時乾淨進入 Empty State，徹底清除殘留標題與錯誤訊息。

4. **調整中央工作區頂部標籤順序**（[src/renderer/src/App.tsx](file:///d:/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/App.tsx)）：
   - 將頂部中央的工作區切換分段按鈕順序更新為：
     `Editor / Preview / Memory / Browser`。
   - 同步調換底層 DOM 面板節點順序。

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
