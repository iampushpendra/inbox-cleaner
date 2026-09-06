#!/bin/bash
cd "$(dirname "$0")/.."

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

if ! /Users/pushpendrasingh/.local/bin/claude -p "$(cat scripts/daily_publish_prompt.md)" \
  --allowedTools "Bash Read Write Edit Glob Grep" \
  >> scripts/daily_publish.log 2>&1; then
  notify_failure "claude publish run failed (check auth: run 'claude' interactively to re-login if session expired)"
  exit 1
fi

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) daily_publish.sh finished (exit 0) ===" >> scripts/daily_publish.log
