## ADDED Requirements

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
