# Latest Handoff

- Agent: Codex
- Updated: 2026-10-02 Asia/Taipei
- Branch: master; source base 013c1e2 (published v0.1.34).
- User request: repair mobile regressions in `phone view_bug1.png` and `phone view_bug2.png`, including switching away from a terminal and returning.
- User requirement: 「一定不要左右滑動，我只接受上下滑動」. Preserve readable text; do not restore dual-axis scrolling or shrink the desktop screen into microscopic text.

## Done
- Replaced mobile canvas scale-to-fit with readable, styled native text lines after xterm parses ANSI using desktop cols/rows (DEC-006 supersedes DEC-005).
- Long text wraps at 13px; desktop soft-wraps join before mobile wrapping, including CJK/emoji boundary padding. ANSI palette/truecolor, bold/dim/italic/underline/inverse/invisible styles and cursor visibility are retained; plain separator lines stay one line.
- Kept desktop PTY resize ownership unchanged. State dimension broadcasts no longer dispose/recreate the mobile parser; snapshot/resized messages update its geometry.
- Removed DOM measurement/opening/scaling lifecycle and sticky virtual scrolling. Native vertical scrolling follows output at the bottom, preserves history during updates/clear-screen, and survives hidden tabs, keyboard/rotation and session remounts.
- Reset pending refresh timers when switching sessions; stale session messages do not populate the reopened session.
- Expanded the existing Electron/xterm regression script; fixed its fixture's missing UTF-8 charset (production remote.html already declares UTF-8).
- Prior release handoff archived verbatim at `archive/2026-10-02-v0.1.34-antigravity.md`. PR #28 and published v0.1.34 remain the latest release; no new source commit, push, PR or release performed.

## Validation
- `npm run typecheck`: passed (0 errors).
- `npm run build`: passed.
- `npx electron scripts/check-terminal-ui.cjs`: passed completely, including actual desktop resize, session changes/reopening, hidden Status/File/Preview restores, alternate-screen enter/exit, relative ANSI redraw, CJK/emoji/long URLs, styles/cursor, HTML-as-text, one-line dividers, keyboard clipping, native swipe/history/follow behavior, and existing IME/workspace/file/version checks.
- 320/390/768px at device scale 1/2/3: readable 13px font, desktop ANSI dimensions retained, no horizontal overflow.
- Visual check: generated `wrapped-terminal.png` confirms readable native text, single-line divider and cursor. Latest test artifacts: `C:/Users/milan.chang/AppData/Local/Temp/workbench-terminal-check-3Hf08z/`.

## Not done / limits
- Source changes remain uncommitted in `TerminalView.tsx`, `remote.css` and `scripts/check-terminal-ui.cjs`; built output is local only. The installed/published v0.1.34 has not been updated.
- Physical iPhone Safari/PWA verification still needed; no claim of real-device validation.
- Rendering scans the existing bounded 5000-line buffer at most every 120ms; incremental rendering only if profiling shows a need.
- Mobile wraps parsed text; full-screen TUI box/table geometry may differ visually from desktop. The raw server snapshot still has its existing 256KiB tail limit.
- User screenshots and pre-existing temp/worktrees remain untouched.

## Next agent should
- Preserve the user's vertical-only/readable-text requirement and desktop PTY dimensions; do not reintroduce CSS canvas scale or fit the ANSI parser to phone columns.
- Review the local source diff, verify on a physical phone, then follow the user's instructions for source commit/PR/packaging/release.
- Shared memory is committed separately and not pushed with MEM_AUTOPUSH=0.
