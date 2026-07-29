## ADDED Requirements

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

### Requirement: User-facing string table

The data layer SHALL hold every user-facing string of this slice's screen in a single table with a Chinese and an English entry set. The two entry sets SHALL have identical key sets. Scope is limited to the strings this slice's screen renders.

#### Scenario: Key sets match across languages

- **WHEN** the Chinese and English entry sets are compared
- **THEN** every key present in one is present in the other

#### Scenario: String lookup follows the active language

- **WHEN** a string is looked up while the active language is Chinese
- **THEN** the Chinese entry for that key is returned
