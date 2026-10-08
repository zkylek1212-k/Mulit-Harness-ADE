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
- User explicitly authorized: commit, handoff, push and sync CURRENT main workspace.
- Current workspace: main master, synchronized by merging origin/master at 51e8d99 into local history (a740224). No conflicts, resets, rebases or force-push.
- Release remains v0.1.39, tag a292b22: https://github.com/zkylek1212-k/Mulit-Harness-ADE/releases/tag/v0.1.39

## Completed
- Source/docs PRs #35, #37, #36, release/docs #38 and HTML architecture #39 are merged; installer, portable ZIP, blockmap and latest.yml published and hash-verified.
- Copied the delivered documentation into this workspace, then committed README.md, docs/architecture.html, docs/cowork-architecture.md and docs/cowork-architecture-preview.png as f40e67b (4 files, +307/-20, PNG 128189 bytes).
- Main source, scripts, package/lock and docs now match published origin/master; the additional source-controlled artifact is the architecture preview PNG. Main is no longer the old v0.1.34 source.
- Existing local shared-memory history preserved in the merge. User authorized publishing this history and the updated handoff via a normal push to origin/master; memory was committed with the pathspec-limited helper and pushed with Windows git. Main now reaches origin/master. No permanent auto-push setting changed.
- Fresh npm ci --no-audit --no-fund completed in MAIN; headless/serialize xterm dependencies now exist. npm run typecheck passed, packaged version is 0.1.39 and both xterm modules load. package.json/lock unchanged by installation.

## Cowork / documentation
- Discussion/Project modes; sequential public replies, follow-ups, retry/skip; multiple independent tabs and concurrent meetings; configurable recorder/cumulative summaries; chair conclusion and editable conversion to Project; explicit approval before worktree execution.
- Settings: full versioned model names, catalog-only selection (no Custom), responsive bilingual layout, configurable budgets and stage-based automatic effort with manual overrides.
- Cowork architecture and meeting/approval flow are rendered native SVGs in docs/architecture.html#cowork, matching the existing theme and bilingual switching. README Mermaid removed; docs/cowork-architecture.md holds implementation notes. Open the HTML directly in a browser.
- Main docs/cowork-architecture-preview.png is the 1200 px Chinese/light render. Other 12-state screenshots: %TEMP%/workbench-architecture-render-0opujF; ad-hoc renderer harness: %TEMP%/render-workbench-architecture.cjs.

## Validation / limits
- Merge source/doc equality with published master verified; diff --check passed. No new application logic was introduced in this sync.
- Prior full fake-CLI planner/discussion/summary/executor checks and Electron terminal/tabs regressions passed. HTML diagrams passed 1200/720/390 px x zh/en x light/dark containment/overflow checks and visual review. The v0.1.39 packaged app launched and exposed Cowork IPC; uploaded hashes and portable contents verified.
- Before publishing local memory history, scanned 69 unique historical text blobs and current text docs for common private-key/token patterns: no hits. This is a pattern check, not a complete security audit.
- No full functional suite or new paid real-provider discussion/summary was rerun during Git sync; real-provider quality/latency still needs live use.
- Multiple meetings allowed in one repo; actual execution limited to one per repo until merge/cleanup (paused/review worktrees retain slot). Tabs/drafts are session-local; history persists.
- Defaults: 6 calls / 20 planning minutes / 60 execution minutes. Settings ranges: 3-30 calls, 1-120 planning minutes, 1-600 execution minutes. Summaries/conclusions/repair count as calls; waiting for user input does not consume planning time. Service raise ceiling 60/240; Discussion button 30/120.
- PR #37 synthetic approval edge cases remain unconfirmed on real CLIs: statusline after numbered options; unnumbered menus. Details in prior archives.

## Worktrees / preserved files
- Main is now ready for npm run dev, with real npm-ci dependencies. Main untracked Temp/ and three phone screenshots preserved and excluded from commits.
- %LOCALAPPDATA%/Temp/agent-workbench-release-v0.1.39: docs/cowork-architecture @ cfe05ff, clean; real node_modules and release assets. Local release/v0.1.39 branch stays ba8f0c1.
- %LOCALAPPDATA%/Temp/agent-workbench-cowork-ui: feat/cowork-p1 @ bb66670, clean; node_modules junction points to retained test worktree.
- %LOCALAPPDATA%/Temp/agent-workbench-test-pr35-37: test/pr-35-36-37 @ d0ee494, with published follow-up changes still uncommitted as an integrated replica. Code matches released source; version remains 0.1.38. User's test environment retained.
- Older ime-fix/release-v0.1.35 worktrees and remote branches retained. No forced cleanup.
- Dev and installed remote both default to port 47600; stop installed remote for mobile testing and use Reload mobile interface.
- Windows UTF-8: explicit UTF8 reads; use apply_patch or explicit UTF8 output encoding for non-ASCII Node input. In this shell, PowerShell MEM_AUTOPUSH did not reach the Bash helper, and Bash git push stalled; explicit authorized Windows git push worked.

## Detailed history
- Pre-sync full handoff: archive/handoff-2026-10-08-before-main-sync.md.
- Prior release/HTML/copy history is preserved there and its linked archives; historical decisions were not rewritten.

<!-- END AUTO-MEMORY -->
