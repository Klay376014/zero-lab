# move-index Specification

## Purpose

The moves tab's list of every move in the shared move table.

Before this capability the move table was a terminus: a reader could only reach a move through the learnset of a species that happens to learn it, and never browse the 496 moves themselves. This capability makes the table its own surface — one row per entry, in the dataset's own order, each row a control that opens that move's detail.

It is the longest fixed sequence in the application, 496 rows against the grid's 208 cards, on a tab one tap away. So it materialises only the visible range plus a buffer, through `visible-range-window`, and declares its row pitch where the row-height check can assert it against the stylesheet.

It carries no query controls. Reaching a move is what this capability is for, and the sequence is fixed in a stable order; a search field, a type filter or a sort control each brings its own state, its own result-count statement and its own interaction with the window, which is a separate decision. The columns and their labels are `learnset-table`'s, reused rather than restated.

## Requirements

### Requirement: The moves tab lists every move in the shared move table

The moves tab SHALL render one row per entry in the shared move table, in the table's own order, with no entry omitted. The move table holds 496 entries.

The order SHALL be the dataset's own rather than a computed one. The table is assembled by the pipeline in first-encounter order across the roster's learnsets, and re-ordering it here would produce a second ordering that no invariant covers.

#### Scenario: Every move is present

- **WHEN** the moves tab is shown
- **THEN** the sequence it renders has one row for every entry in the shared move table

#### Scenario: The order is the dataset's

- **WHEN** the moves tab is shown
- **THEN** the rows appear in the shared move table's own order


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

The move index SHALL materialise only the rows within its scrolling container's visible range plus a buffer, as the `visible-range-window` capability defines, and SHALL hold the remaining extent with spacers so that the scrollable range is the one the full sequence would have.

This is the longest fixed sequence in the application: 496 rows against the grid's 208 cards. The platform's measured cost is per element, so a fully materialised index would pay that cost 496 times on a tab the reader reaches with one tap.

The row height SHALL be declared once and asserted against the stylesheet by the existing row-height check, so that a stylesheet change that moves the row height without updating the declared value fails the check rather than producing silent misalignment.

#### Scenario: Only the visible rows and their buffer exist

- **WHEN** the moves tab is shown
- **THEN** the row elements that exist are those of the visible range plus the buffer
- **AND** the scrollable extent is the one 496 rows would occupy

#### Scenario: Scrolling the full index shows every move

- **WHEN** a reviewer scrolls the move index from its first row to its last on a physical device
- **THEN** no row renders blank
- **AND** no row pairs one move's name with another move's figures

#### Scenario: The declared row height is checked against the stylesheet

- **WHEN** the row-height check runs
- **THEN** it asserts the move index's declared row height against the stylesheet's value


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
### Requirement: The move index carries no query controls

The move index SHALL NOT carry a search field, a type filter, a sort control, or any other query control. The moves tab SHALL NOT render the query bar, which belongs to the dex tab.

The index's purpose in this change is reaching a move, and the sequence is fixed at 496 entries in a stable order. Adding query controls is a separate decision with its own state, its own result-count statement, and its own interaction with the windowed sequence.

#### Scenario: No query controls are present

- **WHEN** the moves tab's element tree is inspected
- **THEN** it contains no search field, type filter, or sort control

#### Scenario: The query bar belongs to the dex tab

- **WHEN** the moves tab is active
- **THEN** the query bar is not rendered

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