## ADDED Requirements

### Requirement: Roster parsing admits only released entries

The pipeline's roster parsing step SHALL remove HTML comment regions from the roster wikitext before matching roster row templates against it. A roster row that appears only inside an HTML comment SHALL NOT reach any downstream step.

The upstream roster page carries entries for a future release as commented-out rows, with a placeholder in place of the version in which they were added. The parsing step matches row templates by pattern and does not otherwise distinguish a commented row from a released one, so without this requirement an unreleased entry enters the dataset as though it had shipped.

Exclusion SHALL be decided by the row being inside a comment region, and SHALL NOT be decided by the value of the version field, because a commented row can carry a real version and a released row can carry a placeholder.

#### Scenario: A commented roster row is not parsed

- **WHEN** the roster wikitext carries a roster row template entirely inside an HTML comment
- **THEN** the parsing step emits no entry for that row

#### Scenario: An uncommented roster row is parsed

- **WHEN** the roster wikitext carries a roster row template outside any HTML comment
- **THEN** the parsing step emits an entry for that row

##### Example: rows of both kinds for one species

| Roster wikitext row                                                    | Parsed |
| ---------------------------------------------------------------------- | ------ |
| a released Mega form row for Absol, outside any comment                 | yes    |
| a Mega Garchomp Z row wrapped in an HTML comment, version placeholder   | no     |
| a Mega Heatran row wrapped in an HTML comment, version placeholder      | no     |
| a Heatran species row wrapped in an HTML comment, version placeholder   | no     |

### Requirement: A pipeline overlay supplies form data upstream does not carry

The pipeline SHALL accept an overlay of hand-authored input covering exactly the fields no upstream source carries for a form: its roster entry and its abilities. Every overlay entry SHALL record the source of its values and the condition under which it is to be deleted.

The overlay is an input to the pipeline, not an edit of its output. The requirement that the application dataset SHALL NOT be hand-authored or hand-edited continues to apply in full: the dataset SHALL remain produced entirely by a pipeline run, and re-running the pipeline against unchanged inputs SHALL continue to reproduce it byte for byte.

The overlay SHALL NOT supply a field an upstream source carries. A form's roster entry carries its English form label, its types and its roster status, and the overlay supplies all three for a form upstream has no released row for. Base stats and sprite paths SHALL continue to come from the PokeAPI exports for every form, including a form the overlay introduces.

When an upstream source begins carrying a field the overlay supplies, the corresponding overlay entry SHALL be deleted and the pipeline re-run, and the resulting dataset SHALL be unchanged.

#### Scenario: The overlay supplies only the fields upstream lacks

- **WHEN** the pipeline assembles a form introduced by the overlay
- **THEN** its roster entry and abilities come from the overlay
- **AND** its base stats and sprite path come from the PokeAPI exports

#### Scenario: A pipeline run with an overlay is still reproducible

- **WHEN** the pipeline assembly step is re-run against unchanged upstream caches and an unchanged overlay
- **THEN** the application dataset is byte-identical to the committed copy

## MODIFIED Requirements

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
| form entries across species| 363      | forms were added or removed                  |
| forms of kind mega         | 78       | a Mega evolution was added or removed        |
| forms of kind regional     | 16       | a regional form was added or removed         |
| shared move table entries  | 496      | the move table changed upstream              |
| ability entries            | 201      | the ability table changed upstream           |

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
| form entry total   | 363   | form entries         |
| Mega form total    | 78    | mega forms           |
| move table entries | 496   | move table entries   |

#### Scenario: An empty roster designation is not a load failure

- **WHEN** the dataset carries an empty roster designation
- **THEN** the data layer loads without raising an error
- **AND** the empty value is exposed to consumers unchanged
