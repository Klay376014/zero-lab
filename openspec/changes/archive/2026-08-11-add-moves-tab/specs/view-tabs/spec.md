## ADDED Requirements

### Requirement: The application presents exactly two tabs

The application SHALL present two mutually exclusive tabs: a dex tab holding the species grid with its query bar, and a moves tab holding the move index. Exactly one SHALL be active at any time, and the dex tab SHALL be active at startup.

The set SHALL be closed at two. A third tab is a new decision rather than an addition, because the tab control's layout is sized for two and the shell surface it occupies is fixed.

#### Scenario: The dex tab is active at startup

- **WHEN** the application starts
- **THEN** the dex tab is active
- **AND** the species grid is shown

#### Scenario: Exactly one tab is active

- **WHEN** the moves tab is activated
- **THEN** the moves tab is active
- **AND** the species grid is not rendered

---

### Requirement: Switching tabs preserves the other tab's state

Activating a tab SHALL NOT reset the state of the tab being left. The query bar's search text, type filters, Mega-only and multi-form-only filters, and sort order SHALL survive a switch away and back. The scroll position of each tab's sequence SHALL survive likewise, through the same mechanism that already preserves scroll position across reactive updates.

Switching tabs SHALL NOT clear the layer stack and SHALL NOT change the content of any layer, as the `layer-stack` capability defines.

#### Scenario: Query state survives a round trip

- **WHEN** the dex tab's query is narrowed by a search term and a type filter, the moves tab is activated, and the dex tab is then activated again
- **THEN** the same search term and type filter are still applied
- **AND** the same result sequence is shown

#### Scenario: Switching does not disturb the layer stack

- **WHEN** a layer is open and the other tab is activated
- **THEN** the layer stack is unchanged

---

### Requirement: The tab control is drawn on the shell, outside the screen

The two tab controls SHALL be rendered inside the shell view and outside the screen view, so that they sit on the device's bezel rather than within its display area. They SHALL NOT be rendered inside the masthead, the query bar, or any scrolling container.

Both controls SHALL be visible at all times. Neither SHALL be reachable only through a menu, a drawer, or any control that opens a layer, because a tab that requires opening something to reach it inverts the relationship between the tab and the layer stack.

The active control SHALL be distinguished by a filled background rather than by a border, for the reason the `retro-theme` capability records: POCKET resolves the accent token and the line token to the same tone, so a border cannot tell the two states apart.

Each control SHALL carry the press mark and its three main-thread touch bindings — start, end and cancel — as the `press-feedback` capability requires of the control set.

#### Scenario: The controls are siblings of the screen, not descendants

- **WHEN** the element tree is inspected
- **THEN** both tab controls are descendants of the shell view
- **AND** neither is a descendant of the screen view

#### Scenario: Both tabs are visible without opening anything

- **WHEN** the application is showing either tab with no layer open
- **THEN** both tab controls are visible

#### Scenario: The active tab is filled, not outlined

- **WHEN** the tab controls are rendered in POCKET mode
- **THEN** the active control is distinguished by its background fill
- **AND** the two controls are distinguishable from each other

---

### Requirement: The active tab is shared reactive state

The active tab SHALL be held by a module of its own, exposing the active tab and a named function to activate a tab. That module SHALL NOT be owned by the module that holds the species selection, nor by the module that holds the layer stack.

The module SHALL NOT introduce a routing dependency. The two tabs are mutually exclusive and are not addressed from outside the application, so a router's history contributes nothing that the layer stack's own unwinding rule does not already own.

#### Scenario: Activating a tab is a named operation

- **WHEN** a tab is activated
- **THEN** the module reports that tab as active

#### Scenario: The tab module does not own the selection

- **WHEN** the module holding the active tab is inspected
- **THEN** it does not hold the species selection
- **AND** it does not hold the layer stack
