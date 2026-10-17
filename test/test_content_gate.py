import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from content_gate import check_post  # noqa: E402

VALID = """<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<link rel="canonical" href="https://inbox-cleaner.vercel.app/blog/example.html">
<meta name="description" content="A description.">
<script type="application/ld+json">{"@type":"Article","datePublished":"2026-10-01","dateModified":"2026-10-01"}</script>
</head><body><h1>How to Do the Thing in Gmail</h1>
<p>Body text about Gmail's own select-all banner.</p>
<p><a href="/blog/">All guides</a></p>
</body></html>"""


class ContentGateTest(unittest.TestCase):
    def write(self, tmp: Path, html: str, name: str = "example.html") -> Path:
        path = tmp / name
        path.write_text(html)
        return path

    def test_a_clean_post_passes(self):
        with self.Temporary() as tmp:
            self.assertEqual(check_post(self.write(tmp, VALID)), [])

    def test_blocks_the_disproved_api_claim(self):
        with self.Temporary() as tmp:
            problems = check_post(self.write(tmp, VALID.replace(
                "<p>Body text about Gmail's own select-all banner.</p>",
                "<p>Inbox Cleaner scans your whole mailbox through the Gmail API and ranks senders.</p>")))
            self.assertTrue(any("Gmail API" in p for p in problems), problems)

    def test_blocks_bypass_and_instant_claims(self):
        for claim in (
            "Inbox Cleaner clears every sender in one click with no 50-per-page limit.",
            "The extension moves all their mail with no timeouts.",
            "Inbox Cleaner scans the entire inbox at once.",
            "The extension permanently deletes the selected emails.",
        ):
            with self.Temporary() as tmp:
                problems = check_post(self.write(tmp, VALID.replace(
                    "<p>Body text about Gmail's own select-all banner.</p>", f"<p>{claim}</p>")))
                self.assertTrue(problems, f"expected a block for: {claim}")

    def test_allows_gmail_native_behaviour_and_truthful_negations(self):
        """The gate must not fire on correct statements about Gmail itself."""
        body = (
            "<p>Gmail's checkbox looks like it should select your whole inbox in one click. "
            "It only grabs the current page.</p>"
            "<p>Emptying the Spam folder empties the whole folder in one action - no 50-per-page limit - "
            "and those messages are deleted permanently rather than moved to Trash.</p>"
            "<p>Inbox Cleaner never permanently deletes anything itself - it only moves emails to Trash.</p>"
            "<p>A filter auto-deletes new mail from a sender as it arrives.</p>"
        )
        with self.Temporary() as tmp:
            problems = check_post(self.write(tmp, VALID.replace(
                "<p>Body text about Gmail's own select-all banner.</p>", body)))
            self.assertEqual(problems, [])

    def test_blocks_age_operator_used_as_a_standing_filter(self):
        with self.Temporary() as tmp:
            problems = check_post(self.write(tmp, VALID.replace(
                "<p>Body text about Gmail's own select-all banner.</p>",
                "<p>Create a filter with older_than:30d to auto-delete aging mail.</p>")))
            self.assertTrue(any("age operator" in p for p in problems), problems)

    def test_blocks_future_dates(self):
        with self.Temporary() as tmp:
            problems = check_post(self.write(tmp, VALID.replace('"2026-10-01"', '"2027-01-01"')),
                                  today=date(2026, 10, 17))
            self.assertTrue(any("future" in p for p in problems), problems)

    def test_blocks_broken_local_link(self):
        with self.Temporary() as tmp:
            problems = check_post(self.write(tmp, VALID.replace(
                'href="/blog/"', 'href="/blog/does-not-exist.html"')))
            self.assertTrue(any("broken local link" in p for p in problems), problems)

    def test_blocks_link_to_unpublished_internal_document(self):
        with self.Temporary() as tmp:
            problems = check_post(self.write(tmp, VALID.replace(
                'href="/blog/"', 'href="/superpowers/plans/internal.html"')))
            self.assertTrue(any("not published" in p for p in problems), problems)

    def test_blocks_canonical_off_the_preferred_host(self):
        with self.Temporary() as tmp:
            problems = check_post(self.write(tmp, VALID.replace(
                "https://inbox-cleaner.vercel.app/blog/example.html",
                "https://iampushpendra.github.io/inbox-cleaner/blog/example.html")))
            self.assertTrue(any("preferred host" in p for p in problems), problems)

    def test_blocks_invalid_json_ld(self):
        with self.Temporary() as tmp:
            problems = check_post(self.write(tmp, VALID.replace(
                '{"@type":"Article","datePublished":"2026-10-01","dateModified":"2026-10-01"}',
                '{not json}')))
            self.assertTrue(any("JSON-LD" in p for p in problems), problems)

    def test_reports_every_problem_at_once(self):
        """One run should surface all defects, not just the first."""
        with self.Temporary() as tmp:
            problems = check_post(self.write(tmp, VALID.replace(
                '"2026-10-01"', '"2027-01-01"').replace(
                'href="/blog/"', 'href="/blog/nope.html"')))
            self.assertGreaterEqual(len(problems), 2, problems)

    class Temporary(unittest.TestCase):
        """Minimal tmp dir helper that needs no extra dependency."""

        def __enter__(self):
            import tempfile

            self._dir = tempfile.TemporaryDirectory()
            return Path(self._dir.name)

        def __exit__(self, *args):
            self._dir.cleanup()


if __name__ == "__main__":
    unittest.main()