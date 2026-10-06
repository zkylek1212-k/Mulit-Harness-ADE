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

- Agent: Antigravity
- Updated: 2026-10-06 Asia/Taipei
- User authorization: merge and release new version; completed.
- PR #30: https://github.com/zkylek1212-k/Mulit-Harness-ADE/pull/30 (MERGED).
- Source commit: bedd79db8a36690b3447db72e0a3712a6d120c75, branch `feat/terminal-cross-agent-scrollback-v0.1.36`.
- Merge/tag/origin-master commit: 952b6364d53fb9beddc8061b3eda075cd7904b39.
- Release: https://github.com/zkylek1212-k/Mulit-Harness-ADE/releases/tag/v0.1.36 (public, latest, published 2026-10-06T05:54:42Z).

## Done
- **PR #30 Merged**:
  - Merged PR #30 into `master` using `gh pr merge 30 --merge`.
  - Annotated tag `v0.1.36` created and pushed at merge commit `952b636`.
- **v0.1.36 Released & Published**:
  - Built Windows installer, packaged native PTY bindings, created portable ZIP, and published via `scripts/release.ps1`.
  - All four assets uploaded to GitHub Releases:
    - `Agent-Workbench-0.1.36-setup.exe` (123.98 MB)
    - `Agent-Workbench-0.1.36-portable.zip` (169.62 MB)
    - `latest.yml` (auto-update metadata)
    - `Agent-Workbench-0.1.36-setup.exe.blockmap` (0.13 MB)
- **Features in v0.1.36**:
  - **Codex CLI**: 自動注入 `--no-alt-screen`，關閉 Alternate Screen Mode，改為 inline 串流輸出，完整保留 xterm scrollback 歷史。
  - **Claude Code CLI**: 手機端實作 `ClaudeHistoryStream`，攔截 React Ink 清螢幕指令（`\x1b[2J\x1b[H`），轉化為向 scrollback 推進換行並補上淡色橫向回合分隔線（`─`），使前幾回合交談自然留在卷軸緩衝區中，隨時可向上滑動回溯。
  - **手機端輸入管道**: upstream prompt 輸入框、快捷鍵按鈕與審批核可完全不受影響，100% 保持正常操作。
  - **架構決策**: DEC-007 記入 `.project-memory/DECISIONS.md`。

## Validation
- `npm run typecheck`: 通過（0 錯誤）。
- `npx electron scripts/check-terminal-ui.cjs`: 完整測試套件全數通過，包含 Codex `--no-alt-screen`、Claude 多回合歷史保留、CJK 換行、原生滾動與各尺寸/縮放驗證。
- Electron 打包與 Windows NSIS 安裝程式建置成功，portable ZIP 與 auto-updater metadata 驗證通過。

## Limits / Local State
- 實體 iPhone Safari / PWA 驗證待使用者測試。更新桌面端後，在手機端 Settings 點擊「Reload mobile interface」即可載入新版 UI。
- 本地專案記憶遵循本機優先原則。

<!-- END AUTO-MEMORY -->
