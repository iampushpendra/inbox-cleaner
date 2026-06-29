#!/usr/bin/env python3
"""
Find Reddit threads to comment on for Inbox Cleaner outreach.
Run: python3 find-reddit-threads.py

Queries Reddit's public search API. No API key needed.
Results are sorted by newest first so you catch threads while they're active.
"""

import urllib.request
import urllib.parse
import json
import time
from datetime import datetime, timezone

HEADERS = {"User-Agent": "InboxCleanerOutreach/1.0 (contact: pushpendra.singh@freed.care)"}

QUERIES = [
    "delete all emails from one sender gmail",
    "gmail inbox full how to delete",
    "gmail bulk delete emails",
    "gmail storage full delete",
    "gmail inbox zero tips",
    "clean up gmail inbox",
    "delete thousands of emails gmail",
]

SUBREDDITS = "r/GMail+r/productivity+r/lifehacks+r/techsupport+r/Entrepreneur+r/selfimprovement"

MIN_COMMENTS = 1   # skip dead threads


def reddit_search(query: str, limit: int = 10) -> list[dict]:
    params = urllib.parse.urlencode({
        "q": query,
        "restrict_sr": "off",
        "sort": "new",
        "t": "month",
        "limit": limit,
        "type": "link",
    })
    url = f"https://www.reddit.com/search.json?{params}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        return data.get("data", {}).get("children", [])
    except Exception as e:
        print(f"  [error fetching] {e}")
        return []


def age_str(created_utc: float) -> str:
    now = datetime.now(timezone.utc).timestamp()
    hours = int((now - created_utc) / 3600)
    if hours < 24:
        return f"{hours}h ago"
    return f"{hours // 24}d ago"


def main():
    seen_ids = set()
    all_results = []

    print("=" * 70)
    print("  INBOX CLEANER — Reddit Thread Finder")
    print(f"  Run at: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 70)

    for query in QUERIES:
        posts = reddit_search(query)
        for post in posts:
            d = post["data"]
            post_id = d["id"]
            if post_id in seen_ids:
                continue
            seen_ids.add(post_id)
            if d["num_comments"] < MIN_COMMENTS:
                continue
            # filter to relevant subreddits only
            sub = d["subreddit"].lower()
            if sub not in {"gmail", "productivity", "lifehacks", "techsupport",
                           "entrepreneur", "selfimprovement", "googlepixel",
                           "google", "androidquestions", "ios", "apple"}:
                continue
            all_results.append({
                "title": d["title"],
                "subreddit": d["subreddit_name_prefixed"],
                "url": f"https://reddit.com{d['permalink']}",
                "comments": d["num_comments"],
                "score": d["score"],
                "age": age_str(d["created_utc"]),
                "query": query,
            })
        time.sleep(1)  # be polite to Reddit's API

    # sort by age (newest first = smallest age_str hours)
    all_results.sort(key=lambda x: x["comments"], reverse=True)

    if not all_results:
        print("\n  No relevant threads found this month. Try again next week.")
        return

    print(f"\n  Found {len(all_results)} threads to comment on:\n")

    for i, r in enumerate(all_results, 1):
        print(f"  {i}. [{r['subreddit']}] {r['title']}")
        print(f"     {r['url']}")
        print(f"     Comments: {r['comments']}  |  Score: {r['score']}  |  Posted: {r['age']}")
        print()

    print("-" * 70)
    print("COMMENT TEMPLATE (adapt to each thread):")
    print("-" * 70)
    print("""
  [If they're asking how to bulk delete Gmail emails]

  Gmail's built-in method caps at 50 emails per page, so it's tedious for
  large inboxes. I built a free tool called Inbox Cleaner that scans your
  inbox, ranks every sender by count, and lets you move thousands of emails
  to Trash in one click — no install needed, runs in the browser.

  → https://inbox-cleaner.vercel.app

  Happy to answer questions about how it works.

  --

  [If they're asking about Gmail storage]

  The fastest way is to find the senders responsible for the bulk of your
  emails and delete them all at once. I built a free tool that shows you
  every sender ranked by count — usually 5-10 senders account for 80% of
  the clutter. Deletes in one click.

  → https://inbox-cleaner.vercel.app
""")


if __name__ == "__main__":
    main()
