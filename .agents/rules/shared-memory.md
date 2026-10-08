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
- Updated: 2026-10-08 Asia/Taipei
- Released: v0.1.39; origin/master and tag at a292b22.
- User explicitly approved commit/push, merging PR #35/#36/#37, releasing a new version, and updating README with Cowork architecture. All completed.
- Release: https://github.com/zkylek1212-k/Mulit-Harness-ADE/releases/tag/v0.1.39

## Done
- Committed Cowork follow-up source/test changes (20 files, +1609/-206) as bb66670 on feat/cowork-p1 and pushed; updated PR #36 title/body.
- Merged GitHub PRs #35 -> #37 -> #36: fe3d2f3, 4365b0d, e721d4b. All are MERGED.
- Created and merged PR #38 (release/v0.1.39 @ ba8f0c1) with package/lock version bump, changelog, bilingual README usage/budgets/concurrency, and docs/cowork-architecture.md. Docs include 3 Mermaid diagrams and module/storage/isolation/recovery boundaries.
- Built from a clean release worktree using npm ci; published installer, portable ZIP, blockmap and latest.yml. Public release is latest, not draft/prerelease. Uploaded asset sizes and SHA-256 digests match local files; updater SHA-512/filename/version verified.
- Cowork now includes Discussion/Project modes, sequential public turns/follow-ups, retry/skip, multiple independent tabs and concurrent meetings, configurable recorder/cumulative summaries, chair conclusion and editable conversion to Project, explicit approval before worktree execution, budget controls and stage-based effort.
- Four screenshot fixes and latest Settings layout/model changes are included: + menu/New Terminal card entry, Claude Windows launch, themed alerts, complete model versions, aligned cards, responsive bilingual Settings, no Custom model input. Existing unknown saved models remain visible as disabled entries.

## Validation
- Previously tested integrated source matches ALL src/scripts files on merged master (version/docs added afterward). User said the interface looks good.
- Integrated typecheck/build, full fake-CLI check-cowork.mts, Electron check-terminal-ui.cjs and check-cowork-tabs.cjs passed; tabs/settings tests also passed on the owning branch. Layout matrix: 1200/720 px x en/zh-TW x 4 themes.
- Release worktree: clean npm ci, npm run typecheck, npm run dist -- --publish never passed. Three documentation diagrams rendered in Electron.
- Actual packaged app launched with isolated userData, rendered UI and exposed Cowork IPC; packaged version/headless-xterm dependencies verified. Portable ZIP contains executable and app.asar (98 entries).
- New Discussion/summary end-to-end checks use fake CLIs. No new paid real-provider discussion/summary run was performed; response quality/latency still needs live use.

## Worktrees and source state
- Main remains local master @ 6daaada before this memory commit; divergent from origin/master (ahead 14 memory commits / behind 34 before this commit). Its source is OLD; do not run/build from main or auto sync/reset it.
- Release worktree: %LOCALAPPDATA%/Temp/agent-workbench-release-v0.1.39; release/v0.1.39 @ ba8f0c1, clean, with real npm-ci node_modules and release assets.
- Owning worktree: %LOCALAPPDATA%/Temp/agent-workbench-cowork-ui; feat/cowork-p1 @ bb66670, clean; node_modules junction still points to the test worktree.
- Test worktree: %LOCALAPPDATA%/Temp/agent-workbench-test-pr35-37; test/pr-35-36-37 @ d0ee494 with uncommitted integrated follow-up changes (now published through owner), intentionally retained for the user's open test environment. Code matches release source; version still 0.1.38.
- Older ime-fix / release-v0.1.35 worktrees and remote feature branches retained; no forced cleanup of user's running/dirty test workspace.
- Main untracked Temp/ and phone screenshots left untouched; main node_modules remains stale (no headless/serialize addons).

## Next / limits
- Use release installer/portable for current version, or npm run dev in the retained test worktree. Dev and installed remote ports both default to 47600; stop the installed remote when testing mobile and use Reload mobile interface.
- Concurrent Discussion/Project planning allowed in the same repo; actual execution stays one per repo until merged/cleaned, including paused/review worktrees. Tabs/drafts are session-local; history persists.
- Budgets default 6 calls/20 planning minutes/60 execution minutes; settings ranges 3-30 calls, 1-120 planning minutes, 1-600 execution minutes. Summaries/conclusions/repair consume calls. Service raise ceiling 60/240; Discussion increase button 30/120.
- Known PR #37 synthetic edge cases remain unconfirmed on real CLIs (statusline after numbered options; unnumbered approval menus). Prior details preserved in archived handoffs.
- Canonical shared memory is local-only (MEM_AUTOPUSH=0); source, docs, version, tag and release ARE pushed/published. No push of divergent main.
- Windows UTF-8 reads must use explicit UTF8; PowerShell ASCII pipeline can corrupt Chinese when piping code into Node. Use apply_patch or explicit UTF8 output encoding.

## Detailed history
- Pre-release handoff: archive/handoff-2026-10-08-cowork-before-v0.1.39-release.md.
- Recorder and UI implementation details: archive/handoff-2026-10-08-cowork-before-settings-layout.md and earlier archives referenced there.

<!-- END AUTO-MEMORY -->
