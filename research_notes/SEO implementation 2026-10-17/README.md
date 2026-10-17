# Local tool browser evidence — 17 October 2026

Captured by the controller using the in-app browser against a local static preview. Both screenshots use synthetic inputs; neither is a Gmail mailbox capture, installed-extension test or quota measurement.

- `query-builder-preview.png`: real local query-tool UI after building `from:newsletter@example.com larger:10M`, checking review consent and obtaining Copy success feedback. Additional browser check replaced output with `larger:0M older_than:0y`; two errors appeared, consent cleared and actions were disabled.
- `storage-diagnostic-preview.png`: real local diagnostic UI after entering Gmail1/Drive2/Photos13 GB against a15 GB assumption. It reports the entered16 GB total, Photos as largest and over-quota/account cautions. Reset was separately observed clearing entries and hiding results.

Screenshots were inspected in a490px-wide pane without horizontal clipping. This is narrow-pane browser evidence, not certification on a physical mobile device or every viewport. No Gmail search was opened, no account was read, and no email was changed. Tool unit tests cover encoded Gmail destinations; clipboard copy feedback was checked on synthetic text. Local inputs remained out of the tool URL.

The optional `tool-demo/` contains a reusable silent showcase made from these real local screenshots and explicit synthetic labels; see its source/report for rendered status.
