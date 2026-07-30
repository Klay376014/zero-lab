## ADDED Requirements

### Requirement: A control's press mark is drawn on the main thread without a thread crossing

Every control listed in the press-feedback control set SHALL render its pressed appearance from a function that executes on the main thread, declared with the platform's main-thread directive and bound through the platform's main-thread event attributes. The pressed appearance SHALL NOT depend on the background thread having run any handler, recomputed any state, or dispatched any render operation.

This exists because the platform's event dispatch and the framework's handlers live on different threads, and the round trip between them is unbounded: pressing the type filter dispatches a handler that re-filters every species and re-renders the whole card sequence before the control itself could otherwise change. A control that stays visually inert for that long reads as one that did not receive the press.

The existing tap bindings SHALL remain unchanged and SHALL remain the only thing that changes application state. The main-thread functions SHALL NOT modify application state, SHALL NOT call the platform's background-thread invocation helper, and SHALL NOT hold a main-thread reference to any element; they SHALL read only the target the event carries.

#### Scenario: A control is pressed while the background thread is busy

- **WHEN** a control that carries press feedback is pressed while the background thread is occupied recomputing the query result
- **THEN** the control's pressed appearance is drawn without waiting for that work to finish
- **AND** the control's own tap behaviour still occurs when the background thread reaches it

#### Scenario: The press mark carries no state change of its own

- **WHEN** a control is pressed and released with no other input
- **THEN** the query state, the selection state and the display state hold the values they held before the press, other than whatever that control's own tap binding changes

### Requirement: The press mark is a positional shift, never a colour or transparency change

A pressed control SHALL be marked by displacing it one pixel downward. It SHALL NOT be marked by altering any colour, by altering opacity, or by adding a shadow.

Three separate contracts forbid the alternatives. Reducing opacity would compose tones outside the four-tone ramp, which the theme specification permits for the detail veil alone and names explicitly as not a precedent. Repainting the control with the accent token would make an unselected control momentarily indistinguishable from a selected one, because the accent token is what carries the selected state. An inset shadow is ignored by the platform and is rejected by the project's own stylesheet check.

The displacement SHALL be expressed once in the stylesheet rather than written as a literal inside a main-thread function, so that changing how far a control moves does not require editing code that runs on the main thread.

#### Scenario: A selected control and an unselected control are pressed

- **WHEN** a selected control and an unselected control are each pressed
- **THEN** both are displaced by the same amount in the same direction
- **AND** neither changes the colour it was drawn in
- **AND** the selected one remains distinguishable from the unselected one throughout the press

#### Scenario: The contrast measurement surface is unchanged

- **WHEN** the project's contrast check runs after press feedback is implemented
- **THEN** it reports the same set of glyph-and-surface combinations it reported before, because no colour was introduced or altered

### Requirement: The press mark is cleared on release and on cancellation

Each control carrying press feedback SHALL bind a main-thread function to the touch-cancel event in addition to the touch-end event, and both SHALL clear the displacement.

Binding release alone leaves a reachable state in which a control stays displaced indefinitely: the form buttons and the learnset table's controls sit inside the detail panel's scrolling container, so a press that turns into a scroll produces a cancellation and never a release. A control left displaced by that gesture does not recover on its own unless the background thread happens to repaint it for an unrelated reason.

#### Scenario: A press becomes a scroll

- **WHEN** a control inside the detail panel's scrolling container is pressed and the finger then moves to scroll the panel rather than lifting on the control
- **THEN** the control returns to its undisplaced position
- **AND** the control's tap behaviour does not occur

#### Scenario: A press is released normally

- **WHEN** a control is pressed and the finger lifts while still on the control
- **THEN** the control returns to its undisplaced position
- **AND** the control's tap behaviour occurs

### Requirement: A background-thread style update ends the press mark, and this is accepted rather than corrected

The platform applies a background-thread inline-style update by replacing the target's inline styles wholesale rather than merging the changed properties. A control that carries an inline style binding therefore loses its main-thread press mark at the moment the background thread next renders it.

For the type filter buttons, which bind their background colour inline, this SHALL be accepted as correct behaviour rather than worked around. The moment the mark is cleared is the moment the real state change reaches the screen, which is the moment the mark stops being needed. The failure this specification guards against is a mark that persists, and wholesale replacement cannot produce one.

No control SHALL be restructured to avoid this, and the main thread and the background thread SHALL NOT be made to share or coordinate one style object.

#### Scenario: A type filter button is pressed

- **WHEN** a type filter button is pressed and the background thread then re-renders it in response to the resulting filter change
- **THEN** the button is not left displaced
- **AND** the button shows its new selected or unselected appearance

#### Scenario: A control without an inline style binding is pressed

- **WHEN** a control that binds only classes is pressed and the background thread re-renders it with a different class
- **THEN** the displacement written by the main thread survives that re-render
- **AND** it is cleared by the control's own release or cancellation binding

### Requirement: Press feedback covers the control set and excludes the card sequence and the veil

Press feedback SHALL be carried by the mode button, the language button, the query reset button, every type filter button, every generation filter button, every sort button, every form button, every move sort button, the same-type-bonus button, and the detail panel's close button.

The species cards SHALL NOT carry press feedback. Binding three main-thread events to each of the two hundred and eight cells would add those bindings to the one path this project has measured as slower than expected — the first paint of the full card sequence — and a card already answers a press by opening the detail panel.

The detail panel's veil SHALL NOT carry press feedback. A pressed appearance on the veil would present it as a control, when its only behaviour is to dismiss the panel.

#### Scenario: A card is pressed

- **WHEN** a species card is pressed
- **THEN** the card is not displaced
- **AND** the detail panel opens for that card's species and displayed form

#### Scenario: The veil is pressed

- **WHEN** the detail panel's veil is pressed
- **THEN** the veil is not displaced
- **AND** the panel closes
