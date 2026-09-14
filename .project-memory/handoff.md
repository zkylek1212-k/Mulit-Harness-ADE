# Latest Handoff

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 修復設定語言選擇 radio dot 實心狀態樣式
- Branch: feat/mobile-dispatch
- Commit: pending memory commit

## Done
- **修復語言卡片 Radio Dot 實心狀態（CSS 規則缺漏修復）**：
  - 在 `src/renderer/src/components/settingsModal.css` 中，原本僅針對 `.macos-theme-card.active .macos-radio-dot` 定義了 `border-color: var(--accent)`、`background: var(--accent)` 與 `:after` 白點樣式，缺少 `.macos-lang-card.active` 的對應規則，導致語言卡片選中時圓圈維持中空。
  - 已補齊 `.macos-lang-card.active .macos-radio-dot` 及通用 `.active .macos-radio-dot` 樣式，並增設柔和的過渡動畫（`transition: border-color 0.15s ease, background 0.15s ease`），選中時圓圈即轉為主題強調色實心與中央亮點（標準 Apple macOS HIG Radio 風格）。
- **優化 Dashboard 靜默輪詢**：
  - `src/renderer/src/panels/dashboard/DashboardPanel.tsx`: `loadData(silent)` 在背景每 5 秒輪詢時採靜默模式，不觸發右上角重新整理按鈕旋轉或短暫 disabled，操作更平滑。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。
- `npm run build` → pass（Vite / Electron 生產環境打包編譯通過）。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。
