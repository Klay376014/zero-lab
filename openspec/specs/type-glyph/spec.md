# type-glyph Specification

## Purpose

The eighteen type marks as rendered artwork. Covers vector output rather than canvas, each bitmap row emitted as merged horizontal runs, a fixed sixteen-pixel box that scales only by whole multiples, memoisation keyed by mode, type and surface, fill baked in from the theme layer's surface-aware selection rather than inherited from surrounding text, and the device-adjudicated fallback for which rendering mechanism is in force.

## Requirements

### Requirement: Glyphs render as vector content, not canvas

A type glyph SHALL be rendered as vector artwork through whichever of the two device-verified mechanisms named in the recorded-fallback requirement is in force. The implementation SHALL NOT use a canvas element, because the platform's element set has none, and SHALL NOT expand the bitmap into individual shape nodes in the component template. The glyph component's input contract SHALL be identical under either mechanism, so that callers rendering a glyph on a card, a filter control, or a placeholder tile are unaffected by which one is in force.

#### Scenario: Glyph renders as a single vector node

- **WHEN** a glyph component renders
- **THEN** it emits one vector element carrying the whole eight-by-eight mark
- **AND** that element is either the SVG element receiving an SVG XML string on its content attribute or the image element referencing an SVG asset

#### Scenario: No per-pixel template nodes

- **WHEN** the glyph component's template is inspected
- **THEN** it contains no shape child elements and no per-pixel iteration in the template

#### Scenario: Callers are unaffected by the mechanism

- **WHEN** the rendering mechanism changes from one verified form to the other
- **THEN** the component's inputs remain the type name and the target surface name
- **AND** no calling component's markup changes


<!-- @trace
source: port-champions-dex-grid
updated: 2026-07-29
code:
  - src/components/QueryBar.vue
  - design/HANDOFF.md
  - src/data/i18n.ts
  - src/state/query.ts
  - src/components/DexGrid.vue
  - src/App.css
  - src/App.vue
-->

---
### Requirement: Bitmap rows are emitted as merged horizontal runs

The SVG string SHALL encode each row's consecutive filled pixels as one rectangle rather than one rectangle per pixel, and SHALL declare a view box of eight by eight units so that the source grid maps to integer coordinates.

#### Scenario: Consecutive filled pixels merge

- **WHEN** a bitmap row contains a run of consecutive filled pixels
- **THEN** the emitted string contains one rectangle spanning that run

##### Example: one row of the Normal glyph

- **GIVEN** the row pattern for row 0 of the Normal glyph, which is two empty pixels, four filled pixels, then two empty pixels
- **WHEN** the SVG string is produced
- **THEN** that row contributes exactly one rectangle at x=2, y=0, width=4, height=1


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
### Requirement: Glyph box size is fixed

A glyph SHALL render into a box of exactly sixteen by sixteen pixels regardless of the surrounding font size, because an eight by eight source grid stays sharp only at integer scale factors.

#### Scenario: Glyph size is independent of text size

- **WHEN** a glyph is placed next to text of any size
- **THEN** its rendered box is sixteen by sixteen pixels

#### Scenario: A larger glyph keeps the grid whole

- **WHEN** a caller asks for a larger glyph, as the sprite placeholder does
- **THEN** the rendered box is a whole-number multiple of eight pixels


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
### Requirement: Glyph strings are memoised

Produced SVG strings SHALL be cached keyed by the combination of active mode, type name and target surface, and the cache SHALL be invalidated when the active mode changes.

#### Scenario: Repeated render reuses the cached string

- **WHEN** the same type and surface combination is rendered again under the same mode
- **THEN** the cached string is reused and no new string is produced

#### Scenario: Mode change invalidates cached strings

- **WHEN** the active mode changes
- **THEN** cached strings are discarded so fills are recomputed for the new mode


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
### Requirement: Glyph accepts a type and a target surface

The glyph component SHALL take the type name and the target surface name as its inputs, and SHALL obtain its fill from the theme layer's surface-aware fill selection. The component SHALL NOT inherit its colour from surrounding text colour, because the fill is written into the SVG string at production time.

The target surface SHALL be one of five named members: surface, accent, typechip, panel and surface2. The panel member names the panel's own background, which the unmarked learnset rows sit on. The surface2 member names the secondary surface, which the bonus-marked learnset rows sit on. A caller SHALL name the surface the glyph will actually sit on, and SHALL NOT reuse a near neighbour: the two ramp tones behind panel and surface coincide in POCKET but differ in MODERN, so reusing one for the other reports a background the glyph is not on and makes the measured contrast meaningless.

#### Scenario: Same type renders different fills on different surfaces

- **WHEN** the same type is rendered on the card surface and on the selected accent surface
- **THEN** the two renders carry different fill colours

#### Scenario: Unrecognised type name

- **WHEN** a glyph is requested for a type name absent from the bitmap table
- **THEN** the Normal bitmap is rendered and no error is raised

#### Scenario: The learnset rows name their own backgrounds

- **WHEN** a learnset row that is not marked for the bonus renders its type glyph
- **THEN** the glyph names the panel surface

#### Scenario: A bonus-marked row names the secondary surface

- **WHEN** a learnset row marked for the bonus renders its type glyph
- **THEN** the glyph names the surface2 surface


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
### Requirement: Glyph rendering strategy has a recorded fallback

The primary mechanism SHALL be the platform's SVG element receiving an SVG XML string on its content attribute. Because that mechanism has been measured not to render on one platform build while the documentation names it as supported, the mechanism SHALL be adjudicated by measurement on a physical device before the grid replaces the verification harness. When measurement shows the primary mechanism renders, it SHALL be kept unchanged. When measurement shows it does not render, the implementation SHALL fall back to an image element referencing an SVG asset, coloured per target surface by the platform's tint colour property. Either outcome SHALL be recorded in the design handoff document together with the form actually adopted.

The fallback SHALL NOT reference the asset as a data URI, because a data URI SVG has been measured not to render. The fallback SHALL NOT emit one asset per combination of type, target surface, and colour mode; eighteen single-colour assets tinted at the point of use SHALL be sufficient, because the tint applies to every non-transparent pixel.

A glyph that renders as nothing SHALL be treated as an acceptance failure. Hiding the glyph SHALL NOT be accepted as a degraded state, because the eighteen marks are the interface's primary means of naming a type.

#### Scenario: Primary mechanism holds on device

- **WHEN** measurement on a physical device shows the SVG element renders its content string
- **THEN** the component keeps that mechanism
- **AND** no SVG assets are added to the project
- **AND** the outcome is recorded in the design handoff document

#### Scenario: Primary mechanism fails on device

- **WHEN** measurement on a physical device shows the SVG element does not render its content string
- **THEN** the component renders an image element referencing an SVG asset, tinted per target surface
- **AND** the outcome and the adopted form are recorded in the design handoff document

#### Scenario: The fallback's asset count is bounded by type

- **WHEN** the fallback is in force and the SVG assets are counted
- **THEN** there are eighteen, one per type
- **AND** no asset is referenced as a data URI

#### Scenario: An invisible glyph fails acceptance

- **WHEN** any type's mark renders as nothing on a target surface
- **THEN** acceptance fails for that surface
- **AND** the glyph is not hidden as a substitute for rendering it

##### Example: measured outcomes per candidate form

| Candidate form                            | Desktop build result | Role                                    |
| ----------------------------------------- | -------------------- | --------------------------------------- |
| SVG element with an SVG XML content string | did not render       | primary, pending device adjudication    |
| SVG element referencing an SVG asset       | did not render       | rejected                                |
| image element referencing an SVG asset     | rendered sharply     | fallback when the primary is disproved  |
| image element with an SVG data URI         | did not render       | rejected                                |

<!-- @trace
source: port-champions-dex-grid
updated: 2026-07-29
code:
  - src/components/QueryBar.vue
  - design/HANDOFF.md
  - src/data/i18n.ts
  - src/state/query.ts
  - src/components/DexGrid.vue
  - src/App.css
  - src/App.vue
-->