# Latest Handoff

- Updated: 2026-09-09 22:10 Asia/Taipei
- Agent: Claude Code
- Task: Phase 3 硬體 MCP、編輯器分頁、打包發佈（收尾整個工具）
- Branch: master
- Commit: Uncommitted

## Done（本輪）
- **修掉一個會直接出貨的核心 bug：Monaco 編輯器根本沒在運作。**
  `@monaco-editor/react` 預設從 CDN 載入 monaco，而本 app 的 CSP 是 default-src 'self'，
  請求被擋 → 編輯器永遠停在 "Loading..."。先前畫面都停在自訂空狀態元件，所以沒露餡。
  改為 `src/renderer/src/monaco-setup.ts`：`loader.config({ monaco })` 用本地打包版，
  並依 Vite 慣例掛上各語言 worker；CSP 補 `worker-src 'self' blob:`。
  bundle 因此從 2.7MB 增為 9.1MB（monaco 本地化的必然代價）。已截圖確認語法高亮、
  行號、minimap 全部正常。
- **硬體分析 MCP：已建置後移除（使用者決定）。**
  原規劃 Phase 3 寫「接入現有 Python 腳本」，但 repo 內沒有任何腳本，我自行寫了一組
  通用工具頂替。事後檢討：四個工具裡只有 pcap 解析（二進位、LLM 讀不了）與
  descriptor 拆解（LLM 算術易錯）真的掙到位置；list_devices 與 log 分析 agent 本來就會做，
  是為做而做。且我把它設成 launcher 預設載入，等於把用不到的東西強加給使用者。
  **決議：整包移除，骨架（Customized 面板 + manifest + 同步）保留，日後有真實腳本再掛。**
- **編輯器多檔分頁**：store 新增 `openTabs` / `closeTab`；EditorPanel 每檔一份 model，
  **切換分頁不會弄丟未存檔的編輯**，關閉有未存檔的分頁會先確認。
- **打包發佈**：`electron-builder.yml`（NSIS）＋ `npm run pack` / `npm run dist`。
  `@lydell/node-pty` 以 asarUnpack 解包（不解包的話打包後終端整個起不來），
  硬體 MCP 以 extraResources 隨附。實測產物可啟動、stderr 空白。

## Not done / 待驗證
- Phase 3 硬體 MCP：**刻意未做**。要掛時在 Customized 面板新增 MCP 項目即可，
  或直接編 `.workbench/extensions.yaml`（檔內有註解範例）。
- Antigravity 的 `mcp_config.json` 外層結構仍是推定（該檔初始 0 bytes）。
- Git Commit Graph 刻意未做。
- 應用程式圖示未設，目前是 Electron 預設圖示。

## Next agent should
1. 請使用者重新登入 `claude`，跑上面那行確認 `mcp__hardware__*` 工具出現
2. 用三家 CLI 真實輸出校準 `src/renderer/src/panels/terminal/approvalDetect.ts`
3. 第一次按 Customized 的 Sync 時，逐一檢視 diff 再套用（會寫到 `~/` 底下）

## Tests
- `npm run typecheck` → pass
- `npm run build` → pass
- `npm run pack` → 產物 `release/win-unpacked` 可啟動，stderr 空白
- 自動化 UI 測試：開兩個 PowerShell、左右分割、底部停靠 → pass

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`，Windows 上編不起來
- **App.tsx 切換終端停靠必須維持單一 JSX 結構**（只換 grid-template-areas）。
  改成兩個分支各自渲染 TerminalPanel 會導致 React remount，殺掉所有終端 session。
- **`src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`**：
  node-pty 在 Windows 會先 fork conpty_console_list_agent，該 helper 在 Electron 下
  必定崩潰，要等滿 5 秒 timeout，關 app 時會留下孤兒 shell 行程。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
