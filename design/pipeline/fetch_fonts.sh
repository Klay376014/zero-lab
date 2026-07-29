#!/usr/bin/env bash
# Fetch the pixel display face into the app's font assets.
#
# TTF rather than the WOFF2 that design/champions-dex.html embeds: Lynx's @font-face takes
# TTF/OTF/TTC on Android and only accepts WOFF2 on recent iOS, so WOFF2 would ship a face
# that silently falls back to the system font on half the devices.
#
# The two weights are fetched as separate faces because Lynx's @font-face ignores
# font-weight descriptors — each weight has to be its own family name.
#
# Assets are committed, so the app builds without ever running this. Re-run it only to
# refresh the upstream face.
set -euo pipefail
cd "$(dirname "$0")"

dest="../../src/assets/fonts"
mkdir -p "$dest"

# Silkscreen (OFL), from the Google Fonts source repository.
base="https://raw.githubusercontent.com/google/fonts/main/ofl/silkscreen"

for face in Silkscreen-Regular Silkscreen-Bold; do
  echo "fetching $face.ttf"
  curl -fsSL "$base/$face.ttf" -o "$dest/$face.ttf"
  # A 404 page saved under a .ttf name would fail at render time, not download time.
  if ! file "$dest/$face.ttf" | grep -qi truetype; then
    echo "error: $dest/$face.ttf is not a TrueType font — upstream layout changed?" >&2
    file "$dest/$face.ttf" >&2
    exit 1
  fi
done

# The licence travels with the fonts.
curl -fsSL "$base/OFL.txt" -o "$dest/OFL.txt"

echo
ls -l "$dest"
echo "done."
