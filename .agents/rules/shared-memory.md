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

- Agent: Codex
- Updated: 2026-10-02 Asia/Taipei
- User authorization: create the PR, merge it, and release the new version; completed.
- PR #29: https://github.com/zkylek1212-k/Mulit-Harness-ADE/pull/29 (MERGED).
- Source commit: 277dfeaaf0bbc5d8d14031e452924c26fba89a11, branch fix/mobile-readable-terminal-v0.1.35.
- Merge/tag/origin-master commit: b2302eca3060d3db530bc6a26870b1cc90f9350b.
- Release: https://github.com/zkylek1212-k/Mulit-Harness-ADE/releases/tag/v0.1.35 (public, latest, published 2026-10-02T08:32:43Z).

## Done
- Published the readable mobile terminal repair described in DEC-006. Preserve the user's requirement: vertical scrolling only, readable text, no desktop-canvas scaling or phone resizing of the shared PTY.
- PR contains exactly six files: TerminalView.tsx, remote.css, check-terminal-ui.cjs, package.json, package-lock.json and CHANGELOG.md; 231 insertions / 190 deletions. Local memory and screenshots were excluded.
- Prepared v0.1.35 from origin/master in an isolated worktree, committed/pushed the source branch, created PR #29, merged it and pushed annotated tag v0.1.35 at the merge commit.
- Verified the merged tree is identical to the validated source tree before publication.
- Built Windows installer and native PTY package, then published with scripts/release.ps1 -SkipBuild after validated packaging.
- All four assets uploaded: Agent-Workbench-0.1.35-setup.exe, Agent-Workbench-0.1.35-portable.zip, latest.yml and setup blockmap. GitHub asset sizes and SHA-256 digests match local files.
- Auto-update metadata version, installer name/size and SHA-512 verified. Portable ZIP executable present; its app.asar SHA-256 matches the verified installed package.
- Prior repair handoff preserved at archive/2026-10-02-mobile-repair-pre-release.md; prior v0.1.34 release handoff remains in its archive.

## Validation
- npm run typecheck: passed for v0.1.35.
- npx electron scripts/check-terminal-ui.cjs: entire suite passed, including session reopening, hidden tabs, alternate screen, ANSI redraw/styles/cursor, CJK/emoji/long text, vertical history/follow behavior, 320/390/768px at device scales 1/2/3 and existing IME/file/workspace/version checks.
- npm run dist -- --publish never: passed (Electron 33.4.11, x64 NSIS).
- Packaged app.asar version 0.1.35, native PTY unpacking and wrapped-mobile JS/CSS assets verified.
- Release worktree is clean and detached at b2302ec: C:/Users/milan.chang/AppData/Local/Temp/agent-workbench-release-v0.1.35/.
- Test screenshot artifacts: C:/Users/milan.chang/AppData/Local/Temp/workbench-terminal-check-J6jXyh/.

## Limits / local state
- Physical iPhone Safari/PWA validation remains pending. After updating the desktop app, mobile Settings > Reload mobile interface loads the new UI.
- Native text wraps full-screen TUI layouts; fixed-grid visual geometry may differ from desktop. Existing 5000-line/120ms rendering and raw-server 256KiB snapshot-tail limits remain.
- Main workspace is still on local master with its memory commit and the three original uncommitted repair files, matching the published repair. Its package version/build remains 0.1.34. No local master sync or source overwrite was performed.
- User screenshots and previous temp files remain untouched. Release worktree and artifacts are retained.
- Shared memory is committed locally only; not pushed (MEM_AUTOPUSH=0). Do not push local master with memory commits into the public source history; future source branches should start at origin/master b2302ec.

<!-- END AUTO-MEMORY -->
