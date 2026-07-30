## ADDED Requirements

### Requirement: The panel lists the form's learnset after its abilities

The panel SHALL render the displayed form's learnset as its final section, following the base stats and the abilities. The learnset section SHALL be the fifth and last section inside the scrolling container.

The panel SHALL hand the learnset table the displayed form and nothing else, following the arrangement already used for the base stats, which receive the six numbers rather than the species. The panel SHALL NOT compute the same-type attack bonus, sort the moves, or filter them; those belong to the learnset capability.

#### Scenario: The learnset is the last section

- **WHEN** the panel is open and its content is scrolled to the end
- **THEN** the learnset section is the final section and is fully visible

#### Scenario: The panel does not compute learnset behaviour

- **WHEN** the panel component is inspected
- **THEN** it contains no bonus computation, no move sorting and no move filtering

## MODIFIED Requirements

### Requirement: The panel has exactly one scrolling container and its header sits outside it

The panel's content SHALL sit inside exactly one scrolling container. The panel's header SHALL sit outside that container so that it stays in place while the content scrolls. No region inside the panel SHALL declare its own scrolling container, because two nested scrolling layers compete for the same gesture. This SHALL hold for the learnset section in particular: the design study gave the move table its own bounded scrolling region, and that region SHALL NOT be reproduced here.

Sticky positioning SHALL NOT be used to hold the header in place. A header placed outside the scrolling container reaches the same result without depending on that positioning mode. The design study also held the move table's column header in place with sticky positioning; that column header SHALL likewise not depend on it.

#### Scenario: One scrolling container

- **WHEN** the open panel's element tree is inspected
- **THEN** it contains exactly one scrolling container
- **AND** no descendant of that container is itself a scrolling container

#### Scenario: The header stays while content scrolls

- **WHEN** the panel's content is scrolled on a physical device
- **THEN** the header remains in place
- **AND** no stylesheet rule uses sticky positioning to achieve it

#### Scenario: The last section is reachable

- **WHEN** a reviewer scrolls the panel content to its end on a physical device
- **THEN** the final section is fully visible

#### Scenario: The learnset section adds no scrolling layer

- **WHEN** the panel is open on the species with the largest learnset
- **THEN** the panel still contains exactly one scrolling container
- **AND** the learnset section declares neither a maximum height nor a scrolling container of its own
