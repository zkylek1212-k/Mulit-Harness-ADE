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

- Updated: 2026-09-11 Asia/Taipei
- Agent: Claude (Opus 4.8)
- Task: 整理成可上傳 GitHub 的初始版 v0.1.0（MIT），並做 IP/所有權 review
- Branch: master
- Commit: 見本輪 release commit

## Done
- **Commit-diff 修復**（前一輪）：Git Graph / Recent Commits 點擊改走 `git.commitFileDiff`（見 `EditorPanel.tsx`），已於 commit 2c64c41 落地。
- **v0.1.0 打包整理**：
  - 新增 `LICENSE`（MIT, © 2026 zkylek1212-k）與雙語 `README.md`（英文為主 + 繁中；含功能、build 指令、商標免責、第三方授權說明）。
  - `.gitignore` 補上：`.workbench/settings.json`、`.workbench/dashboard-state.json`（每機 runtime state）、`.agents/skills/`（本機外部 skill clone）。
  - `package.json`：`version 0.1.0` / `license MIT`、`author` 改為 `zkylek1212-k`，並加 `repository`/`homepage`/`bugs`（repo: github.com/zkylek1212-k/Mulit-Harness-ADE）。
  - `electron-builder.yml` appId 改為 `io.github.zkylek1212-k.agent-workbench`。
  - 個人資訊/本機路徑掃描：追蹤檔內無本機路徑、email、使用者名（paths.ts 皆為 env 動態組出）；僅有的 `zkyle` 署名已全數改為 `zkylek1212-k`。
- **IP/所有權 review 發現**：
  - 所有 runtime 依賴皆 MIT（monaco、xterm、react、simple-git、@lydell/node-pty…），與 MIT 相容；TypeScript 為 Apache-2.0 但僅 devDependency、不隨產品散布。
  - `.agents/skills/apple-design/` 是 `github.com/dickwu/apple-design-skill` 的 clone 且**無 LICENSE（預設全權利留保）**，且帶自己的 `.git` → **已排除，不得併入本 repo**。
  - 商標：Claude Code / Codex / Antigravity / VS Code 屬各家所有；README 已加獨立、未關聯之免責聲明。
  - 無捆綁二進位資產、無專有圖示；未發現逐字抄襲他人程式碼。

## Not done
- 尚未 `git remote add` 也未 push（repo 尚無 remote）。
- 未做正式專利檢索（需律師/專利檢索服務；MIT 不含明示專利授權）。

## Next agent should
- 若要上傳：`git remote add origin <url>` → `git push -u origin master` →（可選）`git tag v0.1.0 && git push --tags`。
- 上傳後於 GitHub 設定 repo 描述與 topics；README 的商標免責已就緒。

## Tests
- `npm run typecheck` → pass（TS 零錯誤）。未跑實機/單元測試。

## Warnings (do-not-touch)
- `src/preload/index.ts` 是唯一 IPC 契約、`src/renderer/src/store.ts` 是跨 panel 狀態。
- 主題一律用 `src/renderer/src/styles.css` 的 CSS 變數，不要在 panel 內寫死顏色。
- pty 用 `@lydell/node-pty`（預編譯）；不要換回 `node-pty`（Windows 編不起來）。
- App.tsx 切換終端停靠必須維持單一 JSX 結構（只換 grid-template-areas），否則 React remount 殺掉終端 session。
- `src/main/ipc/pty.ts` 的 `hardKill()` 不要簡化成只呼叫 `p.kill()`。
- 打包設定的 `asarUnpack` 不可移除，否則安裝版終端無法啟動。
- `.agents/skills/` 為本機外部 clone，已 gitignore，勿加入版控。

<!-- END AUTO-MEMORY -->
