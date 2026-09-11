## MODIFIED Requirements

### Requirement: Only the visible range of rows is materialised

The move index SHALL materialise only the rows within its scrolling container's visible range plus a buffer, as the `visible-range-window` capability defines, and SHALL hold the remaining extent with spacers so that the scrollable range is the one the currently rendered sequence would have.

When the conditions change the sequence's length, the range SHALL be clamped to the new length as the `visible-range-window` capability requires, and no scrolling API SHALL be called and no scroll position stored or restored.

This is the longest sequence in the application: 511 rows unfiltered, against the grid's 231 cards. The platform's measured cost is per element, so a fully materialised index would pay that cost 511 times on a tab the reader reaches with one tap.

The row height SHALL be declared once and asserted against the stylesheet by the existing row-height check, so that a stylesheet change that moves the row height without updating the declared value fails the check rather than producing silent misalignment.

#### Scenario: Only the visible rows and their buffer exist

- **WHEN** the moves tab is shown with no condition set
- **THEN** the row elements that exist are those of the visible range plus the buffer
- **AND** the scrollable extent is the one 511 rows would occupy

#### Scenario: The extent follows the filtered length

- **WHEN** a condition leaves 31 moves matching
- **THEN** the scrollable extent is the one 31 rows would occupy

#### Scenario: Filtering while scrolled far down renders no blank edge

- **WHEN** a reviewer scrolls the index far down on a physical device and then sets a condition that leaves few moves matching
- **THEN** every rendered row names a move that exists in the result
- **AND** no rendered row is blank

#### Scenario: Scrolling the full index shows every move

- **WHEN** a reviewer scrolls the move index from its first row to its last on a physical device
- **THEN** no row renders blank
- **AND** no row pairs one move's name with another move's figures

#### Scenario: The declared row height is checked against the stylesheet

- **WHEN** the row-height check runs
- **THEN** it asserts the move index's declared row height against the stylesheet's value
