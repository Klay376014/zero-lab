# move-detail Specification

## Purpose

What a move does, stated as a layer, and the sole entry to that move's learner list.

The dataset carried a move's name and six mechanical figures but never its description, so a reader could see power 100 and accuracy 80 without learning what the move did. This capability states the mechanics together with the description, in both languages, and is reached from either axis — a row in the move index or a row in a species' learnset table — so that one gesture on a move reaches one screen from both.

It is the only path to the learner list. `learnset-table`'s move row reached that list directly until this capability existed; routing both entry points through here costs one extra tap, which `layer-stack`'s unwinding rule keeps from accumulating layers.

It states a move's flags as a row of short labels, the last row of that same attribute list. 17 of the 21 flag identifiers the dataset names get a label; the other four get none, and that absence is the whole of how their exclusion is expressed. A label names a property of the move itself and never the mechanism the flag governs in the mainline games, because 401 of the 496 moves carry figures this game retuned.

Absence is never stated. The row is missing rather than empty when nothing can be said — for the 71 moves whose flags the upstream source never recorded, and for the 42 whose every flag is excluded, which are therefore indistinguishable on screen. That is deliberate: 71 moves carrying no flag is not the same statement as those moves lacking the properties, and stating only what is present asserts nothing about what is not. This capability displayed no flags at all until the question of which to show was settled, and the guarantee that prohibition existed for is now carried by never saying "none".

## Requirements

### Requirement: Move detail states the move's mechanics and its description

Move detail SHALL state the move's name in both languages, its type, its damage class, its power, its accuracy, its power points, and its description in the leading language.

Power SHALL render as a dash when the move has no fixed damage, and accuracy SHALL render as a dash when the move never misses, matching the treatment the `learnset-table` capability already defines. No fallback for a missing Chinese name is required, because the `dex-data` capability requires every move in the table to carry one.

The description SHALL be restated in the other language when the language is switched.

#### Scenario: Move detail states seven fields

- **WHEN** move detail is open
- **THEN** it states the move's name, type, damage class, power, accuracy, power points and description

#### Scenario: The description follows the language toggle

- **WHEN** the language is switched while move detail is open
- **THEN** the description is restated in the new language

#### Scenario: Absent figures render as a dash

- **WHEN** move detail is open for a move with no fixed damage
- **THEN** its power is shown as a dash

##### Example: three moves as rendered

Every figure below is the Champions value, not the mainline one. Stone Edge's power points are 8 against the mainline's 5, and Ice Spinner's are 16 against the mainline's 15 — the retuning the `dex-data` capability records, which is why no figure here may be checked against an external source.

| Move        | Type  | Class    | Power | Accuracy | PP  | Chinese description present |
| ----------- | ----- | -------- | ----- | -------- | --- | --------------------------- |
| Stone Edge  | Rock  | Physical | 100   | 80       | 8   | yes                         |
| Aurora Veil | Ice   | Status   | dash  | dash     | 20  | yes                         |
| Ice Spinner | Ice   | Physical | 80    | 100      | 16  | yes                         |


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
### Requirement: Every move carries a description in both languages

Every entry in the shared move table SHALL carry a non-empty Chinese description and a non-empty English description. The interface SHALL NOT render an empty description area for any move.

This is a stronger guarantee than the dataset makes for names, where two moves carry no Chinese name and the interface falls back. Descriptions admit no fallback because the pipeline SHALL fail rather than emit a dataset with a missing description, as the `dex-data` capability requires.

#### Scenario: No move renders an empty description

- **WHEN** move detail is opened for any of the 496 moves
- **THEN** a description is stated in the leading language

##### Example: description coverage

| Property                                        | Value |
| ----------------------------------------------- | ----- |
| moves in the shared move table                   | 496   |
| moves with a non-empty Chinese description       | 496   |
| moves with a non-empty English description       | 496   |


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
### Requirement: Move detail is the sole entry to the learner list

Move detail SHALL carry a control that opens the learner list for its move, and SHALL state the number of species that learn it. That control SHALL be the only path by which the learner list is opened.

The learner list SHALL be opened as a layer, governed by the `layer-stack` capability. Opening it SHALL NOT close move detail.

The control SHALL carry the press mark with its three main-thread touch bindings applied together — start, end, and cancel.

#### Scenario: The control opens the learner list

- **WHEN** the learner control in move detail is tapped
- **THEN** the learner list for that move opens

#### Scenario: The learner count is stated

- **WHEN** move detail is open
- **THEN** the number of species that learn the move is stated

#### Scenario: No other path opens the learner list

- **WHEN** the application's element tree is inspected across both tabs and every layer
- **THEN** the only control that opens the learner list is the one in move detail

##### Example: the learner count for three moves

| Move       | Learners stated |
| ---------- | --------------- |
| Tackle     | 207             |
| Blizzard   | 179             |
| Stone Edge | a smaller count |


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
### Requirement: Move detail declares its own scrolling container only if its description overflows

Move detail SHALL be rendered as a layer whose content fits without a nested scrolling container under normal content. Its longest description is 46 characters, and its remaining content is a fixed set of six figures in an attribute list of at most six rows, one control, and at most four flag labels within that list's last row.

If the layer's content does not fit the available height, the layer itself SHALL scroll as a single container. Move detail SHALL NOT introduce a second, nested scrolling region for any of its sections, consistent with the limit the `species-detail` capability places on nested scrolling. The flag row SHALL NOT declare a scrolling region of its own, and its labels SHALL wrap within the row's value column rather than scroll horizontally.

#### Scenario: The layer holds exactly one scrolling container

- **WHEN** move detail is open and its element tree is inspected
- **THEN** it declares at most one scrolling container

#### Scenario: The longest description is readable without a nested scroll

- **WHEN** move detail is open for the move with the longest Chinese description, which is 46 characters
- **THEN** the description is readable without a nested scrolling region

#### Scenario: Four flag labels wrap rather than scroll

- **WHEN** move detail is open for a move stating four flag labels
- **THEN** the labels wrap within the layer's width
- **AND** no horizontal scrolling region is declared for them


<!-- @trace
source: surface-move-flags
updated: 2026-08-11
code:
  - design/pipeline/build_data3.py
  - src/App.css
  - src/data/dex.json
  - src/data/i18n.ts
  - src/data/dex.ts
  - design/champions-dex.html
  - src/components/MoveDetail.vue
  - design/champions-dex.json
  - ROADMAP.md
  - design/pipeline/aggregate.py
  - design/pipeline/fetch_sources.sh
tests:
  - tests/dex-data.test.ts
  - tests/i18n.test.ts
-->

---
### Requirement: Move detail states the move's flags as short labels

Move detail SHALL state each flag the move carries as a short label in the leading language, and SHALL restate the labels in the other language when the language is switched.

The labels SHALL be stated as one row of the same attribute list that states the move's type, damage class, power, accuracy and power points, positioned after power points. They SHALL NOT be stated as a section of their own, and no heading SHALL introduce them beyond that row's own label. This follows the treatment the `species-detail` capability already gives an attribute whose value is a set of marks.

The labels SHALL be stated as display marks, not as controls: no label SHALL respond to a tap, carry the press mark, or bind a touch handler.

The row SHALL carry its own label, and that label SHALL fit the layer's label column on one line. The column is 88 points wide, sized for the longest label already in it; a label that overruns it wraps and takes the row's baseline out of line with the rows above, which is a failure this capability's layer has already suffered once. The English label `Flags` measures 47.0 points in the pixel face at the column's size and tracking, against `ACCURACY` at 81.5.

The row's label and its marks SHALL be centred on each other vertically. This row SHALL NOT be aligned on baselines as the five rows above it are: its value is a container rather than text, and the platform derives a container's baseline from its bottom margin edge, which places the label below the marks by the marks' own bottom margin. The marks' vertical margins SHALL be symmetric so that the centring holds whether the marks occupy one line or two.

A flag SHALL be stated only when the string table carries a short label for its identifier. A flag whose identifier carries no short label SHALL be omitted, and the omission SHALL be silent: no marker, no count, and no text in its place.

Seventeen of the twenty-one flag identifiers the `dex-data` capability requires the dataset to name SHALL carry a short label. Four SHALL carry none in either language: `mirror`, `snatch`, `non-sky-battle` and `distance`. An identifier SHALL carry a short label when that label names a property of the move itself, and SHALL NOT when the label could only name a relation to a mechanism this dataset does not contain — the moves Mirror Move and Snatch are not among the 496, and neither the sky battle nor the triple battle format exists in this game. Coverage SHALL NOT be a criterion: `protect` carries a label despite applying to 340 of the 496 moves.

A short label SHALL name the property only. It SHALL NOT describe the mechanism the flag governs in the mainline games, because 401 of the 496 moves carry retuned figures in this dataset and a mechanism description would assert mainline rules about a game that retunes them.

The labels SHALL appear in the ascending identifier order the `dex-data` capability requires of the flag field. That order is stable rather than meaningful; ordering by label text, by coverage, or by language is not required and SHALL NOT be introduced.

At most four labels SHALL be stated for any move. This is a consequence of the exclusions, not an independent cap: the `dex-data` capability permits up to six identifiers on one move, and no move carries more than four whose identifier has a label.

#### Scenario: A move's flags are stated as short labels

- **WHEN** move detail is open for a move carrying flag identifiers that have short labels
- **THEN** each of those flags is stated as a short label
- **AND** the labels appear in ascending identifier order

#### Scenario: An excluded flag is omitted silently

- **WHEN** move detail is open for a move carrying a flag identifier that has no short label
- **THEN** no label is stated for that flag
- **AND** nothing marks its omission

#### Scenario: The row label fits the label column on one line

- **WHEN** move detail is open in either language for a move stating flag labels
- **THEN** the flag row's label occupies one line

#### Scenario: The row label is centred on its marks

- **WHEN** move detail is open for a move stating flag labels on one line
- **THEN** the row's label and its marks are centred on each other vertically

#### Scenario: Centring holds when the marks wrap

- **WHEN** move detail is open for a move whose flag labels occupy two lines
- **THEN** the row's label is centred against both lines

#### Scenario: The labels follow the language toggle

- **WHEN** the language is switched while move detail is open
- **THEN** the short labels are restated in the new language

##### Example: four moves as rendered

Identifiers are written as their upstream names for readability; the dataset carries the numeric identifiers the `dex-data` capability defines.

| Move        | Flag identifiers carried                    | Labels stated (English)            | Labels stated (Chinese) |
| ----------- | ------------------------------------------- | ---------------------------------- | ----------------------- |
| Attract     | protect, reflectable, authentic, mental     | Protect, Rebound, Pierce, Mental   | 守住、反彈、穿透、心靈     |
| Stone Edge  | protect, mirror                             | Protect                            | 守住                     |
| Aurora Veil | snatch                                      | none, and no flag row              | 無，且無此列              |
| Ice Spinner | none                                        | none, and no flag row              | 無，且無此列              |

##### Example: label coverage across the flag vocabulary

| Property                                                  | Value |
| --------------------------------------------------------- | ----- |
| flag identifiers the dataset names                        | 21    |
| identifiers carrying a short label in both languages      | 17    |
| identifiers carrying a short label in neither language    | 4     |
| greatest number of labels stated for one move             | 4     |
| moves for which no label is stated                        | 113   |
| of those, moves carrying no flag identifiers at all       | 71    |
| of those, moves whose every identifier has no label       | 42    |


<!-- @trace
source: surface-move-flags
updated: 2026-08-11
code:
  - design/pipeline/build_data3.py
  - src/App.css
  - src/data/dex.json
  - src/data/i18n.ts
  - src/data/dex.ts
  - design/champions-dex.html
  - src/components/MoveDetail.vue
  - design/champions-dex.json
  - ROADMAP.md
  - design/pipeline/aggregate.py
  - design/pipeline/fetch_sources.sh
tests:
  - tests/dex-data.test.ts
  - tests/i18n.test.ts
-->

---
### Requirement: Move detail states no flag section when no flag can be stated

When no flag of the move can be stated — because the move carries no flag identifiers, or because every identifier it carries has no short label — move detail SHALL render no element for that row: no row label, no container, and no placeholder text. The attribute list SHALL be one row shorter.

Move detail SHALL NOT state that a move has no flags, and SHALL NOT state a count of flags for any move.

The 71 moves whose flag identifiers the upstream source never recorded and the 42 whose every identifier is excluded are therefore indistinguishable on screen. This is deliberate and replaces the guarantee the removed requirement provided: stating absence would assert that those 71 moves lack the properties, while the dataset supports only the statement that nobody recorded them. Stating only the flags that are present asserts nothing about the flags that are not.

#### Scenario: A move with no flag identifiers renders no flag row

- **WHEN** move detail is open for a move carrying no flag identifiers
- **THEN** no row label, container or placeholder is rendered for flags
- **AND** the attribute list states five rows rather than six

#### Scenario: A move whose every flag is excluded renders no flag row

- **WHEN** move detail is open for a move whose every flag identifier has no short label
- **THEN** no row label, container or placeholder is rendered for flags

#### Scenario: No move states an absence or a count of flags

- **WHEN** move detail is opened for any of the 496 moves
- **THEN** no text states that the move has no flags
- **AND** no number states how many flags the move has

<!-- @trace
source: surface-move-flags
updated: 2026-08-11
code:
  - design/pipeline/build_data3.py
  - src/App.css
  - src/data/dex.json
  - src/data/i18n.ts
  - src/data/dex.ts
  - design/champions-dex.html
  - src/components/MoveDetail.vue
  - design/champions-dex.json
  - ROADMAP.md
  - design/pipeline/aggregate.py
  - design/pipeline/fetch_sources.sh
tests:
  - tests/dex-data.test.ts
  - tests/i18n.test.ts
-->