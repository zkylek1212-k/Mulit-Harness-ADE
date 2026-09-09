# Project State

- Milestone: M1 — Workbench 可用骨幹（編輯／Git／預覽／終端殼）
- Status: In progress
- Last updated: 2026-09-09

## Macro Progress
- [x] Phase 0 專案骨架：Electron + Vite + React + Monaco 三欄殼
- [x] Phase 1 Git 中樞 + ShareProjectMem 檢視器
- [x] Phase 2 多 CLI 終端殼（xterm + node-pty，Claude / Codex / Antigravity）
- [x] Phase 4 面板整合：待審批紅點、handoff 路徑跳轉、OS 通知
- [ ] Phase 3 硬體 MCP：Python USB／BIOS Log 腳本包成 MCP server 掛給各 CLI
- [ ] 打包發佈（electron-builder）與跨機安裝流程

## Long-term Tasks
- P0: 把既有 Python 硬體分析腳本包成 MCP server，於 `agents/claude_dev.yaml` 註冊給 CLI
- P0: 實測三家 CLI 在終端殼內的實際行為（審批提示字串、ANSI 相容性）
- P1: 打包成可安裝檔；跨機 clone 後需 `git config core.hooksPath .githooks`
- P1: 編輯器分頁（目前中央一次只開一個檔）
- P2: Git Commit Graph 視覺化（刻意延後，agent 工作流優先要 diff review）

## Blocked / Needs Human Input
- Antigravity CLI 的實際執行檔名與參數尚未確認，`BUILTIN_CLIS` 目前假設為 `antigravity`
- 待審批偵測目前是文字啟發式（見 `src/renderer/src/panels/terminal/approvalDetect.ts`），
  需要用三家 CLI 真實輸出校準提示字串
