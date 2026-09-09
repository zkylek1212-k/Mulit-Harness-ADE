# Project State

- Milestone: M1 — Workbench 可用骨幹（完成）
- Status: Stable
- Last updated: 2026-09-09

## Macro Progress
- [x] Phase 0 專案骨架：Electron + Vite + React + Monaco 三欄殼
- [x] Phase 1 Git 中樞 + ShareProjectMem 檢視器
- [x] Phase 2 多 CLI 終端殼（xterm + node-pty，Claude / Antigravity + 一般 shell）
- [x] Phase 3 硬體 MCP：`tools/hardware-mcp/server.py`（純標準庫，零 pip 安裝）
- [x] Phase 4 面板整合：待審批紅點、handoff 路徑跳轉、OS 通知
- [x] Customized 面板：跨 agent 的 Skill / MCP / Plugin 一覽與同步、Connections
- [x] 版面可拖曳、終端可停靠右／下、終端分割顯示
- [x] 編輯器多檔分頁（切分頁不丟未存檔編輯）
- [x] 打包發佈（electron-builder，NSIS；已實測 `npm run pack` 產物可啟動）
- [ ] Git Commit Graph 視覺化（刻意延後，agent 工作流優先要 diff review）

## Long-term Tasks
- P0: **端到端驗證硬體 MCP 掛進 Claude Code** —— MCP server 本身已用真實協定
  往返驗過（initialize / tools/list / tools/call 全通），但「CLI 是否真的載入它」
  尚未驗證，因為本機 `claude` 的 OAuth session 過期。重新登入後跑：
  `claude -p "list mcp__hardware tools" --mcp-config .mcp/hardware.json`
- P0: 用三家 CLI 的真實輸出校準 `approvalDetect.ts` 的審批提示字串
- P1: Antigravity 的 `mcp_config.json` 外層結構是推定的（該檔初始為 0 bytes），
  第一次 Sync 時要看 diff 並確認 Antigravity 讀得到
- P1: 若要真的分析 USB 封包內容（而非摘要），再評估是否引入 scapy
- P2: 應用程式圖示（目前用 Electron 預設圖示）

## Blocked / Needs Human Input
- `claude` CLI 需重新登入，否則無法做任何端到端驗證
- Codex 未安裝，Customized 面板維持 Pending 佔位
