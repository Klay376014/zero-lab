# dex-data Specification

## Purpose

The bundled Champions dataset and the reference tables that read it. Covers how the dataset arrives as a pipeline artifact rather than hand-authored data, the load-time integrity assertions that turn upstream drift into a thrown error, the named types the rest of the app reads it through, the derived accessors for base-stat totals and cross-form type sets, bilingual name resolution, the eighteen-type reference tables, and the user-facing string table.

Provenance is split by what each of the three upstream sources is authoritative for, and the split is enforced rather than described. The Champions tables supply the roster and every move's mechanics, because that game retunes them — 401 of the 496 moves disagree with the mainline figures the text sources publish, so the aggregation step asserts that the power, accuracy and power points it emits are the ones it parsed. The PokeAPI exports supply ability and form naming and the English move descriptions. The 52poke move list supplies Traditional Chinese move names and descriptions, joined by move identifier rather than by name, and its Traditional variant specifically: the PokeAPI name column is Simplified for 33 of these moves, and the shipped dataset showed only 8 because the rest had been corrected by hand-editing the dataset file — the edit this capability forbids, which a pipeline re-run would have silently undone.

A move record therefore carries a description in both languages and the identifiers of the flags that apply to it. A missing description fails the pipeline rather than reaching the interface as a blank area. A separate table names all 21 flag identifiers, including the four no screen draws, so that the dataset does not encode which flags are displayed — that is decided by which identifiers the string table gives a short label to, and changing it never means re-running the pipeline. The two hops, id to upstream identifier here and identifier to label in the string table, are what make an upstream renumbering harmless and an upstream rename detectable; a load-time assertion throws when a move references an identifier the table cannot name.

## Requirements

### Requirement: Dataset provenance

The application dataset at src/data/dex.json SHALL be produced by the design pipeline's assembly step from the same in-memory dataset that produces design/champions-dex.json. The file SHALL NOT be hand-authored or hand-edited. Modules under src/ SHALL NOT import any file located under design/.

The pipeline draws on three upstream sources, and each SHALL supply only what it is authoritative for. The roster table and every move's mechanics SHALL come from the Champions tables, because that game retunes values and its own numbers are authoritative for it. Traditional Chinese naming for abilities and forms SHALL come from the PokeAPI CSV exports. Traditional Chinese move names and move descriptions SHALL come from the 52poke move list, whose rows join to the PokeAPI move identifier by number rather than by name.

An upstream source that is not authoritative for a field SHALL NOT supply that field. In particular, no source other than the Champions tables SHALL supply a move's power, accuracy, power points, type, or damage class.

Fetching the 52poke move list requires a browser user-agent header; a request without one is refused. The fetch step SHALL be idempotent in the manner the existing fetch step already is, skipping a source that is already cached.

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

#### Scenario: A non-authoritative source does not supply mechanics

- **WHEN** the pipeline aggregates the move table
- **THEN** each move's power, accuracy and power points are the values parsed from the Champions tables
- **AND** none has been replaced by the corresponding value from another source

##### Example: the two sources disagree on most moves, and Champions wins

| Property                                                        | Value       |
| ---------------------------------------------------------------- | ----------- |
| moves in the shared move table                                    | 496         |
| moves whose power, accuracy or power points differ from the mainline figures | 401 |
| moves whose emitted figures come from the Champions tables        | 496         |


<!-- @trace
source: add-moves-tab
updated: 2026-08-11
code:
  - design/pipeline/aggregate.py
  - design/champions-dex.html
  - scripts/check-row-heights.mjs
  - design/pipeline/fetch_sources.sh
  - src/state/rowMetrics.ts
  - src/data/dex.json
  - src/components/MoveDetail.vue
  - src/data/i18n.ts
  - src/state/tabs.ts
  - src/components/MoveLearners.vue
  - src/components/TabDeck.vue
  - src/App.vue
  - src/state/layerStack.ts
  - design/pipeline/fetch_moves_zh.py
  - ROADMAP.md
  - src/App.css
  - design/champions-dex.json
  - src/data/dex.ts
  - src/components/MoveIndex.vue
  - src/state/selection.ts
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/moveLearners.ts
tests:
  - tests/i18n.test.ts
  - tests/layer-stack.test.ts
  - tests/dex-data.test.ts
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

The data layer SHALL expose derived accessors for total base stats of a form, the highest total base stats across a species' forms, the set of every type across a species' forms, whether a species has any Mega form, the species that learn a given move, and the form of a species to open for a given move.

The last two SHALL be governed by the `move-learners` capability, which owns their ordering, their treatment of forms whose learnset sections differ, and their behaviour for indices outside the shared move table.

Accessors whose answer is a collection derived from the whole dataset SHALL be memoised by the key they are asked about, and SHALL be typed readonly so that the shared answer cannot be mutated by a caller. This is memoisation rather than caching: the dataset is loaded once and is readonly throughout, so no answer can change and nothing evicts or invalidates.

#### Scenario: Total base stats sums the six stat values

- **WHEN** the total for a form is requested
- **THEN** the result is the sum of its six base stat values

#### Scenario: Species-level total takes the strongest form

- **WHEN** the species-level total is requested
- **THEN** the result is the highest total across all of that species' forms

#### Scenario: A collection accessor returns a shared readonly answer

- **WHEN** a collection-returning accessor is asked about the same key twice
- **THEN** both calls return the same collection
- **AND** the collection's type forbids mutation

##### Example: derived values for concrete species

| Species      | Forms | Total per form   | Species total | Types across forms       | Has Mega |
| ------------ | ----- | ---------------- | ------------- | ------------------------ | -------- |
| Venusaur     | 2     | 525, 625         | 625           | Grass, Poison            | true     |
| Charizard    | 3     | 534, 634, 634    | 634           | Fire, Flying, Dragon     | true     |
| Ditto        | 1     | 288              | 288           | Normal                   | false    |
| Crabominable | 2     | 478, 578         | 578           | Fighting, Ice            | true     |

##### Example: the two move-directed accessors

| Input                        | Accessor            | Result                                      |
| ---------------------------- | ------------------- | ------------------------------------------- |
| a move learned by 207 species | learners of a move  | 207 species in dataset order                |
| Ninetales with an Ice move    | form to open        | the regional form, whose section holds it   |
| Ninetales with a Fire move    | form to open        | the base form, whose section holds it       |


<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
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

---
### Requirement: The string table carries the learner list's strings in both languages

The user-facing string table SHALL carry the strings the learner list states — its heading, its learner count label, and its close control's label — in Chinese and in English alike.

A key present in one language and absent from the other SHALL be treated as a defect rather than a fallback, because the absent side renders the key name on screen instead of a word. This capability's existing rule that the two language tables share one key set governs both new keys.

#### Scenario: Both language tables carry every new key

- **WHEN** the string table is inspected
- **THEN** every key the learner list reads is present in the Chinese table and in the English table

#### Scenario: The learner list states words, not key names

- **WHEN** the learner list is open in either language
- **THEN** every label it states is a word in that language

<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
-->

---
### Requirement: Move records carry a bilingual description and flag identifiers

Each move record SHALL carry a Chinese description, an English description, and the identifiers of the move flags that apply to it.

Every move in the table SHALL also carry a non-empty Chinese name in Traditional characters. The 52poke move list's `/zh-hant/` variant supplies one for every numbered row it holds, which the fetch step asserts, so the two moves that carried no Chinese name while PokeAPI was the naming source now carry one. This is why neither the `move-index` nor the `move-detail` capability requires a fallback to the English name.

The variant matters and the naming source SHALL NOT revert to the PokeAPI name column: that column is Simplified for 33 of these 496 moves, and the shipped dataset showed only 8 because the other 25 had been corrected by editing the dataset file directly — the hand edit this capability forbids, which a pipeline re-run would have silently undone.

Both descriptions SHALL be non-empty for every move in the table. The Chinese description SHALL come from the 52poke move list and the English description from the PokeAPI move flavour text, taking the entry from the highest version group present and normalising the in-game line breaks it contains to single spaces.

The flag identifiers SHALL be a readonly array of numbers in ascending order. A move to which no flag applies SHALL omit the field rather than carry an empty array, because the dataset is serialised compactly and 71 of the 496 moves carry no flags.

The record SHALL NOT carry the flags' labels. Flag labels are user-facing strings and belong to the string table, which this capability already requires; placing them in the dataset would make them hand-authored content in a file this capability forbids hand-authoring.

#### Scenario: Both descriptions are present for every move

- **WHEN** the move table is read
- **THEN** every move carries a non-empty Chinese description
- **AND** every move carries a non-empty English description

#### Scenario: Every move carries a Chinese name

- **WHEN** the move table is read
- **THEN** every move carries a non-empty Chinese name

#### Scenario: A move with no flags omits the field

- **WHEN** a move to which no flag applies is read
- **THEN** its record has no flag field
- **AND** no empty array appears in its place

#### Scenario: Flag labels are absent from the dataset

- **WHEN** the dataset is inspected
- **THEN** it carries flag identifiers
- **AND** it carries no flag label text in either language

##### Example: the shape of the added fields

| Property                                          | Value        |
| --------------------------------------------------- | ------------ |
| moves with a Chinese name                           | 496          |
| move names the change rewrites in the shipped dataset | 10         |
| of those, Simplified names corrected                | 8            |
| of those, names filled in that were empty           | 2            |
| Simplified names a re-run would have reintroduced from PokeAPI | 33 |
| moves with a Chinese description                    | 496          |
| moves with an English description                   | 496          |
| distinct flag identifiers in use                    | 21           |
| moves carrying at least one flag                    | 425          |
| moves carrying no flag field                        | 71           |
| greatest number of flags on a single move           | 6            |
| dataset size before this change                     | 195 KB       |
| dataset size after this change                      | 297 KB       |


<!-- @trace
source: add-moves-tab
updated: 2026-08-11
code:
  - design/pipeline/aggregate.py
  - design/champions-dex.html
  - scripts/check-row-heights.mjs
  - design/pipeline/fetch_sources.sh
  - src/state/rowMetrics.ts
  - src/data/dex.json
  - src/components/MoveDetail.vue
  - src/data/i18n.ts
  - src/state/tabs.ts
  - src/components/MoveLearners.vue
  - src/components/TabDeck.vue
  - src/App.vue
  - src/state/layerStack.ts
  - design/pipeline/fetch_moves_zh.py
  - ROADMAP.md
  - src/App.css
  - design/champions-dex.json
  - src/data/dex.ts
  - src/components/MoveIndex.vue
  - src/state/selection.ts
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/moveLearners.ts
tests:
  - tests/i18n.test.ts
  - tests/layer-stack.test.ts
  - tests/dex-data.test.ts
-->

---
### Requirement: A move missing a description fails the pipeline

The pipeline SHALL exit non-zero and name the affected moves when any move in the Champions move table resolves to no Chinese description or no English description. It SHALL NOT emit a dataset carrying an empty description.

This follows the pattern every other pipeline stage already uses: assert the invariant, fail loudly, and leave the previous artifact in place. A dataset with an empty description would surface as a blank area on screen that no check reports, which is the failure shape this project has repeatedly paid for.

#### Scenario: An unresolved description stops the build

- **WHEN** the aggregation step resolves descriptions and one or more moves resolve to none
- **THEN** the step exits non-zero
- **AND** it names the moves that resolved to none

#### Scenario: A complete resolution proceeds

- **WHEN** every move in the Champions move table resolves to both descriptions
- **THEN** the step writes the move table and exits zero


<!-- @trace
source: add-moves-tab
updated: 2026-08-11
code:
  - design/pipeline/aggregate.py
  - design/champions-dex.html
  - scripts/check-row-heights.mjs
  - design/pipeline/fetch_sources.sh
  - src/state/rowMetrics.ts
  - src/data/dex.json
  - src/components/MoveDetail.vue
  - src/data/i18n.ts
  - src/state/tabs.ts
  - src/components/MoveLearners.vue
  - src/components/TabDeck.vue
  - src/App.vue
  - src/state/layerStack.ts
  - design/pipeline/fetch_moves_zh.py
  - ROADMAP.md
  - src/App.css
  - design/champions-dex.json
  - src/data/dex.ts
  - src/components/MoveIndex.vue
  - src/state/selection.ts
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/moveLearners.ts
tests:
  - tests/i18n.test.ts
  - tests/layer-stack.test.ts
  - tests/dex-data.test.ts
-->

---
### Requirement: The string table carries the tab, move index and move detail strings in both languages

The string table SHALL carry, in Chinese and English, the two tab labels, the column labels of the move index, the field labels of move detail, and the statement of a move's learner count.

No such string SHALL appear as a literal in component source, consistent with this capability's existing treatment of user-facing strings.

#### Scenario: Tab labels are resolved from the string table

- **WHEN** the tab controls are rendered in either language
- **THEN** both labels are read from the string table

#### Scenario: Move detail's field labels are resolved from the string table

- **WHEN** move detail is rendered in either language
- **THEN** its field labels and its learner-count statement are read from the string table

<!-- @trace
source: add-moves-tab
updated: 2026-08-11
code:
  - design/pipeline/aggregate.py
  - design/champions-dex.html
  - scripts/check-row-heights.mjs
  - design/pipeline/fetch_sources.sh
  - src/state/rowMetrics.ts
  - src/data/dex.json
  - src/components/MoveDetail.vue
  - src/data/i18n.ts
  - src/state/tabs.ts
  - src/components/MoveLearners.vue
  - src/components/TabDeck.vue
  - src/App.vue
  - src/state/layerStack.ts
  - design/pipeline/fetch_moves_zh.py
  - ROADMAP.md
  - src/App.css
  - design/champions-dex.json
  - src/data/dex.ts
  - src/components/MoveIndex.vue
  - src/state/selection.ts
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/moveLearners.ts
tests:
  - tests/i18n.test.ts
  - tests/layer-stack.test.ts
  - tests/dex-data.test.ts
-->

---
### Requirement: The dataset names every move flag identifier

The dataset SHALL carry a table that names every move flag identifier, keyed by the numeric identifier the move records reference and valued by the upstream identifier string. The table SHALL name all 21 identifiers in use, including the four no capability displays, so that the dataset does not encode which flags the interface shows.

The table SHALL be a pipeline product derived from the upstream flag list, which the fetch step SHALL retrieve. It SHALL NOT be derived from the flag-to-move mapping the pipeline already fetches: that file carries numeric identifiers only, and naming them from it would require hand-authoring the names in a file this capability forbids hand-authoring.

The table SHALL NOT carry the flags' labels, for the reason this capability already gives for move records: labels are user-facing strings and belong to the string table.

Every numeric identifier appearing in any move's flag field SHALL appear in the table. The load-time integrity assertions SHALL throw when one does not, so that a flag the upstream source adds becomes an error rather than an identifier the interface silently cannot name.

#### Scenario: The table names all identifiers in use

- **WHEN** the dataset is read
- **THEN** the flag identifier table names 21 identifiers
- **AND** every identifier appearing in a move's flag field appears in the table

#### Scenario: An identifier absent from the table fails the load

- **WHEN** a move's flag field carries a numeric identifier the table does not name
- **THEN** the load-time integrity assertions throw

#### Scenario: The table carries no label text

- **WHEN** the flag identifier table is inspected
- **THEN** it carries upstream identifier strings
- **AND** it carries no flag label text in either language

##### Example: the shape of the flag identifier table

Four rows of the twenty-one, chosen to show both a displayed and an undisplayed identifier. The label column is not part of the dataset; it is shown to make the split explicit.

| Numeric identifier | Upstream identifier in the table | Label in the dataset | Displayed by `move-detail` |
| ------------------ | -------------------------------- | -------------------- | -------------------------- |
| 4                  | `protect`                        | none                 | yes                        |
| 7                  | `mirror`                         | none                 | no                         |
| 12                 | `distance`                       | none                 | no                         |
| 21                 | `dance`                          | none                 | yes                        |

##### Example: table coverage

| Property                                                     | Value |
| ------------------------------------------------------------ | ----- |
| identifiers named in the table                               | 21    |
| identifiers referenced by at least one move's flag field      | 21    |
| identifiers named in the table but carrying no label anywhere | 21    |
| distinct flag references across the move table               | 1145  |


<!-- @trace
source: surface-move-flags
updated: 2026-08-11
code:
  - design/pipeline/build_data3.py
  - src/App.css
  - src/data/dex.json
  - src/data/i18n.ts
  - src/data/dex.ts
  - design/champions-dex.html
  - src/components/MoveDetail.vue
  - design/champions-dex.json
  - ROADMAP.md
  - design/pipeline/aggregate.py
  - design/pipeline/fetch_sources.sh
tests:
  - tests/dex-data.test.ts
  - tests/i18n.test.ts
-->

---
### Requirement: The string table carries a short label for each displayed move flag

The string table SHALL carry a short label for each of the 17 move flag identifiers the `move-detail` capability displays, in both languages, keyed by the upstream identifier string rather than by the numeric identifier.

Keying by the upstream identifier SHALL be preserved: a numeric identifier renumbered upstream then resolves to the same label, while an identifier renamed upstream resolves to no label and fails the string table's coverage assertion. Keying by the numeric identifier would mislabel silently, because no style, type or dataset check reads these labels.

The string table SHALL carry no short label for `mirror`, `snatch`, `non-sky-battle` or `distance`, in either language. The absence of a label SHALL be the only expression of a flag's exclusion; no separate list of excluded flags SHALL be maintained.

Resolving a short label for an identifier the string table does not carry SHALL yield an empty result rather than throwing, so that the interface omits the flag as the `move-detail` capability requires.

#### Scenario: Seventeen identifiers carry a label in both languages

- **WHEN** the string table is read
- **THEN** 17 upstream identifiers carry a non-empty short label in Chinese
- **AND** the same 17 carry a non-empty short label in English

#### Scenario: The four excluded identifiers carry no label

- **WHEN** the string table is read
- **THEN** `mirror`, `snatch`, `non-sky-battle` and `distance` carry no short label in either language

#### Scenario: An unlabelled identifier resolves to an empty result

- **WHEN** a short label is resolved for an identifier the string table does not carry
- **THEN** the result is empty
- **AND** nothing is thrown

##### Example: the two labels that are not literal renderings of their identifier

Fifteen of the seventeen labels read as their identifier does in both languages. Two do not, and their wording is deliberate.

| Upstream identifier | Chinese label | English label | Why not the identifier |
| ------------------- | ------------- | ------------- | ---------------------- |
| `authentic`         | 穿透          | Pierce        | "Authentic" carries no meaning as an English interface label |
| `reflectable`       | 反彈          | Rebound       | "Reflectable" is an adjective where every other label is a noun, and `Reflect` names a move in these 496 that this flag has nothing to do with |

<!-- @trace
source: surface-move-flags
updated: 2026-08-11
code:
  - design/pipeline/build_data3.py
  - src/App.css
  - src/data/dex.json
  - src/data/i18n.ts
  - src/data/dex.ts
  - design/champions-dex.html
  - src/components/MoveDetail.vue
  - design/champions-dex.json
  - ROADMAP.md
  - design/pipeline/aggregate.py
  - design/pipeline/fetch_sources.sh
tests:
  - tests/dex-data.test.ts
  - tests/i18n.test.ts
-->