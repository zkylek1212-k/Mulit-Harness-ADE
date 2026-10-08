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

<!-- END AUTO-MEMORY -->
