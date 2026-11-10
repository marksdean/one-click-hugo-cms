#!/usr/bin/env bash
# Downloads every photo (plus logo and favicon) from the old Squarespace site
# into this repo, named to match the gallery files in content/.
# Safe to re-run: files that already exist are skipped.
#
#   bash scripts/fetch-photos.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SITE="${SITE:-https://www.markdean.studio}"
UA="markdean-site-migration"
command -v python3 >/dev/null || { echo "python3 is required (install Xcode Command Line Tools: xcode-select --install)"; exit 1; }

# old-site-page   destination-folder   file-prefix   expected-count
GALLERIES="
/ content/home home 14
maybach-sw38 content/galleries/maybach-sw38 maybach-sw38 34
maybachluxury content/galleries/maybachluxury maybachluxury 6
mercedes-maybach6-vision-cabriolet content/galleries/mercedes-maybach6-vision-cabriolet mercedes-maybach6-vision-cabriolet 11
ski-wear content/galleries/ski-wear ski-wear 9
versailles content/galleries/versailles versailles 7
patagonia content/galleries/patagonia patagonia 11
marrakesh content/galleries/marrakesh marrakesh 13
dominican-republic content/galleries/dominican-republic dominican-republic 18
portraits content/galleries/portraits portraits 15
kate content/galleries/kate kate 12
kyle content/galleries/kyle kyle 9
belvedere-home content/galleries/belvedere-home belvedere-home 18
201-ocean-ave content/galleries/201-ocean-ave 201-ocean-ave 11
headshots content/galleries/headshots headshots 17
new-gallery content/galleries/headshots-bw headshots-bw 4
"

fetch() { curl -fsSL --retry 3 --retry-delay 2 -A "$UA" "$@"; }
problems=0; downloaded=0; skipped=0

while read -r page dir prefix expected; do
  [ -z "$page" ] && continue
  mkdir -p "$dir"
  urls=$(fetch "$SITE/${page#/}?format=json" | python3 -c '
import json, sys
for item in json.load(sys.stdin).get("items", []):
    if item.get("assetUrl"): print(item["assetUrl"])')
  count=$(printf "%s\n" "$urls" | grep -c . || true)
  if [ "$count" != "$expected" ]; then
    echo "!! $page: expected $expected photos, the old site now lists $count — check content/ for this gallery"
    problems=$((problems + 1))
  fi
  i=0
  while read -r url; do
    [ -z "$url" ] && continue
    i=$((i + 1))
    out=$(printf "%s/%s-%02d.jpg" "$dir" "$prefix" "$i")
    if [ -s "$out" ] || [ -s "${out%.jpg}.webp" ]; then skipped=$((skipped + 1)); continue; fi
    if fetch -o "$out.part" "$url?format=2500w" && [ -s "$out.part" ]; then
      mv "$out.part" "$out"; downloaded=$((downloaded + 1))
    else
      rm -f "$out.part"; echo "!! failed: $url"; problems=$((problems + 1))
    fi
  done <<< "$urls"
  echo "ok  $prefix ($i photos)"
done <<< "$GALLERIES"

# Logo, favicon and share image.
mkdir -p static/img
asset() { # url, destination
  [ -s "$2" ] && return 0
  fetch -o "$2.part" "$1" && mv "$2.part" "$2" || { rm -f "$2.part"; echo "!! failed: $1"; problems=$((problems + 1)); }
}
CDN="https://images.squarespace-cdn.com/content/v1/5b37bc684611a009b2703a47"
asset "$CDN/1530379510063-8BS9CVO4FDA158EI2N9U/Logo-300.png?format=750w" static/img/logo.png
asset "$CDN/1530508655011-4ZK1HIS5F7IV6YJO1NR3/favicon.ico" static/img/favicon.ico
asset "$CDN/1530596610454-6EZPVQXHY8PRJ4V5ZDZ8/infinity-square-transparent.png?format=1500w" static/img/og-image.png

echo
echo "Downloaded $downloaded, already had $skipped, problems $problems."
[ "$problems" -eq 0 ]
