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

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 深入分析與修復 Session Token 正確性及活躍狀態顯示 completed 根因
- Branch: feat/mobile-dispatch
- Commit: pending memory commit

## Done
- **Token 正確性分析與計算法修復**：
  - **Claude 專案 Token**：底層讀取 Anthropic API 的真實 usage 標頭（`input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`）。修復 `dashboard.ts` 中 `toolTokens += estimateTokens(len.toString())` 之嚴重 bug（原將字元長度轉為字串如 `"20000"` 計為 5 字元 = 2 tokens），改為 `Math.ceil(len / 3.5)` 正確計算工具 payload。
  - **Antigravity Token**：日誌由 Gemini IDE 產生，因 transcript 僅記錄完整文字對話而無底層 API usage 標頭，採業界通用之字元數比率（`Math.ceil(charCount / 3.5)`）進行 BPE token 估算。
- **解決「明明還在 active 卻顯示 completed」之根本原因**：
  - **根因 1（工作區正規化與 Regex 逃逸字元 Bug）**：`extractAntigravityWorkspace` 於匹配工具調用之 `Cwd` 時，因未處理跳脫引號 `\"`，導致路徑擷取為 `"\\"`。在 Windows 下 `fs.existsSync("\\")` 為 true（磁碟根目錄），導致工作區路徑錯設為 `"\\"`，進而使 `workspace.root` 比對永遠失敗，會話狀態始終困在預設值 `completed`。已修正將當前 `workspace.root` 優先級移至第一位，並修復 `cwd` 引號清理與路徑比對長度防禦。
  - **根因 2（即時日誌活躍度偵測）**：歷史會話掃描不再一律標記為 `completed`，改依 `lastActiveTime` 即時判定（5 分鐘內有磁碟寫入更新者判定為 `active`，20 分鐘內為 `idle`，超過則為 `completed`）。
  - **根因 3（PTY 終端行程與 Agent Session ID 鏈結）**：`src/preload/index.ts` 之 `PtySpawnOptions` 與 `src/main/ipc/pty.ts` 之 `ActiveSessionMeta` 增設 `sessionId` 與 `cwd`；`TerminalPanel.tsx` 於啟動終端時精確傳遞 `associatedSessionId`，讓後端可直接 100% 精準將活躍 PTY 映射至 Session 卡片，杜絕重複產生 0 token 的 standalone 假卡片。

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

<!-- END AUTO-MEMORY -->
