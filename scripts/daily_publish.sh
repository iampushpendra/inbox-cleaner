#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) daily_publish.sh starting ===" >> scripts/daily_publish.log

git fetch origin main >> scripts/daily_publish.log 2>&1
git merge --ff-only origin/main >> scripts/daily_publish.log 2>&1

/Users/pushpendrasingh/.local/bin/claude -p "$(cat scripts/daily_publish_prompt.md)" \
  --allowedTools "Bash Read Write Edit Glob Grep" \
  >> scripts/daily_publish.log 2>&1

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) daily_publish.sh finished (exit $?) ===" >> scripts/daily_publish.log
