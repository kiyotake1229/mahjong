#!/bin/bash
# 親フォルダのWebアプリ本体を www/ にコピーする（ネイティブアプリに同梱するため）
set -e
cd "$(dirname "$0")"
SRC=".."
DEST="www"
rm -rf "$DEST"
mkdir -p "$DEST"
# 同梱するファイルだけをコピー（docs や tools、ios-app 自身は除外）
for f in index.html manifest.json sw.js icon-192.png icon-512.png icon-512-maskable.png apple-touch-icon.png favicon-32.png; do
  if [ -f "$SRC/$f" ]; then cp "$SRC/$f" "$DEST/"; fi
done
echo "Web資産を www/ にコピーしました:"
ls -1 "$DEST"
