# Latest Handoff

- Agent: Antigravity
- Updated: 2026-10-08 Asia/Taipei
- Current workspace: master (clean working tree except untracked Temp/ and images). Release remains v0.1.39.
- Next feature tracking: Linux support issue #40 (https://github.com/zkylek1212-k/Mulit-Harness-ADE/issues/40).

## Completed
- Assessed Linux platform compatibility for Agent Workbench across Electron runtime, terminal pty, CLI paths, window frame, and packaging.
- Created GitHub Issue #40: `feat: 支援 Linux 平台 (Support Linux packaging, native window frame, and CI build)`.
- No application source code modified in this turn.

## Linux Support Roadmap (Issue #40)
1. Window frame & controls: In `src/main/index.ts`, switch `titleBarStyle` on Linux to `default` (or provide controls) because WCO `titleBarOverlay` is Windows-only.
2. Shell detection: In `src/main/ipc/pty.ts`, support `process.env.SHELL || 'bash'` for bash/zsh/fish.
3. Protected paths: In `src/main/ipc/settings.ts`, protect Linux root directories (`/`, `/usr`, `/etc`, etc.).
4. Package targets: In `electron-builder.yml`, add Linux targets (`AppImage`, `deb`, `tar.gz`).
5. Packaging & CI: Build via GitHub Actions (`ubuntu-latest`) to compile native `@lydell/node-pty` addon for Linux.

## Detailed history
- Previous release/sync handoff archived in `.project-memory/archive/handoff-2026-10-08-main-sync-complete.md`.
