# Latest Handoff

- Agent: Claude Code
- Updated: 2026-10-07 Asia/Taipei
- User authorization: branch + PR + merge + release; completed.
- PR #31 (fix, MERGED, merge 3ddfdf4, tag v0.1.37 annotated at 3ddfdf4): https://github.com/zkylek1212-k/Mulit-Harness-ADE/pull/31
- PR #32 (CHANGELOG entry missed in #31 due to CRLF, MERGED d7e83cf): https://github.com/zkylek1212-k/Mulit-Harness-ADE/pull/32
- Release: https://github.com/zkylek1212-k/Mulit-Harness-ADE/releases/tag/v0.1.37 (public, latest; setup.exe, portable.zip, latest.yml, blockmap).
- Local `master` still DIVERGED from origin: has local-only memory commits (.project-memory is not tracked on origin), lacks origin code commits. Not merged/reset - user decision.

## Mobile Claude Code fix (v0.1.37)
- Root cause (verified by recording real Claude Code 2.1.280 ConPTY streams): user's `~/.claude/settings.json` has `"tui": "fullscreen"` -> Claude enters alt-screen + mouse mode, no scrollback, cursor parked on spinner row above prompts.
- `pty.ts` spawnPty: Claude sessions get `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1` (Claude analog of Codex `--no-alt-screen`; launcher env overrides).
- `TerminalView.tsx` screenText: approval parsing reads up to last drawn row, not cursor row (fixed "only 1/2/3 buttons").
- Removed v0.1.36 `ClaudeHistoryStream` (turned each clear into rule + rows of blank lines -> duplicated frames on phone).
- check-terminal-ui: replaced Claude clear-screen test with "approval options below parked TUI cursor". typecheck + full suite pass.
- Open: one screenshot showed PTY at ~10 cols (desktop pane narrow?) - not root-caused. Unnumbered select lists (trust dialog) still fall back to 1/2/3.

---

# Previous Handoff

- Agent: Antigravity
- Updated: 2026-10-06 Asia/Taipei
- User authorization: merge and release new version; completed.
- PR #30: https://github.com/zkylek1212-k/Mulit-Harness-ADE/pull/30 (MERGED).
- Source commit: bedd79db8a36690b3447db72e0a3712a6d120c75, branch `feat/terminal-cross-agent-scrollback-v0.1.36`.
- Merge/tag/origin-master commit: 952b6364d53fb9beddc8061b3eda075cd7904b39.
- Release: https://github.com/zkylek1212-k/Mulit-Harness-ADE/releases/tag/v0.1.36 (public, latest, published 2026-10-06T05:54:42Z).

## Done
- **PR #30 Merged**:
  - Merged PR #30 into `master` using `gh pr merge 30 --merge`.
  - Annotated tag `v0.1.36` created and pushed at merge commit `952b636`.
- **v0.1.36 Released & Published**:
  - Built Windows installer, packaged native PTY bindings, created portable ZIP, and published via `scripts/release.ps1`.
  - All four assets uploaded to GitHub Releases:
    - `Agent-Workbench-0.1.36-setup.exe` (123.98 MB)
    - `Agent-Workbench-0.1.36-portable.zip` (169.62 MB)
    - `latest.yml` (auto-update metadata)
    - `Agent-Workbench-0.1.36-setup.exe.blockmap` (0.13 MB)
- **Features in v0.1.36**:
  - **Codex CLI**: 自動注入 `--no-alt-screen`，關閉 Alternate Screen Mode，改為 inline 串流輸出，完整保留 xterm scrollback 歷史。
  - **Claude Code CLI**: 手機端實作 `ClaudeHistoryStream`，攔截 React Ink 清螢幕指令（`\x1b[2J\x1b[H`），轉化為向 scrollback 推進換行並補上淡色橫向回合分隔線（`─`），使前幾回合交談自然留在卷軸緩衝區中，隨時可向上滑動回溯。
  - **手機端輸入管道**: upstream prompt 輸入框、快捷鍵按鈕與審批核可完全不受影響，100% 保持正常操作。
  - **架構決策**: DEC-007 記入 `.project-memory/DECISIONS.md`。

## Validation
- `npm run typecheck`: 通過（0 錯誤）。
- `npx electron scripts/check-terminal-ui.cjs`: 完整測試套件全數通過，包含 Codex `--no-alt-screen`、Claude 多回合歷史保留、CJK 換行、原生滾動與各尺寸/縮放驗證。
- Electron 打包與 Windows NSIS 安裝程式建置成功，portable ZIP 與 auto-updater metadata 驗證通過。

## Limits / Local State
- 實體 iPhone Safari / PWA 驗證待使用者測試。更新桌面端後，在手機端 Settings 點擊「Reload mobile interface」即可載入新版 UI。
- 本地專案記憶遵循本機優先原則。
