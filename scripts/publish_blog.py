import json
import sys
import subprocess
import re
import shutil
from pathlib import Path
from typing import Optional

BLOG_DIR = Path(__file__).parent.parent / "docs" / "blog"
TOPICS_PATH = Path(__file__).parent / "blog-topics.json"


def load_queue(topics_path: Path = TOPICS_PATH) -> Optional[dict]:
    topics = json.loads(topics_path.read_text())
    from content_gate import check_readiness
    root = topics_path.parent.parent
    pending = [topic for topic in topics if topic["status"] == "pending"]
    for topic in pending:
        path = root / "docs/blog" / f'{topic["slug"]}.html'
        draft = root / "internal/blog-drafts" / path.name
        if draft.exists():
            path = draft
        if not check_readiness(path, repo_root=root):
            return dict(topic, action="publish")
    for topic in pending:
        if not (root / "internal/blog-drafts" / f'{topic["slug"]}.html').exists():
            return dict(topic, action="draft")
    if pending:
        return dict(pending[0], action="review")
    return None


def get_published_posts(blog_dir: Path = BLOG_DIR) -> list[dict]:
    import re
    posts = []
    for html_file in sorted(blog_dir.glob("*.html")):
        content = html_file.read_text()
        match = re.search(r'<h1[^>]*class="blog-h1"[^>]*>(.*?)</h1>', content, re.DOTALL)
        if match:
            title = re.sub(r"<[^>]+>", "", match.group(1)).strip()
            posts.append({"slug": html_file.stem, "title": title})
    return posts


def mark_published(slug: str, topics_path: Path = TOPICS_PATH) -> None:
    topics = json.loads(topics_path.read_text())
    for topic in topics:
        if topic["slug"] == slug:
            topic["status"] = "published"
            break
    topics_path.write_text(json.dumps(topics, indent=2) + "\n")


def main() -> None:
    if len(sys.argv) == 2 and sys.argv[1] == "--select":
        topic = load_queue()
        print(f'{topic["action"]} {topic["slug"]}' if topic else "empty")
        return
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/publish_blog.py <slug>")
        print("  Regenerates site discovery/extension links and marks <slug> published.")
        print("  Run this AFTER writing docs/blog/<slug>.html.")
        sys.exit(1)

    slug = sys.argv[1]
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        print("Error: invalid slug")
        sys.exit(1)
    topics = json.loads(TOPICS_PATH.read_text())
    topic = next((t for t in topics if t.get("slug") == slug), None)
    if not topic or topic.get("status") not in ("pending", "published"):
        print("Error: slug must be a known pending topic or published refresh")
        sys.exit(1)
    out_path = BLOG_DIR / f"{slug}.html"
    draft_path = BLOG_DIR.parent.parent / "internal/blog-drafts" / out_path.name
    source = draft_path if draft_path.exists() else out_path
    from content_gate import check_post, check_readiness
    problems = check_post(source) + check_readiness(source)
    if problems:
        print(f"Not publishable: docs/blog/{slug}.html")
        for problem in problems:
            print(f"  - {problem}")
        sys.exit(1)
    print(f"Gate passed: docs/blog/{slug}.html")

    if source != out_path:
        shutil.copyfile(source, out_path)

    # Derive every discovery surface from the files that actually exist.
    # Vercel runs this same build even for articles added outside this publisher.
    subprocess.run(["node", str(Path(__file__).parent / "build_site.mjs")], check=True)
    mark_published(slug)

    print(f"Sitemap updated: docs/sitemap.xml ({slug})")
    print(f"Topic marked published: {slug}")


if __name__ == "__main__":
    main()
