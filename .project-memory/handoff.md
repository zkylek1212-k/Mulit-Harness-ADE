# Latest Handoff

- Updated: 2026-09-11 11:44 Asia/Taipei
- Agent: Antigravity
- Task: 實現 Preview Panel 即時自動同步更新（打字即時預覽 + 存檔與外部/Agent 改檔自動重載）
- Branch: master
- Commit: Uncommitted

## Done（本輪完整總結）
1. **問題根因剖析（為何原先需要按 Refresh）**：
   - 原 `PreviewPanel.tsx` 內 `loadFile` 有快取短路邏輯 `if (!force && cache[p] !== undefined) return`。
   - 監聽檔案系統變更的 `useEffect` 在觸發時呼叫了 `loadFile(targetPath, false)`（`force = false`），導致已存在快取中的內容永遠不會被磁碟新內容覆蓋。
   - Monaco Editor 的打字輸入屬於記憶體未存檔 Draft，Preview 原先完全沒有訂閱編輯器 Draft 狀態，只在點擊「重新整理」按鈕傳入 `force = true` 時才會強制重讀已存檔的磁碟檔案。
2. **全流程即時自動預覽架構（Live Auto-Sync）**：
   - **打字即時預覽（Draft Live Sync）**：
     - 在 [src/renderer/src/store.ts](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/store.ts) 增加 `editorDraft: { path: string; text: string; version: number } | null` 及 `setEditorDraft` / `clearEditorDraft`。
     - 在 [src/renderer/src/panels/editor/EditorPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/editor/EditorPanel.tsx) 的 `handleContentChange`、`handleSave`、`loadData` 即時廣播 draft；關閉標籤時清理 draft。
     - [src/renderer/src/panels/preview/PreviewPanel.tsx](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/preview/PreviewPanel.tsx) 訂閱 `editorDraft`，若當前預覽檔案與 Draft 相符，優先即時渲染 Draft 內容（支援 Markdown 即時轉換與 HTML 即時展示），打字過程預覽秒級同步。
   - **存檔與磁碟/Agent 即時重載（Save & Agent Sync）**：
     - 監聽 `gitTick` 與 `fileReloadTick[targetPath]`，觸發時以 `force = true` 重載磁碟檔案並更新快取。
     - 訂閱 `window.api.files.onExternalChange`，當背景 Agent（Claude/Antigravity/Codex）或外部工具改動當前預覽檔案時，自動以 `force = true` 立即重讀，無須手動按任何按鍵。
   - **狀態與視覺呈現（Apple HIG）**：
     - 在 Preview 工具列增加呼吸微光綠點 `.preview-live-tag`（`● Live`），向使用者清晰傳達「當前處於即時自動同步模式」。
     - 在 [src/renderer/src/panels/preview/preview.css](file:///d:/Cloud/OneDrive/AI%20workspace/Claude%20Agent%20-%20Personal/Vibe%20copy/IDE-remade%20-2/src/renderer/src/panels/preview/preview.css) 配置 Apple-style 精緻毛玻璃標籤與柔和呼吸光晕。

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
