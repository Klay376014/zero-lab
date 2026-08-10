## MODIFIED Requirements

### Requirement: The card area scrolls in a plain scrolling container, not the recycling list element

The species grid SHALL be rendered inside the platform's plain scrolling container. It SHALL NOT be rendered by the platform's recycling list element, because that element's framework binding implements only append-at-end: item insertion ignores the requested position, and the remove and update actions it reports to the native list are always empty. A sequence that shrinks under a filter therefore keeps its stale items, and a sequence that is reordered by a sort pairs cell content with the wrong species. Third-party virtual-scrolling packages SHALL NOT be introduced, because they depend on host DOM measurement that the platform's dual-thread architecture does not provide.

The framework binding's behaviour SHALL be treated as the authority over the framework's own prose documentation, which describes move detection and reordering support the shipped code does not contain.

This choice SHALL be revisited when the framework binding implements the remove and update actions. The revisit trigger and the evidence behind the current choice SHALL be recorded in the design handoff document, so that a later reader does not mistake it for a standing preference. When the trigger is re-examined and found still unmet, that re-examination SHALL be recorded too, so the question is not re-opened from scratch each time it is asked.

Because the plain scrolling container does not recycle, the grid SHALL bound the number of cards that exist at once by materialising only the visible range and its buffer, as the visible-range window capability defines. The measured node growth that this requirement previously left as a condition has been taken: the platform charges roughly one and a third milliseconds per element, and an unfiltered grid of two hundred and eight cards holds about four thousand elements.

The window SHALL target roughly ten visible cards, which at two cards to a row is about five rows.

#### Scenario: Cards sit inside the scrolling container

- **WHEN** the grid renders
- **THEN** every card is a descendant of one plain scrolling container
- **AND** no recycling list element is present in the grid

#### Scenario: No third-party scrolling package

- **WHEN** the project's runtime dependencies are inspected
- **THEN** no virtual-scrolling or windowing package is present

#### Scenario: A filtered sequence drops its removed cards

- **WHEN** a filter reduces the result sequence
- **THEN** the card area shows exactly the remaining results
- **AND** no card from the previous result set stays on screen

#### Scenario: Only the visible cards and their buffer exist

- **WHEN** the unfiltered grid is rendered at the top of its scrolling container
- **THEN** the cards that exist are those of the visible range plus the buffer
- **AND** no card element exists for a species outside that range

#### Scenario: Scrolling the whole roster shows every card

- **WHEN** a reviewer scrolls from the first card to the last on a physical device
- **THEN** no cell renders blank and no card shows another species' name, artwork, or types
- **AND** the observed wait is recorded in the design handoff document
