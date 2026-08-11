## ADDED Requirements

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
