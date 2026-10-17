import importlib.util
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

if __name__=='__main__':unittest.main()
