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

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  notify_failure "tracked working tree has edits; commit or resolve them before publishing"
  exit 1
fi

# Process up to 3 blogs per day
published=0
max_blogs=3

for ((i=1; i<=max_blogs; i++)); do
  if ! selection=$(python3 scripts/publish_blog.py --select); then
    notify_failure "could not read topic queue or evidence records"
    break
  fi
  if [ "$selection" = "empty" ]; then
    echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) Queue empty - no pending topics ===" >> scripts/daily_publish.log
    break
  fi
  export BLOG_JOB_ACTION="${selection%% *}"
  export BLOG_JOB_SLUG="${selection#* }"
  slug="$BLOG_JOB_SLUG"
  if [ "$BLOG_JOB_ACTION" = "review" ]; then
    echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) Pending drafts await evidence review; nothing ready to publish ===" >> scripts/daily_publish.log
    break
  fi

  if ! /Users/pushpendrasingh/.local/bin/claude -p "$(cat scripts/daily_publish_prompt.md)" \
    --allowedTools "Bash Read Write Edit Glob Grep" \
    >> scripts/daily_publish.log 2>&1; then
    notify_failure "claude publish run failed (check auth: run 'claude' interactively to re-login if session expired)"
    break
  fi

  # Drafting is useful unattended work, but is never publication approval.
  if [ "$BLOG_JOB_ACTION" = "draft" ]; then
    if [ ! -f "internal/blog-drafts/$slug.html" ] || [ ! -f "internal/blog-drafts/$slug.evidence.json" ]; then
      notify_failure "draft or evidence sidecar was not created: $slug"
      break
    fi
    echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) Draft saved: $slug; evidence review required before publication ===" >> scripts/daily_publish.log
    # Continue to next iteration to publish another blog
    continue
  fi

  # A zero CLI exit status can still be a refusal or incomplete generation.
  # Confirm the selected article is committed on the remote before reporting success.
  if ! git fetch origin main >> scripts/daily_publish.log 2>&1 ||
     ! git cat-file -e "origin/main:docs/blog/$slug.html" 2>> scripts/daily_publish.log ||
     ! git merge-base --is-ancestor HEAD origin/main; then
    notify_failure "post not verified on origin/main: $slug"
    break
  fi

  # Mark as published in the topic queue
  python3 -c "
import json
from pathlib import Path
TOPICS_PATH = Path('scripts/blog-topics.json')
topics = json.loads(TOPICS_PATH.read_text())
for topic in topics:
    if topic['slug'] == '$slug':
        topic['status'] = 'published'
        break
TOPICS_PATH.write_text(json.dumps(topics, indent=2) + '\n')
"
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) Blog $i published: $slug ===" >> scripts/daily_publish.log
  published=$((published + 1))
done

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) daily_publish.sh finished (published=$published) ===" >> scripts/daily_publish.log