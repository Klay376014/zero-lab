#!/usr/bin/env bash
# Fetch the two display faces into the app's font assets: the pixel face for names, labels and
# numbers, and the reading serif for prose.
#
# TTF rather than the WOFF2 that design/champions-dex.html embeds: Lynx's @font-face takes
# TTF/OTF/TTC on Android and only accepts WOFF2 on recent iOS, so WOFF2 would ship a face
# that silently falls back to the system font on half the devices.
#
# Each weight is a separate face because Lynx's @font-face ignores font-weight descriptors —
# a weight has to be its own family name.
#
# The reading serif needs two more steps than a download, see the section below.
#
# Assets are committed, so the app builds without ever running this — and without Python or
# fonttools. Re-run it only to refresh the upstream faces.
set -euo pipefail
cd "$(dirname "$0")"

dest="../../src/assets/fonts"
mkdir -p "$dest"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Rejects a 404 page saved under a font's name, which would otherwise fail at render time
# rather than at download time.
assert_truetype() {
  if ! file "$1" | grep -qi truetype; then
    echo "error: $1 is not a TrueType font — upstream layout changed?" >&2
    file "$1" >&2
    exit 1
  fi
}

# ---------- pixel face: Silkscreen (OFL), from the Google Fonts source repository ----------

silkscreen="https://raw.githubusercontent.com/google/fonts/main/ofl/silkscreen"

for face in Silkscreen-Regular Silkscreen-Bold; do
  echo "fetching $face.ttf"
  curl -fsSL "$silkscreen/$face.ttf" -o "$dest/$face.ttf"
  assert_truetype "$dest/$face.ttf"
done

# ---------- reading serif: Literata (OFL) ----------
#
# Upstream ships only the variable font, at 933 KB. Embedding that would grow the app bundle
# by more than twice its whole current size, and it would lean on variable-axis support Lynx
# makes no documented promise about — where that support is missing the face renders at its
# own default optical size, which is not the design document's, and says nothing about it.
#
# So: pin one instance, then keep only the characters this app draws.
#
#   wght=400  prose has one weight; the bold in the design document is the pixel face
#   opsz=13   the size prose renders at, which is what a browser resolves there under
#             font-optical-sizing: auto — so this reproduces the design document rather than
#             taking the font's own default of 12
#
# The subset range is declared rather than derived from the current dataset. A dataset-derived
# subset is a quarter of the size, but any character a later dataset introduces would render
# as a missing-glyph box. scripts/check-styles.mjs asserts the range still covers the corpus.
#
# CJK is deliberately absent: Literata has none, and Chinese prose falls through to a system
# serif by design.

literata="https://raw.githubusercontent.com/google/fonts/main/ofl/literata"
variable="$work/Literata-variable.ttf"
instance="$work/Literata-instance.ttf"
prose="$dest/Literata-Prose.ttf"

if ! python3 -c 'import fontTools' 2>/dev/null; then
  cat >&2 <<'MISSING'
error: the reading serif is derived from the variable font, which needs fonttools.

  python3 -m pip install 'fonttools[woff]' brotli

Only this script needs it. The derived asset is committed, so building the app does not.
MISSING
  exit 1
fi

echo "fetching Literata[opsz,wght].ttf (variable master)"
curl -fsSL "$literata/Literata%5Bopsz%2Cwght%5D.ttf" -o "$variable"
assert_truetype "$variable"

echo "pinning instance wght=400 opsz=13"
python3 -m fontTools.varLib.instancer "$variable" wght=400 opsz=13 -o "$instance" >/dev/null

echo "subsetting to the declared range"
python3 -m fontTools.subset "$instance" \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2015,U+2018-201F,U+2026,U+2032-2033" \
  --layout-features=kern \
  --no-hinting \
  --output-file="$prose"
assert_truetype "$prose"

# A variable axis table surviving the pin would mean the instance did not take.
if python3 -c "
import sys
from fontTools.ttLib import TTFont
sys.exit(0 if 'fvar' in TTFont('$prose') else 1)
" 2>/dev/null; then
  echo "error: $prose still carries a variable axis table — the instance did not take." >&2
  exit 1
fi

# ---------- licences travel with the fonts ----------

{
  echo "Silkscreen"
  echo "=========="
  echo
  curl -fsSL "$silkscreen/OFL.txt"
  echo
  echo
  echo "Literata"
  echo "========"
  echo
  curl -fsSL "$literata/OFL.txt"
} > "$dest/OFL.txt"

echo
ls -l "$dest"
echo "done."
