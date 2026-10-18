"""Rebuild an acquisition scorecard from dated exports, without joining surfaces."""
import argparse
import csv
import json
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_EVIDENCE = ROOT / 'research_notes/Analytics intelligence 2026-10-17'

# A record in one of these states has cleared review and may publish; `draft`
# is not verified coverage, however plausible the article reads.
REVIEWED_STATES = ('evidence_checked', 'publish_ready')


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


def coverage(root=ROOT):
    """Verified editorial coverage, counted separately from a raw article total.

    An article is covered only when a record for its exact slug has reached a
    reviewed state. A published page with no reviewed record, or a reviewed
    record with no page, is reported rather than silently averaged away.
    """
    articles = {path.stem for path in (root / 'docs/blog').glob('*.html')} - {'index'}
    records = json.loads((root / 'scripts/content-records.json').read_text(encoding='utf-8'))
    topics = json.loads((root / 'scripts/blog-topics.json').read_text(encoding='utf-8'))
    reviewed = {slug for slug, record in records.items() if record.get('state') in REVIEWED_STATES}
    return dict(articles=len(articles),
                records=len(records),
                reviewed=len(reviewed),
                states=Counter(record.get('state') for record in records.values()),
                topic_status=Counter(topic.get('status') for topic in topics),
                uncovered_articles=sorted(articles - reviewed),
                orphan_records=sorted(reviewed - articles))


def dimension_rows(path):
    """One Search Console dimension export, or nothing when it was not collected."""
    return read_csv(path) if path.exists() else []


def fmt(value, percent=False):
    return 'Unknown' if value is None else (f'{value*100:.3f}%' if percent else f'{value:.2f}')


def _cell(row, key):
    """An export cell as a number, or None when the row genuinely has no value."""
    raw = (row.get(key) or '').strip()
    try:
        return float(raw)
    except ValueError:
        return None


def _count(value):
    """A count cell that stays Unknown rather than becoming an invented zero."""
    return 'Unknown' if value is None else f'{value:g}'


def device_country_section(evidence):
    """Device and country splits, which decide whether mobile-native help matters."""
    lines = ['## Search by device and country', '']
    devices = dimension_rows(evidence / 'gsc-full-history/devices.csv')
    countries = dimension_rows(evidence / 'gsc-full-history/countries.csv')
    if not devices and not countries:
        return lines + ['Not collected in this snapshot. These dimensions stay Unknown rather than zero.', '']
    if devices:
        lines += ['| Device | Clicks | Impressions | CTR | Approx. position |', '|---|---:|---:|---:|---:|']
        for row in devices:
            impressions = _cell(row, 'Impressions')
            lines.append(f"| {row.get('Device','Unknown')} | {_count(_cell(row,'Clicks'))} | {_count(impressions)} | "
                         f"{fmt(_cell(row,'Clicks')/impressions if impressions else None, True)} | {fmt(_cell(row,'Position'))} |")
        lines.append('')
    if countries:
        ranked = sorted(countries, key=lambda r: _cell(r, 'Impressions') or 0, reverse=True)[:10]
        lines += ['Ten highest-impression countries. A long tail follows in the raw export; it is not a demand ranking.', '',
                  '| Country | Clicks | Impressions | Approx. position |', '|---|---:|---:|---:|']
        for row in ranked:
            lines.append(f"| {row.get('Country','Unknown')} | {_count(_cell(row,'Clicks'))} | {_count(_cell(row,'Impressions'))} | {fmt(_cell(row,'Position'))} |")
        lines.append('')
    lines += ['These two dimensions are whole-export aggregates over the full selected date range, not the adjacent '
              '28-day windows above, and they must not be force-reconciled with them.', '',
              'Mobile currently holds a better approximate position and CTR than desktop. That matters editorially: the '
              'extension requires desktop Chrome, so a mobile reader needs working native Gmail steps and an honest '
              'handoff rather than an install button that cannot help them. It is not a claim about future mobile traffic.', '']
    return lines


def coverage_section(cov):
    """Verified editorial coverage, deliberately not a raw article count."""
    states = ', '.join(f"{count} {state}" for state, count in sorted(cov['states'].items())) or 'none'
    topics = ', '.join(f"{count} {status}" for status, count in sorted(cov['topic_status'].items())) or 'none'
    lines = ['## Verified coverage, not article count', '',
             f"- Published articles: {cov['articles']}",
             f"- Evidence records: {cov['records']} ({states})",
             f"- Reviewed records: {cov['reviewed']} — only these count as verified coverage",
             f"- Topics by status: {topics}",
             '',
             f"Articles with no reviewed record: {', '.join(cov['uncovered_articles']) if cov['uncovered_articles'] else 'none'}.",
             f"Reviewed records with no published article: {', '.join(cov['orphan_records']) if cov['orphan_records'] else 'none'}.", '']
    if cov['uncovered_articles'] or cov['orphan_records']:
        lines += ['A mismatch on either line is a contradiction to fix before publishing anything else: an unreviewed '
                  'page is a gate failure, and a reviewed record for a missing page is stale evidence.', '']
    lines += ['Reviewed coverage is tracked here instead of an article total because a longer backlog is not progress. '
              'A `draft` record is unverified no matter how plausible the article reads, and index exclusions stay an '
              'external gate until an owner inspection exists.', '']
    return lines


def provenance_section(evidence):
    """The exact export filters this snapshot was taken with."""
    lines = ['## Export provenance', '']
    filters = dimension_rows(evidence / 'gsc-full-history/filters.csv')
    if filters:
        lines += ['| Export filter | Value |', '|---|---|']
        for row in filters:
            lines.append(f"| {row.get('Filter','Unknown')} | {row.get('Value','Unknown')} |")
    else:
        lines.append('No filter export was preserved with this snapshot; treat the date range as unrecorded.')
    lines += ['', 'Weekly procedure: replace this dated directory with a new one, re-run the script, and keep the old '
              'directory. Store exports keep their own window and reporting timezone and are never merged into search '
              'rows. Record the deployed revision alongside any release annotation.', '']
    return lines


def render(evidence):
    windows = compare_windows(read_csv(evidence / 'gsc-full-history/chart.csv'))
    lines = ['# Organic growth scorecard', '', f'Evidence directory: `{evidence.relative_to(ROOT) if evidence.is_relative_to(ROOT) else evidence}`.',
             'Generated from exports, not a new authenticated analytics collection. Re-run `python3 scripts/growth_scorecard.py` after replacing the evidence input with a new dated snapshot.', '',
             '## Search: adjacent 28-day windows', '', '| Window | Observed days | Clicks | Impressions | CTR | Approx. weighted position |', '|---|---:|---:|---:|---:|---:|']
    for name in ['previous', 'latest']:
        if name not in windows:
            continue
        w=windows[name]
        lines.append(f"| {w['start']}–{w['end']} | {w['observed_days']} | {w['clicks']:g} | {w['impressions']:g} | {fmt(w['ctr'],True)} | {fmt(w['position'])} |")
    lines += ['', 'Position is an impression-weighted approximation from rounded daily values; this is not a fixed keyword rank. Query exports omit undisclosed searches. No causal release effect is inferred.', '']
    lines += device_country_section(evidence)
    lines += provenance_section(evidence)
    lines += ['## Store attribution: a different surface', '', 'Source files retain their own July 19–October 16 window and Los Angeles reporting timezone. Install counts below use the separately install-filtered export, not the ordinary all-events export.', '',
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
              'Fixed cohort: select-all, size deletion, mailbox-full, biggest-mail, older-than-year plus the homepage. Preserve these URLs and compare the same page/query rows after recrawl. Other page improvements are reported separately.', '']
    lines += coverage_section(coverage())
    lines += ['## Unknowns and collection procedure', '',
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
