# Shared Project Memory

This workspace uses `.project-memory/` as the canonical cross-agent memory.

## Startup — run this ONE command first, every session

```bash
bash .project-memory/status.sh
```

It prints tier-1 memory (`INDEX.md` + `handoff.md`) and reports remote drift. Do not read those two
files separately — you already have their contents.

Then inspect `git status --short` and `git branch --show-current`, and summarise the context in
<=3 bullets before substantial work. Read `.project-memory/PROTOCOL.md` on first entry to this repo,
for Git/worktree work, for memory changes, or when uncertain. Read `STATE.md` and `DECISIONS.md`
only on demand.

## Before finishing

Apply the memory-update criteria in `PROTOCOL.md`. Rewrite `handoff.md` when the work meets the
threshold; skip memory updates for read-only questions and trivial, no-change work.

Then commit the memory yourself — an uncommitted handoff does not exist for anyone else:

```bash
bash .project-memory/commit-handoff.sh "docs(memory): <one-line summary>"
```

It is pathspec-limited to memory files, so staged source changes are left untouched. It pushes only
when `MEM_AUTOPUSH=1`; otherwise say clearly that the handoff is not pushed yet.

## Never

Do not auto pull, rebase, merge, reset, or force-push without user authorization.
Do not commit the user's source code on your own initiative — committing shared memory is fine.
Never store secrets in project memory. Never rewrite historical decisions — supersede them.

<!-- BEGIN AUTO-MEMORY (generated from .project-memory/handoff.md - do not edit) -->

## Current shared memory (tier 1 - auto-generated, do not edit here)

You already have the current handoff below. Do NOT re-read `.project-memory/handoff.md`.
Read `STATE.md` / `DECISIONS.md` / `PROTOCOL.md` only on demand.
For the freshest copy plus a remote-drift check, run `bash .project-memory/status.sh`.

---

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
- **硬體分析 MCP server**：`tools/hardware-mcp/server.py`，MCP stdio + JSON-RPC 2.0，
  **純標準庫、零 pip 安裝**。四個工具：
  - `usb_list_devices`：Windows 走 Get-PnpDevice，Linux/macOS 走 lsusb 或 pyusb；
    都沒有時回報缺什麼，不假造裝置。實測列出本機 37 個裝置。
  - `usb_parse_descriptor`：解析 device / config / interface / endpoint / string 描述元。
  - `pcap_summary`：自寫 pcap 與 pcapng 解析（含 USB link type），不需要 scapy。
  - `analyze_log`：BIOS／serial log 的錯誤警告、POST code、最大時間間隔、重複行。
  - `py -3 tools/hardware-mcp/server.py --selftest` 為隨附自我檢查（純解析器 + 協定面）。
- 串接：`.mcp/hardware.json`、`agents/claude_dev.yaml`（`--mcp-config`）、
  `.workbench/extensions.yaml` 的 manifest 都指向真實 server。
- **編輯器多檔分頁**：store 新增 `openTabs` / `closeTab`；EditorPanel 每檔一份 model，
  **切換分頁不會弄丟未存檔的編輯**，關閉有未存檔的分頁會先確認。
- **打包發佈**：`electron-builder.yml`（NSIS）＋ `npm run pack` / `npm run dist`。
  `@lydell/node-pty` 以 asarUnpack 解包（不解包的話打包後終端整個起不來），
  硬體 MCP 以 extraResources 隨附。實測產物可啟動、stderr 空白。

## Not done / 待驗證
- **硬體 MCP 掛進 Claude Code 尚未端到端驗證**：server 本身已用真實協定往返驗過，
  但 `claude` CLI 的 OAuth session 過期，無法確認 CLI 真的載入它。
  重新登入後跑：`claude -p "list mcp__hardware tools" --mcp-config .mcp/hardware.json`
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
- `npm run mcp:selftest` → selftest OK
- MCP 協定往返（initialize / tools/list / tools/call）→ pass，真實列出 37 個 USB 裝置
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

<!-- END AUTO-MEMORY -->
