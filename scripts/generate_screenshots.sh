#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=".screenshot-tmp.html"
OUT="docs/img/screenshots"

if [ ! -x "$CHROME" ]; then
  echo "Chrome not found at $CHROME" >&2
  exit 1
fi

mkdir -p "$OUT"

# Inject the frame stylesheet and the harness (which must load before popup.js).
sed -e 's|<link rel="stylesheet" href="popup.css">|<link rel="stylesheet" href="popup.css">\n  <link rel="stylesheet" href="scripts/screenshots/frame.css">|' \
    -e 's|<script src="popup.js"></script>|<script src="scripts/screenshots/harness.js"></script>\n<script src="popup.js"></script>|' \
    popup.html > "$TMP"

for state in ranked-list search-sort selection confirm; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1280,800 \
    --virtual-time-budget=4000 \
    --screenshot="$OUT/$state.png" \
    "file://$PWD/$TMP?state=$state" 2>/dev/null
  echo "captured $OUT/$state.png"
done

# Social preview image — og:image in docs/index.html points here.
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1200,630 \
  --virtual-time-budget=4000 \
  --screenshot="docs/og-image.png" \
  "file://$PWD/$TMP?state=ranked-list" 2>/dev/null
echo "captured docs/og-image.png"

rm -f "$TMP"
echo "Done. 4 screenshots in $OUT, plus docs/og-image.png"
