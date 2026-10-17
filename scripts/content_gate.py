"""Evidence gate for a blog post, enforced by scripts/publish_blog.py.

The publisher requires both structural/factual checks and an explicit evidence
record bound to the reviewed article and current product version. These checks
validate recorded review metadata; they cannot certify external truth. A real
agent or human reviewer must inspect usefulness and source accuracy.

Failures are collected, not raised on the first hit, so one run reports every
problem at once.
"""
from __future__ import annotations

import hashlib
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
        resolved = (DOCS_DIR / target.lstrip("/")) if target.startswith("/") else (blog_dir / target)
        resolved = resolved.resolve()
        if resolved.is_dir():
            resolved = resolved / "index.html"
        if not resolved.exists():
            problems.append(f"broken local link: {href}")

    return problems



def post_fingerprint(path: Path) -> str:
    """SHA-256 of authored UTF-8 HTML, excluding complete generated AUTO regions."""
    html = path.read_text()
    html = re.sub(r"<!-- AUTO:([a-z-]+):start -->.*?<!-- AUTO:\1:end -->(?:\r?\n)?", "", html, flags=re.S)
    return hashlib.sha256(html.encode("utf-8")).hexdigest()


def check_readiness(path: Path, repo_root: Path | None = None,
                    today: date | None = None) -> list[str]:
    """Validate recorded evidence, not external truth or a human's approval.

    Documentation-only articles may use substantive source_review. Fixtures and
    live_mailbox reviews require a saved local evidence asset. No network request
    here can substitute for source review: URL validity is syntax only.
    """
    from urllib.parse import urlparse
    root = repo_root or Path(__file__).resolve().parent.parent
    today = today or date.today()
    problems = []
    try:
        records = json.loads((root / "scripts/content-records.json").read_text())
        topics = json.loads((root / "scripts/blog-topics.json").read_text())
        version = json.loads((root / "manifest.json").read_text())["version"]
    except (OSError, ValueError, KeyError, TypeError) as error:
        return [f"cannot read readiness inputs: {error}"]
    topic = next((t for t in topics if t.get("slug") == path.stem), None)
    if not topic or topic.get("status") not in ("pending", "published"):
        problems.append("slug must be a known pending topic (published refreshes require review too)")
    record = records.get(path.stem) if isinstance(records, dict) else None
    if not isinstance(record, dict):
        return problems + ["missing content evidence record"]
    if record.get("state") != "publish_ready":
        problems.append("evidence state must be publish_ready")
    if not record.get("intent_owner") or (topic and record.get("intent_owner") != topic.get("intent_owner")):
        problems.append("intent_owner must match the editorial brief")
    if record.get("product_manifest_version") != version:
        problems.append("product manifest version changed; review again")
    if not path.is_file() or record.get("post_sha256") != post_fingerprint(path):
        problems.append("post fingerprint is missing or stale; review the current article")
    try:
        verified = date.fromisoformat(record.get("verified_on", ""))
        if verified > today:
            problems.append("verification date is in the future")
    except (ValueError, TypeError):
        problems.append("missing or invalid verification date")
    for field in ("limitations", "related_links"):
        value = record.get(field)
        if not isinstance(value, list) or not value or any(not isinstance(v, str) or not v.strip() for v in value):
            problems.append(f"{field} must be a non-empty list")
    if not isinstance(record.get("information_gain"), str) or not record["information_gain"].strip():
        problems.append("missing concrete information_gain")
    reviewer = record.get("reviewer")
    if not isinstance(reviewer, dict) or not reviewer.get("identity") or reviewer.get("kind") not in ("agent", "human"):
        problems.append("reviewer must identify the actual agent or human reviewer")
    sources = record.get("sources")
    if not isinstance(sources, list) or not sources:
        problems.append("at least one substantively reviewed source is required")
    else:
        for source in sources:
            if not isinstance(source, dict):
                problems.append("invalid citation record")
                continue
            raw_url = source.get("url", "")
            url = urlparse(raw_url if isinstance(raw_url, str) else "")
            if url.scheme != "https" or not url.netloc or not source.get("supports") or not source.get("review_notes"):
                problems.append("citation needs HTTPS URL, supports and substantive review_notes")
    if path.is_file():
        try:
            store = json.loads((root / "scripts/site-config.json").read_text())["extensionStoreUrl"]
        except (OSError, ValueError, KeyError):
            problems.append("missing canonical extension store configuration")
        else:
            html = path.read_text()
            for css_class in ("blog-nav-cta", "blog-cta-btn"):
                buttons = re.findall(r'<a\b[^>]*class="' + css_class + r'"[^>]*>', html)
                if not buttons or any(f'href="{store}"' not in button for button in buttons):
                    problems.append(f"{css_class} must use the configured Chrome Web Store URL before review")
    kind = record.get("verification_kind")
    if kind not in ("source_review", "synthetic_fixture", "live_mailbox"):
        problems.append("verification_kind must be source_review, synthetic_fixture or live_mailbox")
    assets = record.get("assets")
    if not isinstance(assets, list):
        problems.append("assets must be a list (empty is valid for source_review)")
    else:
        if kind in ("synthetic_fixture", "live_mailbox") and not assets:
            problems.append(f"{kind} requires a saved local evidence asset")
        for asset in assets:
            if not isinstance(asset, str) or not asset:
                problems.append("invalid local evidence asset")
                continue
            resolved = (root / asset).resolve()
            if not resolved.is_relative_to(root.resolve()) or not resolved.is_file():
                problems.append(f"missing or unsafe local evidence asset: {asset}")
    links = record.get("related_links")
    if isinstance(links, list):
        for link in links:
            if not isinstance(link, str) or not link.startswith("/") or link.startswith("//"):
                problems.append(f"related link must be a local absolute URL: {link}")
                continue
            target = (root / "docs" / link.split("#")[0].split("?")[0].lstrip("/")).resolve()
            if target.is_dir():
                target /= "index.html"
            if not target.is_relative_to((root / "docs").resolve()) or not target.is_file():
                problems.append(f"broken evidence related link: {link}")
    return problems

def main() -> int:
    import sys

    ready = len(sys.argv) == 3 and sys.argv[1] == "--ready"
    if len(sys.argv) != 2 and not ready:
        print("Usage: python3 scripts/content_gate.py [--ready] <slug>")
        return 2
    slug = sys.argv[2] if ready else sys.argv[1]
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        print("Invalid slug")
        return 2
    path = BLOG_DIR / f"{slug}.html"
    problems = check_post(path)
    if ready:
        problems += check_readiness(path)
    if problems:
        print(f"Not publishable: docs/blog/{slug}.html")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print(f"Gate passed: docs/blog/{slug}.html")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())