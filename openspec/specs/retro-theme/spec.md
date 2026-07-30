# retro-theme Specification

## Purpose

The two colour modes and the shared state that drives them. Covers one ten-token semantic contract resolved by both POCKET and MODERN, POCKET's derivation from a four-tone greyscale ramp against MODERN's direct declaration, application of the active tokens as inline custom properties on the root view, ink selection by measured contrast rather than a fixed luminance threshold, surface-aware glyph fill selection, and the reactive mode and language state that components read without prop threading.

## Requirements

### Requirement: Two colour modes share one token contract

The theme layer SHALL define exactly two colour modes, POCKET and MODERN, and each SHALL resolve the same ten semantic tokens: bg, shell, panel, surface, surface2, ink, ink2, line, accent and accentInk. No component style SHALL hard-code a colour value; every colour SHALL be read from a token.

#### Scenario: Both modes resolve every token

- **WHEN** the token set for either mode is resolved
- **THEN** all ten semantic tokens carry a colour value

#### Scenario: Component styles reference tokens only

- **WHEN** the stylesheets of this slice are inspected for colour literals
- **THEN** no colour literal appears outside the theme layer


<!-- @trace
source: port-champions-dex-foundation
updated: 2026-07-29
code:
  - shots/12-native-image-events.png
  - shots/04-cards-pocket-zh.png
  - lynx.config.ts
  - AGENTS.md
  - design/pipeline/f700.txt
  - design/pipeline/template.html
  - design/champions-dex.html
  - design/pipeline/verify_forms.py
  - shots/07-narrow-500.png
  - shots/10-native-pocket.png
  - shots/01-pocket-zh.png
  - src/components/SpeciesCard.vue
  - src/rspeedy-env.d.ts
  - README.md
  - .spectra.yaml
  - src/App.vue
  - src/assets/fonts/OFL.txt
  - src/theme/contrast.ts
  - shots/11-native-modern-upscale.png
  - src/components/TypeGlyph.vue
  - tsconfig.json
  - src/shims-vue.d.ts
  - design/pipeline/build_data3.py
  - src/assets/fonts/Silkscreen-Regular.ttf
  - design/pipeline/parse_learn.py
  - src/theme/glyphSvg.ts
  - design/pipeline/f400.txt
  - package.json
  - design/pipeline/fetch_fonts.sh
  - shots/05-upscale-check.png
  - src/theme/modes.ts
  - src/state/display.ts
  - shots/06-sprite-fallback.png
  - .vscode/extensions.json
  - design/pipeline/parse.py
  - design/pipeline/fetch_sources.sh
  - design/pipeline/run.sh
  - design/pipeline/zh_forms.py
  - design/pipeline/__pycache__/parse_learn.cpython-314.pyc
  - design/pipeline/fetch_learnsets.py
  - design/pipeline/fprose.txt
  - shots/02-pixel-face.png
  - design/pipeline/aggregate.py
  - design/pipeline/resolve_forms.py
  - shots/03-glyphs-pocket.png
  - design/champions-dex.json
  - src/App.css
  - src/tsconfig.json
  - tsconfig.node.json
  - src/data/types.ts
  - pnpm-workspace.yaml
  - design/pipeline/build.py
  - CLAUDE.md
  - design/HANDOFF.md
  - shots/08-modern-1400.png
  - shots/09-user-server-modern.png
  - shots/13-native-svg-probes.png
  - src/assets/fonts/Silkscreen-Bold.ttf
  - src/data/dex.json
  - src/data/dex.ts
  - src/data/i18n.ts
  - src/index.ts
-->

---
### Requirement: POCKET derives its tokens from four tones

POCKET SHALL derive its ten tokens from an ordered four-tone greyscale ramp rather than declaring them individually, because the same ramp is the colour source for the sprite placeholders. MODERN SHALL declare its ten tokens directly. The count of distinct colours POCKET's interface renders SHALL NOT exceed four, because the card bevel's secondary surface tone is painted even at rest, which puts the resting count at four rather than three. The invariant this count protects is that no colour outside the ramp is ever introduced; it does not pin the count to one particular value.

Two things are outside the count, and only these two: sprite artwork, which is the one thing on screen deliberately carrying original colour, and the detail veil, which dims the dex behind an open panel.

The veil SHALL be exempt because its colours are composited rather than chosen: it paints a ramp tone at reduced strength over whatever is beneath it. Hiding the dex outright instead would keep the count at four, but the panel would then stop reading as something sitting above the dex, which is the reason it overlays rather than replaces the grid. The exemption SHALL be limited to that one layer — no other surface may reach outside the ramp by compositing, and a translucent surface anywhere else is a violation rather than a precedent.

#### Scenario: POCKET tokens come from the ramp

- **WHEN** POCKET's token set is resolved
- **THEN** every token value is one of the four ramp tones

#### Scenario: POCKET introduces no colour outside its ramp

- **WHEN** the distinct colours rendered by POCKET's interface are collected, excluding sprite artwork and the detail veil
- **THEN** every one of them is a member of the four-tone ramp
- **AND** the count does not exceed four

#### Scenario: The veil dims rather than hides, in both modes

- **WHEN** the detail panel is open in either mode
- **THEN** the dex is visible through the veil at reduced strength
- **AND** the veil names no colour of its own, taking a theme token at reduced opacity instead

#### Scenario: No other surface composites outside the ramp

- **WHEN** POCKET's stylesheets and inline style bindings are inspected
- **THEN** the detail veil is the only rule that reduces the opacity of a painted surface

##### Example: POCKET token derivation from the ramp

| Token     | Ramp position | Value   |
| --------- | ------------- | ------- |
| bg        | tone 0        | #0d0d0d |
| shell     | tone 1        | #4f4f4f |
| panel     | tone 3        | #e8e8e8 |
| surface   | tone 3        | #e8e8e8 |
| surface2  | tone 2        | #a1a1a1 |
| ink       | tone 0        | #0d0d0d |
| ink2      | tone 1        | #4f4f4f |
| line      | tone 0        | #0d0d0d |
| accent    | tone 0        | #0d0d0d |
| accentInk | tone 3        | #e8e8e8 |


<!-- @trace
source: port-champions-dex-detail
updated: 2026-07-29
code:
  - src/state/selection.ts
  - src/components/DexGrid.vue
  - design/HANDOFF.md
  - README.md
  - src/data/i18n.ts
  - src/components/AbilityList.vue
  - src/components/StatBars.vue
  - src/components/FormSwitcher.vue
  - src/App.css
  - src/App.vue
  - scripts/check-styles.mjs
  - src/components/SpeciesCard.vue
  - src/components/SpeciesDetail.vue
  - src/data/dex.ts
-->

---
### Requirement: Tokens are applied as inline CSS variables on the root view

The active mode's token set SHALL be applied as inline CSS custom properties on the application's outermost view. Changing the mode SHALL update those properties and SHALL NOT require remounting the component tree.

#### Scenario: Switching mode recolours the running screen

- **WHEN** the active mode changes while the screen is mounted
- **THEN** every rendered surface, border and text colour updates to the new mode's tokens
- **AND** no component is remounted


<!-- @trace
source: port-champions-dex-foundation
updated: 2026-07-29
code:
  - shots/12-native-image-events.png
  - shots/04-cards-pocket-zh.png
  - lynx.config.ts
  - AGENTS.md
  - design/pipeline/f700.txt
  - design/pipeline/template.html
  - design/champions-dex.html
  - design/pipeline/verify_forms.py
  - shots/07-narrow-500.png
  - shots/10-native-pocket.png
  - shots/01-pocket-zh.png
  - src/components/SpeciesCard.vue
  - src/rspeedy-env.d.ts
  - README.md
  - .spectra.yaml
  - src/App.vue
  - src/assets/fonts/OFL.txt
  - src/theme/contrast.ts
  - shots/11-native-modern-upscale.png
  - src/components/TypeGlyph.vue
  - tsconfig.json
  - src/shims-vue.d.ts
  - design/pipeline/build_data3.py
  - src/assets/fonts/Silkscreen-Regular.ttf
  - design/pipeline/parse_learn.py
  - src/theme/glyphSvg.ts
  - design/pipeline/f400.txt
  - package.json
  - design/pipeline/fetch_fonts.sh
  - shots/05-upscale-check.png
  - src/theme/modes.ts
  - src/state/display.ts
  - shots/06-sprite-fallback.png
  - .vscode/extensions.json
  - design/pipeline/parse.py
  - design/pipeline/fetch_sources.sh
  - design/pipeline/run.sh
  - design/pipeline/zh_forms.py
  - design/pipeline/__pycache__/parse_learn.cpython-314.pyc
  - design/pipeline/fetch_learnsets.py
  - design/pipeline/fprose.txt
  - shots/02-pixel-face.png
  - design/pipeline/aggregate.py
  - design/pipeline/resolve_forms.py
  - shots/03-glyphs-pocket.png
  - design/champions-dex.json
  - src/App.css
  - src/tsconfig.json
  - tsconfig.node.json
  - src/data/types.ts
  - pnpm-workspace.yaml
  - design/pipeline/build.py
  - CLAUDE.md
  - design/HANDOFF.md
  - shots/08-modern-1400.png
  - shots/09-user-server-modern.png
  - shots/13-native-svg-probes.png
  - src/assets/fonts/Silkscreen-Bold.ttf
  - src/data/dex.json
  - src/data/dex.ts
  - src/data/i18n.ts
  - src/index.ts
-->

---
### Requirement: Ink colour is chosen by measured contrast

Ink selection over an arbitrary background SHALL compare the measured WCAG contrast of the dark ink candidate and the light ink candidate against that background and return whichever measures higher. Selection SHALL NOT use a fixed luminance threshold.

#### Scenario: Ink selection returns the higher-contrast candidate

- **WHEN** ink is selected for a background colour
- **THEN** the returned candidate is the one whose measured contrast against that background is higher

#### Scenario: A background near the crossover point

- **WHEN** ink is selected for the Rock type colour
- **THEN** the dark ink candidate is returned

##### Example: measured contrast at the crossover

- **GIVEN** the Rock type colour #AFA981
- **WHEN** contrast is measured against both ink candidates
- **THEN** the dark candidate #101010 measures 7.99 and the light candidate #ffffff measures 2.38, so the dark candidate is returned


<!-- @trace
source: port-champions-dex-foundation
updated: 2026-07-29
code:
  - shots/12-native-image-events.png
  - shots/04-cards-pocket-zh.png
  - lynx.config.ts
  - AGENTS.md
  - design/pipeline/f700.txt
  - design/pipeline/template.html
  - design/champions-dex.html
  - design/pipeline/verify_forms.py
  - shots/07-narrow-500.png
  - shots/10-native-pocket.png
  - shots/01-pocket-zh.png
  - src/components/SpeciesCard.vue
  - src/rspeedy-env.d.ts
  - README.md
  - .spectra.yaml
  - src/App.vue
  - src/assets/fonts/OFL.txt
  - src/theme/contrast.ts
  - shots/11-native-modern-upscale.png
  - src/components/TypeGlyph.vue
  - tsconfig.json
  - src/shims-vue.d.ts
  - design/pipeline/build_data3.py
  - src/assets/fonts/Silkscreen-Regular.ttf
  - design/pipeline/parse_learn.py
  - src/theme/glyphSvg.ts
  - design/pipeline/f400.txt
  - package.json
  - design/pipeline/fetch_fonts.sh
  - shots/05-upscale-check.png
  - src/theme/modes.ts
  - src/state/display.ts
  - shots/06-sprite-fallback.png
  - .vscode/extensions.json
  - design/pipeline/parse.py
  - design/pipeline/fetch_sources.sh
  - design/pipeline/run.sh
  - design/pipeline/zh_forms.py
  - design/pipeline/__pycache__/parse_learn.cpython-314.pyc
  - design/pipeline/fetch_learnsets.py
  - design/pipeline/fprose.txt
  - shots/02-pixel-face.png
  - design/pipeline/aggregate.py
  - design/pipeline/resolve_forms.py
  - shots/03-glyphs-pocket.png
  - design/champions-dex.json
  - src/App.css
  - src/tsconfig.json
  - tsconfig.node.json
  - src/data/types.ts
  - pnpm-workspace.yaml
  - design/pipeline/build.py
  - CLAUDE.md
  - design/HANDOFF.md
  - shots/08-modern-1400.png
  - shots/09-user-server-modern.png
  - shots/13-native-svg-probes.png
  - src/assets/fonts/Silkscreen-Bold.ttf
  - src/data/dex.json
  - src/data/dex.ts
  - src/data/i18n.ts
  - src/index.ts
-->

---
### Requirement: Glyph fill is chosen by the surface it will sit on

A type glyph's fill colour SHALL be selected from the type and the named surface it renders onto, where the surface is one of surface, accent, typechip, panel or surface2. A glyph SHALL NOT be filled with the same colour as the surface beneath it.

The function that reports a glyph's effective background SHALL report the panel token for the panel member and the surface2 token for the surface2 member. Both functions SHALL be extended together: extending only the fill selection leaves the contrast measurement computing against a background the glyph is not on, which yields numbers that look ordinary and mean nothing.

#### Scenario: POCKET spends no colour on glyphs

- **WHEN** a glyph fill is selected in POCKET
- **THEN** the fill is the lightest ramp tone on the accent surface and the darkest ramp tone otherwise

#### Scenario: MODERN colours the glyph on a neutral surface

- **WHEN** a glyph fill is selected in MODERN for the surface, panel, or surface2 target
- **THEN** the fill is the type's own colour

#### Scenario: MODERN inverts the glyph on a type-coloured chip

- **WHEN** a glyph fill is selected in MODERN for the typechip target, whose background is the type's own colour
- **THEN** the fill is the ink candidate with higher measured contrast against that type colour

#### Scenario: No combination renders an invisible glyph

- **WHEN** the measured contrast of every mode, type and surface combination is computed against its effective background
- **THEN** no combination measures below 2.5

#### Scenario: The bonus row is legible without relying on the glyph's contrast

- **WHEN** a bonus-marked learnset row renders a type whose glyph contrast on surface2 is the lowest measured
- **THEN** the row still states the bonus through its star text node, which does not take its colour from the type

##### Example: measured contrast floors and ceilings per combination

| Mode   | Surface  | Glyph fill source        | Lowest measured        | Highest measured        |
| ------ | -------- | ------------------------ | ---------------------- | ----------------------- |
| POCKET | surface  | darkest ramp tone        | 15.86 (all types)      | 15.86 (all types)       |
| POCKET | panel    | darkest ramp tone        | 15.86 (all types)      | 15.86 (all types)       |
| POCKET | surface2 | darkest ramp tone        | 7.52 (all types)       | 7.52 (all types)        |
| POCKET | accent   | lightest ramp tone       | 15.86 (all types)      | 15.86 (all types)       |
| MODERN | surface  | the type's own colour    | 2.95 (Poison)          | 9.71 (Electric)         |
| MODERN | panel    | the type's own colour    | 3.39 (Poison)          | 11.18 (Electric)        |
| MODERN | surface2 | the type's own colour    | 2.53 (Poison)          | 8.34 (Electric)         |
| MODERN | accent   | accent ink token         | 15.97 (all types)      | 15.97 (all types)       |
| MODERN | typechip | higher-contrast ink      | 4.47 (Fire)            | 11.42 (Electric)        |

##### Example: MODERN types measuring below 2.9 on surface2

| Type   | Measured on surface2 | Notes                                                              |
| ------ | -------------------- | ------------------------------------------------------------------ |
| Poison | 2.53                 | the new floor; the same type that floors the surface member at 2.95 |
| Dragon | 2.71                 | above 2.9 on surface, below it on the lighter surface2             |
| Ghost  | 2.89                 | marginally below the previous floor                                |


<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: Active language and active mode are shared reactive state

The active mode and the active language SHALL be held as shared reactive state readable by any component without prop threading. Both SHALL be switchable at runtime.

#### Scenario: Two components observe the same switch

- **WHEN** the active mode changes
- **THEN** every component reading the shared state re-renders with the new mode

#### Scenario: Language and mode switch independently

- **WHEN** the active language changes
- **THEN** the active mode is unaffected

<!-- @trace
source: port-champions-dex-foundation
updated: 2026-07-29
code:
  - shots/12-native-image-events.png
  - shots/04-cards-pocket-zh.png
  - lynx.config.ts
  - AGENTS.md
  - design/pipeline/f700.txt
  - design/pipeline/template.html
  - design/champions-dex.html
  - design/pipeline/verify_forms.py
  - shots/07-narrow-500.png
  - shots/10-native-pocket.png
  - shots/01-pocket-zh.png
  - src/components/SpeciesCard.vue
  - src/rspeedy-env.d.ts
  - README.md
  - .spectra.yaml
  - src/App.vue
  - src/assets/fonts/OFL.txt
  - src/theme/contrast.ts
  - shots/11-native-modern-upscale.png
  - src/components/TypeGlyph.vue
  - tsconfig.json
  - src/shims-vue.d.ts
  - design/pipeline/build_data3.py
  - src/assets/fonts/Silkscreen-Regular.ttf
  - design/pipeline/parse_learn.py
  - src/theme/glyphSvg.ts
  - design/pipeline/f400.txt
  - package.json
  - design/pipeline/fetch_fonts.sh
  - shots/05-upscale-check.png
  - src/theme/modes.ts
  - src/state/display.ts
  - shots/06-sprite-fallback.png
  - .vscode/extensions.json
  - design/pipeline/parse.py
  - design/pipeline/fetch_sources.sh
  - design/pipeline/run.sh
  - design/pipeline/zh_forms.py
  - design/pipeline/__pycache__/parse_learn.cpython-314.pyc
  - design/pipeline/fetch_learnsets.py
  - design/pipeline/fprose.txt
  - shots/02-pixel-face.png
  - design/pipeline/aggregate.py
  - design/pipeline/resolve_forms.py
  - shots/03-glyphs-pocket.png
  - design/champions-dex.json
  - src/App.css
  - src/tsconfig.json
  - tsconfig.node.json
  - src/data/types.ts
  - pnpm-workspace.yaml
  - design/pipeline/build.py
  - CLAUDE.md
  - design/HANDOFF.md
  - shots/08-modern-1400.png
  - shots/09-user-server-modern.png
  - shots/13-native-svg-probes.png
  - src/assets/fonts/Silkscreen-Bold.ttf
  - src/data/dex.json
  - src/data/dex.ts
  - src/data/i18n.ts
  - src/index.ts
-->