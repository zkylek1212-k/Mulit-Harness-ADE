# Latest Handoff

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 修復終端頂部滾動卡住問題、剖析並修復 Session 活躍(Active)與完成(Completed)狀態不準確及更新機制
- Branch: feat/mobile-dispatch
- Commit: pending memory commit

## Done
- **終端 Launchpad 頂部滾動截斷卡住修復**：
  - `src/renderer/src/panels/terminal/terminal.css`: 解決 Flexbox 滾動容器經典負座標剪裁（Flexbox scroll clipping）問題。將 `.term-launchpad` 由 `justify-content: center` 修正為 `justify-content: flex-start`，並將 `.term-launchpad-content` 之 `margin: auto auto` 修正為 `margin: 0 auto`，使窄寬度或內容溢出時頂部標題、副標題及頂部卡片圖示能 100% 完整顯示且可自然滾動至頂。
  - 新增 `@container launchpad (max-width: 330px)` 專屬緊湊間距與字級設定。
- **Session 狀態 (Active / Completed) 誤判與更新機制徹底修復**：
  - **Antigravity 誤判 Completed 成因與修復**：Windows NTFS 中資料夾 mtime 不隨深層檔案更新，原先讀取 `d.path` 導致時間永遠停留在資料夾建立的數十分鐘前；修正為讀取 `.system_generated/logs/transcript.jsonl` 的真實 `statSync(logPath).mtimeMs`，使正在對話進行中的 Antigravity 會話即時呈現 `● Active`。
  - **Claude 幽靈 Active 成因與修復**：原先僅以檔案寫入時間 < 5 分鐘就硬標記為 `active`，導致終端早已關閉結束的會話仍顯示活躍；修正為磁碟紀錄預設為 `completed`/`idle`，僅在 `activePtySessions` 中真正有執行中終端行程匹配時才賦予 `active`。
  - **PTY 行程匹配機制完善**：引入 `matchedSet` 防止重複歸屬，落實優先匹配關聯 sessionId、工作區目錄與時間戳，若為全新 CLI 則呈現即時活躍卡片。
  - **狀態文字中英文在地化**：在 `i18n` 補充 `statusActive`、`statusCompleted`、`statusIdle`、`statusWaitingApproval`，支援中英文切換。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（已通過 Vite 與 Electron 打包編譯）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。
