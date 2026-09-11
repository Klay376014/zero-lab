## ADDED Requirements

### Requirement: Conflicting move mechanics across source pages are resolved by upstream revision time

A move's mechanics are parsed from every learnset page that lists it, and those pages are edited independently, so two pages can state different figures for the same move. The aggregation step SHALL detect that disagreement and SHALL resolve it by taking the figures from the page with the most recent upstream revision timestamp, because this game retunes moves and a page not edited since a retune states the figure that preceded it.

The aggregation step SHALL NOT resolve a disagreement by parse order, and SHALL NOT resolve it by which figure appears on more pages. Parse order carries no authority over the data. A count of pages measures how many have been edited since the retune, not which figure is current.

The revision timestamp of each learnset page SHALL be fetched from the upstream wiki and cached alongside the page itself, so the resolution rule reads upstream metadata rather than a judgement made in this repository. The fetch SHALL be idempotent in the manner the existing learnset fetch already is.

Where two pages state different figures under identical revision timestamps, the aggregation step SHALL fail with a non-zero exit status naming the move and the disagreeing pages. Selecting either figure would be arbitrary, and an arbitrary silent selection is the condition this requirement exists to remove.

The step SHALL report every disagreement it resolves, naming the move, the winning page, the losing pages and the timestamps compared, so that a resolution is auditable without re-running the pipeline.

#### Scenario: Two pages disagree and the newer one wins

- **WHEN** the aggregation step reads a move whose figures differ between two learnset pages
- **THEN** the emitted record carries the figures from the page with the later revision timestamp
- **AND** the step reports the move, the winning page, the losing page and both timestamps

#### Scenario: Disagreement under identical timestamps fails the pipeline

- **WHEN** two pages state different figures for one move and their revision timestamps are equal
- **THEN** the aggregation step exits with a non-zero status naming the move and the pages
- **AND** no dataset is written

#### Scenario: Agreement is not reported as a resolution

- **WHEN** every page listing a move states the same figures
- **THEN** the step reports no disagreement for that move

##### Example: the disagreements in the Regulation Set M-C roster

| Move         | Figure | Pages stating the older value | Pages stating the newer value | Emitted |
| ------------ | ------ | ----------------------------- | ----------------------------- | ------- |
| Wish         | power points | 12 — Clefable, Vaporeon and others revised 2026-09-10T16:03Z–16:06Z | 8 — Pawmot 2026-09-10T17:59Z, Indeedee 2026-09-10T20:42Z | 8 |
| Strength Sap | power points | 12 — Polteageist, Sinistcha revised 2026-09-10T16:03Z | 8 — Arboliva 2026-09-10T18:00Z | 8 |

## MODIFIED Requirements

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
| moves in the shared move table                                    | 511         |
| moves whose power, accuracy or power points differ from the mainline figures | 415 |
| moves whose emitted figures come from the Champions tables        | 511         |

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
| species count              | 231      | the game roster changed                      |
| form entries across species| 396      | forms were added or removed                  |
| forms of kind mega         | 81       | a Mega evolution was added or removed        |
| forms of kind regional     | 17       | a regional form was added or removed         |
| shared move table entries  | 511      | the move table changed upstream              |
| ability entries            | 215      | the ability table changed upstream           |

### Requirement: The data layer exposes the dataset's meta block

The data layer SHALL expose the dataset's meta block as typed, readable data alongside the species, move and ability collections. The block SHALL carry the dataset's scale counts, the designation of the roster it was built from, and a statement of where each part of the dataset came from.

The scale counts SHALL cover, at minimum, the species total, the form entry total, the Mega form total and the move table entry total, because these are the figures the interface states about the dataset as a whole. Each of these four SHALL be one of the counts the load-time invariant assertions already verify, so that a figure rendered on screen is a figure an assertion protects.

Every scale count in the meta block SHALL be computed by the assembly step from the assembled data. No scale count SHALL be written into the block as a literal. A literal gives one quantity two independent sources that agree only while they happen to match, and the counts that were held as literals are the two the roster rotation moved.

The roster designation and the provenance statement SHALL be exposed as strings and SHALL NOT be covered by a count assertion, because neither is a quantity. An empty value for either SHALL be a legitimate state that consumers handle, not a load-time failure.

The roster designation SHALL name the roster the dataset was built from and the date that roster ceases to be current.

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
| species total      | 231   | species count        |
| form entry total   | 396   | form entries         |
| Mega form total    | 81    | mega forms           |
| move table entries | 511   | move table entries   |

#### Scenario: Every scale count is computed rather than written

- **WHEN** the assembly step emits the meta block against a dataset whose Mega form total has changed
- **THEN** the emitted Mega form total equals the number of Mega forms in that dataset
- **AND** the emitted regional form total equals the number of regional forms in that dataset

#### Scenario: An empty roster designation is not a load failure

- **WHEN** the dataset carries an empty roster designation
- **THEN** the data layer loads without raising an error
- **AND** the empty value is exposed to consumers unchanged

### Requirement: Move records carry a bilingual description and flag identifiers

Each move record SHALL carry a Chinese description, an English description, and the identifiers of the move flags that apply to it.

Every move in the table SHALL also carry a non-empty Chinese name in Traditional characters. The 52poke move list's `/zh-hant/` variant supplies one for every numbered row it holds, which the fetch step asserts, so the two moves that carried no Chinese name while PokeAPI was the naming source now carry one. This is why neither the `move-index` nor the `move-detail` capability requires a fallback to the English name.

The variant matters and the naming source SHALL NOT revert to the PokeAPI name column: that column was Simplified for 33 of the moves in the table as it then stood at 496 entries, and the shipped dataset showed only 8 because the other 25 had been corrected by editing the dataset file directly — the hand edit this capability forbids, which a pipeline re-run would have silently undone. The figures in this paragraph record that episode and are not re-measured against a later table.

Both descriptions SHALL be non-empty for every move in the table. The Chinese description SHALL come from the 52poke move list and the English description from the PokeAPI move flavour text, taking the entry from the highest version group present and normalising the in-game line breaks it contains to single spaces.

The flag identifiers SHALL be a readonly array of numbers in ascending order. A move to which no flag applies SHALL omit the field rather than carry an empty array, because the dataset is serialised compactly and 74 of the 511 moves carry no flags.

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
| moves with a Chinese name                           | 511          |
| moves with a Chinese description                    | 511          |
| moves with an English description                   | 511          |
| distinct flag identifiers in use                    | 21           |
| moves carrying at least one flag                    | 437          |
| moves carrying no flag field                        | 74           |
| greatest number of flags on a single move           | 6            |

### Requirement: A pipeline overlay supplies form data upstream does not carry

The pipeline SHALL accept an overlay of hand-authored input covering exactly the fields no upstream source carries for a form. Every overlay entry SHALL record the source of its values and the condition under which it is to be deleted.

The overlay is an input to the pipeline, not an edit of its output. The requirement that the application dataset SHALL NOT be hand-authored or hand-edited continues to apply in full: the dataset SHALL remain produced entirely by a pipeline run, and re-running the pipeline against unchanged inputs SHALL continue to reproduce it byte for byte.

The overlay SHALL NOT supply a field an upstream source carries. Base stats and sprite paths SHALL continue to come from the PokeAPI exports for every form, including a form the overlay supplies a field for.

Two kinds of field qualify, and the overlay SHALL supply a kind only while no upstream source carries it. A form's roster entry — its English form label, its types and its roster status — qualifies while the roster page has no released row for that form. A form's abilities qualify while the PokeAPI exports carry none for it, which is the state of a Mega form the game has released and those exports have not yet caught up with.

When an upstream source begins carrying a field the overlay supplies, the corresponding overlay entry SHALL be deleted and the pipeline re-run, and the resulting dataset SHALL be unchanged. The parsing step SHALL fail rather than continue where the roster page has begun carrying a row the overlay also supplies, so the deletion is enforced rather than remembered.

#### Scenario: The overlay supplies only the fields upstream lacks

- **WHEN** the pipeline assembles a form whose abilities the overlay supplies
- **THEN** its abilities come from the overlay
- **AND** its base stats, sprite path, form label and types come from the upstream sources

#### Scenario: A pipeline run with an overlay is still reproducible

- **WHEN** the pipeline assembly step is re-run against unchanged upstream caches and an unchanged overlay
- **THEN** the application dataset is byte-identical to the committed copy

#### Scenario: An overlay entry upstream has caught up with fails the pipeline

- **WHEN** the roster page carries a released row for a form whose roster entry the overlay also supplies
- **THEN** the parsing step fails naming that form
- **AND** it states that the overlay entry is to be deleted
