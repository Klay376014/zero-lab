## ADDED Requirements

### Requirement: A layer type holds at most one instance, and re-entry unwinds

The application SHALL hold an ordered stack of open layers above the active tab. A layer SHALL be one of exactly three types: species detail, move detail, and learner list.

Opening a layer whose type is not present in the stack SHALL push it onto the top. Opening a layer whose type is already present SHALL discard every layer above it and replace that layer's content, rather than pushing a second instance.

The stack SHALL therefore never hold two layers of the same type, and its depth SHALL never exceed three.

Without this rule the navigation graph is a cycle — species detail leads to move detail, move detail leads to the learner list, and the learner list leads back to species detail — so a reader moving between related entries accumulates layers without bound. Bounding the stack by refusing to open more than a fixed number of layers is rejected: it would make a legitimate navigation step fail rather than resolve.

#### Scenario: Opening an absent layer type pushes it

- **WHEN** the stack holds only species detail and move detail is opened
- **THEN** the stack holds species detail then move detail

#### Scenario: Opening a present layer type unwinds to it

- **WHEN** the stack holds species detail, move detail and the learner list, and species detail is opened for another species
- **THEN** the stack holds only species detail
- **AND** it shows the newly opened species

#### Scenario: The stack never holds two of a type

- **WHEN** any sequence of layer openings has been performed
- **THEN** no two layers in the stack have the same type

##### Example: one full cycle from each tab

| Step                                            | Stack after the step                              | Depth |
| ----------------------------------------------- | ------------------------------------------------- | ----- |
| dex tab, no layer                               | (empty)                                           | 0     |
| open species detail for species A               | species detail                                    | 1     |
| open move detail for a move in A's learnset     | species detail, move detail                       | 2     |
| open the learner list for that move             | species detail, move detail, learner list         | 3     |
| choose species B from the learner list          | species detail                                    | 1     |
| moves tab, no layer                             | (empty)                                           | 0     |
| open move detail for move X                     | move detail                                       | 1     |
| open the learner list for move X                | move detail, learner list                         | 2     |
| choose species B from the learner list          | move detail, learner list, species detail         | 3     |
| open move detail for a move in B's learnset     | move detail                                       | 1     |

##### Example: the cycle does not accumulate

- **GIVEN** the stack is empty on the dex tab
- **WHEN** the sequence of opening species detail, move detail, the learner list, and then a learner is performed ten times in succession
- **THEN** the stack depth after every step is at most 3
- **AND** the stack depth after the tenth cycle is 1

---

### Requirement: Closing removes only the topmost layer

Closing SHALL remove the topmost layer and SHALL leave every layer beneath it, along with its content and its scroll position, unchanged. Closing the last remaining layer SHALL return the reader to the active tab.

No history of visited content SHALL be kept beyond the stack itself. Closing SHALL NOT restore a layer that an earlier unwinding discarded.

#### Scenario: A layer beneath is undisturbed

- **WHEN** species detail is scrolled to its learnset table, move detail is opened, and move detail is then closed
- **THEN** species detail is showing the same content at the same scroll position as before move detail opened

#### Scenario: Closing the last layer returns to the tab

- **WHEN** the stack holds one layer and it is closed
- **THEN** the active tab is shown
- **AND** the stack is empty

#### Scenario: A discarded layer is not restored

- **WHEN** the stack holds species detail, move detail and the learner list, a learner is chosen, and the resulting species detail is then closed
- **THEN** the active tab is shown
- **AND** neither move detail nor the learner list is shown

---

### Requirement: The stack is held separately from the active tab and from the selection

The layer stack SHALL be held by a module of its own, exposing the stack, a named function to open a layer of a given type with its content, and a named function to close the topmost layer.

That module SHALL NOT be owned by the module holding the active tab, because the two change independently: a tab switch leaves the stack intact, and a layer opening leaves the active tab intact.

The content a layer carries SHALL be identified by the value the layer is about — a species and its form for species detail, a move index for move detail and for the learner list — rather than by the layer's position in the stack. Position identifies a different layer under each stack shape.

#### Scenario: A tab switch leaves the stack intact

- **WHEN** the stack holds two layers and the other tab is activated
- **THEN** the stack still holds the same two layers with the same content

#### Scenario: Opening a layer leaves the active tab intact

- **WHEN** a layer is opened
- **THEN** the active tab is unchanged

#### Scenario: A layer is identified by its content, not its position

- **WHEN** the stack unwinds and a layer's content is replaced
- **THEN** the layer reports the content it was opened with
- **AND** not the content of the layer that previously occupied that position
