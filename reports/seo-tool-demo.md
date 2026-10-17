# SEO08 tool demo — 2026-10-17

Status: completed locally; not published or uploaded.

Output: `research_notes/SEO implementation 2026-10-17/tool-demo/tool-demo.mp4` — H.264, 1920×1080, 24 fps, exactly 16.000 seconds / 384 frames, 1,437,743 bytes, no audio stream. Editable source, README, design/storyboard, VTT captions, provenance hashes, and two decoded MP4 poster frames accompany it.

Content: 0–8s shows the actual local query checker/consent screenshot with the tested synthetic query label `from:newsletter@example.com larger:10M`; 8–16s shows the actual local storage diagnostic screenshot with synthetic Gmail 1 GB + Drive 2 GB + Photos 13 GB (entered total 16 GB; Photos largest). Persistent disclosure identifies synthetic local inputs and no mailbox access or deletion. The query field was above the screenshot viewport, so the separate label is based on the parent browser test, not claimed as pixels visible in that screenshot.

## Checks executed

- `hyperframes init tool-demo --example blank --non-interactive` scaffolded the source. Its optional global skill-clone step stalled and was interrupted after scaffold creation; existing local domain skills were read and used.
- `npm run check` completed exit 0: lint 0 errors / 0 warnings; validation no console errors and 58 text elements pass WCAG AA; inspection 0 layout issues across 9 timeline samples.
- `hyperframes snapshot --at 0.5,2,4,6,7.8,8.5,10,12,15.5 --json` completed exit 0. All nine samples were reviewed via their contact sheet; both full-size source images were also inspected.
- Global `hyperframes render --quality high --fps 24 --workers 2 --strict --output tool-demo.mp4` failed because its Puppeteer worker import expected a missing `puppeteer-core/index.js`.
- `npx --yes hyperframes@0.7.33 render --quality high --fps 24 --workers 1 --strict --output tool-demo.mp4` completed exit 0, reporting 1.4 MB / 16.0s. A redundant global one-worker retry was cancelled after the pinned render succeeded.
- `ffprobe -v error -show_entries format=duration,size:stream=index,codec_name,codec_type,width,height,r_frame_rate,nb_frames -of json tool-demo.mp4` confirmed the properties above.
- `ffmpeg -y -loglevel error -ss 4 -i tool-demo.mp4 -frames:v 1 poster-query.png` and the equivalent at 12s for `poster-storage.png` decoded the actual final MP4; both were viewed full size and showed the intended composition without missing assets or clipping.

## Limitations and disclosure

This is a screenshot showcase, not a recording of Gmail behavior. No real mailbox matching, account measurement, deletion, or storage recovery was tested or claimed. Small screenshot text is primarily desktop-readable; the large labels and VTT carry the essential message. No audio playback is relevant because there is no audio track. HyperFrames automatically resolved fallback font faces during rendering; no external editorial media, paid service, TTS, or generated images were used. No telemetry feedback, publication, upload, or push was performed under this local-only scope.
