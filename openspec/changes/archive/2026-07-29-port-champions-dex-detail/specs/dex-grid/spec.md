## ADDED Requirements

### Requirement: The grid cell is the tap target and reports the species with the form it displays

Each grid cell SHALL accept a tap and report the cell's species together with the form index that cell is displaying. The report SHALL carry the displayed form index rather than the species' first form, because a type filter chooses which form each cell shows and opening the first form would contradict what the user tapped.

The tap SHALL be bound on the cell element the grid itself writes, and SHALL NOT be bound on the card component and left to reach an element by attribute fall-through. The measured lesson behind this is recorded in the design handoff document: a binding placed on a component rather than on an element the template owns has an uncertain landing point, and a binding that never lands is indistinguishable from a platform that ignores it.

The card component SHALL remain presentational. It SHALL NOT gain tap handling, selection awareness, or any knowledge of the detail panel, because which form it draws is already its caller's decision.

#### Scenario: Tap reports the displayed form

- **WHEN** a cell is tapped
- **THEN** the grid reports that cell's species and the form index that cell was displaying

##### Example: what a tap reports

| Active type filter | Cell shown for Charizard | Reported form index |
| ------------------ | ------------------------ | ------------------- |
| none               | base                     | 0                   |
| Dragon             | Mega Charizard X         | 1                   |
| Flying             | base                     | 0                   |

#### Scenario: The binding is on the grid's own element

- **WHEN** the grid's template is inspected
- **THEN** the tap binding is on the cell element the grid writes
- **AND** no tap binding is placed on the card component

#### Scenario: The card stays presentational

- **WHEN** the card component's source is inspected
- **THEN** it contains no tap handling and no reference to selection state or the detail panel

---

### Requirement: The grid does not own the selection

The grid SHALL NOT hold the selected species or the selected form index. That state belongs to the selection state module, and a second copy inside the grid would let the two disagree.

The grid's own state SHALL remain unchanged while the detail is open: its scroll position, its reveal flag, and the active query SHALL be unaffected by opening or closing the detail.

#### Scenario: No selection state in the grid

- **WHEN** the grid's source is inspected
- **THEN** it declares no selected species and no selected form index

#### Scenario: Grid state survives the detail

- **WHEN** the grid is scrolled, a cell is tapped, and the detail is closed
- **THEN** the grid's scroll position is unchanged and the reveal animation does not replay
