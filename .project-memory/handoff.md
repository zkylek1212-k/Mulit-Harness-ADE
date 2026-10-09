# Latest Handoff

- Agent: Claude Code
- Updated: 2026-10-09 Asia/Taipei
- v0.1.40 released (Windows). User authorised push, merge of PR #41/#42 and the release in one request.
- Architecture: DEC-011, two independent apps in one repo; no shared runtime imports or npm workspace. Windows users take priority.

## Done this session
- Linux PR #41 CI fixed by 3469c9e (Electron SUID sandbox step in .github/workflows/linux-app.yml); runs 37816334970 and 37870095383 (on 9cb042d) green. Merged as 349774e; Issue #40 closed.
- Phone Cowork PR #42 merged as 0885cda: Cowork tile per workspace (list, new meeting, timeline, per-phase actions); `invokeCowork` + `coworkEvents` in main/ipc/cowork.ts serve the Remote Bridge.
- Release PR #43 (release/v0.1.40: package.json/lock 0.1.40, CHANGELOG, README phone Cowork bullet en/zh) merged as 851b185.
- Tag v0.1.40 → 851b185, release marked Latest with setup.exe, blockmap, portable.zip, latest.yml (version 0.1.40). Built via `npm run release` from master.
- Validation on merged master before release: typecheck, check-cowork.mts, check-remote.mts, build, `electron scripts/check-remote-cowork.cjs` all passed; release.ps1 typecheck + electron-builder passed.

## Next / limits
- Linux linux-v0.1.0 PUBLISHED (user-authorised): tag created via GitHub API on master b98dc0d (local git was hung); CI run 37874886216 build+publish green; prerelease with AppImage/deb/tar.gz x64; releases/latest still v0.1.40. Next Linux release: bump apps/linux/package.json, then tag linux-vX.Y.Z (must match).
- Main workspace git: .git/index went OneDrive cloud-only and hung (~160 unkillable git status). Needs full OneDrive quit or reboot, then `git reset -q` to rebuild the index. Commits this session were made with a temporary GIT_INDEX_FILE outside OneDrive. `.git` has conflict copies from machine GG5275-NB — OneDrive syncs .git across machines; consider moving the repo out of OneDrive.
- Phone Cowork: no real iPhone ↔ desktop E2E yet; a meeting started on desktop shows in the phone list only after reload/reconnect; not ported to apps/linux (DEC-011 manual port).
- Old worktree C:/Users/milan.chang/AppData/Local/Temp/agent-workbench-mobile-cowork (branch merged) still exists; its node_modules is a junction to the main workspace — remove the junction before deleting the worktree. Remote branches feat/* and release/v0.1.40 not deleted.
- Other Linux distributions, ARM64, real deb install and complete agent-provider/phone remote E2E remain unverified. Linux updater checks the newest 100 releases.
- WSL verification cache: /home/milanchang/.cache/agent-workbench-linux-verification.
- Temp/ and three phone screenshots remain untracked and untouched in the main workspace.
- History: archive/handoff-2026-10-09-pr41-pr42-before-merge.md, archive/handoff-2026-10-08-linux-local-verification-before-pr.md.
