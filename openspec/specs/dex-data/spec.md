# dex-data Specification

## Purpose

The bundled Champions dataset and the reference tables that read it. Covers how the dataset arrives as a pipeline artifact rather than hand-authored data, the load-time integrity assertions that turn upstream drift into a thrown error, the named types the rest of the app reads it through, the derived accessors for base-stat totals and cross-form type sets, bilingual name resolution, the eighteen-type reference tables, and the user-facing string table.

## Requirements

### Requirement: Dataset provenance

The application dataset at src/data/dex.json SHALL be produced by the design pipeline's assembly step from the same in-memory dataset that produces design/champions-dex.json. The file SHALL NOT be hand-authored or hand-edited. Modules under src/ SHALL NOT import any file located under design/.

#### Scenario: Pipeline emits the application dataset

- **WHEN** the pipeline assembly step runs
- **THEN** it writes src/data/dex.json with compact JSON separators
- **AND** it writes design/champions-dex.json in its existing indented form
- **AND** both files carry identical dataset content

#### Scenario: Dataset drift is detectable

- **WHEN** the pipeline assembly step is re-run against unchanged upstream caches
- **THEN** src/data/dex.json is byte-identical to the committed copy

#### Scenario: Application builds without running the pipeline

- **WHEN** the application is built from a fresh checkout with no pipeline run
- **THEN** src/data/dex.json is present in version control and the build succeeds


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
### Requirement: Dataset integrity is asserted at load time

The data layer SHALL assert six dataset invariants when its module initialises. On violation it SHALL throw an error naming the failing invariant, its expected value and its actual value. The data layer SHALL NOT fall back to partial data and SHALL NOT downgrade a violation to a warning.

#### Scenario: Dataset satisfies every invariant

- **WHEN** the data layer module initialises and all six invariants hold
- **THEN** the module exports the dataset and no error is raised

#### Scenario: An invariant is violated

- **WHEN** the data layer module initialises and the species count differs from its expected value
- **THEN** the module throws an error naming the invariant, the expected count and the actual count

##### Example: asserted invariants

| Invariant                  | Expected | A failure means                              |
| -------------------------- | -------- | -------------------------------------------- |
| species count              | 208      | the game roster changed                      |
| form entries across species| 360      | forms were added or removed                  |
| forms of kind mega         | 75       | a Mega evolution was added or removed        |
| forms of kind regional     | 16       | a regional form was added or removed         |
| shared move table entries  | 496      | the move table changed upstream              |
| ability entries            | 200      | the ability table changed upstream           |


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
### Requirement: Typed dataset access

The data layer SHALL expose the dataset through named TypeScript types and SHALL keep the JSON module boundary untyped so that the compiler does not infer a literal type for the payload. The TypeScript configuration SHALL NOT enable resolveJsonModule.

#### Scenario: JSON import carries no inferred literal type

- **WHEN** a module imports src/data/dex.json
- **THEN** the import resolves through a wildcard JSON module declaration whose exported type is unknown
- **AND** the data layer narrows that value to its named types in exactly one place

#### Scenario: Consumers read the dataset through named types

- **WHEN** a component reads a species entry
- **THEN** it receives a value typed with the national number, English and Chinese species names, Chinese category, generation number, and form array
- **AND** it receives each form typed with English and Chinese form labels, form kind, type array, sprite file name, six base stats, ability references, and learnset section index

#### Scenario: Form kind is a closed set

- **WHEN** a form's kind is read
- **THEN** its type admits exactly the values base, other, regional and mega


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
### Requirement: Derived value accessors

The data layer SHALL expose derived accessors for total base stats of a form, the highest total base stats across a species' forms, the set of every type across a species' forms, and whether a species has any Mega form.

#### Scenario: Total base stats sums the six stat values

- **WHEN** the total for a form is requested
- **THEN** the result is the sum of its six base stat values

#### Scenario: Species-level total takes the strongest form

- **WHEN** the species-level total is requested
- **THEN** the result is the highest total across all of that species' forms

##### Example: derived values for concrete species

| Species      | Forms | Total per form   | Species total | Types across forms       | Has Mega |
| ------------ | ----- | ---------------- | ------------- | ------------------------ | -------- |
| Venusaur     | 2     | 525, 625         | 625           | Grass, Poison            | true     |
| Charizard    | 3     | 534, 634, 634    | 634           | Fire, Flying, Dragon     | true     |
| Ditto        | 1     | 288              | 288           | Normal                   | false    |
| Crabominable | 2     | 478, 578         | 578           | Fighting, Ice            | true     |


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
### Requirement: Bilingual name resolution

The data layer SHALL resolve, for the active language, both a leading name and an alternate name for every species and every form. Switching the active language SHALL change which language leads and SHALL NOT remove the other language from the resolved pair. A form whose label is empty SHALL resolve its leading label to the localised base-form string.

#### Scenario: Switching language swaps lead and alternate

- **WHEN** the active language changes
- **THEN** the previously leading name becomes the alternate and the previous alternate becomes the leading name

#### Scenario: Base form has no upstream label

- **WHEN** a form's English and Chinese labels are both empty
- **THEN** the resolved leading label is the localised base-form string and the resolved alternate label is empty

##### Example: resolved name pairs

| Entry                  | Active language | Leading name  | Alternate name |
| ---------------------- | --------------- | ------------- | -------------- |
| species Venusaur       | zh              | 妙蛙花        | Venusaur       |
| species Venusaur       | en              | Venusaur      | 妙蛙花         |
| form Mega Venusaur     | zh              | 超級妙蛙花    | Mega Venusaur  |
| form Mega Venusaur     | en              | Mega Venusaur | 超級妙蛙花     |
| base form of Venusaur  | zh              | 基本形態      | (empty)        |


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
### Requirement: Type reference tables

The data layer SHALL expose five type reference tables keyed by the eighteen English type names: canonical order, series colour, Chinese name, three-letter abbreviation, and 8x8 glyph bitmap. Every table SHALL cover all eighteen types. A lookup for an unrecognised type name SHALL resolve to the Normal entry for the glyph bitmap and to the neutral ink token for the colour.

#### Scenario: Every table covers every type

- **WHEN** any of the five tables is enumerated
- **THEN** it contains exactly eighteen entries whose keys match the canonical type order

#### Scenario: Glyph bitmap shape is uniform

- **WHEN** a glyph bitmap is read
- **THEN** it is a list of exactly eight strings, each exactly eight characters long, using only the filled and empty markers

#### Scenario: Abbreviation width is fixed

- **WHEN** any type abbreviation is read
- **THEN** it is exactly three characters long

#### Scenario: Unrecognised type name

- **WHEN** a glyph bitmap is requested for a type name absent from the table
- **THEN** the Normal bitmap is returned and no error is raised


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
### Requirement: User-facing string table

The data layer SHALL hold every user-facing string of this slice's screen in a single table with a Chinese and an English entry set. The two entry sets SHALL have identical key sets. Scope is limited to the strings this slice's screen renders.

#### Scenario: Key sets match across languages

- **WHEN** the Chinese and English entry sets are compared
- **THEN** every key present in one is present in the other

#### Scenario: String lookup follows the active language

- **WHEN** a string is looked up while the active language is Chinese
- **THEN** the Chinese entry for that key is returned

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
### Requirement: The data layer exposes the dataset's meta block

The data layer SHALL expose the dataset's meta block as typed, readable data alongside the species, move and ability collections. The block SHALL carry the dataset's scale counts, the designation of the roster it was built from, and a statement of where each part of the dataset came from.

The scale counts SHALL cover, at minimum, the species total, the form entry total, the Mega form total and the move table entry total, because these are the figures the interface states about the dataset as a whole. Each of these four SHALL be one of the counts the load-time invariant assertions already verify, so that a figure rendered on screen is a figure an assertion protects.

The roster designation and the provenance statement SHALL be exposed as strings and SHALL NOT be covered by a count assertion, because neither is a quantity. An empty value for either SHALL be a legitimate state that consumers handle, not a load-time failure.

#### Scenario: The meta block is readable

- **WHEN** the exposed dataset is read
- **THEN** its meta block is available as typed data
- **AND** it carries the four scale counts, the roster designation and the provenance statement

#### Scenario: The exposed scale counts are the asserted ones

- **WHEN** the four scale counts in the meta block are compared against the load-time invariants
- **THEN** each count corresponds to an invariant the data layer asserts at load

##### Example: the four asserted scale counts

| Meta count         | Value | Asserted invariant   |
| ------------------ | ----- | -------------------- |
| species total      | 208   | species count        |
| form entry total   | 360   | form entries         |
| Mega form total    | 75    | mega forms           |
| move table entries | 496   | move table entries   |

#### Scenario: An empty roster designation is not a load failure

- **WHEN** the dataset carries an empty roster designation
- **THEN** the data layer loads without raising an error
- **AND** the empty value is exposed to consumers unchanged

<!-- @trace
source: surface-dataset-facts
updated: 2026-07-30
code:
  - design/HANDOFF.md
  - src/components/DexGrid.vue
  - src/components/DexFooter.vue
  - src/App.css
  - ROADMAP.md
  - src/data/dex.ts
  - src/App.vue
  - src/data/i18n.ts
-->