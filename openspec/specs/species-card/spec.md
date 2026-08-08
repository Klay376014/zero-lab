# species-card Specification

## Purpose

The presentation contract for a single species card. Covers element order and badge rules, the type row's trailing group and the base-stat figure that appears in it exactly while the grid is ordered by base stats, both languages staying on the card at once, layout stability when optional rows are empty and when names are overlong, nearest-neighbour sprite upscaling declared per element, the guarantee that artwork is never recoloured, the glyph-tile fallback when artwork fails to load, the bevel built from per-side border colours instead of an unsupported inset shadow, in-place updates on mode and language change, and the species-plus-form-index input contract.

## Requirements

### Requirement: Card composition

A species card SHALL render, in order: a header row carrying the zero-padded national number on the left and the Mega badge followed by the generation numeral on the right; the form's sprite; the leading species name; the alternate species name; the form label; and a type row carrying one glyph and one three-letter abbreviation per type, with a trailing group aligned to the type row's trailing edge.

The trailing group SHALL contain, in order, the base-stat figure and the form-count badge. Each member SHALL be rendered only when its own condition holds, and the group SHALL reserve no space for a member that is absent. When both members are absent the type row SHALL occupy the same height as it does when both are present.

The trailing group SHALL be aligned to the trailing edge by a mechanism already proven on this platform. Individual members SHALL NOT each claim the free space, because two members both claiming it would place one at the leading edge of the remaining space and one at the trailing edge rather than grouping them together.

#### Scenario: National number is zero-padded to four digits

- **WHEN** a card renders a species number
- **THEN** the number is prefixed and padded to four digits

#### Scenario: Generation renders as a Roman numeral

- **WHEN** a card renders the generation
- **THEN** the generation number is shown as its Roman numeral

#### Scenario: Mega badge appears only for species with a Mega form

- **WHEN** a species has no Mega form
- **THEN** no Mega badge is rendered

#### Scenario: Mega badge carries a count only when several exist

- **WHEN** a species has more than one Mega form
- **THEN** the badge shows the star followed by the count
- **AND** when exactly one Mega form exists the badge shows the star alone

#### Scenario: Form-count badge appears only for multi-form species

- **WHEN** a species has exactly one form
- **THEN** no form-count badge is rendered

#### Scenario: Trailing group keeps its members in a fixed order

- **WHEN** both the base-stat figure and the form-count badge are rendered
- **THEN** the base-stat figure precedes the form-count badge
- **AND** both sit at the type row's trailing edge as one group

##### Example: header and badge output for concrete species

| Species   | Number shown | Generation | Mega badge | Form-count badge | Type row      |
| --------- | ------------ | ---------- | ---------- | ---------------- | ------------- |
| Venusaur  | No.0003      | I          | star       | 2                | GRS, PSN      |
| Charizard | No.0006      | I          | star + 2   | 3                | FIR, FLY      |
| Ditto     | No.0132      | I          | none       | none             | NRM           |
| Heracross | No.0214      | II         | star       | 2                | BUG, FGT      |


<!-- @trace
source: surface-bst-on-cards
updated: 2026-08-08
code:
  - src/App.css
  - ROADMAP.md
  - src/components/SpeciesCard.vue
-->

---
### Requirement: Both languages stay on the card

A card SHALL render the leading species name and the alternate species name at the same time. Switching the active language SHALL swap which one leads and SHALL NOT remove either from the card.

#### Scenario: Language switch swaps the two name rows

- **WHEN** the active language changes while the card is mounted
- **THEN** the leading name row and the alternate name row exchange contents
- **AND** both rows remain rendered


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
### Requirement: Card height is stable when optional rows are empty

The alternate name row and the form label row SHALL reserve their height when their content is empty, so cards of differing content align on a shared baseline.

#### Scenario: Base form leaves the form label empty

- **WHEN** a card renders a form whose label is empty
- **THEN** the form label row reserves its height and the card's overall height matches a card whose form label is present


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
### Requirement: Long names wrap rather than truncate

A species name SHALL wrap onto additional lines when it exceeds the card width. A name SHALL NOT be clipped, ellipsised, or pushed outside the card bounds.

#### Scenario: Longest Latin name fits

- **WHEN** a card renders the species name Crabominable
- **THEN** the full name is visible, wrapped if needed, and no horizontal overflow occurs

#### Scenario: Longest Chinese name fits

- **WHEN** a card renders a five-character Chinese species name
- **THEN** the full name is visible and no horizontal overflow occurs


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
### Requirement: Sprite upscaling declares nearest-neighbour on the image element itself

Every image element that renders sprite artwork SHALL carry the pixelated image-rendering declaration on the element itself. The declaration SHALL NOT be placed only on an ancestor, because the platform applies this property to the declaring element alone and does not inherit it.

#### Scenario: Declaration sits on the image element

- **WHEN** the styles applied to a sprite image are inspected
- **THEN** the pixelated image-rendering declaration is present on that image element

#### Scenario: Upscaled sprite stays a sharp pixel grid

- **WHEN** a 96 pixel source sprite is rendered into a 192 pixel box on device
- **THEN** the result shows sharp square pixels rather than smooth interpolation

#### Scenario: Nearest-neighbour upscaling is unavailable on the platform

- **WHEN** the upscaled sprite renders with smooth interpolation on device despite the declaration
- **THEN** the fallback of rendering artwork at its native 96 pixel size is applied
- **AND** the observed platform behaviour is recorded in the design handoff document


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
### Requirement: Sprite artwork is never recoloured

Sprite artwork SHALL render unmodified in both colour modes. No tint, filter or quantisation SHALL be applied to it.

#### Scenario: Mode switch leaves artwork untouched

- **WHEN** the active mode changes
- **THEN** the sprite's own colours are unchanged while surrounding surfaces recolour


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
### Requirement: Sprite load failure falls back to a glyph tile

When sprite artwork fails to load, the card SHALL render a placeholder tile filling the sprite's box, using the secondary surface token as its background and the form's first type glyph centred within it. The fallback SHALL NOT render a broken-image indicator, SHALL NOT leave the sprite box empty, and SHALL NOT report an error to the console.

#### Scenario: Remote artwork is unreachable

- **WHEN** the sprite request fails because the artwork host is unreachable
- **THEN** the card renders the placeholder tile with the form's first type glyph
- **AND** the console records no error

#### Scenario: Placeholder occupies the same box as artwork

- **WHEN** the placeholder tile is rendered
- **THEN** its box matches the sprite box, so the card's height does not change


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
### Requirement: Card bevel is built from per-side border colours

The card's one-pixel bevel SHALL be produced by a nested view whose top and left border colours use the panel token and whose bottom and right border colours use the secondary surface token. Inset box shadows SHALL NOT be used, because the platform does not support the inset keyword. The bevel SHALL introduce no colour outside the active mode's token set.

#### Scenario: Bevel renders without inset shadow

- **WHEN** the card's styles are inspected
- **THEN** no box shadow declaration uses the inset keyword
- **AND** the bevel's light and shadow edges come from existing tokens

#### Scenario: Bevel is visible on device

- **WHEN** a card is viewed on device
- **THEN** a one-pixel light edge is visible along its top and left and a one-pixel darker edge along its bottom and right

#### Scenario: Border rendering makes the two-edge bevel unusable

- **WHEN** the one-pixel per-side borders render inconsistently on device
- **THEN** the bevel is reduced to the top and left light edge alone
- **AND** the observed platform behaviour is recorded in the design handoff document


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
### Requirement: Card reflects mode and language without remounting

A card SHALL re-render its colours on a mode change and its names on a language change, without being unmounted and recreated.

#### Scenario: Mode change recolours a mounted card

- **WHEN** the active mode changes
- **THEN** the card's surface, border, text and glyph colours update in place


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
### Requirement: Card takes a species and a form index

The card component SHALL take a species entry and a form index as its inputs, and SHALL render the form at that index. Form switching interaction is out of scope for this capability.

#### Scenario: Card renders the requested form

- **WHEN** a card is given a species and a form index pointing at a Mega form
- **THEN** the card renders that form's sprite, label and types rather than the base form's

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
### Requirement: Cards sharing a grid row are the same height

The two cards occupying one row of the grid SHALL draw outlines of equal height, whichever of them has the taller content. A card SHALL fill the cell it is placed in rather than stopping at its own content height.

A wrapping row already stretches both of its cells to the taller one, so the cell is not what needs fixing — the card inside it is. A card that stops early leaves a gap between its own bottom outline and the bottom of its stretched cell, and beside a taller neighbour that gap reads as a rendering fault rather than as a longer name. Both the card outline and the bevel drawn inside it SHALL reach the cell's full height, or the bevel's light and shadow edges float above the outline they belong to.

This SHALL be expressed with a property the platform passes through to layout rather than with flex growth. On the web target every flex property is rewritten into a custom property, and for these elements nothing consumes it, so an authored flex declaration resolves to nothing while appearing to have handled the case.

#### Scenario: A wrapped name does not shorten its neighbour

- **WHEN** one card in a row renders a species name that wraps to two lines and the other does not
- **THEN** both cards' outlines end at the same height
- **AND** both cards' bevels end at the same height

##### Example: the measured pair at a phone width

- **GIVEN** the grid at a 375px width with English leading and the pixel face loaded
- **WHEN** Crabominable, whose name wraps to two lines, sits beside Lycanroc, whose name does not
- **THEN** both card outlines measure 209px, where the shorter card previously measured 193px

##### Example: every row of the full grid

- **GIVEN** the grid at a 375px width with English leading and the pixel face loaded
- **WHEN** all 104 rows are measured
- **THEN** no row holds two cards whose outlines end more than half a pixel apart

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
### Requirement: Base-stat figure is shown exactly when it decides the order

A card SHALL render the base-stat figure when, and only when, the active sort order is by base stats. Under any other sort order the figure SHALL NOT be rendered.

The figure SHALL be the highest base-stat total across all of the species' forms, and SHALL be the same value the sort uses to order that card. It SHALL NOT be the base-stat total of the form the card is currently drawing, because a card showing one figure while being ordered by another gives the reader a number that does not explain the position it sits in.

The card SHALL obtain the active sort order from application state rather than from a component input. Taking a species entry and a form index as inputs governs which species and which form the card draws; it does not govern ambient display state, which the card already reads directly for the active language.

#### Scenario: Figure appears under base-stat sort

- **WHEN** the active sort order is by base stats
- **THEN** every visible card renders its base-stat figure in the type row's trailing group

#### Scenario: Figure disappears under number sort

- **WHEN** the active sort order changes from base stats to national number
- **THEN** no card renders a base-stat figure
- **AND** the cards are not unmounted and recreated

#### Scenario: Figure reflects the strongest form, not the drawn form

- **WHEN** a card draws a species' base form while that species has a stronger Mega form
- **THEN** the figure shown is the Mega form's base-stat total

#### Scenario: Figure is consistent with the order it explains

- **WHEN** the grid is sorted by base stats
- **THEN** reading the figures from the first card onward yields a sequence that never increases

##### Example: trailing group contents by sort order and form count

| Species  | Forms | Sort order | Base-stat figure | Form-count badge |
| -------- | ----- | ---------- | ---------------- | ---------------- |
| Venusaur | 2     | base stats | shown            | 2                |
| Venusaur | 2     | number     | absent           | 2                |
| Ditto    | 1     | base stats | shown            | absent           |
| Ditto    | 1     | number     | absent           | absent           |

<!-- @trace
source: surface-bst-on-cards
updated: 2026-08-08
code:
  - src/App.css
  - ROADMAP.md
  - src/components/SpeciesCard.vue
-->