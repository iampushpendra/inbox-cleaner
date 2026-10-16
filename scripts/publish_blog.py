import json
import sys
import subprocess
from pathlib import Path
from typing import Optional

BLOG_DIR = Path(__file__).parent.parent / "docs" / "blog"
TOPICS_PATH = Path(__file__).parent / "blog-topics.json"


def load_queue(topics_path: Path = TOPICS_PATH) -> Optional[dict]:
    topics = json.loads(topics_path.read_text())
    for topic in topics:
        if topic["status"] == "pending":
            return topic
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
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/publish_blog.py <slug>")
        print("  Regenerates site discovery/extension links and marks <slug> published.")
        print("  Run this AFTER writing docs/blog/<slug>.html.")
        sys.exit(1)

    slug = sys.argv[1]
    out_path = BLOG_DIR / f"{slug}.html"
    if not out_path.exists():
        print(f"Error: {out_path} does not exist. Write the post first.")
        sys.exit(1)

    # Derive every discovery surface from the files that actually exist.
    # Vercel runs this same build even for articles added outside this publisher.
    subprocess.run(["node", str(Path(__file__).parent / "build_site.mjs")], check=True)
    mark_published(slug)

    print(f"Sitemap updated: docs/sitemap.xml ({slug})")
    print(f"Topic marked published: {slug}")


if __name__ == "__main__":
    main()
