# learnset-table Specification

## Purpose

How one form's Champions learnset is presented as a six-column table. Covers one row per move in the section the displayed form points at, the same-type attack bonus judged against the displayed form's types rather than the species' and excluding status moves, the closed set of three sort orders and the tie-break every one of them resolves by name, sort order and the bonus filter held as state that outlives the panel, the section heading stating both the learnset size and the filtered size, an empty filtered result stated in words, numeric columns fixed in width and right aligned with absent values as a dash, move names held to one line by an element attribute rather than a style property, bonus rows carrying both a background and a real star text node, the deliberate absence of the design study's hover tooltips with no substitute added, an English fallback for the two moves with no Chinese name, the platform list binding left unused because it renders neither removals nor reorders, and the table's own height bound and scrolling container above a row threshold with its column header outside them.

## Requirements

### Requirement: The learnset table renders one row per move in the displayed form's section

The learnset table SHALL render one row for every move in the learnset section that the displayed form points at. Each row SHALL carry, in order: the move's type glyph, the move's name in the leading language, the damage-class abbreviation, the power, the accuracy, and the PP.

The table's inputs SHALL be the move-index list to render and the types the bonus is computed against, and SHALL NOT include the species. A learnset section is held on the species and a form holds only an index into those sections, so neither input can be derived from a form alone; the panel resolves the section and hands over the result, following the arrangement already used for abilities, where the list component receives the slots rather than the species.

Resolving a form's section SHALL be a data-layer operation. When a form's section index falls outside the range of sections the species has, that operation SHALL yield an empty list rather than raising an error, so the table renders no rows. This matches the clamping already applied to form indices, and places the decision in the same layer as the existing ability-slot resolution.

#### Scenario: A form's learnset is listed in full

- **WHEN** the panel opens on a form whose learnset section holds 72 moves and no filter is active
- **THEN** the table renders 72 rows
- **AND** each row carries a type glyph, a name, a damage-class abbreviation, a power, an accuracy and a PP

#### Scenario: An out-of-range section index yields an empty learnset

- **WHEN** a form's section index is greater than the last section the species has
- **THEN** the data-layer resolution yields an empty list, the table renders no rows, and no error is raised

#### Scenario: The table is not given the species

- **WHEN** the table component's declared inputs are inspected
- **THEN** they name a move-index list and a type list, and no species


<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: Same-type attack bonus excludes status moves and follows the displayed form's types

A move SHALL be marked as receiving the same-type attack bonus when both conditions hold: its type is one of the displayed form's types, and its damage class is not status. A status move SHALL NOT be marked even when its type matches, because a move that deals no damage receives no damage bonus.

The bonus SHALL be recomputed from the displayed form's types. A Mega form that reuses its base form's learnset SHALL therefore produce a different bonus set from that base form whenever the Mega form's types differ.

#### Scenario: A same-type status move is not marked

- **WHEN** a form of type Fire lists a status move of type Fire
- **THEN** that row is not marked as receiving the bonus

#### Scenario: Changing form recomputes the bonus set

- **WHEN** the form switcher moves from a form whose types are Fire and Flying to a Mega form whose types are Fire and Dragon, both sharing one learnset
- **THEN** the marked rows change to match the new type pair

##### Example: Charizard's three forms over one shared learnset of 72 moves

| Form             | Types        | Marked rows | Same-type status moves excluded            |
| ---------------- | ------------ | ----------- | ------------------------------------------ |
| base             | Fire/Flying  | 19          | Sunny Day, Will-O-Wisp, Roost              |
| Mega Charizard X | Fire/Dragon  | 20          | Sunny Day, Will-O-Wisp, Dragon Dance, Dragon Cheer |
| Mega Charizard Y | Fire/Flying  | 19          | Sunny Day, Will-O-Wisp, Roost              |


<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: Sort order is a closed set of three, each resolving ties by name

The sort order SHALL be a closed set containing exactly three members: name, power and type. Name SHALL order ascending by the move name in the leading language. Power SHALL order from highest to lowest, placing moves with no power value last. Type SHALL order by the project's existing type order.

Power and type SHALL resolve equal values by ordering those rows ascending by name. A sort without a tiebreaker leaves the order of equal rows undefined, and both of these keys produce large equal groups.

#### Scenario: Power orders highest first with absent power last

- **WHEN** the sort order is power
- **THEN** each row's power is less than or equal to the row above it
- **AND** every row with no power value follows every row that has one

#### Scenario: Equal power falls back to name

- **WHEN** the sort order is power and several rows share one power value
- **THEN** those rows appear in ascending name order among themselves

##### Example: Charizard's learnset under the power sort

- **GIVEN** the rows Crunch (power 80), Dig (power 80), Dragon Claw (power 80), Focus Punch (power 150), Giga Impact (power 150), Hyper Beam (power 150) and Beat Up (no power)
- **WHEN** the sort order is power
- **THEN** the order is Focus Punch, Giga Impact, Hyper Beam, Crunch, Dig, Dragon Claw, Beat Up


<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: Sort order and the bonus filter are shared reactive state that outlives the panel

The sort order and the bonus filter SHALL be held as shared reactive state in their own module, following the same arrangement as the existing display, query and selection state. Each SHALL be settable without disturbing the other. A reset operation SHALL return both to their initial values.

Neither SHALL be reset when the panel closes or when the displayed form changes. The panel is mounted on open and unmounted on close, so state held inside the table would return to its default on every open, and a reader who set the sort order did so in order to compare several species under it.

#### Scenario: Sort order survives closing and reopening the panel

- **WHEN** the sort order is set to power, the panel is closed, and another species is opened
- **THEN** the new species' learnset is sorted by power

#### Scenario: The bonus filter survives a form change

- **WHEN** the bonus filter is active and the form switcher selects another form
- **THEN** the filter remains active and the rows shown are the new form's marked moves


<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: The section heading states the learnset size and the filtered size

The section heading SHALL state the total number of moves in the displayed form's learnset. When the bonus filter is active, the heading SHALL additionally state the number of rows that survive the filter. A single number SHALL NOT be shown while the filter is active, because a reader cannot then distinguish a small learnset from a filtered one.

#### Scenario: Unfiltered heading states one number

- **WHEN** the bonus filter is inactive and the learnset holds 72 moves
- **THEN** the heading states 72

#### Scenario: Filtered heading states both numbers

- **WHEN** the bonus filter is active, the learnset holds 72 moves and 19 receive the bonus
- **THEN** the heading states both 72 and 19


<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: An empty filtered result is stated in words in the reading face

When the active sort and filter leave no rows, the table SHALL render a sentence saying so instead of leaving the region blank. An empty result is a normal outcome of filtering and SHALL NOT be reported to the console.

That sentence SHALL name the reading face at the head of its font stack, because it is prose rather than a name, a label or a number.

#### Scenario: Filtering to nothing states it in words

- **WHEN** the bonus filter is active on a form whose only move is a same-type status move
- **THEN** the table renders the no-matching-moves sentence, renders no rows, and writes nothing to the console

##### Example: Ditto under the bonus filter

- **GIVEN** national number 132, type Normal, a learnset of one move: Transform, type Normal, damage class status
- **WHEN** the bonus filter is active
- **THEN** no rows render and the no-matching-moves sentence is shown


<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: Numeric columns are fixed width and right aligned, and absent values render as a dash

The power, accuracy and PP columns SHALL each have a fixed width and SHALL align their contents to the trailing edge. The table SHALL NOT rely on tabular figures to align them: the pixel face's digits do not share one advance width, and the platform's font registration accepts no font-variant descriptor, so that declaration would have no effect and SHALL NOT appear in the stylesheet.

Each fixed column's width SHALL be derived from its own widest content plus slack, and SHALL NOT be carried over from the design study's values. Those were sized for a browser no narrower than 500px and are roughly twice what the content needs; the surplus comes out of the name column, which is the one column that has to hold something long. In every fixed column the widest content is a column heading rather than a value.

##### Example: measured widest content per fixed column

| Column   | Widest content     | Measured at 11px | Width given |
| -------- | ------------------ | ---------------- | ----------- |
| class    | the heading `PH`   | 16.5px           | 22px        |
| power    | the heading `PWR`  | 26.1px           | 32px        |
| accuracy | the heading `ACC`  | 24.8px           | 32px        |
| PP       | the heading `PP`   | 16.5px           | 24px        |

No power in the dataset exceeds three digits and no PP exceeds two, so no value is wider than its heading.

A power or accuracy with no value SHALL render as a dash in the secondary ink rather than as an empty cell. Absent power means the move deals no fixed damage and absent accuracy means it never misses; both are properties of the move rather than missing data.

#### Scenario: Numbers align on their trailing edge

- **WHEN** the table renders rows whose powers are 80, 100 and 150
- **THEN** the three values align on the column's trailing edge

#### Scenario: Absent values render as a dash

- **WHEN** a row's move has no power value and no accuracy value
- **THEN** both cells render a dash in the secondary ink


<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: Move names occupy one line and truncate rather than wrap

The name column SHALL limit its content to a single line and SHALL truncate a name that exceeds the column. A name SHALL NOT wrap onto a second line, because a table scanned down its columns depends on every row having the same height, unlike the species cards where wrapping is required.

The line limit SHALL be declared as the platform's line-limit **attribute on the text element**, not as a style property. As a style declaration it is silently inert: the name wraps on device while the stylesheet reads as though the case were handled. The overflow the platform requires alongside that attribute, and the ellipsis, SHALL be in the stylesheet.

No name in the dataset SHALL reach that truncation at any target device width. Truncation is the guard for a dataset that later grows a longer name, not the mechanism the present one relies on — an ellipsis in the middle of a move name is less readable than either alternative, so the column has to be wide enough that none appears.

Widening SHALL come from the fixed columns beside it rather than from a smaller type size. Reducing the type was measured and rejected: fitting the widest name into the column the design study's widths left over would have taken 9.8px, smaller than every figure in the same row.

#### Scenario: The line limit is an attribute, not a style declaration

- **WHEN** the table's markup and stylesheet are inspected
- **THEN** the name element carries the line-limit attribute
- **AND** no stylesheet rule declares the line limit as a property

#### Scenario: No name is truncated at any target width

- **WHEN** every move name in the dataset is measured against the name column at each target device width, on a row carrying the bonus star
- **THEN** none exceeds the column
- **AND** every row in the table has the same height

##### Example: the name column against the widest name

The row is the device width less the chrome the panel sits inside — the root padding the overlay inherits, the panel border and the section padding. The fixed columns and, on a marked row, the star and its margins come off what is left.

| Device width | Row  | Name column | On a starred row | Widest name at 12px |
| ------------ | ---- | ----------- | ---------------- | ------------------- |
| 375px        | 315  | 187px       | 171px            | 160.5px             |
| 390px        | 330  | 202px       | 186px            | 160.5px             |
| 393px        | 333  | 205px       | 189px            | 160.5px             |
| 430px        | 370  | 242px       | 226px            | 160.5px             |

All 496 names fit in every row of this table, the narrowest case leaving 10.5px. The widest are Stomping Tantrum and Burning Jealousy at 160.5px each; the second is a Fire move, so on a Fire-typed form it carries the star and takes the 171px case.


<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: Bonus rows carry both a background and a real star text node

A row marked as receiving the bonus SHALL be distinguished by a background fill and by a star following the move name. The star SHALL be a real text node. The platform has no generated-content property, so a star produced by a pseudo-element would never appear.

The star SHALL remain legible on the bonus row's background in both colour modes. It is the signal that does not depend on the type colour, so it carries the bonus for the types whose glyph contrast on that background is lowest.

#### Scenario: A marked row shows both signals

- **WHEN** a row is marked as receiving the bonus
- **THEN** the row carries the bonus background and a star text node follows the move name

#### Scenario: The star is not a pseudo-element

- **WHEN** the stylesheet is searched for generated content on the move name
- **THEN** no rule produces the star through a pseudo-element


<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: Hover-dependent tooltips are absent and no substitute is added

The table SHALL NOT carry the design study's two hover tooltips: the move name in the other language, and the damage class's full name. Touch devices have no hover state.

Neither SHALL be replaced by a tap-to-expand control or an inline second column. The other language is reachable through the existing language control, which swaps which language leads for the whole table, and the design study's own reason for a single name column is that two languages across a long table are noise. The damage class is a closed set of three values whose row already carries the type as a glyph.

#### Scenario: No tooltip attributes on move rows

- **WHEN** a move row's elements are inspected
- **THEN** no element carries a hover-triggered tooltip

#### Scenario: The other language is reached through the language control

- **WHEN** the leading language is switched while the table is open
- **THEN** every move name changes to the other language and the row structure is unchanged


<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: A move with no Chinese name falls back to its English name

When Chinese leads and a move has no Chinese name, the name column SHALL render that move's English name. The table SHALL NOT render an empty name cell, and SHALL NOT mark the row as incomplete.

#### Scenario: A move with no Chinese name renders in English

- **WHEN** Chinese leads and the table renders a move whose Chinese name is absent
- **THEN** the name column shows that move's English name

##### Example: the two moves in the dataset with no Chinese name

| Move          | Chinese name | Rendered when Chinese leads |
| ------------- | ------------ | --------------------------- |
| Syrup Bomb    | absent       | Syrup Bomb                  |
| Matcha Gotcha | absent       | Matcha Gotcha               |

<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: The move table bounds its own height once it is long enough to need it

The move table SHALL declare a definite height and its own vertical scrolling container when the number of rows it currently displays exceeds a threshold, so that a long learnset scrolls within the table instead of lengthening the panel.

The height SHALL be expressed relative to the viewport rather than as the design study's literal `400px`. That figure was tuned for a browser no narrower than 500px; the panel body is itself bounded at `60vh`, so a 400px table consumes the whole visible panel on a phone and the panel becomes nothing but the move table. The height SHALL satisfy two bounds: it SHALL leave at least eight data rows visible below the column header on a 667px-tall viewport, and it SHALL NOT exceed two thirds of the panel body's height, because a table taller than that leaves the surrounding scrolling container with nothing to show.

The table SHALL NOT declare a maximum height in place of a definite one. A scrolling container whose height is only bounded above grows to its content and scrolls nothing — the same failure this project has already recorded twice.

When the displayed row count is at or below the threshold the table SHALL NOT apply the height, so that a short learnset renders at its content height with no empty region beneath it. The threshold SHALL be the number of data rows the declared height accommodates on the smallest target viewport, and the threshold and the height SHALL be defined together with their relationship stated, because a threshold larger than the height accommodates produces a bounded table that cannot scroll.

The count compared against the threshold SHALL be the number of rows currently displayed, not the species' total move count, so that the same-type filter removes the bound when it reduces the table below the threshold.

#### Scenario: A long learnset scrolls within the table

- **WHEN** the panel is open on the species with the largest learnset
- **THEN** the move table declares a definite height and its own vertical scrolling container
- **AND** the panel's height is not determined by the number of moves

#### Scenario: A short learnset is not bounded

- **WHEN** the panel is open on a species whose displayed move count is at or below the threshold
- **THEN** the move table declares no height
- **AND** no empty region appears beneath its last row

#### Scenario: The filter removes the bound

- **WHEN** the same-type filter reduces the displayed row count from above the threshold to at or below it
- **THEN** the move table stops declaring a height

#### Scenario: The height leaves the panel usable

- **WHEN** the move table is bounded
- **THEN** its height is at most two thirds of the panel body's height

##### Example: the declared height against its two bounds

| Viewport height | Panel body at 60vh | Table at 36vh | Data rows visible at ~22px | Share of body |
| --------------- | ------------------ | ------------- | -------------------------- | ------------- |
| 667px           | 400px              | 240px         | 10                         | 60%           |
| 812px           | 487px              | 292px         | 13                         | 60%           |
| 932px           | 559px              | 335px         | 15                         | 60%           |

The threshold is 12 rows rather than 13, so that a table which is bounded but has nothing to scroll does not occur on the taller viewports.

##### Example: which species are bounded

| Species          | Displayed rows | Bounded | Why                                          |
| ---------------- | -------------- | ------- | -------------------------------------------- |
| Gallade #475     | 105            | yes     | far above the threshold                       |
| Ditto #132       | 1              | no      | a bounded region would be an empty box        |
| Charizard #006   | 63             | yes     | above the threshold                           |
| Charizard #006 with the same-type filter on | 16 | yes | still above the threshold        |


<!-- @trace
source: bound-learnset-scroll
updated: 2026-07-30
code:
  - src/components/LearnsetTable.vue
  - design/HANDOFF.md
  - CLAUDE.md
  - ROADMAP.md
  - src/App.css
  - README.md
-->

---
### Requirement: The column header sits outside the table's scrolling container

The move table's column header SHALL sit outside the table's scrolling container, so that it stays in place while the rows scroll. A reader who has scrolled to the fiftieth row otherwise has six unlabelled columns.

The column header SHALL NOT depend on sticky positioning to stay in place, matching the panel header's arrangement.

The column header SHALL keep using the same column classes as the data rows, because shared classes are what aligns them. The header and the data rows SHALL share the same left edge for all six columns; a scrollbar that reserves width inside the scrolling container breaks that alignment, and the recorded remedy SHALL be to disable the scrolling container's scrollbar.

#### Scenario: The column header stays while rows scroll

- **WHEN** the move table is bounded and its rows are scrolled on a physical device
- **THEN** the column header remains in place
- **AND** no stylesheet rule uses sticky positioning to achieve it

#### Scenario: Header and rows stay aligned

- **WHEN** the move table is bounded
- **THEN** the six columns of the header share their left edge with the six columns of every data row


<!-- @trace
source: bound-learnset-scroll
updated: 2026-07-30
code:
  - src/components/LearnsetTable.vue
  - design/HANDOFF.md
  - CLAUDE.md
  - ROADMAP.md
  - src/App.css
  - README.md
-->

---
### Requirement: Nested scrolling is verified on a physical device and carries a recorded fallback

The platform's `scroll-view` element exposes no attribute that arbitrates between nested scrolling layers — the nested-scrolling attribute belongs to the `list` element, which this table cannot use because that element supports only append-at-end and this table sorts and filters. Which layer consumes a vertical drag is therefore unverified, and a web preview SHALL NOT be accepted as evidence, because it runs the browser's scrolling rather than the platform's gesture chain.

Acceptance SHALL include a physical-device check that a drag beginning on the move table scrolls the move table, and that a drag beginning elsewhere in the panel scrolls the panel. Whether the outer container takes over once the table reaches its end SHALL be recorded but SHALL NOT block acceptance.

A fallback SHALL be recorded before implementation, and it SHALL NOT depend on any further unverified platform behaviour. The recorded fallback SHALL be to collapse the move table behind a control that expands it, which solves the same problem — a panel no longer lengthened by the learnset — without any nested scrolling at all. The outcome of the device check SHALL be recorded in the design handoff document either way.

#### Scenario: A drag on the table scrolls the table

- **WHEN** the panel is open on the species with the largest learnset on a physical device
- **AND** a vertical drag begins on the move table
- **THEN** the move table scrolls

#### Scenario: The fallback needs no new platform facts

- **WHEN** the recorded fallback is read
- **THEN** it describes a collapsed table with a control that expands it
- **AND** it requires no platform behaviour that is unverified

#### Scenario: The device outcome is recorded

- **WHEN** the physical-device check has been carried out
- **THEN** its outcome is recorded in the design handoff document


<!-- @trace
source: bound-learnset-scroll
updated: 2026-07-30
code:
  - src/components/LearnsetTable.vue
  - design/HANDOFF.md
  - CLAUDE.md
  - ROADMAP.md
  - src/App.css
  - README.md
-->

---
### Requirement: The table does not use the platform list binding

The table SHALL NOT use the platform's list binding. That binding appends only at the tail, ignores the anchor it is passed, and reports neither removals nor updates, so a sequence that shrinks under a filter retains stale rows and a sequence that is reordered pairs cells with the wrong content. Sorting and filtering both change this sequence.

This holds regardless of the table having a scrolling container of its own. The nested-scrolling attribute that the list binding carries and this platform's `scroll-view` lacks is not a reason to reach for it: the binding cannot render a sequence that sorts and filters at all.

Every row of the active result set SHALL be reachable, no row SHALL render blank, and no row SHALL pair one move's name with another move's values.

#### Scenario: The longest learnset is reachable by scrolling the table

- **WHEN** a reviewer opens the species with the largest learnset on a physical device and scrolls the table to its end
- **THEN** every row is reachable, no row renders blank, and no row pairs a name with another row's values

##### Example: the largest and smallest learnsets in the dataset

| Species        | National no. | Rows | Notes                                                      |
| -------------- | ------------ | ---- | ---------------------------------------------------------- |
| Gallade        | 475          | 105  | the largest learnset; bounded, 2520px of rows in a 292px window |
| Ditto          | 132          | 1    | the smallest learnset; one status move only, never bounded  |

<!-- @trace
source: bound-learnset-scroll
updated: 2026-07-30
code:
  - src/components/LearnsetTable.vue
  - design/HANDOFF.md
  - CLAUDE.md
  - ROADMAP.md
  - src/App.css
  - README.md
-->