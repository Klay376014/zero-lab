## MODIFIED Requirements

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
