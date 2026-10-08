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
- Main repo: `master` @ ed40be7 before this memory commit; 8 ahead / 14 behind origin at startup. No pull/reset.
- PR #36 worktree: `C:/Users/milan.chang/AppData/Local/Temp/agent-workbench-cowork-ui`, branch `feat/cowork-p1` @ 9b8cca7, with UNCOMMITTED fixes in 13 files.
- Test worktree: `C:/Users/milan.chang/AppData/Local/Temp/agent-workbench-test-pr35-37`, branch `test/pr-35-36-37` @ d0ee494, with the same UNCOMMITTED fixes. Test script additions were ported while preserving PR #37 changes.
- Source was NOT committed or pushed. The earlier pushed PR #36 commit remains 9b8cca7. PRs #35/#36/#37 remain unmerged per prior handoff; GitHub status not re-queried this turn.
- Authorization: user clarified the four screenshots and fixes were implemented locally. GitHub merges and releases remain unauthorized. Memory commit is local only unless MEM_AUTOPUSH=1.

## User intent (confirmed)
- bug-1: remove the standalone toolbar Cowork action, integrate it into the + dropdown; fix Claude meeting startup.
- bug-2: Cancel meeting confirmation must use the current app UI design.
- bug-3: show model names WITH versions (e.g. Opus 5.5); align Antigravity card controls with adjacent cards.
- bug-4: add a Cowork card in New Terminal Session.

## Done this turn
- Both Cowork entry points now open the existing Cowork tab; removed the standalone toolbar button. New launcher card uses existing agent marks and theme styles.
- `launchPlan` recognizes npm shims forwarding to a native exe or Node entrypoint and launches that target directly. JSON/TOML/metacharacter arguments avoid cmd.exe; unrecognized/missing-target scripts retain the original safety guard. Fixed shared planning, execution, and capability/catalog launch paths together.
- Claude model catalog now reads its stream-json initialize control response, without sending a user prompt or making a model call. Actual local CLI returned Opus 5.5 / Sonnet 5 / Fable 5.1 / Haiku 4.5. Parser checks added to check-cowork.mts.
- ModelPicker shows catalog labels including versions, omits redundant technical IDs, and uses concise Default (<model>) labels. Wider cards; vertically stacked model/effort selectors. Antigravity's slow note moved to tooltip so selected card headers/controls align.
- Replaced all Cowork native confirms/alert with AppleAlertDialog or inline errors (cancel/stop, delete, execution cleanup). Cancel confirmation labels are Keep meeting / Cancel meeting, localized.
- AppleAlertDialog now focuses its safe action, traps Tab, respects focused buttons for Enter, supports Escape, and restores focus. Added real Electron keyboard regression checks to check-terminal-ui.cjs.
- Changes copied as a patch into the existing test worktree without committing source or overwriting PR #37 checks; no branch merge needed.

## Validation
- Owning PR #36 worktree: typecheck passed; check-cowork.mts passed (pure parsing, JS/native npm shims with JSON/%/newlines, all fake-CLI meeting/execution scenarios); check-terminal-ui.cjs passed including new dialog keyboard checks.
- Actual installed Claude: model initialize request exited 0 with versioned catalog; planning arguments including inline JSON reached the executable with --help, exit 0. No paid model request/full real meeting was run.
- Electron UI harness passed: + menu and card open Cowork, toolbar button absent, all three selected agent selectors align, Default (Opus 5.5) visible, keep/cancel flows work, delete failure appears inline. Form screenshots checked in light and dark-morandi; screenshots also generated for dark/light-morandi.
- Test worktree: typecheck, build, check-approval.cjs, and check-terminal-ui.cjs all passed; git diff --check clean. Diff: 13 files, 293 insertions / 58 deletions.
- Ad-hoc UI harness: `C:/Users/milan.chang/AppData/Local/Temp/cowork-qa.cjs`; screenshots: `C:/Users/milan.chang/AppData/Local/Temp/cowork-visual-ldqYnz`. Scratch artifacts are outside the repository.

## Remaining / next
1. User hands-on test of the refreshed test worktree, especially a real Claude-chaired meeting. Run `npm run dev` there; restart an already-running dev app to pick up main-process changes.
2. After user review, source commits/pushes need explicit authorization. Both worktrees currently contain the same source fixes; commit on the owning PR branch first, then refresh the test branch carefully (do not blindly overwrite its dirty copy).
3. PR #37 synthetic possible misses remain unverified on real CLIs: non-indented statusline after numbered options; unnumbered Allow once / Allow always / Deny. Capture real Claude/Antigravity approval screens before changing detection; ask before pushing #37.
4. After user OK: GitHub merge order #35 -> #37 -> #36, then version/release. Cleanup temporary worktrees/test branch only after merging.

## Environment / preservation
- Test worktree has real node_modules; Cowork worktree uses its junction. Main node_modules remains stale (missing xterm headless/serialize). Main branch remains divergent; do not auto-sync.
- Dev and installed app default to remote port 47600. Stop installed remote for mobile tests; phone Settings > Reload mobile interface.
- User screenshots and temp files remain untracked in main: Temp/cowork bug-1..4.png, phone view bug*.png. Leave them alone; do not commit. The memory sync script consumed its pre-existing AGENTS.md.spmtmp scratch file.
- Previous detailed handoff (prior UI restyle/release history) preserved in `archive/handoff-2026-10-08-claude-cowork-feedback.md`.

## User-approved next direction (not implemented)
- User agreed to separate Discussion and Project flows in one Cowork UI, with actual public agent statements and visible interaction. Discussion should answer conversational requests directly and allow later conversion to a project plan; Project should retain parallel independent review, targeted follow-up on disagreements, scoped execution and acceptance checks.
- User also asks to reduce chair startup latency. Latest observed real run rmuyxen80d28f (last updated 2026-10-08 10:39:47 Asia/Taipei): Codex chair, three participants, request was one-sentence introductions; phase awaiting-approval, no execution. Codex opening CLI call 27.420s, high effort, 20,041 reported input tokens; call began 0.927s after run.createdAt. These timings do NOT isolate CLI startup from model processing, and pre-createdAt capability/context preparation is not timed.
- Real Claude now launches and reports session quota exceeded (its response said reset 11:30am Asia/Taipei). Antigravity agreed with all three introduction tasks and claimed its own task (68.824s); Claude review was dropped; Codex finalized the three-task board (18.291s). Claude introduction remains assigned, although its review was dropped. This shows current planning flow misfits simple conversational requests.
- Suggested performance priorities: lightweight Discussion context/schema, configurable lower effort for simple openings, immediate truthful progress/public-output display, and phase timing before considering persistent CLI/prewarming. Preserve required project rules and explicit user model/effort choices; no speed benchmark or implementation yet.

<!-- END AUTO-MEMORY -->
