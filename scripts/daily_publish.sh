#!/bin/bash
cd "$(dirname "$0")/.." || exit 1

# Bound failed connections, including Git commands run by the publishing agent.
export GIT_TERMINAL_PROMPT=0
export GIT_HTTP_LOW_SPEED_LIMIT=1000
export GIT_HTTP_LOW_SPEED_TIME=30
export GIT_SSH_COMMAND='ssh -o BatchMode=yes -o ConnectTimeout=15 -o ConnectionAttempts=1 -o ServerAliveInterval=15 -o ServerAliveCountMax=2'

notify_failure() {
  local reason="$1"
  osascript -e "display notification \"$reason — see scripts/daily_publish.log\" with title \"Inbox Cleaner: daily blog publish failed\" sound name \"Basso\"" >/dev/null 2>&1
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) daily_publish.sh FAILED: $reason ===" >> scripts/daily_publish.log
}

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) daily_publish.sh starting ===" >> scripts/daily_publish.log

if ! git fetch origin main >> scripts/daily_publish.log 2>&1; then
  notify_failure "git fetch failed"
  exit 1
fi

if ! git merge --ff-only origin/main >> scripts/daily_publish.log 2>&1; then
  notify_failure "git merge failed"
  exit 1
fi

if ! slug=$(python3 -c 'import json; print(next((t["slug"] for t in json.load(open("scripts/blog-topics.json")) if t["status"] == "pending"), ""))'); then
  notify_failure "could not read topic queue"
  exit 1
fi
if [ -z "$slug" ]; then
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) Queue empty - no pending topics ===" >> scripts/daily_publish.log
  exit 0
fi

if ! /Users/pushpendrasingh/.local/bin/claude -p "$(cat scripts/daily_publish_prompt.md)" \
  --allowedTools "Bash Read Write Edit Glob Grep" \
  >> scripts/daily_publish.log 2>&1; then
  notify_failure "claude publish run failed (check auth: run 'claude' interactively to re-login if session expired)"
  exit 1
fi

# A zero CLI exit status can still be a refusal or incomplete generation.
# Confirm the selected article is committed on the remote before reporting success.
if ! git fetch origin main >> scripts/daily_publish.log 2>&1 ||
   ! git cat-file -e "origin/main:docs/blog/$slug.html" 2>> scripts/daily_publish.log ||
   ! git merge-base --is-ancestor HEAD origin/main; then
  notify_failure "post not verified on origin/main: $slug"
  exit 1
fi

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) daily_publish.sh finished (exit 0) ===" >> scripts/daily_publish.log
