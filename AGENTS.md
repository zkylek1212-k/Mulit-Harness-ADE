# Agent Instructions

Canonical cross-agent memory is `.project-memory/`.

## Startup — run this ONE command first, every session

```bash
bash .project-memory/status.sh
```

It prints tier-1 memory (`INDEX.md` + `handoff.md`) and reports whether the branch is behind the
remote. Do not read those two files separately — the command already gave you their contents.

Then:
1. Inspect `git status --short` and `git branch --show-current`.
2. Summarise the current context in <=3 bullets.
3. Read `.project-memory/PROTOCOL.md` on first entry to this repo, for Git/worktree/merge tasks,
   for memory-file changes, or when the rules are unclear.
4. Read `STATE.md` / `DECISIONS.md` only when the task needs macro status or architecture history.

## Before finishing

Apply the memory-update criteria in `PROTOCOL.md`: rewrite `handoff.md` when the work meets the
threshold; skip it entirely for read-only questions, trivial explanations, and no-change reviews.

Then commit the memory yourself — an uncommitted handoff does not exist for anyone else:

```bash
bash .project-memory/commit-handoff.sh "docs(memory): <one-line summary>"
```

It is pathspec-limited to memory files, so the user's staged source changes are left untouched.
It pushes only when `MEM_AUTOPUSH=1`; otherwise say clearly that the handoff is not pushed yet.

## Never

- Auto pull/rebase/merge/reset/force-push without user authorization. `git fetch` is read-only and fine.
- Commit the user's SOURCE code on your own initiative — committing shared memory is fine, that is not.
- Commit secrets, tokens, passwords, API keys, or private keys.
- Rewrite historical decisions — supersede them instead.

<!-- BEGIN AUTO-MEMORY (generated from .project-memory/handoff.md - do not edit) -->

## Current shared memory (tier 1 - auto-generated, do not edit here)

You already have the current handoff below. Do NOT re-read `.project-memory/handoff.md`.
Read `STATE.md` / `DECISIONS.md` / `PROTOCOL.md` only on demand.
For the freshest copy plus a remote-drift check, run `bash .project-memory/status.sh`.

---

# Latest Handoff

- Updated: 2026-09-14 Asia/Taipei
- Agent: Antigravity (Gemini 3.8 Flash)
- Task: 合併雙分支並正式發布 v0.1.2（開機效能優化 + Dashboard CLI 動態連動）
- Branch: master
- Commit: chore(release): bump version to v0.1.2 and add changelog

## Done
- **雙分支完整合併至 master**：
  - 合併 `perf/fast-startup`（mtime 快取、冷啟動 42 倍加速、面板按需掛載）與 `feat/dashboard-cli-linkage`（Settings CLI 啟用/停用動態過濾 Dashboard 遙測卡片與會話紀錄）。
- **進版至 v0.1.2 與發布描述文件**：
  - `package.json` & `package-lock.json`：進版至 `0.1.2`。
  - `CHANGELOG.md`：建立標準 Keep a Changelog 格式變更日誌，詳細記錄 v0.1.2 之更新亮點、新增功能與效能改進。
  - `README.md`：更新中英文功能清單（極速冷啟動與快取、Dashboard CLI 連動）。
  - `.project-memory/STATE.md`：里程碑正式更新為 `v0.1.2` 完成。
- **後端主行程合流**：
  - `src/main/ipc/dashboard.ts`: 結合 mtime 磁碟持久化快取與 `isCliEnabled(agentId)` 雙重防護，已停用的 Agent 既不讀磁碟、亦不建快取，啟用的 Agent 則直接享受 < 7ms 極速快取命中。
- **前端面板合流**：
  - 按需掛載（Mount-on-Demand）降低冷開機負載，同時 Dashboard 即時監聽 `settingsTick`，動態顯示/隱藏卡片與會話。

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

<!-- END AUTO-MEMORY -->
