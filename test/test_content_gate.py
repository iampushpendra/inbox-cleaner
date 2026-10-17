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
class ReadinessTest(unittest.TestCase):
    def setUp(self):
        import tempfile, json
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'scripts').mkdir()
        (self.root / 'docs/blog').mkdir(parents=True)
        (self.root / 'docs/blog/index.html').write_text("hub")
        self.post = self.root / 'docs/blog/example.html'
        store='https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep'
        self.post.write_text(VALID + f'<a class="blog-nav-cta" href="{store}">Install</a><a class="blog-cta-btn" href="{store}">Install</a>')
        (self.root / 'scripts/site-config.json').write_text(json.dumps({'extensionStoreUrl':store}))
        (self.root / 'manifest.json').write_text('{"version":"3.2.1"}')
        self.topics = self.root / 'scripts/blog-topics.json'
        self.topics.write_text(json.dumps([{'slug':'example','status':'pending','intent_owner':'example'}]))
        self.records = self.root / 'scripts/content-records.json'

    def record(self):
        from content_gate import post_fingerprint
        return {'state':'publish_ready','intent_owner':'example','product_manifest_version':'3.2.1',
                'sources':[{'url':'https://support.google.com/mail/answer/7190?hl=en','supports':'Search syntax', 'review_notes':'Compared each query operator with the documented syntax.'}],
                'assets':[], 'verification_kind':'source_review','verified_on':'2026-10-17',
                'limitations':['No live mailbox tested.'],'information_gain':'A decision table distinguishes sender scope from date scope.',
                'related_links':['/blog/'], 'reviewer':{'identity':'Codex fixture review','kind':'agent'},
                'post_sha256':post_fingerprint(self.post)}

    def check(self, record):
        import json
        from content_gate import check_readiness
        self.records.write_text(json.dumps({'example':record} if record is not None else {}))
        return check_readiness(self.post, repo_root=self.root, today=date(2026,10,17))

    def test_ready_source_review_needs_no_fabricated_live_fixture(self):
        self.assertEqual(self.check(self.record()), [])

    def test_missing_draft_stale_version_future_and_missing_evidence_fail(self):
        self.assertTrue(self.check(None))
        for field, value in [('state','draft'),('post_sha256','0'*64),('product_manifest_version','1'),
                             ('verified_on','2027-01-01'),('sources',[]),('reviewer',None),
                             ('information_gain',''),('verification_kind','invented')]:
            record=self.record(); record[field]=value
            self.assertTrue(self.check(record),field)
        record=self.record(); record['assets']=['internal/missing.png']
        self.assertTrue(self.check(record))
        record=self.record(); record['related_links']=['/blog/missing.html']
        self.assertTrue(self.check(record))
        record=self.record(); record['sources'][0]['url']='not a URL'
        self.assertTrue(self.check(record))

    def test_article_edit_invalidates_review_but_generated_links_do_not(self):
        record=self.record()
        self.post.write_text(self.post.read_text()+'<!-- AUTO:related:start -->generated<!-- AUTO:related:end -->')
        self.assertEqual(self.check(record), [])
        self.post.write_text(self.post.read_text().replace('Body text','Different claim'))
        self.assertTrue(self.check(record))
