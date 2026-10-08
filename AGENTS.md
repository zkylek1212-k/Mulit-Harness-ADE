# Agent Instructions

Canonical cross-agent memory is `.project-memory/`.

## Startup — run this ONE command first, every session

```bash
bash .project-memory/status.sh
```

It prints tier-1 memory (`INDEX.md` + `handoff.md`) and reports whether the branch is behind the
remote. Do not read those two files separately — the command already gave you their contents.

Then:
1. Inspect `git status --short` and `git branch --show-current`.
2. Summarise the current context in <=3 bullets.
3. Read `.project-memory/PROTOCOL.md` on first entry to this repo, for Git/worktree/merge tasks,
   for memory-file changes, or when the rules are unclear.
4. Read `STATE.md` / `DECISIONS.md` only when the task needs macro status or architecture history.

## Before finishing

Apply the memory-update criteria in `PROTOCOL.md`: rewrite `handoff.md` when the work meets the
threshold; skip it entirely for read-only questions, trivial explanations, and no-change reviews.

Then commit the memory yourself — an uncommitted handoff does not exist for anyone else:

```bash
bash .project-memory/commit-handoff.sh "docs(memory): <one-line summary>"
```

It is pathspec-limited to memory files, so the user's staged source changes are left untouched.
It pushes only when `MEM_AUTOPUSH=1`; otherwise say clearly that the handoff is not pushed yet.

## Never

- Auto pull/rebase/merge/reset/force-push without user authorization. `git fetch` is read-only and fine.
- Commit the user's SOURCE code on your own initiative — committing shared memory is fine, that is not.
- Commit secrets, tokens, passwords, API keys, or private keys.
- Rewrite historical decisions — supersede them instead.

<!-- BEGIN AUTO-MEMORY (generated from .project-memory/handoff.md - do not edit) -->

## Current shared memory (tier 1 - auto-generated, do not edit here)

You already have the current handoff below. Do NOT re-read `.project-memory/handoff.md`.
Read `STATE.md` / `DECISIONS.md` / `PROTOCOL.md` only on demand.
For the freshest copy plus a remote-drift check, run `bash .project-memory/status.sh`.

---

# Latest Handoff

- Agent: Claude Code
- Updated: 2026-10-09 Asia/Taipei
- Two open lines of work. User paused Linux to prioritise phone Cowork (separate PR).
- Architecture: DEC-011, two independent apps in one repo; no shared runtime imports or npm workspace. Windows users take priority.

## A. Phone Cowork — PR #42 OPEN (priority)
- PR: https://github.com/zkylek1212-k/Mulit-Harness-ADE/pull/42 ; branch feat/mobile-cowork @ bfef6f3 (from origin/master 153c1fc).
- Worktree: C:/Users/milan.chang/AppData/Local/Temp/agent-workbench-mobile-cowork (node_modules is a junction to the main workspace's node_modules; remove the junction before deleting the worktree).
- Phone gets a Cowork tile per workspace: list, new meeting (mode/participants/chair; models from saved settings), timeline, per-phase actions mirroring desktop. Board editing and model picking stay desktop-only.
- main/ipc/cowork.ts: one `ops` table registers all 27 cowork:* IPC handlers and serves Remote Bridge (`invokeCowork`); `coworkEvents` 'update' feeds `coworkRun` pushes (context stripped). Workspace comes from windowId, never from the phone.
- Validation: typecheck, check-cowork.mts, check-remote.mts, build passed; new `electron scripts/check-remote-cowork.cjs` (built phone bundle + fake socket) passed 3/3 after `npm run build`.
- Not done: real iPhone ↔ desktop E2E; the list does not show a meeting started on desktop until reload/reconnect; not ported to apps/linux (DEC-011 manual port).

## B. Linux independent app — PR #41 OPEN, CI failing
- PR: https://github.com/zkylek1212-k/Mulit-Harness-ADE/pull/41 (Closes #40); branch feat/linux-independent-app, source commit 404fbd5, memory ef876eb.
- CI runs 37798530660 and 37798723248 failed at "Verify main and terminal windows": Electron FATAL, chrome-sandbox must be root-owned mode 4755 on GitHub Ubuntu runners. typecheck/check:linux/check:pty/dist steps passed.
- UNCOMMITTED fix in main workspace: .github/workflows/linux-app.yml adds "Enable Electron SUID sandbox" step (sudo chown root:root + chmod 4755 on node_modules/electron/dist/chrome-sandbox) before the window check. Not pushed; user has not yet authorised commit/push.
- Linux owns appId, userData and .workbench-linux settings; native frames, system/default shells, Linux protected/symlink paths and case-sensitive checks.
- Credential storage rejects unavailable encryption/basic_text; manual updater uses linux-v* prereleases and Linux x64 assets only.
- Separate Ubuntu CI builds AppImage/deb/tar.gz; tagged publication requires matching version, prerelease and latest=false. No tag or release created.
- Local validation (WSL Ubuntu 26.04 x64): npm ci, typecheck, guards, Node 24 PTY, build, Electron startup, System Shell, packaged PTY, all three packages verified. Root Windows typecheck passed and Windows files untouched.

## Next / limits
- A: review PR #42, then real-phone test; optionally refetch the list when an unknown run id arrives.
- B: commit/push the CI fix when authorised, wait for green CI, then review. No merge or release authorised/performed for either PR.
- Other Linux distributions, ARM64, real deb install and complete agent-provider/phone remote E2E remain unverified.
- Linux updater checks the newest 100 releases (ponytail limit).
- WSL verification cache: /home/milanchang/.cache/agent-workbench-linux-verification; /tmp does not persist across WSL shutdown.
- Temp/ and three phone screenshots remain untracked and untouched in the main workspace.
- Detailed Linux verification: archive/handoff-2026-10-08-linux-local-verification-before-pr.md; earlier histories archived.

<!-- END AUTO-MEMORY -->
