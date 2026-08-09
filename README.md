# CHAMPIONS DEX

A pixel-styled, bilingual Pokémon Champions dex — a finished design study, plus a port of it
to [Vue Lynx](https://vue.lynxjs.org/).

Two colour modes (`POCKET`, a four-tone greyscale chrome that leaves the artwork as the
only colour on screen; `MODERN`, which spends colour everywhere), Traditional Chinese and
English side by side, and type marks hand-plotted on an 8×8 grid.

## Layout

| Path | What it is |
| ---- | ---------- |
| `design/champions-dex.html` | The design study. Self-contained — open it in a browser. |
| `design/pipeline/` | Rebuilds the study and its dataset from upstream sources in 8 stages, each asserting its own invariants. |
| `design/HANDOFF.md` | The document that matters. Data provenance, derivation rules, design decisions and their reasons, and the measured Lynx platform facts (§12). |
| `src/` | The Vue Lynx port, complete: data layer, colour modes, type glyph, the species grid with its query bar, the detail panel, and the learnset table. |
| `openspec/` | [Spectra](https://github.com/spectra-app/spectra) specs the port is built against. |
| `ROADMAP.md` | What the port does not carry over from the study, and what has been decided against. Read this rather than re-deriving the gap from the handoff. |
| `src/ios/Zero Lab/` | Native iOS shell that embeds the built bundle for offline, on-device installs — see "Installing on a physical iOS device" below. |

## Running

```bash
pnpm install
pnpm run dev
```

Scan the QR code with LynxExplorer, or open the printed web URL. Note that the pixel face
does not load in the web preview — see `design/HANDOFF.md` §12.5 for why and how to check
it anyway.

There is also a desktop LynxExplorer, which needs neither Xcode nor Android Studio and
prints the native diagnostic log to stdout:

```bash
LynxExplorer.app/Contents/MacOS/LynxExplorer --url='http://<host>:<port>/main.lynx.bundle?fullscreen=true'
```

Its limits are recorded in §12.9 — it draws no SVG at all, so it cannot verify the type
glyphs. That is a defect in the desktop build rather than platform behaviour: on a physical
iOS device the same glyphs render correctly (§12.10).

## Installing on a physical iOS device

`src/ios/Zero Lab/` is a minimal native shell — a `LynxView` that loads `main.lynx.bundle`
straight from the app bundle — so the app runs standalone on an iPhone with no dev server,
no App Store submission, and no LynxExplorer. It needs Xcode and an Apple ID (a free
personal-team signature works) on whichever Mac deploys it.

`Pods/` and the copied `main.lynx.bundle` are gitignored inside that folder — they're build
artifacts, same reasoning as the root `dist/`. Regenerate them on a fresh clone:

```bash
pnpm install
pnpm run build
cp dist/main.lynx.bundle "src/ios/Zero Lab/Zero Lab/main.lynx.bundle"
cd src/ios/Zero Lab
pod install   # needs CocoaPods — `brew install cocoapods`, not `gem install`
```

Open `Zero Lab.xcworkspace` (not the `.xcodeproj`), pick an Apple ID under Signing &
Capabilities, connect a device with Developer Mode enabled (Settings → Privacy & Security),
and run. A free Apple ID's signature expires after 7 days — reconnect and re-run to renew
it; a paid Apple Developer Program account lasts a year.

The app icon is drawn by `scripts/make-app-icons.mjs` rather than exported by hand, so it
cannot drift from the app's own palette — it reads the same colours and the same 8×8 type
marks the interface does. Unlike `Pods/` and the copied bundle it **is** committed, because
it is a source, not a build product; the script rewrites it byte-for-byte, so re-running
leaves the tree unchanged. Pass `--all <dir>` to draw the candidates it was chosen from,
and see the script's own header for why a lone type mark does not survive at icon size.

## Checks

```bash
pnpm run check
```

Asserts the invariants that fail silently if broken, and exits non-zero on violation — the same
idea as the pipeline's stage assertions below. A wrong colour is visible; a selected control
that renders identically to an unselected one is not, nor is a type mark filled with the colour
it is sitting on. Four checks: selected-state rule ordering, absence of inset shadows, prose-face
coverage of the prose corpus, and the measured contrast of every type mark on every surface it is
drawn onto.

## Rebuilding the dataset

```bash
cd design/pipeline
./run.sh
```

Roughly 3–5 minutes on a cold cache. Every stage asserts its invariants and exits non-zero
on violation, so a silently wrong build is not possible. **Read `design/HANDOFF.md` §6
before relaxing any threshold** — most of them exist to detect upstream change, not to make
a test pass.

## Sources and rights

This is a non-commercial technical and design study. It is not affiliated with, endorsed
by, or sponsored by any rights holder.

- **Pokémon** is © Nintendo / Creatures Inc. / GAME FREAK inc. All Pokémon names, artwork
  and related content are the property of their respective owners. No artwork is
  redistributed here — sprites are referenced from PokeAPI at runtime.
- **Roster, form lists and Champions move data** are derived from
  [Bulbapedia](https://bulbapedia.bulbagarden.net/), which publishes under
  [CC BY-NC-SA 2.5](https://creativecommons.org/licenses/by-nc-sa/2.5/). The derived
  dataset in this repository therefore carries the same non-commercial and share-alike
  terms, and Bulbapedia is credited as its source.
- **Base stats, abilities and zh-Hant naming** are derived from
  [PokeAPI](https://pokeapi.co/) source data.
- **Silkscreen** by Jason Kottke is used under the SIL Open Font License; the licence
  travels with the font at `src/assets/fonts/OFL.txt`.

The original code in this repository — the pipeline, the Vue Lynx port, and the specs — is
available for reuse. The derived Pokémon dataset is not mine to relicense; treat it under
Bulbapedia's terms.
