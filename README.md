# CHAMPIONS DEX

A pixel-styled, bilingual Pokémon Champions dex — a finished design study, plus an
in-progress port of it to [Vue Lynx](https://vue.lynxjs.org/).

Two colour modes (`POCKET`, a four-tone greyscale chrome that leaves the artwork as the
only colour on screen; `MODERN`, which spends colour everywhere), Traditional Chinese and
English side by side, and type marks hand-plotted on an 8×8 grid.

## Layout

| Path | What it is |
| ---- | ---------- |
| `design/champions-dex.html` | The design study. Self-contained — open it in a browser. |
| `design/pipeline/` | Rebuilds the study and its dataset from upstream sources in 8 stages, each asserting its own invariants. |
| `design/HANDOFF.md` | The document that matters. Data provenance, derivation rules, design decisions and their reasons, and the measured Lynx platform facts (§12). |
| `src/` | The Vue Lynx port. First vertical slice only — data layer, colour modes, type glyph, one species card. |
| `openspec/` | [Spectra](https://github.com/spectra-app/spectra) specs the port is built against. |

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

Its limits are recorded in §12.9 — it cannot render SVG, so it cannot verify the type
glyphs.

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
