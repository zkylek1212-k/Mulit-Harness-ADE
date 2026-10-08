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
- Updated: 2026-10-08 Asia/Taipei
- Current workspace: master (clean working tree except untracked Temp/ and images). Release remains v0.1.39.
- Next feature tracking: Linux support issue #40 (https://github.com/zkylek1212-k/Mulit-Harness-ADE/issues/40).

## Completed
- Assessed Linux platform compatibility for Agent Workbench across Electron runtime, terminal pty, CLI paths, window frame, and packaging.
- Created GitHub Issue #40: `feat: 支援 Linux 平台 (Support Linux packaging, native window frame, and CI build)`.
- No application source code modified in this turn.

## Linux Support Roadmap (Issue #40)
1. Window frame & controls: In `src/main/index.ts`, switch `titleBarStyle` on Linux to `default` (or provide controls) because WCO `titleBarOverlay` is Windows-only.
2. Shell detection: In `src/main/ipc/pty.ts`, support `process.env.SHELL || 'bash'` for bash/zsh/fish.
3. Protected paths: In `src/main/ipc/settings.ts`, protect Linux root directories (`/`, `/usr`, `/etc`, etc.).
4. Package targets: In `electron-builder.yml`, add Linux targets (`AppImage`, `deb`, `tar.gz`).
5. Packaging & CI: Build via GitHub Actions (`ubuntu-latest`) to compile native `@lydell/node-pty` addon for Linux.

## Detailed history
- Previous release/sync handoff archived in `.project-memory/archive/handoff-2026-10-08-main-sync-complete.md`.

<!-- END AUTO-MEMORY -->
