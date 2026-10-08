# Latest Handoff

- Agent: Codex
- Updated: 2026-10-08 Asia/Taipei
- Workspace: feat/linux-independent-app; Windows v0.1.39 unchanged; independent Linux v0.1.0 implemented, not released.
- User authorized source commit and new PR for Issue #40; source commit 404fbd5 pushed to origin/feat/linux-independent-app.
- PR #41 OPEN against master: https://github.com/zkylek1212-k/Mulit-Harness-ADE/pull/41 (Closes #40 on merge).
- Architecture: DEC-011, two independent apps in one repo; no shared runtime imports or npm workspace. Windows users take priority.

## Completed
- Committed 141 source/config/doc files (61,966 insertions): apps/linux fork, apps/README.md, isolated Linux workflow and .gitignore addition. Existing Windows source/package/build files untouched.
- Linux owns appId, userData and .workbench-linux settings; native main/detached window frames, system/default shells, Linux protected/symlink paths and case-sensitive checks.
- Credential storage rejects unavailable encryption/basic_text; manual Linux updater uses linux-v* prereleases and Linux x64 assets, never Windows latest/update metadata.
- Separate Ubuntu CI builds AppImage/deb/tar.gz; Linux tagged publication requires matching package version, prerelease and latest=false. No tag or release created.
- Local release packages remain ignored under apps/linux/release; Temp/ and three phone screenshots remain untracked and untouched.

## Validation
- Prior implementation: root Windows typecheck passed; all 134 tracked Windows source/scripts/package/build files unchanged. Linux relative imports stay within apps/linux.
- Ubuntu 26.04 x64 WSL: independent npm ci, typecheck, Linux guard/default shell checks, Node 24 native PTY and production build passed.
- Real Electron main/detached-window startup, System Shell spawn/kill and isolated userData passed; packaged Electron native PTY passed.
- All three packages built; tar contents and Debian package identity/ALSA runtime dependency metadata verified. publish:null produces no updater metadata.
- Before source commit: check:linux passed again; staged whitespace and root Windows tracked-path diff checks passed; pre-commit hook passed.
- PR CI first run queued: https://github.com/zkylek1212-k/Mulit-Harness-ADE/actions/runs/37798530660 . GitHub CI has not yet passed; later memory push may start a new run.

## Next / limits
- Review PR #41 and its latest-head CI before merging. No merge or release authorized/performed.
- Other Linux distributions, ARM64, actual deb installation and complete agent-provider/phone remote E2E remain unverified.
- Duplicate apps require manual porting of common fixes. Any shared source/dependency proposal must revisit DEC-011 and Windows impact.
- Linux updater currently checks the newest 100 releases (ponytail limit); expand pagination when release volume warrants it.
- WSL verification cache: /home/milanchang/.cache/agent-workbench-linux-verification (Node 24, app, local runtime libs); /tmp does not persist reliably across WSL shutdown.
- Detailed implementation/package verification preserved in archive/handoff-2026-10-08-linux-local-verification-before-pr.md; earlier plan and Windows sync histories remain archived.
