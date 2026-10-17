# Local SEO tool demo

Current version: 1.0.0

A reusable 16-second silent 1920×1080 preview of two working local InboxCleaner tools. `tool-demo.mp4` is the final render. `poster-query.png` and `poster-storage.png` are decoded frames from that MP4, not browser mockups. Captions are also available in `captions.vtt`.

## Reproduce

With Node.js ≥22, FFmpeg, and a supported Chromium runtime:

```sh
npm run check
npx --yes hyperframes@0.7.33 snapshot --at 0.5,2,4,6,7.8,8.5,10,12,15.5 --json
npx --yes hyperframes@0.7.33 render --quality high --fps 24 --workers 1 --strict --output tool-demo.mp4
```

Use the pinned command: the globally installed CLI had a Puppeteer module resolution failure with two workers. One-worker pinned rendering completed successfully. The source has one standalone timeline and two scenes; no installed dependencies or temporary frame sequences are committed.

## Scope and provenance

The two PNGs in `assets/` are byte-for-byte copies of local browser screenshots captured during the parent SEO08 task on 2026-10-17. The screenshot provenance is recorded in `provenance.json`. The tool inputs are synthetic: query `from:newsletter@example.com larger:10M`, Gmail 1 GB, Drive 2 GB, Photos 13 GB. The storage result is an entered-data illustration, not an account measurement. The query label comes from the local browser test; the visible screenshot itself shows review consent and copy success, with the query field above the captured viewport.

There is no Gmail screen simulation, mailbox connection, deletion, recovered-storage claim, testimonial, paid service, voiceover, music, or generated image. Screenshot text may be too small to read on phones; the larger editorial labels carry the essential information. No publication or upload was performed. End-to-end real Gmail matching/deletion was not tested. HyperFrames automatically resolved fallback font faces during rendering; no external editorial media was sourced.

GSAP 3.14.2 is vendored from the official jsDelivr npm distribution; its license notice is retained at the top of `assets/gsap.min.js`.
