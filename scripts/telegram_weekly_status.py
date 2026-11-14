#!/usr/bin/env python3
"""
Weekly Telegram status update for Inbox Cleaner blog pipeline.
Run via cron/launchd every 7 days.
Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars.
"""
import os
import json
import subprocess
import sys
from datetime import datetime, timedelta

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, cwd=REPO_ROOT, stderr=subprocess.DEVNULL).decode().strip()
    except subprocess.CalledProcessError:
        return ""

def send_telegram(text):
    if not BOT_TOKEN or not CHAT_ID:
        print("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID", file=sys.stderr)
        return False
    import urllib.request
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    data = json.dumps({"chat_id": CHAT_ID, "text": text, "parse_mode": "HTML"}).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"Telegram send failed: {e}", file=sys.stderr)
        return False

def main():
    since = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Last 7 days commits touching blog
    commits = run(f"git log --since='{since}' --pretty='• %ad %s' --date=short -- docs/blog")
    
    # Pending topics / drafts
    topics = run("python3 scripts/publish_blog.py --select 2>/dev/null || echo 'error'")
    draft_count = len(run("ls internal/blog-drafts/*.html 2>/dev/null").splitlines()) if run("ls internal/blog-drafts/*.html 2>/dev/null") else 0
    
    # Last published (from sitemap or git)
    last_pub = run("git log -1 --pretty='%ad %s' --date=short -- docs/blog/*.html 2>/dev/null | head -1")
    
    # Queue status
    queue = run("python3 -c \"import json; d=json.load(open('scripts/blog-topics.json')); print(len(d))\" 2>/dev/null")
    
    # Dirty tree check
    dirty = "⚠️ YES" if run("git status --porcelain --untracked-files=no") else "✅ clean"
    
    text = f"""<b>📊 Inbox Cleaner — Weekly Status</b>
<b>Week ending:</b> {datetime.now().strftime('%Y-%m-%d')}

<b>📝 Last published:</b> {last_pub or 'none found'}

<b>📦 Commits last 7d (blog):</b>
{commits or '• none'}

<b>📋 Queue:</b> {queue} topics | {draft_count} drafts awaiting review
<b>🔄 Next action:</b> {topics}
<b>🧹 Working tree:</b> {dirty}

<b>🤖 Pipeline:</b> {'🟢 Running' if not dirty else '🔴 Blocked by dirty tree'}
"""
    send_telegram(text)

if __name__ == "__main__":
    main()