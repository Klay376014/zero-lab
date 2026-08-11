## MODIFIED Requirements

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
