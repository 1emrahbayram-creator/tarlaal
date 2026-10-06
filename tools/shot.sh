#!/usr/bin/env bash
# Kullanım: tools/shot.sh <sayfa.html[?query] veya URL> <genişlik> <çıktı.png> [yükseklik=3000]
# Headless Chrome ile ekran görüntüsü alır. 500px altı genişlikler için sayfayı iframe içinde
# (Chrome'un minimum pencere sınırı nedeniyle) istenen genişlikte render eder.
set -euo pipefail
PAGE="$1"; W="${2:-1366}"; OUT="$3"; H="${4:-3000}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
case "$PAGE" in http*|file*) URL="$PAGE" ;; *) URL="file://$ROOT/$PAGE" ;; esac
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ "$W" -lt 500 ]; then
  WRAP="$ROOT/.shot-wrap-$$.html"
  cat > "$WRAP" <<HTML
<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#888}iframe{display:block;width:${W}px;height:${H}px;border:0;background:#fff}</style></head>
<body><iframe src="$URL"></iframe></body></html>
HTML
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --window-size="500,${H}" --virtual-time-budget=14000 --screenshot="$OUT" "file://$WRAP" >/dev/null 2>&1
  rm -f "$WRAP"
else
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --window-size="${W},${H}" --virtual-time-budget=14000 --screenshot="$OUT" "$URL" >/dev/null 2>&1
fi
echo "$OUT"
