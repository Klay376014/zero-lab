## ADDED Requirements

### Requirement: The card area scrolls in a plain scrolling container, not the recycling list element

The species grid SHALL be rendered inside the platform's plain scrolling container. It SHALL NOT be rendered by the platform's recycling list element, because that element's framework binding implements only append-at-end: item insertion ignores the requested position, and the remove and update actions it reports to the native list are always empty. A sequence that shrinks under a filter therefore keeps its stale items, and a sequence that is reordered by a sort pairs cell content with the wrong species. Third-party virtual-scrolling packages SHALL NOT be introduced, because they depend on host DOM measurement that the platform's dual-thread architecture does not provide.

The framework binding's behaviour SHALL be treated as the authority over the framework's own prose documentation, which describes move detection and reordering support the shipped code does not contain.

This choice SHALL be revisited when the framework binding implements the remove and update actions. The revisit trigger and the evidence behind the current choice SHALL be recorded in the design handoff document, so that a later reader does not mistake it for a standing preference.

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

#### Scenario: Node growth is measured on a physical device

- **WHEN** a reviewer scrolls from the first card to the last on a physical device
- **THEN** the observed node and memory growth is recorded in the design handoff document
- **AND** when the growth is unacceptable, a self-managed visible-range window is engaged and recorded

### Requirement: Card identity is composed from species and form, never from position

Every card SHALL carry a reconciliation key composed from the species national number together with the form index the card displays. The key SHALL NOT be derived from the card's position in the rendered sequence, because filtering and sorting change both the length and the order of that sequence, and a position-derived key makes the framework reuse an existing card component for a different species.

The form index SHALL be part of the key, because one species renders a different form under different type filters, and a key carrying only the number would let the framework treat those as the same card and retain the previous form's sprite load state.

#### Scenario: Key is present and position-independent

- **WHEN** a rendered card is inspected
- **THEN** its key is composed from the species national number and the displayed form index
- **AND** the key does not change when the same species moves to a different position under a different sort

#### Scenario: Identity survives reordering

- **WHEN** a filter or sort change reorders the rendered sequence
- **THEN** no card displays the name, artwork, or types of a species other than the one its key names

#### Scenario: Changing the displayed form resets the card's load state

- **WHEN** a type filter changes which form a species' card displays
- **THEN** the card renders the new form's artwork rather than retaining the previous form's load state

##### Example: key composition

| Species        | Displayed form   | Form index | Key   |
| -------------- | ---------------- | ---------- | ----- |
| Venusaur       | base             | 0          | 3-0   |
| Venusaur       | Mega Venusaur    | 1          | 3-1   |
| Charizard      | Mega Charizard X | 1          | 6-1   |
| Ditto          | base             | 0          | 132-0 |

### Requirement: The grid lays out columns as a proportion of the row

Columns SHALL be produced by a row-direction wrapping container whose cells take a fixed proportion of the row width, so that the column count follows from that proportion alone. The proportion SHALL be declared in exactly one place and SHALL NOT be derived from a platform screen-width query.

Cells SHALL NOT be given a fixed pixel width. The design document's fixed card width was chosen for a browser no narrower than five hundred pixels; on the handheld widths this port targets the same value leaves room for only one column, wasting half the row and making a two-hundred-species grid unscannable. A proportion holds the column count across every target width instead.

Because the platform's box model counts padding and border inside a declared width, two cells at half the row SHALL fill it exactly. The gutter between cards SHALL therefore be cell padding rather than margin, since margin would push the second cell onto its own row.

Artwork SHALL remain at its own pixel size, centred in the cell, so that a proportional cell width does not disturb the whole-number upscaling the artwork depends on.

#### Scenario: Proportional cells in a wrapping container

- **WHEN** the grid's card area is inspected
- **THEN** its container lays out in the row direction and wraps
- **AND** each cell's width is a proportion of the row, declared in one place
- **AND** no screen-width query decides the column count
- **AND** no cell carries a fixed pixel width

#### Scenario: The column count holds across target widths

- **WHEN** the grid is rendered at any handheld width the port targets
- **THEN** the number of columns is the same

##### Example: what the proportion has to survive

| Device width | Available after chrome | Fixed 164px card | Half-row cell |
| ------------ | ---------------------- | ---------------- | ------------- |
| 375          | 309                    | 1 column         | 2 columns     |
| 390          | 324                    | 1 column         | 2 columns     |
| 393          | 327                    | 1 column         | 2 columns     |
| 430          | 364                    | 2 columns        | 2 columns     |

#### Scenario: Artwork keeps its own size inside a proportional cell

- **WHEN** a card is rendered in a cell wider or narrower than the artwork
- **THEN** the artwork renders at its own pixel size, centred, rather than stretched to the cell

### Requirement: Content taller than one screen declares its own scrolling

Because the platform does not scroll a page automatically, any region taller than one screen SHALL declare its own scrolling container. The masthead and the query bar SHALL sit outside the list so that they stay fixed while cards scroll. The list SHALL NOT be nested inside another scrolling container, because two nested scrolling layers compete for the same gesture.

#### Scenario: The last card is reachable

- **WHEN** a reviewer scrolls the card area to its end on a physical device
- **THEN** the final card of the current result set is fully visible

#### Scenario: The query bar does not scroll away

- **WHEN** the card area is scrolled
- **THEN** the masthead and the query bar remain in place

#### Scenario: No nested scrolling containers

- **WHEN** the grid's element tree is inspected
- **THEN** the card area's scrolling container has no other scrolling container among its ancestors inside the screen region

### Requirement: The reveal animation plays once on first paint

Cards SHALL be revealed in a staggered sequence on first paint. Every animation SHALL use stepped timing rather than smooth easing, because the hardware era this interface quotes had no tweening and smooth easing reads as the wrong era. The per-card delay SHALL increase with the card's index up to a fixed cap, beyond which every card carries the cap's delay, because a delay that grows without limit across the full result set leaves the last card waiting seconds. The animation SHALL be gated on a boot flag that is removed once the first paint completes, so that cards entering the sequence later do not replay it. A change to the query SHALL NOT replay it, because replaying on every keystroke makes the control feel slower than it is.

#### Scenario: Stagger on first paint only

- **WHEN** the app reaches its first paint
- **THEN** cards appear in a staggered sequence using stepped timing

#### Scenario: Cards entering later do not replay the reveal

- **WHEN** a card enters the rendered sequence after the boot flag has been removed
- **THEN** it appears without the reveal animation

#### Scenario: Query changes do not replay the reveal

- **WHEN** the search string, a filter, or the sort order changes
- **THEN** the resulting cards appear without the reveal animation

##### Example: delay is capped

| Card index | Delay              |
| ---------- | ------------------ |
| 0          | zero               |
| 10         | ten delay steps    |
| 26         | the cap            |
| 100        | the cap            |
| 207        | the cap            |

### Requirement: An empty result set is stated rather than blank

When the active query matches no species, the card area SHALL render explanatory text drawn from the string table. It SHALL NOT render an empty region, and it SHALL NOT report an error to the console, because an empty result is a normal outcome of filtering.

#### Scenario: No matches renders explanatory text

- **WHEN** the active query matches no species
- **THEN** the card area renders the localised empty-result string
- **AND** the console reports no error

#### Scenario: Recovering from an empty result

- **WHEN** the query is changed from one that matches no species to one that matches at least one
- **THEN** the matching cards render and the empty-result text is removed
