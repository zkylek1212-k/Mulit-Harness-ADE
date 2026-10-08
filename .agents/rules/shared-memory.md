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

- Agent: Claude Code -> handing off to Codex
- Updated: 2026-10-08 Asia/Taipei
- Main repo: branch `master` @ 67550bd (local-only memory commits; diverged from origin, see Warnings)
- Test branch: `test/pr-35-36-37` @ d0ee494 (LOCAL ONLY, not pushed), worktree `%LOCALAPPDATA%\Temp\agent-workbench-test-pr35-37`
- PR #36 branch: `feat/cowork-p1` @ 9b8cca7 (pushed), worktree `%LOCALAPPDATA%\Temp\agent-workbench-cowork-ui`
- User authorization this session: local merge of #35/#36/#37 for testing; push of the Cowork UI commit to PR #36. NOT authorized: merging any PR on GitHub, releasing.

## Done
- Open PRs (all OPEN on GitHub, none merged): #35 `feat/dev-mode-collapsible-center`, #36 `feat/cowork-p1`, #37 `fix/mobile-question-options`.
- Built `test/pr-35-36-37` = origin/master (v0.1.38, b6c7841) + #35 + #37 + #36, plus later updates: 9b8cca7 (#36) and b028245 (#37). No conflicts (#36 and #37 both touch TerminalPanel.tsx, merged cleanly).
- PR #36 Cowork UI restyle, commit 9b8cca7 pushed to `feat/cowork-p1` (user asked for Apple HIG consistency, theme-mapped colors, aligned rules, minimal content):
  - One button family `.cw-btn` (default / `.primary` / `.danger` / `.sm` / `.icon`; 26px and 22px only) replaces term-btn-*, cw-mini-btn, cw-chair-toggle, ghost, pill picker.
  - Theme tokens only in `cowork.css` (removed hard-coded agent colors #e05d26/#6366f1/#10b981 and #fff; fixed white-on-light check/chair in dark-morandi). Agents identified by AgentMark.
  - Layout: `--cw-gutter` 12px everywhere; roster and board header share `--cw-bar-h` 40px (bottom borders align, measured y=74 both); board collapse toggle at end.
  - Removed: topbar icon+title, "your turn" badge, per-agent model/role chips in roster (now tooltip), "can plan read-only" filler (i18n key `cowork.eligible` deleted; `eligibleSlow` shortened), execManualHint/execReviewHint display. Stop moved to top bar with confirm. Budget shows 2 numbers, rest in tooltip. Single-row composers. `approveDesc` (en + zh-TW) rewritten (old text said dispatch is manual only).
- Reviewed PR #37 update b028245 (author not this agent): approval detection now reads the parsed current xterm screen (`readApprovalScreen`) instead of raw output text; clears automatically when the prompt disappears; no clear-on-input. Logic looks sound.

## Not done
- User has not finished hands-on testing of the merged build (`npm run dev` in the test worktree).
- PR #37 possible missed detections (found with synthetic strings, NOT confirmed on real CLIs):
  1. Claude permission menu followed by a non-indented line (e.g. custom statusline `Opus 4 | ctx 34%`) -> `looksLikeApprovalPrompt` returns false (rule: lines after the last option must be blank, a FOOTER, or indented).
  2. Unnumbered menus (e.g. `> Allow once / Allow always / Deny`) -> false. Old rule caught `allow ... ?`. Real Antigravity approval format unknown.
- Unused i18n keys still present: `cowork.execManualHint`, `cowork.execReviewHint`, `cowork.turnTitle` (harmless).
- PRs not merged; no release.

## Next agent should
1. Ask the user for test results of the merged build. If they report a bug, fix it on the owning PR branch (#35 / #36 / #37), not on `test/pr-35-36-37`, then `git -C <test worktree> merge <branch>` to refresh the test build.
2. For PR #37: capture a real Claude Code and Antigravity approval screen (e.g. run a command needing approval in `npm run dev`, read the screen). If either case above is missed, extend `src/shared/approvalDetect.ts` and add the case to `scripts/check-approval.cjs`; ask the user before pushing to `fix/mobile-question-options`.
3. Only after the user says OK: merge on GitHub in order #35 -> #37 -> #36 (ask first), then version bump/release per previous release flow.
4. After merging: remove the temporary worktrees (`git worktree remove` for agent-workbench-test-pr35-37, agent-workbench-cowork-ui, and the older agent-workbench-ime-fix / agent-workbench-release-v0.1.35) and delete local branch `test/pr-35-36-37`.

## Tests (run 2026-10-08 in the test worktree, after merging b028245)
- `npm run typecheck` -> exit 0
- `node scripts/check-approval.cjs` -> passed (Claude + Codex)
- `node --experimental-strip-types scripts/check-remote.mts` -> remote ok
- `node --experimental-strip-types scripts/check-cowork.mts` -> cowork ok
- `node_modules/.bin/electron scripts/check-terminal-ui.cjs` -> all sections passed, exit 0
- Cowork UI visually verified with an ad-hoc Electron screenshot harness (esbuild + mocked window.api; 5 states x 4 themes). Harness lives only in the Claude scratchpad, not in the repo.

## Warnings
- Run the test build: `cd $env:LOCALAPPDATA\Temp\agent-workbench-test-pr35-37; npm run dev`. Dev uses separate userData (`...-dev`), so it can run beside the installed app, but both default to remote port 47600 - stop the installed app's remote when testing #37. Phone must use Settings > "Reload mobile interface".
- `node_modules`: the test worktree has its OWN real node_modules (copied from main + `npm install --no-save --ignore-scripts @xterm/headless @xterm/addon-serialize`). The cowork-ui worktree's node_modules is a junction to it. The MAIN repo's node_modules is stale (lacks @xterm/headless + @xterm/addon-serialize required since v0.1.38) and was never modified.
- Local `master` is diverged from origin (ahead: local-only `.project-memory` commits; behind: 14+ origin commits). Not pulled/reset - user decision. `.project-memory` is not tracked on origin.
- Windows PowerShell 5.1 `Get-Content -Raw` reads UTF-8 files without BOM as ANSI and corrupts Chinese text; use `[IO.File]::ReadAllText` or the Edit tool. Native `git commit -F -` with a piped here-string fails; use a message file.
- Untracked user files in main repo: `phone view bug.png`, `phone view_bug1.png`, `phone view_bug2.png` (user's screenshots; leave them).

---

# Previous Handoff (2026-10-07, Claude Code) - v0.1.37 / v0.1.38 released
- v0.1.38 (PR #33 IME + mobile TUI mirror, PR #34 bump) released: https://github.com/zkylek1212-k/Mulit-Harness-ADE/releases/tag/v0.1.38
- v0.1.37 (PR #31 + #32): Claude sessions get `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1` in `pty.ts`; mobile approval parsing reads to last drawn row.
- Main keeps an @xterm/headless mirror per PTY (serialize addon = mobile snapshot); output/resize delivered in mirror order.
- Open from then: one screenshot showed PTY at ~10 cols (not root-caused).

<!-- END AUTO-MEMORY -->
