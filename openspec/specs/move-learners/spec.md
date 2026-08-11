# move-learners Specification

## Purpose

How a move resolves to the species that learn it, and how those species are presented as a layer of their own. Covers the learner relation derived from the dataset and memoised rather than recomputed, the form opened for a learner being the one that actually knows the move, the list sitting above the layer beneath it rather than nested inside it, the move name and learner count in its heading with two species to a row and only the visible range of those rows materialised, and choosing a learner replacing the selection rather than stacking another layer.

The layer beneath the list is move detail, which `move-detail` establishes as the sole entry to it — this list is no longer reached directly from a learnset row. Two consequences follow. Choosing a learner is governed by `layer-stack`'s unwinding rule rather than by a rule of this capability's own: reached from a species, the stack unwinds to the species layer and discards this list; reached from the moves tab, species detail is pushed above it. And the move whose learners are shown is carried as this layer's own content, **not** by a module of its own — the reverse of what this capability previously required, because a second holder of that fact could disagree with the stack undetected.

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

The learner list SHALL be rendered as a layer in the layer stack the `layer-stack` capability defines, drawn above whatever layer is beneath it. It SHALL NOT be rendered as a section inside the detail panel, nor inside move detail.

The layer beneath the learner list SHALL be move detail, because the `move-detail` capability establishes move detail as the sole entry to the learner list. When move detail was itself opened from the species detail panel, the panel remains in the stack beneath move detail and retains its content and its scroll position.

The list SHALL declare its own scrolling container. Placing it inside the detail panel would make it a third nested scrolling layer and would violate the limit the `species-detail` capability places on the panel's scrolling containers — a violation the style check cannot detect, because that check reads the stylesheet and not the element tree.

Closing the learner list SHALL return the reader to move detail unchanged, as the `layer-stack` capability's closing rule requires.

The list SHALL NOT be rendered with the species card used by the grid. Presenting up to 207 cards would pay a second time the first-paint cost this project has measured on the full card sequence.

#### Scenario: The list is a layer, not a descendant of another layer

- **WHEN** the learner list is open and the element tree is inspected
- **THEN** the list's overlay is a sibling of the layer beneath it
- **AND** the list's overlay is not a descendant of the detail panel or of move detail

#### Scenario: The layers beneath are undisturbed

- **WHEN** the detail panel is scrolled to its learnset table, a move is opened, the learner list is opened, and the learner list is then closed
- **THEN** move detail is shown unchanged
- **AND** closing move detail shows the panel at the same scroll position as before move detail opened

#### Scenario: The list scrolls without moving the layers beneath

- **WHEN** the learner list for a move with 207 learners is scrolled to its end on a physical device
- **THEN** the list scrolls
- **AND** the layer beneath it does not scroll


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
### Requirement: The learner list states the move, the count, and two species per row

The learner list SHALL state the name of the move it was opened from in the leading language, and the number of species that learn it.

Species SHALL be listed two per row. Each entry SHALL state the species' name in the leading language, its national dex number, and its type marks.

Listing every learner SHALL NOT mean materialising every row. The list SHALL materialise only the rows within its scrolling container's visible range plus a buffer, as the visible-range window capability defines, and SHALL hold the remaining extent with spacers so that the scrollable range is the one the full sequence would have. This is the longest sequence in the application: the most widely learned move reaches two hundred and twenty-five species, more than the roster the grid draws, and at roughly eight elements a row it exceeds the grid's element count for a screen that is reached by a single tap.

The list SHALL NOT carry a search field, a filter, or a sort control. The relation's median size is fourteen species, and the list's purpose is navigation rather than browsing. A median-sized relation SHALL still be presented through the same path as a large one, so that the two do not diverge in behaviour.

#### Scenario: The heading names the move and the count

- **WHEN** the learner list is open
- **THEN** the move's name in the leading language is stated
- **AND** the number of species that learn it is stated

#### Scenario: Entries are laid out two per row

- **WHEN** the learner list is open
- **THEN** each row holds at most two species entries

#### Scenario: Only the visible rows and their buffer exist

- **WHEN** the learner list is opened on a move that two hundred and twenty-five species learn
- **THEN** the row elements that exist are those of the visible range plus the buffer
- **AND** the scrollable extent is the one the full relation would occupy

#### Scenario: Scrolling the longest relation shows every learner

- **WHEN** a reviewer scrolls the largest learner list from its first row to its last on a physical device
- **THEN** no row renders blank
- **AND** no entry pairs one species' name with another species' number or type marks

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
source: window-visible-range
updated: 2026-08-10
code:
  - src/App.css
  - src/state/visibleRange.ts
  - ROADMAP.md
  - package.json
  - src/App.vue
  - src/components/MoveLearners.vue
  - src/components/LearnsetTable.vue
  - scripts/check-row-heights.mjs
  - src/state/viewport.ts
  - design/HANDOFF.md
  - src/state/rowMetrics.ts
  - src/components/DexGrid.vue
tests:
  - tests/visible-range.test.ts
-->

---
### Requirement: Choosing a learner replaces the selection and does not stack

Choosing a species from the learner list SHALL open species detail for that species on the form the form accessor returns. The opening SHALL follow the `layer-stack` capability's rule: if species detail is already in the stack, the stack unwinds to it and its content is replaced; if it is not, species detail is pushed. In both cases the learner list SHALL close, along with every other layer above the layer that receives the species.

No history of visited species SHALL be kept. Closing species detail after one or more replacements SHALL return the reader to the active tab, not to the species the reader came from.

The learnset table's sort order and bonus filter SHALL survive the replacement, because that state is held outside the panel by the `learnset-table` capability and is deliberately not reset.

#### Scenario: The selection is replaced when species detail is already open

- **WHEN** species detail, move detail and the learner list are open, and a species is chosen from the list
- **THEN** species detail shows the chosen species
- **AND** the stack holds species detail alone

#### Scenario: The selection is pushed when species detail is not open

- **WHEN** move detail and the learner list are open on the moves tab, and a species is chosen from the list
- **THEN** species detail shows the chosen species
- **AND** it is drawn above move detail and the learner list

#### Scenario: Closing returns to the tab, not to the source species

- **WHEN** species detail is opened for species A, a move is opened, the learner list is opened, species B is chosen, and species detail is then closed
- **THEN** the active tab is shown
- **AND** species detail for species A is not shown

#### Scenario: Table state survives the replacement

- **WHEN** the learnset table is sorted by power with the bonus filter on, a move is opened, the learner list is opened, and another species is chosen
- **THEN** the new species' learnset table is sorted by power with the bonus filter on


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
### Requirement: The state holding the open move is separate from the selection

The move whose learners are being viewed SHALL be carried as the content of the learner-list layer in the layer stack, together with the move detail layer that opened it. It SHALL NOT be held by a module of its own.

This reverses the arrangement this capability previously required. A separate module was correct while the learner list had one entry point and one relationship to the selection. With the layer stack owning which layers are open and what each carries, a second module holding the same fact would allow the two to disagree — a layer present in the stack while the module reports none, or the reverse — and nothing would detect the disagreement.

The selection SHALL remain separate from the layer stack's own bookkeeping in the sense the `layer-stack` capability defines: closing the learner list SHALL leave the species detail layer and its content intact.

#### Scenario: Closing the list leaves the layer beneath intact

- **WHEN** the learner list is closed without choosing a species
- **THEN** the layer beneath it is shown with its content unchanged

#### Scenario: The open move is carried by the stack

- **WHEN** the learner list is open
- **THEN** the move whose learners are shown is the content the learner-list layer carries

#### Scenario: No separate module holds the open move

- **WHEN** the application's state modules are inspected
- **THEN** none holds an open move independently of the layer stack

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