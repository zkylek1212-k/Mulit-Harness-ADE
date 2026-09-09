# Latest Handoff

- Updated: 2026-09-09 20:40 Asia/Taipei
- Agent: Claude Code
- Task: Customized 擴充管理面板 + 終端雙向橋接 + shell 支援
- Branch: master
- Commit: Uncommitted

## Done（本輪）
- **版面可自由調整**：三欄之間加可拖曳分隔線（`src/renderer/src/components/Splitter.tsx`），
  支援拖曳／雙擊還原／方向鍵微調，尺寸存 localStorage（`src/renderer/src/layout.ts`）。
- **終端可停靠右側或底部**：titlebar 的 Right／Bottom 切換。切換只換
  `grid-template-areas`、JSX 結構不動 —— 否則 React 會 unmount TerminalPanel，
  把所有終端 session 殺掉。**改這段時務必維持單一 JSX 結構。**
- **終端分割顯示**：單一／左右／上下／四宮格，顯示哪幾個依 MRU 自動決定，
  作用中面板有藍框。
- **修掉真 bug：關閉終端／關 app 會留下孤兒 shell 行程。**
  node-pty 在 Windows 的 `kill()` 會先 fork `conpty_console_list_agent`，
  該 helper 在 Electron 下必定以 AttachConsole failed 崩潰，於是要等滿 5 秒
  timeout 才真的殺；`before-quit` 根本等不到。改為在 `src/main/ipc/pty.ts` 的
  `hardKill()` 先 `taskkill /T /F` 殺掉整棵 process tree 再呼叫 kill()。
  實測：開兩個 PowerShell 後關閉 app，powershell 行程數 before=after，無殘留。
  註：那行 AttachConsole stderr 仍會出現（helper 仍被 fork），但已不影響行為。

- **Customized 面板**（`src/renderer/src/panels/customized/CustomizedPanel.tsx`）：
  一次看到 Claude / Antigravity / Codex 三家各裝了什麼、哪些可用。Codex 掛 Pending（本機未裝）。
- **跨 agent 擴充管理**：`.workbench/extensions.yaml` 為唯一真相，
  `src/main/ext/adapters.ts` 生成各家原生設定；寫入前一律用 Monaco Diff 預覽並需確認。
- **Connections**：`src/main/ipc/conn.ts` 以 Electron safeStorage 加密存
  `.workbench/credentials.enc`（已 gitignore）；憑證不寫進任何 agent 設定檔，
  只在 `src/main/ipc/pty.ts` spawn CLI 時注入 env。
- **終端支援一般 shell**：PowerShell / CMD（非 Windows 為 bash / pwsh）。
- **終端雙向橋接**：終端選取內容可「送到…」另一個 session；
  Preview / Memory 的 shell code block 有「送到終端」。皆用 bracketed paste 貼上、不自動執行。
- **實測校正**：Antigravity 執行檔是 `agy`（非 antigravity），已在 pty resolveCommand 修正；
  Claude 的專案級 MCP 存在 `~/.claude.json` 的 `projects[路徑].mcpServers`，掃描器已補上。
- **介面全英文**：renderer 與 main 端所有使用者可見字串改為英文。
  程式註解、以及 `src/renderer/src/panels/terminal/approvalDetect.ts` 用來比對
  CLI 輸出的中文提示字串保留（那是偵測樣式，不是介面）。

## Done（前一輪）
- 安裝 ShareProjectMem：`.project-memory/`、`AGENTS.md`、`.agents/rules/shared-memory.md`、
  `.githooks/pre-commit`、`.githooks/post-merge`，並設 `core.hooksPath .githooks`
- 終端待審批紅點：`src/renderer/src/panels/terminal/approvalDetect.ts` 偵測提示字串，
  分頁顯示脈動紅點，工具列顯示待審批數
- OS 原生通知：`src/main/ipc/notify.ts`，待審批（非當前分頁時）與任務結束會發通知，
  點通知把視窗帶到前景
- handoff 路徑跳轉：`src/renderer/src/panels/memory/MemoryPanel.tsx` 會把本檔提到、
  且工作區真實存在的路徑做成可點擊，點了在中央 Monaco 開啟
- 新增 `files:exists` IPC（`src/main/ipc/files.ts`），改掉用例外當流程控制的寫法，
  消除開機時 `.project-memory/*.md` 的 ENOENT 噪音
- 修掉 `src/renderer/src/panels/terminal/TerminalPanel.tsx` 的 ptyId 閉包 bug
  （resize 事件先前從未真正送到 pty）

## Not done
- Phase 3 硬體 MCP：Python USB／BIOS Log 腳本尚未包成 MCP server
- 三家 CLI 未實機驗證（本機是否已安裝 codex / antigravity 未確認）
- 尚未打包發佈

## Next agent should
1. 確認本機有哪幾家 CLI 可執行，逐一在終端殼開起來，記下各家真實的審批提示字串，
   回填 `src/renderer/src/panels/terminal/approvalDetect.ts` 的 `APPROVAL_PATTERNS`
2. 把既有 Python 硬體腳本包成 MCP server，建 `.mcp/hardware.json`，
   在 `agents/claude_dev.yaml` 的 `args` 以 `--mcp-config` 註冊給 CLI
3. 驗證 CLI 呼叫硬體工具後，結果能寫回本檔並在 Memory 面板即時看到

## Tests
- `npm run typecheck` → pass
- `npm run build` → pass
- 實機啟動 Electron → 視窗正常、renderer 載入、IPC 正常

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態，
  改動會牽動全部 panel，動之前先確認沒有其他 agent 正在平行改 panel
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
