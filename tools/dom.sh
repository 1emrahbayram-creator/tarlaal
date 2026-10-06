#!/usr/bin/env bash
# Kullanım: tools/dom.sh <sayfa.html veya URL> [genişlik=1366]
# JS çalıştıktan sonraki DOM'u stdout'a döker (file:// ile çalışır).
set -euo pipefail
PAGE="$1"; W="${2:-1366}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
case "$PAGE" in http*|file*) URL="$PAGE" ;; *) URL="file://$ROOT/$PAGE" ;; esac
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --allow-file-access-from-files \
  --window-size="${W},2000" --virtual-time-budget=12000 --dump-dom "$URL" 2>/dev/null
