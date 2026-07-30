## ADDED Requirements

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

## REMOVED Requirements

### Requirement: The table declares no scrolling container and does not use the platform list binding

**Reason**: Its first half is the prohibition this change reverses — the table now declares both a definite height and a scrolling container of its own, above the row threshold. Its second half, the prohibition on the platform list binding, is unaffected and outlives it: that binding still cannot render a sequence that sorts and filters, and the table still sorts and filters.

**Migration**: The scrolling container and the maximum height are now specified by "The move table bounds its own height once it is long enough to need it" above, which replaces the prohibition with a bound and a threshold. The list-binding prohibition and the reachability guarantee move to "The table does not use the platform list binding" above, unchanged in substance. The panel-wide count of scrolling containers is governed by the `species-detail` capability, which now permits this table as its one exemption.
