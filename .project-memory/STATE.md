# Project State

- Milestone: M1 — Workbench 可用骨幹（完成）
- Status: Stable
- Last updated: 2026-09-09

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
- [ ] Git Commit Graph 視覺化（刻意延後，agent 工作流優先要 diff review）

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
