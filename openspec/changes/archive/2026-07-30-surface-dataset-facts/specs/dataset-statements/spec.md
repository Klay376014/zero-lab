## ADDED Requirements

### Requirement: Dataset figures on screen are read from the dataset, never written as literals

Every figure the interface states about the dataset as a whole SHALL be read from the dataset's own meta block. No such figure SHALL appear as a literal value in component source, because the data layer already asserts these counts at load time and a second copy in the tree is a fact with no assertion protecting it.

This SHALL hold for the species total the result count is stated against, and for each of the four scale counts. A component SHALL NOT recompute a figure the meta block already carries — recounting derives the number a second way, and a derivation that drifts from the pipeline's definition renders a figure that no invariant covers.

#### Scenario: The species total is not a literal

- **WHEN** the masthead's source is inspected
- **THEN** the species total is read from the dataset's meta block
- **AND** the value 208 does not appear as a literal in the masthead's source

#### Scenario: Scale counts are not recomputed

- **WHEN** the source producing the four scale counts is inspected
- **THEN** each count is read from the meta block
- **AND** none is derived by iterating the species or form collections

---

### Requirement: The masthead states the dataset's scale as four counts

The masthead SHALL state four counts describing the dataset's scale: species, form entries, Mega forms, and move table entries, in that order. Each SHALL be presented as its figure together with a label naming what is counted.

The order SHALL be fixed rather than driven by the meta block's field order, because the four read as a progression from the coarsest unit to the finest and a reordering makes the row read as an arbitrary list.

#### Scenario: Four counts appear in the fixed order

- **WHEN** the masthead is rendered
- **THEN** four counts appear in the order species, forms, Mega, moves
- **AND** each carries both its figure and its label

##### Example: the four figures

| Position | Counts        | Figure |
| -------- | ------------- | ------ |
| 1        | species       | 208    |
| 2        | form entries  | 360    |
| 3        | Mega forms    | 75     |
| 4        | move entries  | 496    |

---

### Requirement: The result count is a localised statement, not a bare ratio

The count of species matching the active query SHALL be stated as a localised string carrying the matched count, the dataset's species total, and the unit being counted. It SHALL NOT be rendered as two figures separated by a bare punctuation mark, because a bare ratio does not say what is being counted and reads identically in both languages while the rest of the interface changes.

#### Scenario: The result count names its unit

- **WHEN** the masthead's result count is rendered with the language set to Chinese
- **THEN** it states the matched count, the species total, and the Chinese word for species

#### Scenario: The result count follows the language toggle

- **WHEN** the language is switched
- **THEN** the result count is restated in the new language

##### Example: the same query in both languages

| Language | Matched | Rendered                |
| -------- | ------- | ----------------------- |
| Chinese  | 208     | 208 / 208 種類          |
| Chinese  | 19      | 19 / 208 種類           |
| English  | 208     | 208 / 208 species       |
| English  | 19      | 19 / 208 species        |

---

### Requirement: The footer states the font licensing and the copyright notice

The interface SHALL carry a footer stating the licensing of the embedded fonts and the copyright of the depicted works, together with the non-commercial standing of this work. It SHALL be composed of heading-and-body segments, and SHALL carry at least the font and rights segment.

This footer SHALL be the interface's own statement. A statement held only in repository documentation SHALL NOT be treated as satisfying this requirement, because the reader of the interface never sees it.

The five provenance segments the design study carries — the roster, the move data, the base stats and abilities, the Chinese naming, and the artwork — are outside this requirement by decision. The interface therefore states no data provenance, and any document claiming that it does is wrong until this requirement is widened.

#### Scenario: The font and rights segment is rendered

- **WHEN** the footer is rendered
- **THEN** a segment carrying a heading and a body appears
- **AND** the body names the embedded font families and their licence
- **AND** it carries the copyright holders of the depicted works
- **AND** it states that this work is non-commercial

#### Scenario: The footer follows the language toggle

- **WHEN** the language is switched
- **THEN** the heading and the body are restated in the new language

#### Scenario: No provenance is claimed

- **WHEN** the footer is read
- **THEN** it makes no statement about where the roster, moves, stats, naming or artwork came from

---

### Requirement: Footer statements describe this implementation, not the design study

Every statement in the footer SHALL be true of this implementation. A statement carried over from the design study SHALL be rewritten wherever the two differ, because the footer's purpose is to state what is actually so and a carried-over falsehood is worse than an absent statement.

Two statements in the font and rights segment differ and SHALL be rewritten. The segment SHALL name both embedded font families rather than one, because this implementation embeds a pixel face and a prose face. It SHALL describe this work as a non-commercial work rather than as a design study.

#### Scenario: The segment names both faces

- **WHEN** the font and rights segment is read
- **THEN** it names both the pixel face and the prose face as embedded
- **AND** it states their licence

#### Scenario: The segment does not call this a design study

- **WHEN** the font and rights segment is read
- **THEN** it describes this work as non-commercial
- **AND** it does not describe it as a design study

##### Example: which statements change

| Design study states                        | This implementation states                |
| ------------------------------------------ | ----------------------------------------- |
| one pixel face embedded                    | a pixel face and a prose face embedded    |
| this page is a non-commercial design study | this work is non-commercial               |

---

---

### Requirement: The footer scrolls with the cards and introduces no scrolling container

The footer SHALL be placed inside the card area's existing scrolling container, after the cards, so that it is reachable by the same gesture that scrolls the roster. It SHALL NOT be given a scrolling container of its own.

The masthead SHALL remain outside that container, so the four scale counts stay in place while the cards and the footer scroll.

#### Scenario: The footer is reachable by scrolling the cards

- **WHEN** the card area is scrolled to its end
- **THEN** the footer is visible

#### Scenario: No scrolling container is added

- **WHEN** the footer's markup is inspected
- **THEN** it contains no scrolling container

#### Scenario: The scale counts do not scroll away

- **WHEN** the card area is scrolled
- **THEN** the four scale counts remain in place
