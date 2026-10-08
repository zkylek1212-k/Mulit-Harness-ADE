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
- USER TEST FEEDBACK (2026-10-08 09:26-09:29): screenshots `Temp/cowork bug-1..4.png` in the main repo (untracked; the user left no text, so readings below are this agent's interpretation - confirm with the user):
  1. bug-1 (2) BLOCKER, PR #36: meeting fails at "Round 1 - chair opens": `Could not start claude: refusing to pass an argument containing quotes, % or newlines to cmd.exe: {"type":"object",...}`. Cause (verified in code): `src/main/cowork/runner.ts` `launchPlan()` routes `.cmd/.bat` through cmd.exe and rejects args matching `CMD_UNSAFE = /["%\r\n]/`; on this machine `claude` resolves to an npm `.cmd` shim, and the Claude planner invocation passes the JSON schema inline as an argument (`plannerInvocation` in orchestrator.ts ~line 586 gets both `schema` and `schemaFile`). Fix direction: for Claude, don't pass inline JSON through cmd.exe (resolve the npm shim to `node <cli.js>` / native exe and spawn directly, or use a file-based schema if the CLI supports it). Add a check-cowork case with a `.cmd` CLI path.
  2. bug-1 (1): circled the terminal toolbar "Prompt" and "Cowork" buttons - probably the two adjacent buttons look alike or inconsistent (meaning unclear; ask).
  3. bug-2: "Cancel meeting" uses native `window.confirm` (OS dialog titled "agent-workbench", buttons 確定/取消 while UI is English) - not HIG. Replace all Cowork `window.confirm`/`window.alert` (CoworkPanel.tsx: deleteRun, stopRun, TurnCard cancel; ExecView.tsx cleanup) with the app's `src/renderer/src/components/AppleAlertDialog.tsx`.
  4. bug-3: start-form agent cards - (1) Claude card model/effort selects truncate ("Same as your Claude Code…"), (2) Antigravity card's subtitle pushes its chair button + selects lower than the other cards, so rows don't line up across cards. Fix: fixed-height subtitle slot (or move the "slower" note to a tooltip) so all cards align; let select text fit (wider cards / shorter fallback labels in ModelPicker `fallbackLabel`).
  5. bug-4: "New Terminal Session" launcher grid - Command Prompt card sits alone on a second row with an empty area circled. Unclear: layout balance (5 cards -> one row / centered) or a request to add a Cowork launch card there. Ask the user.
- User has not finished hands-on testing of the merged build (`npm run dev` in the test worktree).
- PR #37 possible missed detections (found with synthetic strings, NOT confirmed on real CLIs):
  1. Claude permission menu followed by a non-indented line (e.g. custom statusline `Opus 4 | ctx 34%`) -> `looksLikeApprovalPrompt` returns false (rule: lines after the last option must be blank, a FOOTER, or indented).
  2. Unnumbered menus (e.g. `> Allow once / Allow always / Deny`) -> false. Old rule caught `allow ... ?`. Real Antigravity approval format unknown.
- Unused i18n keys still present: `cowork.execManualHint`, `cowork.execReviewHint`, `cowork.turnTitle` (harmless).
- PRs not merged; no release.

## Next agent should
0. Look at `Temp/cowork bug-1..4.png` (main repo) and confirm the interpretations above with the user. Fix bug-1 (cmd.exe / inline JSON schema) first - Cowork cannot run a meeting with Claude as chair on this machine until it is fixed. Work on `feat/cowork-p1` (worktree `%LOCALAPPDATA%\Temp\agent-workbench-cowork-ui`), then merge into the test branch.
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
- Untracked user files in main repo: `phone view bug.png`, `phone view_bug1.png`, `phone view_bug2.png`, `Temp/cowork bug-1..4.png` (user screenshots; leave them, do not commit).

---

# Previous Handoff (2026-10-07, Claude Code) - v0.1.37 / v0.1.38 released
- v0.1.38 (PR #33 IME + mobile TUI mirror, PR #34 bump) released: https://github.com/zkylek1212-k/Mulit-Harness-ADE/releases/tag/v0.1.38
- v0.1.37 (PR #31 + #32): Claude sessions get `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1` in `pty.ts`; mobile approval parsing reads to last drawn row.
- Main keeps an @xterm/headless mirror per PTY (serialize addon = mobile snapshot); output/resize delivered in mirror order.
- Open from then: one screenshot showed PTY at ~10 cols (not root-caused).
