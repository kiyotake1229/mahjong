#!/bin/bash
# App Store 用スクリーンショットを撮る（手元の Google Chrome を puppeteer-core で動かす。Mac 専用）
#   使い方: bash tools/screenshots.sh [出力先フォルダ]   （省略時 ios-app/screenshots）
#   場面: home / table / result / story / records（index.html の ?shot= で用意している撮影用の場面）
#   サイズ: 6.7インチ 2796x1290 ／ 6.5インチ 2688x1242 ／ 5.5インチ 2208x1242（横向き）
#   puppeteer-core は Dropbox の外（~/.cache/sui-shots）に入れる。Node.js と Google Chrome が必要
set -e
cd "$(dirname "$0")/.."
OUT="${1:-ios-app/screenshots}"
CACHE="$HOME/.cache/sui-shots"
[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ] || { echo "Google Chrome が見つかりません"; exit 1; }
if [ ! -d "$CACHE/node_modules/puppeteer-core" ]; then
  echo "puppeteer-core を $CACHE に入れます（初回だけ）"
  mkdir -p "$CACHE" && npm i --prefix "$CACHE" --no-audit --no-fund puppeteer-core@23 >/dev/null
fi
NODE_PATH="$CACHE/node_modules" node tools/screenshots.js "$OUT"
echo "できあがり:"; ls -1 "$OUT"
