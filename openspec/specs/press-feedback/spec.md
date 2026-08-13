# press-feedback Specification

## Purpose

How a control answers a press in the frame the finger lands, ahead of the thread the handler runs on. Covers the pressed appearance drawn by a main-thread function bound through the platform's main-thread event attributes, that function reading only the target the event carries and touching no application state, no background-thread invocation and no element reference, the existing tap bindings left as the only thing that changes state, the mark as a one-pixel downward displacement with the three separate contracts that forbid a colour, a transparency and a shadow instead, the displacement expressed exactly once and why that one place is the main-thread module rather than the stylesheet — the platform substitutes no custom property in a value a main-thread function writes, measured with the property declared in the stylesheet and inline alike, the mark cleared by a cancellation binding as well as a release one because a press that becomes a scroll inside the detail panel produces the former and never the latter, a background-thread inline-style update ending the mark accepted as correct rather than worked around because that platform replaces inline styles wholesale and so cannot leave one stuck, and the control set that carries the mark — the theme menu's trigger and rows among them — against the card sequence, the two veils and the theme menu's transparent dismiss layer that deliberately do not.

## Requirements

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


<!-- @trace
source: press-feedback-main-thread
updated: 2026-07-30
code:
  - src/components/FormSwitcher.vue
  - src/components/QueryBar.vue
  - src/components/SpeciesDetail.vue
  - src/components/LearnsetTable.vue
  - design/HANDOFF.md
  - src/App.css
  - src/interaction/press.ts
-->

---
### Requirement: The press mark is a positional shift, never a colour or transparency change

A pressed control SHALL be marked by displacing it one pixel downward. It SHALL NOT be marked by altering any colour, by altering opacity, or by adding a shadow.

Three separate contracts forbid the alternatives. Reducing opacity would compose tones outside the four-tone ramp, which the theme specification permits for the detail veil alone and names explicitly as not a precedent. Repainting the control with the accent token would make an unselected control momentarily indistinguishable from a selected one, because the accent token is what carries the selected state. An inset shadow is ignored by the platform and is rejected by the project's own stylesheet check.

The displacement SHALL be expressed exactly once in the project, so that changing how far a control moves is a single edit at a single known place.

It SHALL NOT be expressed as a stylesheet custom property read by the main-thread function. The platform does not substitute custom properties in the values a main-thread function writes, so such a reference resolves to nothing and the control does not move at all — measured with the property declared in the stylesheet and declared inline on the root view alike. The one place is therefore the main-thread module itself.

#### Scenario: A selected control and an unselected control are pressed

- **WHEN** a selected control and an unselected control are each pressed
- **THEN** both are displaced by the same amount in the same direction
- **AND** neither changes the colour it was drawn in
- **AND** the selected one remains distinguishable from the unselected one throughout the press

#### Scenario: The contrast measurement surface is unchanged

- **WHEN** the project's contrast check runs after press feedback is implemented
- **THEN** it reports the same set of glyph-and-surface combinations it reported before, because no colour was introduced or altered


<!-- @trace
source: press-feedback-main-thread
updated: 2026-07-30
code:
  - src/components/FormSwitcher.vue
  - src/components/QueryBar.vue
  - src/components/SpeciesDetail.vue
  - src/components/LearnsetTable.vue
  - design/HANDOFF.md
  - src/App.css
  - src/interaction/press.ts
-->

---
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


<!-- @trace
source: press-feedback-main-thread
updated: 2026-07-30
code:
  - src/components/FormSwitcher.vue
  - src/components/QueryBar.vue
  - src/components/SpeciesDetail.vue
  - src/components/LearnsetTable.vue
  - design/HANDOFF.md
  - src/App.css
  - src/interaction/press.ts
-->

---
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


<!-- @trace
source: press-feedback-main-thread
updated: 2026-07-30
code:
  - src/components/FormSwitcher.vue
  - src/components/QueryBar.vue
  - src/components/SpeciesDetail.vue
  - src/components/LearnsetTable.vue
  - design/HANDOFF.md
  - src/App.css
  - src/interaction/press.ts
-->

---
### Requirement: Press feedback covers the control set and excludes the card sequence and the veil

Press feedback SHALL be carried by the theme menu's trigger, every theme menu row, the language button, the query reset button, the sort cycle button, every type filter button, every form button, every move sort button, the same-type-bonus button, the detail panel's close button, every move row in the learnset table, and the learner list's close button.

The theme menu's trigger is the control the mode button became. It carries the mark for the same reason the mode button did, and the menu's rows carry it because a row has no other signal that it became a control — the same reason the learnset table's move rows carry it. The row sequence is bounded by the number of colour modes, which is three, so the binding count stays far below the sequences excluded below.

The control set names one sort button, not several. The query bar states the sort order as a single button whose text is the order in force, so there is exactly one control to press and exactly one to displace.

No generation filter button appears in the control set, because the query bar presents no control that selects a generation.

The species cards SHALL NOT carry press feedback. Binding three main-thread events to each of the two hundred and eight cells would add those bindings to the one path this project has measured as slower than expected — the first paint of the full card sequence — and a card already answers a press by opening the detail panel.

The learner list's species entries SHALL NOT carry press feedback, for the same two reasons and by the same measure: a single move reaches up to two hundred and seven species, and an entry already answers a press by replacing the detail panel's species. The move rows that open that list are bounded differently — the largest learnset section holds one hundred and five moves, and rows are the control that has no other way to announce itself as one.

The detail panel's veil SHALL NOT carry press feedback. A pressed appearance on the veil would present it as a control, when its only behaviour is to dismiss the panel.

The learner list's veil SHALL NOT carry press feedback, for the same reason as the detail panel's veil.

The theme menu's dismiss layer SHALL NOT carry press feedback, for the same reason as the two veils: its only behaviour is to close the menu, and it paints nothing at all, so a displacement would have nothing to displace.

#### Scenario: The sort cycle button is pressed

- **WHEN** the query bar's sort button is pressed
- **THEN** the button is displaced by the press mark
- **AND** the sort order advances to the next member of the sort set on release

#### Scenario: The theme menu's trigger is pressed

- **WHEN** the theme menu's trigger is pressed
- **THEN** the trigger is displaced by the press mark
- **AND** the menu opens on release, or closes if it was already open

#### Scenario: A theme menu row is pressed

- **WHEN** a row in the theme menu is pressed
- **THEN** the row is displaced by the press mark
- **AND** the active mode becomes that row's mode on release

#### Scenario: The theme menu's dismiss layer is pressed

- **WHEN** the theme menu's dismiss layer is pressed
- **THEN** the layer is not displaced
- **AND** the menu closes

#### Scenario: A card is pressed

- **WHEN** a species card is pressed
- **THEN** the card is not displaced
- **AND** the detail panel opens for that card's species and displayed form

#### Scenario: The veil is pressed

- **WHEN** the detail panel's veil is pressed
- **THEN** the veil is not displaced
- **AND** the panel closes

#### Scenario: A move row is pressed

- **WHEN** a move row in the learnset table is pressed
- **THEN** the row is displaced by the press mark
- **AND** the learner list opens for that row's move on release

#### Scenario: A learner entry is pressed

- **WHEN** a species entry in the learner list is pressed
- **THEN** the entry is not displaced
- **AND** the detail panel is replaced with that species on release

#### Scenario: The learner list's veil is pressed

- **WHEN** the learner list's veil is pressed
- **THEN** the learner list closes
- **AND** the veil is not displaced

##### Example: the two bounded sequences and the choice each one drives

| Sequence                  | Largest size | Carries the mark | Why                                                        |
| ------------------------- | ------------ | ---------------- | ---------------------------------------------------------- |
| species cards in the grid | 208          | no               | the measured first-paint path; a card announces itself      |
| learner list entries      | 207          | no               | same measure; an entry announces itself                     |
| move rows in one section  | 105          | yes              | the row has no other signal that it became a control        |
| type filter buttons       | 18           | yes              | bounded, and each is a control with no other press signal   |
| theme menu rows           | 3            | yes              | bounded by the mode set; a row has no other press signal    |

<!-- @trace
source: add-emerald-mode
updated: 2026-08-13
code:
  - design/theme-menu-variants.html
  - src/components/ThemeMenuList.vue
  - design/HANDOFF.md
  - design/theme-emerald-mock.html
  - f22d633073a187527790b2510e225c46.jpg
  - src/components/ThemeMenu.vue
  - src/theme/modes.ts
  - src/components/TypeGlyph.vue
  - src/App.vue
  - src/App.css
  - src/state/display.ts
  - scripts/check-contrast.mjs
tests:
  - tests/theme.test.ts
-->