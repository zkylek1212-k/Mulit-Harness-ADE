# Latest Handoff

- Agent: Codex; updated 2026-10-08 Asia/Taipei.
- Main master @ 79a3676 before this memory commit; ahead 13 / behind 14 origin at startup. No automatic sync. User screenshots and Temp untouched.
- Owning PR #36: %LOCALAPPDATA%/Temp/agent-workbench-cowork-ui, feat/cowork-p1 @ 9b8cca7.
- Integrated test: %LOCALAPPDATA%/Temp/agent-workbench-test-pr35-37, test/pr-35-36-37 @ d0ee494.
- User authorized fixing Settings text/layout and removing custom model choices. All source remains UNCOMMITTED in both worktrees; no source commit/push, GitHub merge or release. Memory local/unpushed.

## Ready for testing: Settings layout and catalog-only models
- Cowork settings now has scoped responsive layout: explanatory text wraps, direct row info fills available space, budget hint uses normal row padding, and long title words cannot spill outside cards/rows.
- Model rows use aligned label/control columns; model + effort selectors have consistent 28px heights and fixed effort width showing complete default values. Below 440px content width, model controls move below labels, chair cards use one column, and recorder/timing controls stack below explanations. Changes are scoped to Cowork settings; other Settings tabs retain existing styling.
- Recorder/timing selects use the UI font instead of monospace, widths align, and the model default explanation was shortened in both languages.
- Shared ModelPicker no longer offers Custom or a free-text input, in Settings AND meeting start forms. Removed unused custom CSS/i18n and changed catalog-error copy to reload/use CLI defaults.
- Already saved models absent from the current catalog remain visible as a disabled existing-value option, including during catalog loading; no silent model replacement. Listed selections, CLI defaults, full model labels in menus/tooltips and per-model effort validation retained.
- This task: 6 files, +106/-62 relative to pre-task snapshot. Incrementally three-way synced to integrated test, retaining PR #35 translations and #37 approval detection. Snapshot %TEMP%/cowork-before-settings-layout; sync scratch %TEMP%/cowork-settings-sync-M2cICn.

## Validation
- Integrated npm run typecheck and npm run build exit 0; git diff --check passed.
- Extended real Electron scripts/check-cowork-tabs.cjs passed in owning and integrated worktrees. It now renders actual SettingsModal instead of a bare CoworkSettings fragment, mocks IPC, edits/saves a budget, checks removed custom inputs/options and preserved saved model, and validates unsupported effort resets when selecting a listed model.
- Layout matrix: viewport widths 1200/720, en/zh-TW, light/dark/light-morandi/dark-morandi. Asserts no horizontal text overflow or overlapping row controls and full selected effort labels. Captures top/model/budget sections (48 screenshots).
- Latest integrated screenshots %TEMP%/cowork-tabs-check-jyeIZM/settings-<width>-<language>-<theme>-<section>.png. Owning screenshots visually reviewed: %TEMP%/cowork-tabs-check-utjbON, including narrow zh-TW dark-morandi models, chair cards and budget layouts. Before-fix screenshot evidence %TEMP%/cowork-tabs-check-ewyWPf/settings-top.png and settings-bottom.png.
- Existing tabs/records/conclusion/editable conversion checks still pass in the same harness. Backend untouched this task; full CLI planner/discussion/executor and terminal/mobile/alert checks last passed in previous summary task, documented in the archived handoff.
- Models in the renderer check are fixture data; no paid live meeting was run. Hands-on testing, actual model catalog labels and generated summary quality remain for user.

## Previous work and next
1. Refresh the integrated dev renderer, then reopen Settings > Cowork to verify wrapping/controls, change a budget, save, and check meeting model dropdowns. This task is renderer-only; a main restart is needed only if the dev process predates the previous summary/preload changes.
2. Multi-tabs, concurrent discussion/Project planning, selected recorder, cumulative records and chair conclusion retained. Original messages persist; new discussion marks an earlier conclusion outdated. Create plan opens the editable Project form and actual execution still requires explicit user approval. Summary/conclusion share planning budgets.
3. Actual execution exclusive per repo until merge/cleanup. Closing tab only removes view; meetings persist, tabs session-only. Detailed summary flow/test evidence archived in archive/handoff-2026-10-08-cowork-before-settings-layout.md; earlier archives referenced there.
4. Continue on owning PR worktree and sync incremental diffs; no source commit/push or merge/release without user instruction. Main modules stale; test modules current. Remote phone test ports can clash (47600). PR #35/#36/#37 remain unmerged.
