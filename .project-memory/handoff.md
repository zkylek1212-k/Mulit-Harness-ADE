# Latest Handoff

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: Dashboard Agent 卡片與會話列表與 Settings CLI 啟用/停用狀態連動
- Branch: feat/dashboard-cli-linkage
- Commit: feat(dashboard): link agent and session visibility to CLI enable/disable settings

## Done
- **後端主行程會話掃描依 CLI 啟用狀態過濾 (Backend CLI Guard)**：
  - `src/main/ipc/dashboard.ts`: 引入 `isCliEnabled(agentId)`，在 `dashboard:data` 抓取會話記錄時，若該 Agent CLI 在 Settings 中已被停用，則跳過其會話掃描（不掃描磁碟、不建立空快取，省去 I/O 與 CPU）；同時在活躍 PTY 進程關聯時排除已停用之 Agent CLI。
- **前端 Dashboard 面板即時連動與空狀態引導 (Reactive UI & Empty State)**：
  - `src/renderer/src/panels/dashboard/DashboardPanel.tsx`: 訂閱 `settingsTick`，當使用者在設定中切換 CLI 啟用/停用開關時，即時重載設定並刷新遙測數據；
  - 遙測卡片網格（`dash-agents-grid`）僅渲染目前啟用的 Agent 卡片；若全部停用則顯示提示 Banner 並提供快捷跳轉「設定 ➔ CLI 設定」按鈕；
  - 統計數值（`workspaceTokens`、`activeProcesses`、`totalSessions`）動態計算已啟用的 Agent 資料；
  - 會話資料夾群組（`folderGroups`）與會話卡片全面過濾已停用的 Agent 歷史，停用後不再顯示；若使用者原本選取的 Agent 被停用，自動重設為 `'all'`；
  - 下方會話清單空狀態在全停用時顯示導引文案與跳轉按鈕。
- **樣式與多國語系 (Styling & i18n)**：
  - `src/renderer/src/panels/dashboard/dashboard.css`: 實作 `.dash-no-agents-banner` 與 `.dash-no-agents-btn`，延續 Apple HIG 半透明磨砂與微互動風格。
  - `src/renderer/src/i18n/index.ts`: 補齊中英文 `noAgentsEnabled` 與 `noAgentsEnabledDesc` 語系鍵值。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（所有 chunk 編譯成功）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。
