#!/usr/bin/env bash
# Commit the shared memory BY ITSELF, so the handoff reaches other agents and other machines
# without waiting for the user to commit.
#
# Safety model:
#   commit = local and reversible (git reset --soft HEAD~1) -> done automatically.
#   push   = outward facing       -> opt-in via MEM_AUTOPUSH=1, never forced.
#   Source files are NEVER touched: the commit is pathspec-limited to memory + entry files,
#   so anything else you have staged stays staged and uncommitted.
#
# Usage: bash .project-memory/commit-handoff.sh ["commit message"]

set -e
MEM="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$MEM/.." && pwd)"
cd "$REPO"

MSG="${1:-docs(memory): update handoff}"

# Regenerate the block Codex/Antigravity auto-load, so it lands in this same commit.
[ -f "$MEM/sync-entry-files.sh" ] && bash "$MEM/sync-entry-files.sh" >/dev/null 2>&1 || true

PATHS=(".project-memory")
[ -f "AGENTS.md" ] && PATHS+=("AGENTS.md")
[ -f ".agents/rules/shared-memory.md" ] && PATHS+=(".agents/rules/shared-memory.md")

# Use status, not diff: `git diff` does not see UNTRACKED files, so a freshly scaffolded repo
# (no commits yet) would otherwise look like "nothing to commit" and silently do nothing.
if [ -z "$(git status --porcelain -- "${PATHS[@]}")" ]; then
  echo "No memory changes to commit."
  exit 0
fi

git add -- "${PATHS[@]}"
# Pathspec-limited commit: only these paths go in, other staged work is left alone.
git commit -q -m "$MSG" -- "${PATHS[@]}"
echo "Committed memory: $(git rev-parse --short HEAD) $MSG"

if [ "${MEM_AUTOPUSH:-0}" = "1" ]; then
  if git rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
    if git push --quiet 2>/dev/null; then
      echo "Pushed to $(git rev-parse --abbrev-ref '@{u}')."
    else
      echo "Push rejected (branch is probably behind). Sync first, then push. NOT forcing."
    fi
  else
    echo "No upstream configured; commit stays local."
  fi
else
  echo "Not pushed (MEM_AUTOPUSH=0). Other machines see this after you push."
fi
