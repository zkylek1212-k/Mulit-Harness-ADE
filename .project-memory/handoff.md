# Latest Handoff

- Agent: Codex
- Updated: 2026-10-08 Asia/Taipei
- Workspace: master; existing Windows app remains v0.1.39. Linux v0.1.0 is ready locally, not published.
- User decision (DEC-011): maintain separate Windows and Linux apps in one repo, prioritizing existing Windows users. No shared runtime application code or npm workspace.
- Source status: 140 new files under apps/ and .github/ plus one .gitignore rule remain uncommitted. Existing Temp/ and phone screenshots were untouched. Only memory is committed by the handoff script.
- Tracking: Linux support Issue #40 remains open: https://github.com/zkylek1212-k/Mulit-Harness-ADE/issues/40.

## Completed
- Copied tracked Windows v0.1.39 source/config/test fixtures into independent apps/linux; own package name, lockfile, app ID, product name and version 0.1.0.
- Linux owns agent-workbench-linux userData (separate -dev data) and .workbench-linux workspace settings/credentials/manifest. No Windows settings migration.
- Native title bars for both windows; System Shell uses $SHELL or /bin/bash, with explicit Bash/pwsh retained. Desktop and phone launchers use the Linux choices.
- Linux system directory and symlink guards, case-sensitive main workspace/file checks, and refusal of safeStorage basic_text credential storage.
- Linux-only AppImage/deb/tar.gz build config; publish:null and --publish never prevent inferred or automatic updater publishing. Debian dependencies explicitly include libasound2t64 | libasound2.
- Dedicated Linux CI builds/tests this app; linux-vX.Y.Z tags publish prereleases with --latest=false. Manual Linux updates select only Linux prereleases with Linux assets, protecting Windows /releases/latest.
- Docs: apps/README.md and apps/linux/README.md explain builds, isolation, release rules and manual fix porting.

## Validation
- Windows root typecheck passed; all 134 tracked source/scripts/package/build-config files match the pre-task baseline. Linux relative imports remain inside apps/linux.
- Standalone Linux npm ci, typecheck, guard/shell/release/credential checks and production build passed in Ubuntu 26.04 WSL x64.
- Real Electron main and detached-terminal windows rendered; System Shell spawned and was killed. Native PTY passed both Node and packaged Electron checks.
- Three packages built; tar contents and Debian package identity/amd64/runtime dependencies checked. No latest-linux.yml or app-update.yml generated with publish:null.
- Local artifacts: apps/linux/release/Agent-Workbench-Linux-0.1.0-x64.{AppImage,deb,tar.gz}; ignored by Git. Local tar compression used level 1 for verification; CI uses builder defaults.
- Workflow YAML/publish restrictions and whitespace checks passed; GitHub Actions has not run remotely.

## Next / Limits
- Review and explicitly authorize a SOURCE commit/PR/push; none was done. Memory commit/push status is reported by commit-handoff.sh.
- Do not convert Linux prereleases to stable/latest without revisiting Windows update isolation. Do not merge application sources or dependencies automatically.
- Fixes must be ported between apps deliberately. Other distros, ARM64, actual package installation and complete agent-provider/remote-phone flows remain unverified.
- Linux manual update lookup scans 100 releases (ponytail limit); paginate if Windows history hides Linux releases.
- WSL /tmp vanished on distro stop; retained verification app/Node/libs live at /home/milanchang/.cache/agent-workbench-linux-verification. Runtime libs were unpacked there only; no system package installation.
- Previous Linux plan archived at archive/handoff-2026-10-08-linux-plan-before-independent-app.md; earlier release/sync handoff remains archived.
