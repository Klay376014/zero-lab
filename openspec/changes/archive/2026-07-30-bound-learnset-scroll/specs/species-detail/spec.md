## REMOVED Requirements

### Requirement: The panel has exactly one scrolling container and its header sits outside it

**Reason**: The requirement forbade the learnset section from bounding its own height, and the cost of that prohibition was accepted and recorded at the time: the panel is as long as its content, so the species with the largest learnset produces a panel whose move table can only be reached after scrolling past roughly five hundred pixels of artwork, attributes, base stats and abilities. The move table is the part of the panel a reader compares back and forth across, and it was the hardest part to reach. The prohibition is replaced rather than deleted — the panel body and the move table are now the only two scrolling containers permitted, and every other region is still forbidden one.

**Migration**: Replaced by "The panel's scrolling containers are limited to the panel body and the learnset table" below. The header-outside-the-container arrangement and the prohibition on sticky positioning carry over unchanged. The learnset table's own bound and column header are specified in the `learnset-table` capability.

## ADDED Requirements

### Requirement: The panel's scrolling containers are limited to the panel body and the learnset table

The panel's content SHALL sit inside a scrolling container, and the panel's header SHALL sit outside that container so that it stays in place while the content scrolls.

Exactly two scrolling containers SHALL be permitted inside the panel: the panel body, and the learnset table's own bounded region. No other region inside the panel SHALL declare a scrolling container, because two nested scrolling layers compete for the same gesture and the platform's `scroll-view` element exposes no attribute that arbitrates between them. The exemption SHALL be limited to the learnset table — a second bounded region anywhere else in the panel is a violation rather than a precedent.

The learnset table's region SHALL be governed by the `learnset-table` capability, which owns the bound, the threshold at which it applies, and the physical-device verification that the two layers do not fight.

Sticky positioning SHALL NOT be used to hold either header in place. A header placed outside its scrolling container reaches the same result without depending on that positioning mode.

#### Scenario: Two scrolling containers at most

- **WHEN** the open panel's element tree is inspected
- **THEN** the panel body is a scrolling container
- **AND** the only scrolling container among its descendants is the learnset table's own region
- **AND** no other section inside the panel declares a scrolling container

#### Scenario: The header stays while content scrolls

- **WHEN** the panel's content is scrolled on a physical device
- **THEN** the panel header remains in place
- **AND** no stylesheet rule uses sticky positioning to achieve it

#### Scenario: The last section is reachable

- **WHEN** a reviewer scrolls the panel content to its end on a physical device
- **THEN** the final section is fully visible

#### Scenario: A gesture outside the learnset table scrolls the panel

- **WHEN** the panel is open on the species with the largest learnset on a physical device
- **AND** a vertical drag begins on a region other than the learnset table
- **THEN** the panel body scrolls

##### Example: which regions are permitted a scrolling container

| Region                                   | Scrolling container | Why                                                        |
| ---------------------------------------- | ------------------- | ---------------------------------------------------------- |
| panel body                               | yes                 | the panel's own content is taller than the panel           |
| learnset table                           | yes                 | bounded by the `learnset-table` capability, one exemption   |
| base stats section                       | no                  | six rows, never taller than the body                       |
| abilities section                        | no                  | at most three blocks                                       |
| artwork stage                            | no                  | fixed 192px                                                |
| attribute list                           | no                  | four rows                                                  |
