"""Evidence gate for a blog post, enforced by scripts/publish_blog.py.

The scheduler runs unattended, so an unreviewed post must be impossible to
publish rather than merely discouraged in a prompt. These are the checks this
repo can actually prove from its own files — they do not certify that a
procedure is true, only that it contradicts known facts, or that the page is
broken. A human still reviews usefulness and source accuracy.

Failures are collected, not raised on the first hit, so one run reports every
problem at once.
"""
from __future__ import annotations

import json
import re
from datetime import date, datetime
from pathlib import Path

BLOG_DIR = Path(__file__).parent.parent / "docs" / "blog"
DOCS_DIR = BLOG_DIR.parent

# Claims the audit disproved against the packaged extension. Wording varies, so
# match on the falsifiable core rather than whole sentences. Each entry is
# (pattern, why it is wrong). Most of these are only falsifiable when the
# sentence is about the extension: a guide may correctly say Gmail's Spam
# folder empties in one action, or that the 15 GB pool is shared. So a claim is
# reported when the pattern matches a sentence that also names the product,
# unless `always` is set for wording that is false in any context.
PRODUCT = r"inbox cleaner|the extension|chrome extension"
FORBIDDEN = [
    (r"via the Gmail API|through the Gmail API",
     "the packaged extension has no Gmail API, OAuth or network code; it walks Gmail's rendered DOM", True),
    (r"no 50-per-page|no per-page limit|no page limit",
     "senders are chunked 20 per query and each chunk is a sequential Gmail navigation", False),
    (r"in one click|one-click|single-click",
     "selecting senders and confirming are two user actions", False),
    (r"no timeouts?|no select-all timeout",
     "large batches can stall; the extension reports unverified batches instead of denying it", False),
    (r"(?:entire|whole) (?:mailbox|inbox) at once|no practical limit",
     "counts are exact only for the top 250 senders and approximate beyond that", False),
    (r"storage freed|reclaim(?:ed|s)? \d|guaranteed to free",
     "Trash still uses storage until emptied; the extension never measures quota", False),
    # "never permanently deletes" is the truthful phrasing, so reject a negation
    # in the same sentence before flagging.
    (r"(?<!never )(?<!not )permanently delete(?:s|d)?",
     "the extension moves mail to Gmail Trash, which is recoverable for 30 days", False),
    # Only false when an AGE operator is attached to a standing filter rule:
    # plain "auto-delete new mail from a sender" is what filters do correctly.
    (r"(?:auto-?delete[sd]?|standing rule|standing filter)[^.<]{0,80}older_than:\w|older_than:\w[^.<]{0,60}auto-?delete",
     "filters test each email as it arrives, so an age operator cannot match newly delivered mail", True),
]

# Directories inside docs/ that must never appear as a link target in a post.
INTERNAL_PREFIXES = ("/superpowers/", "/blog/superpowers/")

# Sentences, so a claim can be attributed to the product rather than to Gmail.
_SENTENCE = re.compile(r"(?<=[.!?])\s+|\n")


def _visible(html: str) -> str:
    """Post content as a reader sees it: no script/style, no generated blocks."""
    text = re.sub(r"<script\b.*?</script>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<style\b.*?</style>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<!--\s*AUTO:.*?-->", " ", text, flags=re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    for entity, char in (("&amp;", "&"), ("&quot;", '"'), ("&#39;", "'"), ("&lt;", "<"), ("&gt;", ">"), ("&nbsp;", " ")):
        text = text.replace(entity, char)
    return text


def _date_fields(html: str) -> list[str]:
    return re.findall(r'"date(?:Published|Modified)":\s*"([^"]+)"', html)


def check_post(path: Path, today: date | None = None, blog_dir: Path = BLOG_DIR) -> list[str]:
    """Return a list of blocking problems; empty means the post may publish."""
    today = today or date.today()
    problems: list[str] = []
    if not path.exists():
        return [f"{path.name} does not exist"]

    html = path.read_text()
    body = _visible(html)

    title = re.search(r"<h1\b[^>]*>(.*?)</h1>", html, re.S)
    if not title or not re.sub(r"<[^>]+>", "", title.group(1)).strip():
        problems.append("missing a non-empty <h1>")

    description = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html)
    if not description or not description.group(1).strip():
        problems.append("missing a non-empty meta description")

    canonical = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"', html)
    if not canonical:
        problems.append("missing a canonical link")
    elif not canonical.group(1).startswith("https://inbox-cleaner.vercel.app/"):
        problems.append(f"canonical points off the preferred host: {canonical.group(1)}")

    dates = _date_fields(html)
    if not dates:
        problems.append("missing datePublished/dateModified in the Article schema")
    for value in dates:
        try:
            parsed = datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            problems.append(f"unparseable date: {value}")
            continue
        if parsed > today:
            problems.append(f"date is in the future: {value}")

    if re.search(r"<script[^>]*application/ld\+json", html):
        for match in re.finditer(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.S):
            try:
                json.loads(match.group(1))
            except json.JSONDecodeError as error:
                problems.append(f"invalid JSON-LD: {error}")

    # The H1/title names the task, not the product, so a guide legitimately
    # titled "Permanently Delete Gmail Emails" must not trip its own rule.
    title_text = re.sub(r"<[^>]+>", " ", title.group(1)) if title else ""
    claim_text = body.replace(title_text, " ") if title_text else body

    for pattern, reason, always in FORBIDDEN:
        for sentence in _SENTENCE.split(claim_text):
            hit = re.search(pattern, sentence, re.I)
            if not hit:
                continue
            # Wording that is false regardless of who it describes.
            if always or re.search(PRODUCT, sentence, re.I):
                problems.append(f'disproved claim "{hit.group(0)}" — {reason}')
                break

    for href in re.findall(r'(?:href|src)="([^"]+)"', html):
        if href.startswith(("http://", "https://", "mailto:", "#", "data:")):
            continue
        for prefix in INTERNAL_PREFIXES:
            if href.startswith(prefix):
                problems.append(f"links to an internal document that is not published: {href}")
        target = href.split("#")[0].split("?")[0]
        if not target:
            continue
        resolved = (DOCS_DIR / target.lstrip("/")) if target.startswith("/") else (path.parent / target)
        resolved = resolved.resolve()
        if resolved.is_dir():
            resolved = resolved / "index.html"
        if not resolved.exists():
            problems.append(f"broken local link: {href}")

    return problems


def main() -> int:
    import sys

    if len(sys.argv) != 2:
        print("Usage: python3 scripts/content_gate.py <slug>")
        return 2
    slug = sys.argv[1]
    path = BLOG_DIR / f"{slug}.html"
    problems = check_post(path)
    if problems:
        print(f"Not publishable: docs/blog/{slug}.html")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print(f"Gate passed: docs/blog/{slug}.html")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())