## MODIFIED Requirements

### Requirement: Card height is stable when optional rows are empty

The alternate name row and the form label row SHALL reserve their height when their content is empty, so cards of differing content align on a shared baseline.

The cell a card is placed in SHALL reserve a minimum height, so that every card draws the same height as every other card, not merely the same height as the card beside it.

Reserving SHALL be expressed as a minimum height, the mechanism the alternate name and form label rows already use. It SHALL NOT be expressed as a fixed height, and SHALL NOT be expressed by limiting any text to a number of lines: both would push a name that wraps outside the card, which the requirement that long names wrap forbids.

The reservation SHALL be a figure measured on a physical device rather than computed. The stylesheet declares no height for a card and no line height for the text inside it, so no figure can be summed out of source; and character widths follow the pixel face's own metrics, which the web preview does not load, so a width measured there is a measurement of a different face.

Uniform card height is what allows the grid to render only a visible range: a window derives which rows to render from a scroll offset and one row height, and rows of differing heights make that derivation drift.

#### Scenario: Base form leaves the form label empty

- **WHEN** a card renders a form whose label is empty
- **THEN** the form label row reserves its height and the card's overall height matches a card whose form label is present

#### Scenario: A card shorter than the reservation still fills its row

- **WHEN** a card's content is shorter than the reserved height
- **THEN** the card draws the reserved height rather than its content height

#### Scenario: A name is never clipped to hold the reservation

- **WHEN** any card's text would exceed the reserved height
- **THEN** the text remains fully visible
- **AND** no fixed height and no line limit is applied to hold the card at the reservation

#### Scenario: Every card in the grid draws one height

- **WHEN** the grid is rendered on a physical device with the pixel face loaded
- **THEN** every card outline measures the same height, in both leading languages

#### Scenario: The reservation is measured, not computed

- **WHEN** the reserved height is chosen
- **THEN** it comes from a measurement taken on a physical device
- **AND** the measured figure and the cases it was taken from are recorded in the design handoff document

##### Example: the cases the reservation was measured against

| Case                         | Value                       | Lines it occupies on device |
| ---------------------------- | --------------------------- | --------------------------- |
| Longest Latin species name   | Crabominable                | 1                           |
| Longest Chinese species name | 赫拉克羅斯                   | 1                           |
| Longest Latin form label     | Paldean Form (Combat Breed) | 1                           |
| Longest Chinese form label   | 帕底亞的樣子（鬥戰種）         | 1                           |
