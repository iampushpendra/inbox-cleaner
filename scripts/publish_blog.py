import json
import sys
from datetime import date
from pathlib import Path
from typing import Optional

BLOG_DIR = Path(__file__).parent.parent / "docs" / "blog"
SITEMAP_PATH = Path(__file__).parent.parent / "docs" / "sitemap.xml"
TOPICS_PATH = Path(__file__).parent / "blog-topics.json"
BASE_URL = "https://inbox-cleaner.vercel.app"


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


def update_sitemap(slug: str, today: str, sitemap_path: Path = SITEMAP_PATH) -> None:
    content = sitemap_path.read_text()
    new_url = (
        f"  <url>\n"
        f"    <loc>{BASE_URL}/blog/{slug}.html</loc>\n"
        f"    <lastmod>{today}</lastmod>\n"
        f"    <changefreq>monthly</changefreq>\n"
        f"    <priority>0.8</priority>\n"
        f"  </url>\n"
    )
    content = content.replace("</urlset>", new_url + "</urlset>")
    sitemap_path.write_text(content)


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
        print("  Marks <slug> published in blog-topics.json and appends it to sitemap.xml.")
        print("  Run this AFTER writing docs/blog/<slug>.html.")
        sys.exit(1)

    slug = sys.argv[1]
    out_path = BLOG_DIR / f"{slug}.html"
    if not out_path.exists():
        print(f"Error: {out_path} does not exist. Write the post first.")
        sys.exit(1)

    today = date.today().isoformat()
    update_sitemap(slug, today)
    mark_published(slug)

    print(f"Sitemap updated: docs/sitemap.xml ({slug})")
    print(f"Topic marked published: {slug}")


if __name__ == "__main__":
    main()
