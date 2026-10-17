"""Rebuild an acquisition scorecard from dated exports, without joining surfaces."""
import argparse
import csv
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_EVIDENCE = ROOT / 'research_notes/Analytics intelligence 2026-10-17'


def compare_windows(rows):
    if not rows:
        return {}
    latest = max(date.fromisoformat(row['Date']) for row in rows)
    result = {}
    for name, end in [('latest', latest), ('previous', latest - timedelta(days=28))]:
        start = end - timedelta(days=27)
        chosen = [r for r in rows if start <= date.fromisoformat(r['Date']) <= end]
        clicks = sum(float(r['Clicks']) for r in chosen)
        impressions = sum(float(r['Impressions']) for r in chosen)
        result[name] = dict(start=start.isoformat(), end=end.isoformat(), clicks=clicks, impressions=impressions,
                            ctr=clicks/impressions if impressions else None,
                            position=(sum(float(r['Position'])*float(r['Impressions']) for r in chosen if float(r['Impressions']) > 0)/impressions if impressions and all(r['Position'] for r in chosen if float(r['Impressions']) > 0) else None),
                            observed_days=len(chosen))
    return result


def read_csv(path):
    with path.open(encoding='utf-8-sig') as file:
        return list(csv.DictReader(line for line in file if not line.startswith('#') and line.strip()))


def render(evidence):
    windows = compare_windows(read_csv(evidence / 'gsc-full-history/chart.csv'))
    lines = ['# Organic growth scorecard', '', f'Evidence directory: `{evidence.relative_to(ROOT) if evidence.is_relative_to(ROOT) else evidence}`.',
             'Generated from exports, not a new authenticated analytics collection. Re-run `python3 scripts/growth_scorecard.py` after replacing the evidence input with a new dated snapshot.', '',
             '## Search: adjacent 28-day windows', '', '| Window | Observed days | Clicks | Impressions | CTR | Approx. weighted position |', '|---|---:|---:|---:|---:|---:|']
    def fmt(value, percent=False):
        return 'Unknown' if value is None else (f'{value*100:.3f}%' if percent else f'{value:.2f}')
    for name in ['previous', 'latest']:
        if name not in windows:
            continue
        w=windows[name]
        lines.append(f"| {w['start']}–{w['end']} | {w['observed_days']} | {w['clicks']:g} | {w['impressions']:g} | {fmt(w['ctr'],True)} | {fmt(w['position'])} |")
    lines += ['', 'Position is an impression-weighted approximation from rounded daily values; this is not a fixed keyword rank. Query exports omit undisclosed searches. No causal release effect is inferred.', '',
              '## Store attribution: a different surface', '', 'Source files retain their own July 19–October 16 window and Los Angeles reporting timezone. Install counts below use the separately install-filtered export, not the ordinary all-events export.', '',
              '| Session source / medium | Listing sessions | Engaged sessions | Attributed install events |', '|---|---:|---:|---:|']
    traffic = read_csv(evidence / 'ga-90d-traffic-source-medium.csv')
    installs = {r['Session source / medium']:r['Event count'] for r in read_csv(evidence / 'ga-90d-install-events-by-source.csv')}
    for r in traffic:
        source=r['Session source / medium']
        lines.append(f"| {source} | {r['Sessions']} | {r['Engaged sessions']} | {installs.get(source,'Unknown')} |")
    lines += ['', 'ChatGPT attribution is a small-sample observation. Owner/test traffic and originating shared links remain unresolved. No article-to-install conversion rate is calculated.', '',
              '## Release annotations and fixed cohort', '',
              '- 16 October: complete guide discovery/link generation and install routes changed; the latest performance export ends 14 October and cannot measure that effect.',
              '- 17 October, `1479fe7`: 64 new editorial briefs and prioritized backlog.',
              '- 17 October, `2263d24`: five priority guide refreshes; verified live after publication.',
              '- Current delivery: seven further refreshes, privacy/homepage alignment, local tools and evidence gates. Record the deployed revision and actual publication date in the delivery ledger.', '',
              'Fixed cohort: select-all, size deletion, mailbox-full, biggest-mail, older-than-year plus the homepage. Preserve these URLs and compare the same page/query rows after recrawl. Other page improvements are reported separately.', '',
              '## Unknowns and collection procedure', '',
              '| Metric / check | State | Next collection |', '|---|---|---|',
              '| Website landings and store CTA clicks | Unknown; no website stream in collected property | Review a separately specified privacy-consistent event design before adding code |',
              '| Activation / successful cleanup | Unknown; no extension telemetry | Use voluntary task feedback; no mailbox content or identity collection |',
              '| Dashboard installs/uninstalls/active users | Unknown; browser access blocked | Owner-export existing reports; preserve dates/filters/definitions |',
              '| Per-URL indexing after release | Pending recrawl/owner inspection | Inspect valuable excluded URLs without restarting existing validation |',
              '| New 28-day outcome | Not yet observable | Collect the next complete post-release window; note crawl date and sample size |', '',
              'For each weekly export preserve original GSC chart/pages/queries/devices/countries CSVs, date filter, property and reporting timezone. Preserve store session-source and install-filtered exports separately. Do not add overlapping snapshots together. Re-run this script with `--evidence <dated-directory> --output <report-path>`. GSC aggregate versus page/query totals can differ and must not be force-reconciled.', '',
              '## Minimal future measurement contract', '',
              'No tracking is installed by this release. If approved and required later, website events are limited to article path and an outbound-store action, with a documented attribution window and sanitized acquisition source. Never transmit sender addresses/domains, message IDs, mailbox contents, tool inputs or complete personal search URLs. Do not label internal/store links as ChatGPT to manufacture attribution. Keep website clicks, store install events and observed product usefulness as separate denominators.', '',
              '## Manual ChatGPT citation check', '',
              'Use a fixed set of question families: select-all missing link; bulk delete; sender cleanup; age search; size search; storage full; storage after deletion; archive versus delete; unsubscribe versus deletion; cleaner permissions. Record exact prompt, date, search setting, cited URLs and answer correctness. These owner-run checks are variable observations, not organic customer acquisition or a guaranteed rank. Do not send personal mailbox examples.', '']
    return '\n'.join(lines)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--evidence',type=Path,default=DEFAULT_EVIDENCE)
    parser.add_argument('--output',type=Path,default=ROOT/'reports/organic-growth-scorecard.md')
    args=parser.parse_args()
    args.output.write_text(render(args.evidence.resolve()))
    print(f'Scorecard written: {args.output}')

if __name__ == '__main__':
    main()
