# retro-theme Specification

## Purpose

The colour modes and the shared state that drives them. Covers one ten-token semantic contract resolved by every mode in an ordered set — POCKET, MODERN and EMERALD — with no eleventh token admitted, POCKET's derivation from a four-tone greyscale ramp against the direct declaration the other two use, the provenance each directly declared EMERALD token carries so that it can be checked back to a rectangle of the palette source or to the factor deriving it rather than to a feature name that both generations in that image answer to, application of the active tokens as inline custom properties on the root view, ink selection by measured contrast rather than a fixed luminance threshold, one surface-aware selection returning both a glyph's fill and the plate a light mode paints behind it so the two cannot disagree with the background reported for measurement and so that replacing a neutral token cannot move what the plated arrangement measures, and the reactive mode and language state that components read without prop threading, with the mode set by naming it rather than by advancing a position, with each one's initial value restored at launch rather than defaulted and each change to it persisted — both by `display-persistence`, which owns the store and leaves this layer holding only the state whose change triggers the write, and which makes a mode identifier already in the ordered set an external contract that a rename silently breaks.

## Requirements

### Requirement: Colour modes share one token contract

The theme layer SHALL define at least two colour modes and SHALL define them as one ordered set, so that adding a mode is an addition to that set rather than a change to any control that reads it. The set currently holds three: POCKET, MODERN and EMERALD. Each mode SHALL resolve the same ten semantic tokens: bg, shell, panel, surface, surface2, ink, ink2, line, accent and accentInk. No component style SHALL hard-code a colour value; every colour SHALL be read from a token.

Adding a mode SHALL NOT add an eleventh token. A mode needing a colour the ten do not carry is a change to the contract for every mode, not an addition of one.

#### Scenario: Every mode resolves every token

- **WHEN** the token set for any mode in the ordered set is resolved
- **THEN** all ten semantic tokens carry a colour value

#### Scenario: Component styles reference tokens only

- **WHEN** the stylesheets of this slice are inspected for colour literals
- **THEN** no colour literal appears outside the theme layer

#### Scenario: The mode set is readable as a sequence

- **WHEN** a control needs to present every available mode
- **THEN** it reads the ordered set from the theme layer rather than naming the modes itself


<!-- @trace
source: add-emerald-mode
updated: 2026-08-13
code:
  - design/theme-menu-variants.html
  - src/components/ThemeMenuList.vue
  - design/HANDOFF.md
  - design/theme-emerald-mock.html
  - design/emerald-palette-source.jpg
  - src/components/ThemeMenu.vue
  - src/theme/modes.ts
  - src/components/TypeGlyph.vue
  - src/App.vue
  - src/App.css
  - src/state/display.ts
  - scripts/check-contrast.mjs
tests:
  - tests/theme.test.ts
-->

---
### Requirement: POCKET derives its tokens from four tones

POCKET SHALL derive its ten tokens from an ordered four-tone greyscale ramp rather than declaring them individually, because the same ramp is the colour source for the sprite placeholders. MODERN and EMERALD SHALL each declare their ten tokens directly. The count of distinct colours POCKET's interface renders SHALL NOT exceed four, because the card bevel's secondary surface tone is painted even at rest, which puts the resting count at four rather than three. The invariant this count protects is that no colour outside the ramp is ever introduced; it does not pin the count to one particular value.

Two things are outside the count, and only these two: sprite artwork, which is the one thing on screen deliberately carrying original colour, and the detail veil, which dims the dex behind an open panel.

The veil SHALL be exempt because its colours are composited rather than chosen: it paints a ramp tone at reduced strength over whatever is beneath it. Hiding the dex outright instead would keep the count at four, but the panel would then stop reading as something sitting above the dex, which is the reason it overlays rather than replaces the grid. The exemption SHALL be limited to that one layer — no other surface SHALL reach outside the ramp by compositing, and a translucent surface anywhere else is a violation rather than a precedent.

The theme menu is inside the count, not outside it: while POCKET is in force the menu SHALL paint only ramp tones, which is why its rows name their modes in text rather than sampling their colours.

EMERALD's declared tokens SHALL be traceable to the region of the palette source image they were taken from. Four are sampled as the channel mean of a named rectangle; the remaining six are derived from a sampled value by scaling its HSL lightness, or are a second use of a value already declared. Naming the depicted feature alone SHALL NOT count as traceable: the source image places two generations side by side and every feature name holds in both halves, so a feature name alone cannot distinguish a correct sample from an incorrect one. The recorded provenance SHALL therefore carry pixel coordinates for a sampled value and the scaling factor for a derived one.

#### Scenario: POCKET tokens come from the ramp

- **WHEN** POCKET's token set is resolved
- **THEN** every token value is one of the four ramp tones

#### Scenario: POCKET introduces no colour outside its ramp

- **WHEN** the distinct colours rendered by POCKET's interface are collected, excluding sprite artwork and the detail veil
- **THEN** every one of them is a member of the four-tone ramp
- **AND** the count does not exceed four

#### Scenario: The veil dims rather than hides, in every mode

- **WHEN** the detail panel is open in any mode
- **THEN** the dex is visible through the veil at reduced strength
- **AND** the veil names no colour of its own, taking a theme token at reduced opacity instead

#### Scenario: No other surface composites outside the ramp

- **WHEN** POCKET's stylesheets and inline style bindings are inspected
- **THEN** the detail veil is the only rule that reduces the opacity of a painted surface

#### Scenario: Every EMERALD token names where it came from

- **WHEN** EMERALD's declared tokens are read alongside their recorded provenance
- **THEN** each sampled token names a rectangle in the upper half of the palette source image
- **AND** each derived token names the sampled token it scales and the factor it scales by

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

##### Example: EMERALD's ten declared tokens and their measured text contrast

The palette source image is 460x916 and places two generations one above the other: the upper half, rows 8 through 452, is the generation EMERALD is named for. Every sampled value below is the channel mean of a rectangle inside that upper half, given as top-left through bottom-right pixel coordinates. Two sampled values feed no token of their own and appear only as the base of a derived one: the grass at (202,142) through (212,180), measuring #73BF9F, and the house wall at (142,284) through (151,300), measuring #BAA376.

| Token     | Value   | Source                                             | Drawn onto | Measured |
| --------- | ------- | -------------------------------------------------- | ---------- | -------- |
| bg        | #2C491E | shell scaled to 0.5149 of its HSL lightness         | —          | —        |
| shell     | #568E3A | sampled: tree canopy, (120,246) - (132,304)         | —          | —        |
| panel     | #D8C780 | sampled: sand path, (218,145) - (252,190)           | —          | —        |
| surface   | #E6DDCD | house wall scaled to 1.43 of its HSL lightness      | —          | —        |
| surface2  | #CCAB67 | sampled: ochre building roof, (196,62) - (264,96)   | —          | —        |
| ink       | #2C491E | the bg value, used a second time                    | panel      | 5.97     |
| ink       | #2C491E | the bg value, used a second time                    | surface    | 7.50     |
| ink2      | #265441 | grass scaled to 0.40 of its HSL lightness           | surface    | 6.42     |
| line      | #2C491E | the bg value, used a second time                    | —          | —        |
| accent    | #AE505D | sampled: house roof, (141,258) - (194,276)          | —          | —        |
| accentInk | #E6DDCD | the surface value, used a second time               | accent     | 3.80     |

accentInk is the light value rather than the dark one because accent is dark. The dark ink measures 1.97 against this accent, below the floor the glyph check enforces; the surface value measures 3.80. A future accent light enough to invert that comparison SHALL invert accentInk with it.


<!-- @trace
source: resample-emerald-palette
updated: 2026-08-13
code:
  - design/theme-menu-variants.html
  - design/theme-emerald-mock.html
  - ROADMAP.md
  - src/theme/modes.ts
tests:
  - tests/theme.test.ts
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

A type glyph's paint SHALL be selected from the type and the named surface it renders onto, where the surface is one of surface, accent, typechip, panel or surface2. The selection SHALL return a fill colour and, for modes that plate their glyphs, the colour of a plate the glyph paints behind itself. A glyph SHALL NOT be filled with the same colour as whatever is immediately beneath it.

A mode whose neutral surfaces are lighter than the type colours SHALL plate its glyphs rather than fill them with the type colour. Filling with the type colour on a light surface is not a matter of choosing better values: the brightest type colours measure below the floor against white itself, so no light surface clears it. Plating restores the arrangement the typechip surface already uses — the type's colour as the background, the higher-contrast ink candidate as the fill — so it introduces no colour and no new floor.

A plate SHALL be painted only for the surface, panel and surface2 members. The accent and typechip members already carry a chosen background, and plating them would hide it.

The function that reports a glyph's effective background SHALL report the plate colour whenever a plate is in force, the panel token for the panel member, and the surface2 token for the surface2 member. Fill, plate and reported background SHALL be produced by one selection so they cannot disagree: reporting a background the glyph is not on yields numbers that look ordinary and mean nothing.

Because a plated glyph takes both its fill and its background from the type's own colour, its measured contrast SHALL be independent of the mode's neutral tokens. Changing a neutral token therefore SHALL NOT move the plated figures, and a change to the palette that does move them indicates the plating arrangement itself was altered.

#### Scenario: POCKET spends no colour on glyphs

- **WHEN** a glyph fill is selected in POCKET
- **THEN** the fill is the lightest ramp tone on the accent surface and the darkest ramp tone otherwise
- **AND** no plate is returned

#### Scenario: MODERN colours the glyph on a neutral surface

- **WHEN** a glyph fill is selected in MODERN for the surface, panel, or surface2 target
- **THEN** the fill is the type's own colour
- **AND** no plate is returned

#### Scenario: MODERN inverts the glyph on a type-coloured chip

- **WHEN** a glyph fill is selected in MODERN for the typechip target, whose background is the type's own colour
- **THEN** the fill is the ink candidate with higher measured contrast against that type colour

#### Scenario: EMERALD plates the glyph on a neutral surface

- **WHEN** a glyph paint is selected in EMERALD for the surface, panel, or surface2 target
- **THEN** the plate is the type's own colour
- **AND** the fill is the ink candidate with higher measured contrast against that type colour
- **AND** the reported background is the plate colour

#### Scenario: No mode plates a glyph that already has a chosen background

- **WHEN** a glyph paint is selected for the accent or typechip target in any mode
- **THEN** no plate is returned

#### Scenario: No combination renders an invisible glyph

- **WHEN** the measured contrast of every mode, type and surface combination is computed against its effective background
- **THEN** no combination measures below 2.5

#### Scenario: The bonus row is legible without relying on the glyph's contrast

- **WHEN** a bonus-marked learnset row renders a type whose glyph contrast on surface2 is the lowest measured
- **THEN** the row still states the bonus through its star text node, which does not take its colour from the type

#### Scenario: Replacing a neutral token leaves the plated figures where they were

- **WHEN** EMERALD's panel, surface or surface2 token is replaced with a different colour
- **THEN** the measured contrast of every plated combination is unchanged
- **AND** only the accent combination moves, because it alone reads the mode's own tokens for both fill and background

##### Example: measured contrast floors and ceilings per combination

| Mode    | Surface  | Glyph fill source        | Lowest measured        | Highest measured        |
| ------- | -------- | ------------------------ | ---------------------- | ----------------------- |
| POCKET  | surface  | darkest ramp tone        | 15.86 (all types)      | 15.86 (all types)       |
| POCKET  | panel    | darkest ramp tone        | 15.86 (all types)      | 15.86 (all types)       |
| POCKET  | surface2 | darkest ramp tone        | 7.52 (all types)       | 7.52 (all types)        |
| POCKET  | accent   | lightest ramp tone       | 15.86 (all types)      | 15.86 (all types)       |
| MODERN  | surface  | the type's own colour    | 2.95 (Poison)          | 9.71 (Electric)         |
| MODERN  | panel    | the type's own colour    | 3.39 (Poison)          | 11.18 (Electric)        |
| MODERN  | surface2 | the type's own colour    | 2.53 (Poison)          | 8.34 (Electric)         |
| MODERN  | accent   | accent ink token         | 15.97 (all types)      | 15.97 (all types)       |
| MODERN  | typechip | higher-contrast ink      | 4.47 (Fire)            | 11.42 (Electric)        |
| EMERALD | surface  | higher-contrast ink on a plate of the type's colour | 4.47 (Fire) | 11.42 (Electric) |
| EMERALD | panel    | higher-contrast ink on a plate of the type's colour | 4.47 (Fire) | 11.42 (Electric) |
| EMERALD | surface2 | higher-contrast ink on a plate of the type's colour | 4.47 (Fire) | 11.42 (Electric) |
| EMERALD | accent   | accent ink token         | 3.80 (all types)       | 3.80 (all types)        |
| EMERALD | typechip | higher-contrast ink      | 4.47 (Fire)            | 11.42 (Electric)        |

##### Example: MODERN types measuring below 2.9 on surface2

| Type   | Measured on surface2 | Notes                                                              |
| ------ | -------------------- | ------------------------------------------------------------------ |
| Poison | 2.53                 | the new floor; the same type that floors the surface member at 2.95 |
| Dragon | 2.71                 | above 2.9 on surface, below it on the lighter surface2             |
| Ghost  | 2.89                 | marginally below the previous floor                                |

##### Example: why a light surface cannot carry the type colour as a fill

The white column is the ceiling: no light surface can measure higher than white does, so a type
below the floor against white is below it against every light surface there is.

| Type     | Colour  | Against white | Against surface #E6DDCD | Against panel #D8C780 |
| -------- | ------- | ------------- | ----------------------- | --------------------- |
| Electric | #FAC000 | 1.67          | 1.24                    | 1.02                  |
| Ice      | #3DCEF3 | 1.85          | 1.38                    | 1.10                  |
| Flying   | #81B9EF | 2.08          | 1.54                    | 1.23                  |

Counted across all eighteen types, the fill arrangement leaves 11 below the floor on surface,
13 on panel and 17 on surface2.


<!-- @trace
source: resample-emerald-palette
updated: 2026-08-13
code:
  - design/theme-menu-variants.html
  - design/theme-emerald-mock.html
  - ROADMAP.md
  - src/theme/modes.ts
tests:
  - tests/theme.test.ts
-->

---
### Requirement: Active language and active mode are shared reactive state

The active mode and the active language SHALL be held as shared reactive state readable by any component without prop threading. Both SHALL be switchable at runtime.

The initial value of each SHALL come from the settings restored at launch by `display-persistence` rather than from a fixed default. The fixed defaults — the first mode of the ordered mode set, and Chinese — SHALL remain the value used when nothing is restored, so a first run and a run with an unreadable store both start where the application has always started.

A change to either value SHALL be persisted. The shared state layer SHALL NOT decide when to write: it is the layer whose change triggers the write, and the durable storage keys, their value domains and the writing itself belong to `display-persistence`. This keeps a new way of changing either value persistent without that code path knowing persistence exists.

The active mode SHALL be set by naming a mode, not by advancing a position in the mode set. No operation that advances the active mode to the next member SHALL be exposed, because a control built on it states neither how many modes exist nor which one is in force, and the set is expected to grow.

Setting the active mode to the mode already in force SHALL leave the interface unchanged and SHALL persist nothing.

The identifier of a mode already present in the ordered mode set SHALL be treated as carrying an external contract, because it is what gets stored. Adding a mode to the set carries no such cost; renaming one returns every reader who had selected it to the default mode.

#### Scenario: Two components observe the same switch

- **WHEN** the active mode changes
- **THEN** every component reading the shared state re-renders with the new mode

#### Scenario: Language and mode switch independently

- **WHEN** the active language changes
- **THEN** the active mode is unaffected

#### Scenario: The mode is selected by name

- **WHEN** a mode is set by naming it
- **THEN** the active mode becomes that mode, whatever its position in the ordered set

#### Scenario: Setting the active mode again is inert

- **WHEN** the active mode is set to the mode already in force
- **THEN** no token value changes, no component is remounted, and nothing is written to durable storage

#### Scenario: The initial values come from the restored settings

- **WHEN** the shared state is first read after launch and durable storage holds a mode and a language
- **THEN** the active mode and the active language are the stored ones rather than the fixed defaults

#### Scenario: The fixed defaults survive as the fallback

- **WHEN** the shared state is first read after launch and nothing is restored
- **THEN** the active mode is the first mode of the ordered mode set and the active language is Chinese

#### Scenario: A change to either value is persisted

- **WHEN** the active mode or the active language changes
- **THEN** the new value is written to durable storage without the changing code path referring to persistence

<!-- @trace
source: persist-display-settings
updated: 2026-08-14
code:
  - src/ios/Zero Lab/Zero Lab/AppDelegate.swift
  - design/HANDOFF.md
  - ROADMAP.md
  - src/ios/Zero Lab/Zero Lab/ViewController.swift
  - src/state/display.ts
  - src/theme/modes.ts
  - src/platform/settings.ts
  - src/rspeedy-env.d.ts
  - src/ios/Zero Lab/Zero Lab/DisplaySettingsModule.swift
tests:
  - tests/displayPersistence.test.ts
-->