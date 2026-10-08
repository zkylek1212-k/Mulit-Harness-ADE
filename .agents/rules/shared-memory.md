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

- Agent: Codex; updated 2026-10-08 Asia/Taipei.
- Main master @ e60c1e1 before this memory commit; ahead 12 / behind 14 origin commits at startup. No automatic sync. User screenshots/Temp remain untouched.
- Owning PR #36: %LOCALAPPDATA%/Temp/agent-workbench-cowork-ui, feat/cowork-p1 @ 9b8cca7.
- Integrated test: %LOCALAPPDATA%/Temp/agent-workbench-test-pr35-37, test/pr-35-36-37 @ d0ee494.
- User authorized adjustable meeting budgets and a designated recorder -> chair conclusion -> user approval workflow. Source UNCOMMITTED in both worktrees; no source commit/push, GitHub merge or release. Memory local/unpushed.

## Ready for testing: meeting recorder and chair conclusion
- Existing Settings > Cowork budget controls retained and verified: new meetings use 3-30 planning calls, 1-120 planning minutes, 1-600 execution minutes. New wording explicitly counts discussion, summary and chair conclusion; settings changes apply only to new meetings.
- Settings and Discussion start form select a recorder (default follows chair; must be a participant) and summary timing. Default on demand / before context fills; optional after every round. Asked user for frequency preference asynchronously, no reply at completion; both choices are available.
- Discussion view can change recorder while idle/blocked/paused, generate a record on demand, or ask the chair to conclude. Records show summary, agreements, attributed disagreements and decisions needed from user, with recorder and covered message count. Original messages and summary checkpoints persist in run.json; earlier records can be collapsed.
- Each model gets the latest cumulative record plus uncovered messages. Before the raw context reaches 20 messages / 18000 serialized chars, recorder processes oldest uncovered chunks, folding in the preceding record. Manual/final summary covers ALL remaining chunks; coverage advances only on success. Summary JSON capped at 6000 chars / 20 items per array.
- Summary and conclusion use existing runner, read-only/no-tool discussion invocation, schema validation, one repair attempt, timings, call/time budgets and generation cancellation. Automatic effort: summary medium, chair conclusion high; explicit model/effort overrides retained.
- Ask chair to conclude first completes/reuses the cumulative record, then calls only the chair for a public recommendation and remaining user decisions. No approval or execution is granted by this action. Failed summaries can switch recorder and retry; failed/restarted chair calls reuse finished records rather than repeat speakers.
- Create plan appears only for a conclusion covering the current messages. New user follow-up makes the old conclusion visibly outdated. Conversion opens the existing editable Project form containing topic + record + chair recommendation; Project still runs code-aware proposal/review/finalization and requires explicit approval before execution.
- Conversion no longer silently truncates a long record: over-20000-char forms show an error and require user editing before start. Discussion itself still does not inspect project files; records are model-generated and need user review.
- This task changed 11 existing files, +492/-36 relative to its pre-task snapshot. Incrementally three-way synced all 11 to integrated test; PR #35 center translations and #37 rendered approval detection verified retained. Snapshot %TEMP%/cowork-before-summary, sync scratch %TEMP%/cowork-summary-sync-dpNGUc.

## Validation
- Integrated npm run typecheck and npm run build exit 0.
- Full scripts/check-cowork.mts exit 0: old planner/executor/discussion/concurrency checks plus designated recorder, per-round record, cumulative old-message retention, invalid record validation, budget/retry, recorder replacement, chair failure/restart recovery, cancellation, stale conclusion and approval boundary.
- Extended real Electron scripts/check-cowork-tabs.cjs passed in owning and integrated worktrees: previous multi-tab checks plus recorder selector, structured records, conclusion, editable conversion/no automatic start, and actual CoworkSettings budget editing. Latest integrated screenshot %TEMP%/cowork-tabs-check-Wlumbw/tabs.png.
- Integrated Electron scripts/check-terminal-ui.cjs passed: approval detection, IME, mobile rendering, native folding and Apple dialogs. git diff --check passed.
- CLI conversations were simulated by the existing three fake CLIs; no paid live meeting was run. Actual summary fidelity, response speed, quotas and hands-on testing remain for user.

## Previous work and next
1. Restart npm run dev in integrated test (main/preload changed); Settings > Cowork choose budgets/default recorder, open new Discussion, complete round, summarize, ask chair to conclude, then create/edit Project plan and explicitly approve execution.
2. Multi-tabs/concurrent planning retained; actual execution exclusive per repo until merge/cleanup. Closing tab only closes view. Tabs session-only; meetings persist. Earlier detailed handoff archived in archive/handoff-2026-10-08-cowork-before-summary.md, with previous archives referenced there.
3. Continue on owning PR worktree and sync incremental diffs; source remains uncommitted. No merge/release/push without user instruction. No persistent/prewarmed CLI or extra targeted dispute round added.
4. Main node_modules stale; use test modules. Installed/test mobile remote ports can clash (47600); stop installed remote and Reload mobile interface when testing phone. PR #35/#36/#37 remain unmerged.

<!-- END AUTO-MEMORY -->
