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

- Agent: Codex
- Updated: 2026-10-08 Asia/Taipei
- Main: master @ 29e155a before this memory commit; still diverged from origin. Source changes live ONLY in the two temporary worktrees.
- Owning PR #36: feat/cowork-p1 @ 9b8cca7, %LOCALAPPDATA%/Temp/agent-workbench-cowork-ui.
- Integrated test: test/pr-35-36-37 @ d0ee494, %LOCALAPPDATA%/Temp/agent-workbench-test-pr35-37.
- User authorized implementation and local testing. No new source commit, push, GitHub merge or release authorized/performed. Memory commits remain local/unpushed.

## Ready for hands-on testing
- Implemented Discussion / Project mode selector (Discussion default); historical runs remain Project with original CLI effort defaults.
- Discussion: chair then participants speak sequentially with preceding public transcript; replies link to the actual referenced message. User can start another round. Failure shows actual error, retry resumes that speaker without replaying previous replies; explicit skip excludes the speaker from later rounds, including a failed chair.
- Discussion creates no Git snapshot and loads no project instructions or selected skills. CLI runs in an isolated per-run conversation directory; Claude tools disabled, Codex read-only/skip-git-repo-check, existing Antigravity isolation/sandbox retained. Ordinary folders supported.
- Project: opening proposal, independent parallel reviews, then chair integration. Reviewer and chair schema now include public message text, validated and displayed alongside structured results. Existing approval/executor reused.
- Explicit convert action opens an editable Project form containing plain-language conversation and original topic; skipped speakers are excluded where possible, with >=2 eligible participants required. No automatic execution.
- Automatic effort: discussion low, opening/revision medium, review/arbitration high; manual per-agent effort overrides win, checkbox off restores CLI defaults. Cached actual model efforts constrain automatic values; unknown explicit Antigravity model IDs are not rewritten. Haiku avoids unsupported effort. Catalogue requires no paid user prompt.
- Real timings: meeting preparation, process spawn, first CLI output and total call duration. First CLI output can be lifecycle/stderr data; it is NOT first public text or private reasoning. Public messages appear when each reply finishes.
- Dropped reviewers no longer receive tasks. Shared task validator requires transitive dependencies for overlapping file/directory scopes; executor serializes exclusive resources even across separate agent worktrees. Independent work remains parallel.
- Prior four screenshot fixes remain: + dropdown and launchpad Cowork, native npm-shim Claude launch, themed dialogs, full model version labels, aligned agent cards. Details archived in archive/handoff-2026-10-08-cowork-before-discussion.md.
- Incremental sync copied 12 changed files to test worktree, using a three-way merge for i18n to preserve PR #35 keys. PR #37 terminal and regression additions retained. Total uncommitted owning diff: 17 files, approximately 800 added / 110 removed lines, including prior fixes.

## Validation
- Owning: typecheck; full check-cowork.mts (legacy planner, schema repair, budget/cancel/restart, all three fake CLIs, sequential/parallel execution; new discussion context/timing/retry/skip/follow-up/recovery/budget; exclusive resource serialization); Electron terminal UI regression all passed.
- Integrated test: typecheck + production build; check-approval.cjs; check-remote.mts; Electron terminal UI regression including PR #37 passed. Latest resolver adjustment revalidated with typecheck/build.
- Real Electron visual harness with mocked API exercised new discussion replies/anchors, disabled composer while working, CLI-wait status, quota skip, follow-up IPC, conversion form, entry points, model alignment, themes and dialogs. Scratch harness: %LOCALAPPDATA%/Temp/cowork-discussion-qa.cjs; screenshots: cowork-visual-M9NlQu.
- No new paid live multi-agent conversation was run; actual model responsiveness / latency still needs the user's hands-on test. Existing real run rmuyxen80d28f confirmed Claude quota exhaustion, not launch failure (see archive for observed timings).

## Next
1. Restart npm run dev in the integrated test worktree (main/preload changed; renderer reload alone is insufficient). Choose a NEW Discussion, choose automatic low effort, test introductions then response to another speaker. Claude quota failure can be explicitly skipped.
2. Try conversion to a Project plan; verify public reviewer responses and chair reply, then approve/execute only if desired. Existing older meetings do not retroactively gain discussion messages or automatic effort.
3. Discussion context ceiling: most recent 24 messages / 24000 characters. Converted form capped at 20000 chars; original topic retained, latest conversation excerpt uses remaining room. No persistent/prewarmed CLIs or extra targeted dispute round in this first version.
4. Source changes are UNCOMMITTED in BOTH worktrees. Continue fixing on owning PR worktree and sync incremental changes into test. Do not blindly overwrite i18n or TerminalPanel/test scripts from the owning branch.
5. PRs #35/#36/#37 remain unmerged, no release. GitHub merge, source commit/push still requires user instruction. Preserve main screenshot files, stale main node_modules and existing worktrees. Remote testing still needs installed app remote stopped (port 47600); phone Reload mobile interface.

<!-- END AUTO-MEMORY -->
