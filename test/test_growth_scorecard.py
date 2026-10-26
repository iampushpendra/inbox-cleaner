import importlib.util
import json
import tempfile
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('growth', Path(__file__).parents[1] / 'scripts/growth_scorecard.py')
growth = importlib.util.module_from_spec(spec) if spec else None

class ScorecardTest(unittest.TestCase):
    def load(self):
        self.assertTrue(Path(spec.origin).exists(), 'scorecard implementation is missing')
        spec.loader.exec_module(growth)
    def test_adjacent_windows_use_latest_observation_and_weighted_position(self):
        self.load()
        rows=[{'Date':'2026-10-14','Clicks':'2','Impressions':'100','Position':'10'}, {'Date':'2026-09-17','Clicks':'1','Impressions':'300','Position':'20'}, {'Date':'2026-09-16','Clicks':'1','Impressions':'50','Position':'40'}, {'Date':'2026-10-13','Clicks':'0','Impressions':'0','Position':''}, {'Date':'2026-08-19','Clicks':'99','Impressions':'100','Position':'1'}]
        result=growth.compare_windows(rows)
        self.assertEqual(result['latest']['start'],'2026-09-17')
        self.assertEqual(result['latest']['clicks'],3)
        self.assertEqual(result['latest']['position'],17.5)
        self.assertEqual(result['previous']['clicks'],1)
        self.assertAlmostEqual(result['latest']['ctr'],3/400)
    def test_zero_impressions_and_empty_data_remain_unknown(self):
        self.load()
        self.assertEqual(growth.compare_windows([]),{})
        result=growth.compare_windows([{'Date':'2026-10-14','Clicks':'0','Impressions':'0','Position':''}])
        self.assertIsNone(result['latest']['ctr'])
        self.assertIsNone(result['latest']['position'])

    def build_repo(self, articles, records, topics, version='3.3.1'):
        root = Path(tempfile.mkdtemp())
        (root / 'docs/blog').mkdir(parents=True)
        (root / 'scripts').mkdir()
        for name in articles:
            (root / 'docs/blog' / f'{name}.html').write_text('<html></html>')
        (root / 'scripts/content-records.json').write_text(json.dumps(records))
        (root / 'scripts/blog-topics.json').write_text(json.dumps(topics))
        (root / 'manifest.json').write_text(json.dumps({'version': version}))
        return root

    def test_coverage_counts_reviewed_records_not_article_totals(self):
        self.load()
        root = self.build_repo(
            articles=['alpha', 'beta', 'index'],
            records={'alpha': {'state': 'evidence_checked'}, 'beta': {'state': 'draft'},
                     'gone': {'state': 'publish_ready'}},
            topics=[{'status': 'published'}, {'status': 'pending'}, {'status': 'pending'}])
        cov = growth.coverage(root)
        self.assertEqual(cov['articles'], 2, 'index.html is not an article')
        self.assertEqual(cov['reviewed'], 2)
        self.assertEqual(cov['uncovered_articles'], ['beta'])
        self.assertEqual(cov['orphan_records'], ['gone'])
        self.assertEqual(cov['topic_status']['pending'], 2)
        section = '\n'.join(growth.coverage_section(cov))
        self.assertIn('beta', section)
        self.assertIn('contradiction', section)

    def test_coverage_of_a_fully_reviewed_repo_reports_no_contradiction(self):
        self.load()
        root = self.build_repo(['alpha'], {'alpha': {'state': 'evidence_checked'}}, [{'status': 'published'}])
        section = '\n'.join(growth.coverage_section(growth.coverage(root)))
        self.assertIn('Articles with no reviewed record: none.', section)

    def test_coverage_separates_current_stale_and_retired_records(self):
        self.load()
        article = '<html><body>Reviewed text.</body></html>'
        record = {'state': 'evidence_checked', 'product_manifest_version': '3.3.1',
                  'post_sha256': __import__('hashlib').sha256(article.encode()).hexdigest()}
        root = self.build_repo(['example'], {'example': record, 'gone': {'state': 'merged'}},
                               [{'status': 'published'}])
        (root / 'docs/blog/example.html').write_text(article)
        cov = growth.coverage(root)
        self.assertEqual(cov['current_reviewed'], 1)
        self.assertEqual(cov['stale_records'], [])
        self.assertEqual(cov['retired_records'], ['gone'])
        self.assertEqual(cov['orphan_records'], [])

        record['product_manifest_version'] = '3.3.0'
        (root / 'scripts/content-records.json').write_text(json.dumps({'example': record, 'gone': {'state': 'merged'}}))
        cov = growth.coverage(root)
        self.assertEqual(cov['current_reviewed'], 0, 'a stale manifest version is not current coverage')
        self.assertEqual(cov['stale_records'], ['example'])
        self.assertIn('example', '\n'.join(growth.coverage_section(cov)))

        record['product_manifest_version'] = '3.3.1'
        (root / 'docs/blog/example.html').write_text('<html><body>Edited after review.</body></html>')
        (root / 'scripts/content-records.json').write_text(json.dumps({'example': record, 'gone': {'state': 'merged'}}))
        self.assertEqual(growth.coverage(root)['stale_records'], ['example'],
                         'an edit after review invalidates the recorded fingerprint')

    def test_missing_dimension_exports_stay_unknown_instead_of_zero(self):
        self.load()
        missing = Path(tempfile.mkdtemp()) / 'not-collected'
        section = '\n'.join(growth.device_country_section(missing))
        self.assertIn('Unknown', section)
        self.assertIn('Weekly procedure', '\n'.join(growth.provenance_section(missing)))

    def test_device_rows_without_impressions_do_not_divide_by_zero(self):
        self.load()
        evidence = Path(tempfile.mkdtemp()) / 'gsc-full-history'
        evidence.mkdir()
        (evidence / 'devices.csv').write_text('Device,Clicks,Impressions,CTR,Position\nTablet,0,0,0,\n')
        section = '\n'.join(growth.device_country_section(evidence.parent))
        self.assertIn('Unknown', section)

    def test_blank_count_cells_stay_unknown_instead_of_crashing_or_becoming_zero(self):
        self.load()
        evidence = Path(tempfile.mkdtemp()) / 'gsc-full-history'
        evidence.mkdir()
        (evidence / 'devices.csv').write_text('Device,Clicks,Impressions,CTR,Position\nSmart TV,,,,\n')
        section = '\n'.join(growth.device_country_section(evidence.parent))
        self.assertIn('| Smart TV | Unknown | Unknown | Unknown | Unknown |', section)

if __name__=='__main__':unittest.main()
