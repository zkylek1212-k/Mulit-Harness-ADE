# Project State

- Milestone: v0.1.3 — CLI 啟動權限 Bypass Mode（完成）
- Status: Stable
- Last updated: 2026-09-14

## Macro Progress
- [x] Phase 0 專案骨架：Electron + Vite + React + Monaco 三欄殼
- [x] Phase 1 Git 中樞 + ShareProjectMem 檢視器
- [x] Phase 2 多 CLI 終端殼（xterm + node-pty，Claude / Antigravity + 一般 shell）
- [ ] Phase 3 硬體 MCP：**刻意未做** —— 曾建置一組通用工具，經檢討多為冗餘
      （agent 本來就能跑 shell 與讀檔），已整包移除；骨架保留，有真實腳本再掛
- [x] Phase 4 面板整合：待審批紅點、handoff 路徑跳轉、OS 通知
- [x] Customized 面板：跨 agent 的 Skill / MCP / Plugin 一覽與同步、Connections
- [x] 版面可拖曳、終端可停靠右／下、終端分割顯示
- [x] 編輯器多檔分頁（切分頁不丟未存檔編輯）
- [x] 打包發佈（electron-builder，NSIS；已實測 `npm run pack` 產物可啟動）
- [x] Git Commit Graph 視覺化（GitGraphView 拓撲與提交歷史檢視）
- [x] Dashboard 面板：Agent 會話歷史、Token 統計與 Apple HIG 原生警告彈窗
- [x] Settings 與 Browser 面板：全域設定持久化與內建瀏覽器
- [x] Git Commit 點選即時開啟 Diff 比對（Monaco DiffEditor，支援歷史 Commit 比對與檔案切換）
- [x] Preview 預覽面板全域分頁同步（修正關閉殘留）與 Git 歷史版本 Markdown 預覽
- [x] Antigravity CLI 會話防禦降級（解決 conversation not found）
- [x] 中央工作區分段順序優化（Editor / Preview / Memory / Browser）
- [x] Office & PDF 整合：Editor 內建 DocumentViewer（Word/Excel/PowerPoint/PDF）與 Settings 自訂外部工具路徑及自動偵測
- [x] 雙語系 i18n 支援：支援 Strict English 與繁體中文切換，全域面板與 Settings 全面對接
- [x] 檔案樹即時自動監聽與工作區切換連動：後端 fs.watch 廣播、點擊 Session 卡片資料夾無縫切換根目錄
- [x] Dashboard 會話摺疊分組與遙測精準校準：消除幽靈會話、精準校準 Active/Completed 狀態與真實 Token 計算
- [x] 終端 Launchpad 頂部滾動卡住修復與 Mobile Dispatch 完整架構規劃完稿
- [x] v0.1.1 正式發布：整合外部 PR #2 (Codex 擴充掃描與真實會話 Token 統計)、雙語系 i18n 完整實作、資料夾分組與一鍵工作區切換連動、遙測精準校準與終端滾動修正
- [x] v0.1.2 正式發布：開機效能優化（mtime 磁碟持久化快取、面板按需掛載 Mount-on-Demand、冷開機 42 倍加速）、Dashboard 與 Settings CLI 啟用/停用動態連動（即時過濾遙測卡片、會話與資料夾群組，全停用導引橫幅）
- [x] v0.1.3 正式發布：新增 CLI 啟動權限 Bypass Mode（Claude, Codex, Antigravity 官方免審批與跳過權限參數注入、全域設定持久化、終端即時懸浮徽章與排版優化）

## Long-term Tasks
- P1: 真的需要硬體分析時再包 MCP。判準：**只包 LLM 做不到或容易做錯的事**
      （二進位格式解析、確定性的位元運算）；能用 shell 或讀檔解決的不要包。
- P0: 用三家 CLI 的真實輸出校準 `approvalDetect.ts` 的審批提示字串
- P1: Antigravity 的 `mcp_config.json` 外層結構是推定的（該檔初始為 0 bytes），
  第一次 Sync 時要看 diff 並確認 Antigravity 讀得到
- P2: 應用程式圖示（目前用 Electron 預設圖示）

## Blocked / Needs Human Input
- `claude` CLI 需重新登入，否則無法做任何端到端驗證
- Codex 未安裝，Customized 面板維持 Pending 佔位
