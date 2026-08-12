## MODIFIED Requirements

### Requirement: The moves tab lists every move in the shared move table

The moves tab SHALL render one row per entry in the shared move table that satisfies the active conditions, in the table's own order, with no satisfying entry omitted. When no condition is set, that is every entry: the move table holds 496 entries.

The sequence rendered SHALL be the one the `move-query` capability derives, so that which moves appear is decided in one place rather than restated here.

The order SHALL be the dataset's own rather than a computed one, and SHALL remain so under every condition: filtering removes rows without reordering the rows it keeps. The table is assembled by the pipeline in first-encounter order across the roster's learnsets, and re-ordering it here would produce a second ordering that no invariant covers.

#### Scenario: Every move is present

- **WHEN** the moves tab is shown with no condition set
- **THEN** the sequence it renders has one row for every entry in the shared move table

#### Scenario: The order is the dataset's

- **WHEN** the moves tab is shown
- **THEN** the rows appear in the shared move table's own order

#### Scenario: Filtering removes rows without reordering them

- **WHEN** a condition is set that some moves do not satisfy
- **THEN** the rows that remain appear in the shared move table's own relative order

---
### Requirement: Only the visible range of rows is materialised

The move index SHALL materialise only the rows within its scrolling container's visible range plus a buffer, as the `visible-range-window` capability defines, and SHALL hold the remaining extent with spacers so that the scrollable range is the one the currently rendered sequence would have.

When the conditions change the sequence's length, the range SHALL be clamped to the new length as the `visible-range-window` capability requires, and no scrolling API SHALL be called and no scroll position stored or restored.

This is the longest sequence in the application: 496 rows unfiltered, against the grid's 208 cards. The platform's measured cost is per element, so a fully materialised index would pay that cost 496 times on a tab the reader reaches with one tap.

The row height SHALL be declared once and asserted against the stylesheet by the existing row-height check, so that a stylesheet change that moves the row height without updating the declared value fails the check rather than producing silent misalignment.

#### Scenario: Only the visible rows and their buffer exist

- **WHEN** the moves tab is shown with no condition set
- **THEN** the row elements that exist are those of the visible range plus the buffer
- **AND** the scrollable extent is the one 496 rows would occupy

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

## ADDED Requirements

### Requirement: The moves tab carries its own filter row and does not render the dex tab's query bar

The moves tab SHALL render a filter row above the index carrying three controls: a search field, the eighteen type marks as selectable chips, and the three damage classes as selectable chips. Each control SHALL set the corresponding condition in the `move-query` capability's state, and the row SHALL carry a reset control that clears all three.

The moves tab SHALL NOT render the dex tab's query bar. That bar sets the dex tab's query state, whose sort orders and Mega-only and multi-form-only filters are statements about species and have no answer in the move table.

Selected chips SHALL reuse the existing selected-state style rules rather than introducing new ones, and the type marks SHALL be drawn on the glyph surfaces the dex tab's type chips already use, so that no new glyph surface is introduced and the contrast check covers them without amendment.

The search field's text, background and border colours SHALL be written onto the element as inline style and the field SHALL be keyed on the display mode, because the native text field keeps the colours it resolved at creation and does not repaint when the root view's custom properties change.

The search field's placeholder SHALL state only what this field searches, and SHALL NOT reuse the dex tab's placeholder, which names a number, a type and a form — none of which this corpus carries.

#### Scenario: The three controls are present

- **WHEN** the moves tab is shown
- **THEN** a search field, eighteen type chips and three damage class chips are present
- **AND** a reset control is present

#### Scenario: The dex tab's query bar is absent

- **WHEN** the moves tab is active
- **THEN** the dex tab's query bar is not rendered

#### Scenario: Reset clears every condition

- **WHEN** the reset control is used with all three conditions set
- **THEN** no chip is selected and the search field is empty
- **AND** every move in the shared move table is rendered

#### Scenario: The field survives a mode change

- **WHEN** the display mode is changed while the moves tab is shown
- **THEN** the search field is drawn in the new mode's colours

#### Scenario: No new glyph surface is introduced

- **WHEN** the contrast check runs
- **THEN** it passes without a new glyph surface member being added for the filter row

---
### Requirement: A result with no matching moves is stated in words

When the active conditions leave no moves, the index SHALL render a sentence saying so instead of leaving the region blank. An empty result is a normal outcome of filtering and SHALL NOT be reported to the console.

That sentence SHALL name the reading face at the head of its font stack, because it is prose rather than a name, a label or a number, following the treatment the `learnset-table` capability defines for its own empty result.

The sentence SHALL come from a string-table key belonging to the moves tab, not from the learnset table's key. The two read alike today and the string table already keeps separate key sets where text coincides, so that either surface can be reworded without silently rewording the other.

#### Scenario: An empty result is stated in words

- **WHEN** the active conditions leave no moves matching
- **THEN** the index renders the no-matching-moves sentence
- **AND** renders no rows
- **AND** writes nothing to the console

##### Example: a combination no move satisfies

- **GIVEN** the search string 牙, which matches seven moves, none of them Water
- **WHEN** the Water type and the physical damage class are also selected
- **THEN** no rows render and the no-matching-moves sentence is shown

---
### Requirement: The declared viewport height is not reduced for the filter row

The move index's declared viewport height SHALL NOT be reduced to account for the filter row.

The declared height is deliberately an overstatement of the container: overstating it renders rows beyond the visible range, which costs elements, while understating it lets the scroll outrun the window and blanks an edge, and only the second failure is silent. The filter row makes the container shorter, so the existing declared height becomes a larger overstatement and the failure it can produce stays the non-silent one.

Reducing it SHALL require a device measurement rather than an estimate, because every other row metric in this application is a measured figure and a hand-computed replacement would carry no relation to what the platform draws.

#### Scenario: The declared height is unchanged

- **WHEN** the filter row is added
- **THEN** the move index's declared viewport height is the value it already had

#### Scenario: The overstatement costs elements and not correctness

- **WHEN** the moves tab is shown with the filter row present
- **THEN** the rows materialised are at least those of the visible range plus the buffer
- **AND** no edge of the visible range is blank

## REMOVED Requirements

### Requirement: The move index carries no query controls

**Reason**: The moves tab now carries three filter conditions. This requirement forbade exactly that, and its stated rationale — that reaching a move is the tab's purpose and the sequence is fixed at 496 entries in a stable order — no longer holds once a reader's question is which moves carry a type or a damage class rather than which move is named. Its two costs were named as separate decisions to be taken later: the result-count statement and the interaction with the windowed sequence. Both are now decided, the first by the `dataset-statements` capability and the second by the `visible-range-window` capability, whose clamping requirement already covers a sequence shortened by a filter.

**Migration**: Replaced by "The moves tab carries its own filter row and does not render the dex tab's query bar", which keeps the half of this requirement that still holds — the dex tab's query bar belongs to the dex tab and is not rendered on the moves tab — and states what the moves tab carries instead. The sort control this requirement forbade remains absent: sort order for the move index is deliberately out of scope, recorded in the project roadmap alongside the sort-control rework it would require.
