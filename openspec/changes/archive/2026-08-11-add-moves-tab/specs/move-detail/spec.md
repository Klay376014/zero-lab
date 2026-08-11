## ADDED Requirements

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

---

### Requirement: Move flags are carried by the data layer and are not displayed

Move detail SHALL NOT display move flags in this capability's current form. The flag identifiers the `dex-data` capability requires the dataset to carry SHALL remain unread by the interface.

The flags describe the mainline games, while 401 of the 496 moves carry retuned figures in this dataset, so displaying them would assert mainline mechanics about a game that retunes them. Separately, 71 moves carry no flags at all because the upstream source has not recorded them, which is not the same statement as those moves lacking the properties — and no display can distinguish the two without a decision that has not been made.

#### Scenario: No flag is rendered

- **WHEN** move detail is open for a move that carries flag identifiers
- **THEN** no flag is stated

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

---

### Requirement: Move detail declares its own scrolling container only if its description overflows

Move detail SHALL be rendered as a layer whose content fits without a nested scrolling container under normal content. Its longest description is 46 characters, and its remaining content is a fixed set of six figures and one control.

If the layer's content does not fit the available height, the layer itself SHALL scroll as a single container. Move detail SHALL NOT introduce a second, nested scrolling region for any of its sections, consistent with the limit the `species-detail` capability places on nested scrolling.

#### Scenario: The layer holds exactly one scrolling container

- **WHEN** move detail is open and its element tree is inspected
- **THEN** it declares at most one scrolling container

#### Scenario: The longest description is readable without a nested scroll

- **WHEN** move detail is open for the move with the longest Chinese description, which is 46 characters
- **THEN** the description is readable without a nested scrolling region
