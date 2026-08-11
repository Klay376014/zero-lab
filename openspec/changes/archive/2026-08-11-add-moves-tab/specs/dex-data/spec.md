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
| moves in the shared move table                                    | 496         |
| moves whose power, accuracy or power points differ from the mainline figures | 401 |
| moves whose emitted figures come from the Champions tables        | 496         |

## ADDED Requirements

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
