## MODIFIED Requirements

### Requirement: The learnset table renders one row per move in the displayed form's section

The learnset table SHALL present one row for every move in the learnset section that the displayed form points at. Each row SHALL carry, in order: the move's type glyph, the move's name in the leading language, the damage-class abbreviation, the power, the accuracy, and the PP.

Presenting every move SHALL NOT mean materialising every row. The table SHALL materialise only the rows within its scrolling container's visible range plus a buffer, as the visible-range window capability defines, and SHALL hold the remaining extent with spacers so that the scrollable range is the one the full sequence would have. The longest learnset in the dataset holds one hundred and five moves at roughly eight and a half elements a row; the platform charges roughly one and a third milliseconds per element, and that sequence alone accounts for a wait of about nine hundred milliseconds before the panel's artwork appears.

The table's inputs SHALL be the move-index list to render and the types the bonus is computed against, and SHALL NOT include the species. A learnset section is held on the species and a form holds only an index into those sections, so neither input can be derived from a form alone; the panel resolves the section and hands over the result, following the arrangement already used for abilities, where the list component receives the slots rather than the species.

Resolving a form's section SHALL be a data-layer operation. When a form's section index falls outside the range of sections the species has, that operation SHALL yield an empty list rather than raising an error, so the table renders no rows. This matches the clamping already applied to form indices, and places the decision in the same layer as the existing ability-slot resolution.

#### Scenario: A form's learnset is listed in full

- **WHEN** the panel opens on a form whose learnset section holds 72 moves and no filter is active
- **THEN** the table presents 72 rows, every one of them reachable by scrolling
- **AND** each row carries a type glyph, a name, a damage-class abbreviation, a power, an accuracy and a PP

#### Scenario: Only the visible rows and their buffer exist

- **WHEN** the panel opens on a form whose learnset section holds 105 moves
- **THEN** the row elements that exist are those of the visible range plus the buffer
- **AND** the scrollable extent is the one 105 rows would occupy

#### Scenario: Scrolling the whole learnset shows every row

- **WHEN** a reviewer scrolls a 105-move learnset from its first row to its last on a physical device
- **THEN** no row renders blank
- **AND** no row pairs one move's name with another move's values

#### Scenario: An out-of-range section index yields an empty learnset

- **WHEN** a form's section index is greater than the last section the species has
- **THEN** the data-layer resolution yields an empty list, the table renders no rows, and no error is raised

#### Scenario: The table is not given the species

- **WHEN** the table component's declared inputs are inspected
- **THEN** they name a move-index list and a type list, and no species
