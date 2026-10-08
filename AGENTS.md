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

- Agent: Codex; updated 2026-10-08 Asia/Taipei.
- Main master @ 8830f06 before this memory commit; ahead 11 / behind 14 origin commits at startup. No automatic sync. Main has only memory changes and user screenshots.
- Owning PR #36 worktree: %LOCALAPPDATA%/Temp/agent-workbench-cowork-ui, feat/cowork-p1 @ 9b8cca7.
- Integrated test: %LOCALAPPDATA%/Temp/agent-workbench-test-pr35-37, test/pr-35-36-37 @ d0ee494.
- User authorized Cowork multi-tabs, implementation and local tests. Source remains UNCOMMITTED in both worktrees; no new source commit/push, GitHub merge or release. Memory commit local/unpushed.

## Ready for testing: multiple Cowork tabs
- Every + menu > Cowork or launchpad action creates a fresh independent tab (Cowork 1/2/etc); starting/selecting a meeting changes that tab's title to the topic and updates its own phase dot.
- Each CoworkPanel remains mounted while hidden, preserving its draft, chosen run, view state and background updates. New tabs do not auto-select another active meeting. Opening history refreshes the run list so meetings created in other tabs appear.
- Closing a tab removes only that view/subscription, not the persisted meeting or running CLI. Close active tab selects its neighbor, or falls back to terminal/launchpad; close inactive tab keeps current selection. Closed meeting can be reopened from history.
- New/selected terminal clears active Cowork and only one tab is highlighted. Hidden Cowork does not restart a terminal. Tabs themselves are session-only, like the current terminal tab list; persisted meetings remain available after app restart.
- Backend allows multiple discussions and Project planning runs in one repo; follow-up in one discussion is allowed while others run. Context, snapshots, cancellation, retries and budgets stay per run.
- Actual execution remains exclusive per repo until its execution worktrees are merged/cleaned. A synchronous per-repo starting reservation prevents simultaneous execute clicks racing during asynchronous worktree setup. Other meetings/planning do not block execution.
- Changed 5 existing source/test files plus new scripts/check-cowork-tabs.cjs. Synced incrementally to integrated test; TerminalPanel was three-way merged to retain PR #37 approval changes. No PR #35 translations overwritten.

## Previous work retained
- Discussion vs Project UI, real sequential public replies/reply links, skip/retry/next round, explicit conversion to editable plain-language Project form, public reviewer/chair responses, stage-aware effort with manual overrides and model capability checks, real CLI spawn/first-output timings.
- Planning validator rejects unordered overlapping scopes, dropped reviewers not assignable, executor serializes exclusive resources; existing approval/execution paths retained.
- Four screenshot fixes: Cowork in + menu/launchpad; npm shim Claude launch; themed dialogs; full model versions/aligned agent cards. Detailed evidence is preserved in archive/handoff-2026-10-08-cowork-before-tabs.md and earlier archives.

## Validation
- Owning full scripts/check-cowork.mts passed: planner/executor/three fake CLIs, discussion/follow-up/retry/skip/recovery/budget, parallel discussions and Project plans, isolated context/cancellation, execution-start reservation and existing execution exclusion.
- New real Electron renderer check scripts/check-cowork-tabs.cjs passed in BOTH owning and integrated worktrees: independent drafts and meetings, background phase updates, new-tab freshness, close/fallback/no cancellation, terminal switching, history reopening, no renderer errors. Screenshot: %LOCALAPPDATA%/Temp/cowork-tabs-check-cknvaU/tabs.png.
- Integrated npm run typecheck and npm run build passed. Integrated Electron scripts/check-terminal-ui.cjs passed, including PR #37 rendered approval detection, IME, mobile rendering and Apple dialogs.
- No paid live multi-agent discussion was run; user's real model responsiveness, quota behavior and hands-on multi-tab testing still pending.

## Next
1. Restart npm run dev in integrated test worktree (main changed); renderer reload alone is insufficient. Open + > Cowork twice, enter different topics, start both, switch, close/reopen via history; stop one and verify the other continues.
2. Continue fixes on owning PR worktree and synchronize only incremental diffs; use three-way merge for TerminalPanel/i18n differences in integrated test. Do not commit/push source or merge/release without user instruction.
3. All older follow-up caveats remain: newest 24 discussion messages / 24000 chars; conversion form capped at 20000; no persistent/prewarmed CLI or targeted extra dispute round in first version. Historical meetings do not retroactively gain public messages/auto effort.
4. Preserve screenshots and existing worktrees. Main node_modules stale; use test worktree's real modules. Mobile remote shares port 47600 with installed app; stop installed remote and Reload mobile interface for phone tests. PRs #35/#36/#37 remain unmerged.

<!-- END AUTO-MEMORY -->
