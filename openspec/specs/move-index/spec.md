# move-index Specification

## Purpose

The moves tab's list of the moves in the shared move table, and the filter row that narrows it.

Before this capability the move table was a terminus: a reader could only reach a move through the learnset of a species that happens to learn it, and never browse the 511 moves themselves. This capability makes the table its own surface — one row per entry, in the dataset's own order, each row a control that opens that move's detail.

It is the longest sequence in the application, 511 rows unfiltered against the grid's 231 cards, on a tab one tap away. So it materialises only the visible range plus a buffer, through `visible-range-window`, holds the remaining extent with spacers sized to the sequence currently rendered, and declares its row pitch where the row-height check can assert it against the stylesheet. Its declared viewport height is deliberately not reduced for the filter row: the row makes the container shorter, so the existing figure becomes a larger overstatement, and overstating costs elements while understating blanks an edge silently.

It carries three filter conditions — a name search, the eighteen type marks and the three damage classes — set through a filter row of its own and held by `move-query`. Reaching a named move was what the first delivery was for, and it carried no query controls on the ground that each condition brings its own state, result-count statement and interaction with the window; those three costs are now paid, the count by `dataset-statements` and the window interaction by `visible-range-window`'s clamping. **Sort order remains absent**, and deliberately: a third order needs the sort control reworked from a single cycling chip into one that shows how many members the set has, which is a decision of its own recorded in the project roadmap. The dex tab's query bar is still not rendered here.

Filtering to nothing is stated in words rather than left blank, from a string-table key belonging to this tab rather than the learnset table's, so either surface can be reworded without rewording the other. The columns and their labels are `learnset-table`'s, reused rather than restated.

## Requirements

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


<!-- @trace
source: filter-move-index
updated: 2026-08-12
code:
  - src/state/moveQuery.ts
  - src/state/rowMetrics.ts
  - src/components/MoveIndex.vue
  - src/App.vue
  - ROADMAP.md
  - src/data/dex.ts
  - src/components/MoveFilterBar.vue
  - src/data/i18n.ts
tests:
  - tests/i18n.test.ts
  - tests/move-query.test.ts
-->

---
### Requirement: A move row states the move's name, type, damage class and three figures

Each row SHALL state the move's name in the leading language, its type mark, its damage class, and its power, accuracy and power points.

No fallback for a missing Chinese name is required here. The `dex-data` capability requires every move in the table to carry one, so the fallback the `learnset-table` capability defines has no case to answer in this sequence.

Power SHALL render as a dash when the move has no fixed damage, and accuracy SHALL render as a dash when the move never misses, matching the treatment the `learnset-table` capability already defines for absent values. Numeric columns SHALL be fixed width and right aligned.

#### Scenario: A row states all six fields

- **WHEN** a move row is rendered
- **THEN** it states the move's name, type mark, damage class, power, accuracy and power points

#### Scenario: Absent figures render as a dash

- **WHEN** a move with no fixed damage is rendered
- **THEN** its power column shows a dash
- **AND** its accuracy column shows a dash when the move never misses


<!-- @trace
source: add-moves-tab
updated: 2026-08-11
code:
  - design/pipeline/aggregate.py
  - design/champions-dex.html
  - scripts/check-row-heights.mjs
  - design/pipeline/fetch_sources.sh
  - src/state/rowMetrics.ts
  - src/data/dex.json
  - src/components/MoveDetail.vue
  - src/data/i18n.ts
  - src/state/tabs.ts
  - src/components/MoveLearners.vue
  - src/components/TabDeck.vue
  - src/App.vue
  - src/state/layerStack.ts
  - design/pipeline/fetch_moves_zh.py
  - ROADMAP.md
  - src/App.css
  - design/champions-dex.json
  - src/data/dex.ts
  - src/components/MoveIndex.vue
  - src/state/selection.ts
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/moveLearners.ts
tests:
  - tests/i18n.test.ts
  - tests/layer-stack.test.ts
  - tests/dex-data.test.ts
-->

---
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


<!-- @trace
source: update-roster-m-c
updated: 2026-09-11
code:
  - ROADMAP.md
  - design/champions-dex.json
  - src/components/MoveDetail.vue
  - src/data/dex.ts
  - design/HANDOFF.md
  - design/pipeline/fetch_sources.sh
  - src/App.css
  - design/pipeline/overlay.json
  - design/champions-dex.html
  - design/pipeline/aggregate.py
  - design/pipeline/build_data3.py
  - src/components/MoveIndex.vue
  - design/pipeline/parse.py
  - src/state/rowMetrics.ts
  - src/data/dex.json
  - design/pipeline/fetch_learnsets.py
  - src/data/i18n.ts
tests:
  - tests/dex-data.test.ts
  - tests/i18n.test.ts
  - tests/move-query.test.ts
  - tests/dex-query.test.ts
-->

---
### Requirement: A move row is a control that opens that move's detail

Each rendered move row SHALL be a control. Tapping a row SHALL open move detail for that row's move, as the `move-detail` capability defines.

The move carried to move detail SHALL be the move rendered in the tapped row, resolved through the same move reference the row was built from. The row's position SHALL NOT be used to identify the move, because the windowed sequence renders a row at a position that changes with the scroll offset.

The tap SHALL be bound on the row element itself rather than on a component boundary, because a binding placed on a component reaches an element only by attribute fall-through.

The row SHALL carry the press mark, and its three main-thread touch bindings SHALL be applied together — start, end, and cancel. The cancel binding is load-bearing rather than defensive: rows sit inside a scrolling container, so a press that becomes a scroll produces a cancellation and never a release.

#### Scenario: Tapping a row opens its move detail

- **WHEN** a move row is tapped
- **THEN** move detail opens for that row's move

#### Scenario: A tap after scrolling opens the right move

- **WHEN** the index is scrolled so that a different range of rows is materialised, and a row is tapped
- **THEN** move detail opens for the move rendered in that row

#### Scenario: A row press that becomes a scroll recovers

- **WHEN** a move row is pressed and the finger then moves to scroll the index rather than lifting on the row
- **THEN** the row's press mark is cleared


<!-- @trace
source: add-moves-tab
updated: 2026-08-11
code:
  - design/pipeline/aggregate.py
  - design/champions-dex.html
  - scripts/check-row-heights.mjs
  - design/pipeline/fetch_sources.sh
  - src/state/rowMetrics.ts
  - src/data/dex.json
  - src/components/MoveDetail.vue
  - src/data/i18n.ts
  - src/state/tabs.ts
  - src/components/MoveLearners.vue
  - src/components/TabDeck.vue
  - src/App.vue
  - src/state/layerStack.ts
  - design/pipeline/fetch_moves_zh.py
  - ROADMAP.md
  - src/App.css
  - design/champions-dex.json
  - src/data/dex.ts
  - src/components/MoveIndex.vue
  - src/state/selection.ts
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/moveLearners.ts
tests:
  - tests/i18n.test.ts
  - tests/layer-stack.test.ts
  - tests/dex-data.test.ts
-->

---
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


<!-- @trace
source: filter-move-index
updated: 2026-08-12
code:
  - src/state/moveQuery.ts
  - src/state/rowMetrics.ts
  - src/components/MoveIndex.vue
  - src/App.vue
  - ROADMAP.md
  - src/data/dex.ts
  - src/components/MoveFilterBar.vue
  - src/data/i18n.ts
tests:
  - tests/i18n.test.ts
  - tests/move-query.test.ts
-->

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


<!-- @trace
source: filter-move-index
updated: 2026-08-12
code:
  - src/state/moveQuery.ts
  - src/state/rowMetrics.ts
  - src/components/MoveIndex.vue
  - src/App.vue
  - ROADMAP.md
  - src/data/dex.ts
  - src/components/MoveFilterBar.vue
  - src/data/i18n.ts
tests:
  - tests/i18n.test.ts
  - tests/move-query.test.ts
-->

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

<!-- @trace
source: filter-move-index
updated: 2026-08-12
code:
  - src/state/moveQuery.ts
  - src/state/rowMetrics.ts
  - src/components/MoveIndex.vue
  - src/App.vue
  - ROADMAP.md
  - src/data/dex.ts
  - src/components/MoveFilterBar.vue
  - src/data/i18n.ts
tests:
  - tests/i18n.test.ts
  - tests/move-query.test.ts
-->