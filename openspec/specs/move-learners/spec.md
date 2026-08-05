# move-learners Specification

## Purpose

TBD - created by archiving change 'add-move-learners'. Update Purpose after archive.

## Requirements

### Requirement: A move resolves to the species that learn it

The data layer SHALL expose a derived accessor that takes a move's index into the shared move table and returns the species that learn that move, in the dataset's own species order.

A species SHALL be included when the move appears in any of that species' learnset sections, not only the section its base form points at. The dataset holds fifteen species whose sections differ between forms, and restricting the answer to base forms would omit one hundred and seventy-four of the twelve thousand nine hundred and thirty-nine move-to-species pairs.

The returned collection SHALL be shared with every caller and SHALL be typed readonly, so that no caller can mutate an answer another caller holds.

An index outside the shared move table SHALL raise the same diagnostic the existing single-move accessor raises, rather than being reported a second way.

#### Scenario: Every form's section is searched

- **WHEN** the learners of a move are requested
- **AND** a species learns that move only through a form other than its base form
- **THEN** that species is present in the result

#### Scenario: The result is ordered by the dataset, not by relevance

- **WHEN** the learners of a move are requested
- **THEN** the species appear in the dataset's own species order

#### Scenario: An out-of-range move index is rejected

- **WHEN** the learners of a move index outside the shared move table are requested
- **THEN** the same error the single-move accessor raises is raised
- **AND** no empty result is returned in its place

##### Example: measured shape of the learner relation

| Property                                            | Value                  |
| --------------------------------------------------- | ---------------------- |
| moves in the shared move table                       | 496                    |
| moves with at least one learner                      | 496                    |
| largest learner count for a single move              | 207 of 208 species     |
| median learner count                                 | 14                     |
| total move-to-species pairs                          | 12939                  |
| species whose sections differ between forms          | 15                     |
| pairs reachable only through a non-base form         | 174                    |


<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
-->

---
### Requirement: The learner relation is memoised, not recomputed

The learner accessor SHALL compute a move's answer at most once and return the same collection on every later request for that move. The answer SHALL NOT be computed for moves that are never requested.

This is memoisation rather than a cache: the dataset is loaded once and is readonly throughout, so a move's answer cannot change and nothing evicts or invalidates. The reason for computing lazily rather than building every move's answer at load is that the launch path is the one path this project has measured as slower than expected, and a move that is never opened SHALL cost nothing.

#### Scenario: A repeated request returns the same collection

- **WHEN** the learners of the same move are requested twice
- **THEN** both requests return the same collection
- **AND** the relation is walked only on the first request

#### Scenario: Unrequested moves cost nothing at load

- **WHEN** the application has started and no move's learners have been requested
- **THEN** no learner relation has been computed


<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
-->

---
### Requirement: The form opened for a learner is the one that actually knows the move

The data layer SHALL expose a derived accessor that takes a species and a move index and returns the index of the form to open.

The accessor SHALL return the species' base form when that form's learnset section contains the move. Otherwise it SHALL return the first form whose section contains the move.

Opening the base form unconditionally is forbidden because it produces a silently wrong screen: a reader who arrived by way of a move would be shown a form whose learnset does not contain it, with no error and no empty state to signal the mismatch.

When no section contains the move the accessor SHALL return the base form's index rather than raising. This state is unreachable for a species obtained from the learner accessor, and raising inside a reactive computation surfaces on this platform as unexplained broken layout rather than as an error.

#### Scenario: The base form knows the move

- **WHEN** the form to open is requested for a species whose base form's section contains the move
- **THEN** the base form's index is returned

#### Scenario: Only a non-base form knows the move

- **WHEN** the form to open is requested for a species whose base form's section does not contain the move
- **THEN** the index of the first form whose section contains it is returned

#### Scenario: An unreachable miss falls back rather than raising

- **WHEN** the form to open is requested for a species where no section contains the move
- **THEN** the base form's index is returned
- **AND** no error is raised

##### Example: Ninetales opened from an Ice move

- **GIVEN** Ninetales has two forms: a base form typed Fire pointing at section 0, and a regional form typed Ice and Fairy pointing at section 1
- **AND** section 0 holds 67 moves and does not contain Blizzard
- **AND** section 1 contains Blizzard, along with 17 other moves absent from section 0
- **WHEN** the form to open is requested for Ninetales and Blizzard
- **THEN** the regional form's index is returned
- **AND** the learnset shown to the reader contains Blizzard


<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
-->

---
### Requirement: The learner list is presented above the detail panel as its own layer

The learner list SHALL be rendered as an overlay that is a sibling of the detail panel's overlay inside the application's outermost view, drawn above it. It SHALL NOT be rendered as a section inside the detail panel.

The list SHALL declare its own scrolling container. Placing it inside the panel would make it a third nested scrolling layer and would violate the limit the `species-detail` capability places on the panel's scrolling containers — a violation the style check cannot detect, because that check reads the stylesheet and not the element tree.

While the learner list is open the detail panel beneath it SHALL retain its content and its scroll position. Closing the list SHALL return the reader to the panel unchanged.

The list SHALL NOT be rendered with the species card used by the grid. Presenting up to 207 cards would pay a second time the first-paint cost this project has measured on the full card sequence.

#### Scenario: The list is a sibling of the panel, not a descendant

- **WHEN** the learner list is open and the element tree is inspected
- **THEN** the list's overlay is a sibling of the detail panel's overlay
- **AND** the list's overlay is not a descendant of the detail panel

#### Scenario: The panel is undisturbed beneath the list

- **WHEN** the detail panel is scrolled to its learnset table, a move is opened, and the learner list is then closed
- **THEN** the panel is showing the same content at the same scroll position as before the list opened

#### Scenario: The list scrolls without moving the panel

- **WHEN** the learner list for a move with 207 learners is scrolled to its end on a physical device
- **THEN** the list scrolls
- **AND** the detail panel beneath it does not scroll


<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
-->

---
### Requirement: The learner list states the move, the count, and two species per row

The learner list SHALL state the name of the move it was opened from in the leading language, and the number of species that learn it.

Species SHALL be listed two per row. Each entry SHALL state the species' name in the leading language, its national dex number, and its type marks.

The list SHALL NOT carry a search field, a filter, or a sort control. The relation's median size is fourteen species, and the list's purpose is navigation rather than browsing.

#### Scenario: The heading names the move and the count

- **WHEN** the learner list is open
- **THEN** the move's name in the leading language is stated
- **AND** the number of species that learn it is stated

#### Scenario: Entries are laid out two per row

- **WHEN** the learner list is open
- **THEN** each row holds at most two species entries

#### Scenario: No query controls are present

- **WHEN** the learner list's element tree is inspected
- **THEN** it contains no search field, filter button, or sort button

##### Example: what the heading states for three moves

| Move          | Learner count | Rows of two |
| ------------- | ------------- | ----------- |
| Blizzard      | 179           | 90          |
| Tackle        | 207           | 104         |
| a median move | 14            | 7           |


<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
-->

---
### Requirement: Choosing a learner replaces the selection and does not stack

Choosing a species from the learner list SHALL open the detail for that species on the form the form accessor returns, replacing the current selection through the module that owns it. The learner list SHALL close.

No history of visited species SHALL be kept. Closing the detail panel after one or more replacements SHALL return the reader to the grid, not to the species the reader came from.

The learnset table's sort order and bonus filter SHALL survive the replacement, because that state is held outside the panel by the `learnset-table` capability and is deliberately not reset.

#### Scenario: The selection is replaced

- **WHEN** a species is chosen from the learner list
- **THEN** the detail panel shows that species
- **AND** the learner list closes

#### Scenario: Closing returns to the grid, not to the source species

- **WHEN** the detail is opened for species A, a move is opened, species B is chosen from the learner list, and the detail is then closed
- **THEN** the grid is shown
- **AND** the detail for species A is not shown

#### Scenario: Table state survives the replacement

- **WHEN** the learnset table is sorted by power with the bonus filter on, a move is opened, and another species is chosen
- **THEN** the new species' learnset table is sorted by power with the bonus filter on


<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
-->

---
### Requirement: The state holding the open move is separate from the selection

The move whose learners are being viewed SHALL be held by a module of its own, with named functions to open and to close it. That module SHALL NOT be owned by the module that holds the species selection.

The two are separate because they close independently: closing the learner list SHALL leave the selection intact, and the selection SHALL be replaceable while the list is closing.

#### Scenario: Closing the list leaves the selection intact

- **WHEN** the learner list is closed without choosing a species
- **THEN** the species selection is unchanged
- **AND** the detail panel remains open

#### Scenario: The open move is cleared when the list closes

- **WHEN** the learner list is closed
- **THEN** the module holds no open move

<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
-->