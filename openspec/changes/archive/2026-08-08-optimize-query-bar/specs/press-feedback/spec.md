## MODIFIED Requirements

### Requirement: Press feedback covers the control set and excludes the card sequence and the veil

Press feedback SHALL be carried by the mode button, the language button, the query reset button, the sort cycle button, every type filter button, every form button, every move sort button, the same-type-bonus button, the detail panel's close button, every move row in the learnset table, and the learner list's close button.

The control set names one sort button, not several. The query bar states the sort order as a single button whose text is the order in force, so there is exactly one control to press and exactly one to displace.

No generation filter button appears in the control set, because the query bar presents no control that selects a generation.

The species cards SHALL NOT carry press feedback. Binding three main-thread events to each of the two hundred and eight cells would add those bindings to the one path this project has measured as slower than expected — the first paint of the full card sequence — and a card already answers a press by opening the detail panel.

The learner list's species entries SHALL NOT carry press feedback, for the same two reasons and by the same measure: a single move reaches up to two hundred and seven species, and an entry already answers a press by replacing the detail panel's species. The move rows that open that list are bounded differently — the largest learnset section holds one hundred and five moves, and rows are the control that has no other way to announce itself as one.

The detail panel's veil SHALL NOT carry press feedback. A pressed appearance on the veil would present it as a control, when its only behaviour is to dismiss the panel.

The learner list's veil SHALL NOT carry press feedback, for the same reason as the detail panel's veil.

#### Scenario: The sort cycle button is pressed

- **WHEN** the query bar's sort button is pressed
- **THEN** the button is displaced by the press mark
- **AND** the sort order advances to the next member of the sort set on release

#### Scenario: A card is pressed

- **WHEN** a species card is pressed
- **THEN** the card is not displaced
- **AND** the detail panel opens for that card's species and displayed form

#### Scenario: The veil is pressed

- **WHEN** the detail panel's veil is pressed
- **THEN** the veil is not displaced
- **AND** the panel closes

#### Scenario: A move row is pressed

- **WHEN** a move row in the learnset table is pressed
- **THEN** the row is displaced by the press mark
- **AND** the learner list opens for that row's move on release

#### Scenario: A learner entry is pressed

- **WHEN** a species entry in the learner list is pressed
- **THEN** the entry is not displaced
- **AND** the detail panel is replaced with that species on release

#### Scenario: The learner list's veil is pressed

- **WHEN** the learner list's veil is pressed
- **THEN** the veil is not displaced
- **AND** the learner list closes

##### Example: the two bounded sequences and the choice each one drives

| Sequence                  | Largest size | Carries the mark | Why                                                        |
| ------------------------- | ------------ | ---------------- | ---------------------------------------------------------- |
| species cards in the grid | 208          | no               | the measured first-paint path; a card announces itself      |
| learner list entries      | 207          | no               | same measure; an entry announces itself                     |
| move rows in one section  | 105          | yes              | the row has no other signal that it became a control        |
| type filter buttons       | 18           | yes              | bounded, and each is a control with no other press signal   |
