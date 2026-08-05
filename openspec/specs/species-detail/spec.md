# species-detail Specification

## Purpose

How one form is presented in full, above the grid rather than in place of it. Covers positioning the overlay against the application's outermost view instead of the viewport and why, the two scrolling containers it permits — the panel body and the learnset table, that table being the one exemption — each with its header outside it, mounting and unmounting the panel rather than hiding it and the three consequences that follow, the one module that owns the selection and clamps the form index, opening from a card tap on the form that card displays, the identity and artwork and four attributes the panel states, type pills spending type colour only in the mode allowed to, roster and shared-artwork conditions stated as warnings rather than left implicit, base stats as six rows whose emphasis never changes a row's height, abilities in both languages with prose descriptions, and the two style invariants this panel is held to — no inset shadows, and no grid layout.

## Requirements

### Requirement: The detail panel overlays the dex without relying on viewport-fixed positioning

The detail panel and the veil behind it SHALL be siblings of the screen region inside the application's outermost view, positioned absolutely so that they cover it. They SHALL NOT be positioned relative to the viewport, because the platform makes no documented commitment about that positioning mode and a failure to honour it is silent: the panel would be confined by the screen region's padding and read as a stylesheet that did not take effect.

The recorded fallback, if absolute positioning inside the outermost view does not cover the screen on a physical device, SHALL be to render the detail as a full-screen region that replaces the grid, and the outcome SHALL be recorded in the design handoff document.

#### Scenario: Panel covers the grid

- **WHEN** the detail panel is open on a physical device
- **THEN** it covers the grid beneath it, reaching every edge of the screen region
- **AND** the veil spans the grid area not occupied by the panel, dimming it rather than hiding it

#### Scenario: No viewport-fixed positioning

- **WHEN** the stylesheet rules for the panel and the veil are inspected
- **THEN** neither declares viewport-fixed positioning

#### Scenario: Fallback is recorded, not improvised

- **WHEN** absolute positioning inside the outermost view fails to cover the screen on a physical device
- **THEN** the detail is rendered as a full-screen region replacing the grid
- **AND** the outcome is recorded in the design handoff document


<!-- @trace
source: port-champions-dex-detail
updated: 2026-07-29
code:
  - src/state/selection.ts
  - src/components/DexGrid.vue
  - design/HANDOFF.md
  - README.md
  - src/data/i18n.ts
  - src/components/AbilityList.vue
  - src/components/StatBars.vue
  - src/components/FormSwitcher.vue
  - src/App.css
  - src/App.vue
  - scripts/check-styles.mjs
  - src/components/SpeciesCard.vue
  - src/components/SpeciesDetail.vue
  - src/data/dex.ts
-->

---
### Requirement: The panel is mounted on open and unmounted on close

The panel SHALL be added to the element tree when a species is selected and removed from it when the selection is cleared. It SHALL NOT be kept in the tree and merely hidden.

The panel SHALL additionally carry a reconciliation identity derived from the selected species, so that replacing one species with another while the panel stays open is an unmount followed by a mount rather than a content update in place. Without it the panel survives the replacement and the three consequences below hold only for an open that follows a close — a species reached from the learner list would inherit the previous species' scroll position, leaving the reader partway down a panel they have not read.

Three consequences are intended and SHALL hold, for a replacement as well as for an open: the panel's deeper element tree costs nothing while it is closed; the content begins at the top of its scrolling container on every open, without any code reading or writing a scroll position; and the panel's stepped reveal animation plays on every open.

The scroll position SHALL NOT be corrected by reading or writing it. The reconciliation identity reaches the same result through the mount the panel already performs.

#### Scenario: Closed panel is absent from the tree

- **WHEN** no species is selected
- **THEN** neither the panel nor the veil is present in the element tree

#### Scenario: Content starts at the top on every open

- **WHEN** a species is selected, its panel is scrolled to the bottom, closed, and another species is selected
- **THEN** the newly opened panel's content is at the top of its scrolling container

#### Scenario: Content starts at the top on a replacement

- **WHEN** the panel is open and scrolled to its learnset table, and the selection is replaced with another species without the panel closing first
- **THEN** the panel's content is at the top of its scrolling container

#### Scenario: No code reads or writes the scroll position

- **WHEN** the panel's sources are inspected
- **THEN** no scroll position is read or written

#### Scenario: The reveal plays on every open

- **WHEN** a species is selected
- **THEN** the panel appears with its stepped reveal animation
- **AND** the animation uses stepped timing rather than smooth easing

#### Scenario: A replacement to the same species is not a remount

- **WHEN** the selection is replaced with the species already selected
- **THEN** the panel is not remounted


<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
-->

---
### Requirement: Selection is owned by one module that clamps the form index

Which species is selected and which of its forms is shown SHALL be owned by a single module-level state module, in the same manner as the display and query state. That module SHALL be the only place that clamps the form index into the range the species' form count allows, and it SHALL clear both the species and the form index together when the selection is closed.

An out-of-range form index SHALL be clamped rather than raised as an error. An out-of-range index means the selection and the query layer have gone out of step, and showing the species' first form is a better outcome than the panel vanishing.

#### Scenario: Opening clamps the requested index

- **WHEN** the detail is opened for a species with a form index outside that species' form count
- **THEN** the panel renders a form within range and reports no error

##### Example: clamping

| Species                   | Form count | Requested index | Rendered index |
| ------------------------- | ---------- | --------------- | -------------- |
| Venusaur                  | 2          | 1               | 1              |
| Venusaur                  | 2          | 5               | 1              |
| Venusaur                  | 2          | -1              | 0              |
| Ditto                     | 1          | 3               | 0              |

#### Scenario: Closing clears both parts of the selection

- **WHEN** the detail is closed
- **THEN** no species is selected
- **AND** the form index is back to its initial value

#### Scenario: Selecting a form while nothing is selected does nothing

- **WHEN** a form is selected while no species is selected
- **THEN** no state changes and no error is reported


<!-- @trace
source: port-champions-dex-detail
updated: 2026-07-29
code:
  - src/state/selection.ts
  - src/components/DexGrid.vue
  - design/HANDOFF.md
  - README.md
  - src/data/i18n.ts
  - src/components/AbilityList.vue
  - src/components/StatBars.vue
  - src/components/FormSwitcher.vue
  - src/App.css
  - src/App.vue
  - scripts/check-styles.mjs
  - src/components/SpeciesCard.vue
  - src/components/SpeciesDetail.vue
  - src/data/dex.ts
-->

---
### Requirement: A card tap opens the detail on the form that card displays

Tapping a card SHALL open the detail for that card's species on the very form the card was displaying, not on the species' first form. A card can be displaying a form other than the first, because a type filter chooses which form each card shows.

The detail SHALL be closable by two paths: the header's close control, and a tap on the veil. Closing SHALL leave the grid's scroll position and the active query untouched.

#### Scenario: Tapping a filtered card opens that form

- **WHEN** a type filter makes a species' card display a form other than its first, and that card is tapped
- **THEN** the panel opens on the form the card was displaying

##### Example: which form opens

| Active type filter | Card shown for Charizard | Form opened |
| ------------------ | ------------------------ | ----------- |
| none               | base                     | base        |
| Dragon             | Mega Charizard X         | Mega Charizard X |

#### Scenario: Both close paths work

- **WHEN** the close control is tapped
- **THEN** the detail closes

#### Scenario: Closing on the veil

- **WHEN** the veil is tapped
- **THEN** the detail closes

#### Scenario: Closing preserves the grid state

- **WHEN** the grid is scrolled, a card is tapped, and the detail is then closed
- **THEN** the grid's scroll position and the active query are unchanged


<!-- @trace
source: port-champions-dex-detail
updated: 2026-07-29
code:
  - src/state/selection.ts
  - src/components/DexGrid.vue
  - design/HANDOFF.md
  - README.md
  - src/data/i18n.ts
  - src/components/AbilityList.vue
  - src/components/StatBars.vue
  - src/components/FormSwitcher.vue
  - src/App.css
  - src/App.vue
  - scripts/check-styles.mjs
  - src/components/SpeciesCard.vue
  - src/components/SpeciesDetail.vue
  - src/data/dex.ts
-->

---
### Requirement: The panel states the species' identity, artwork, and four attributes

The panel SHALL render, for the selected form: the species' leading and secondary names, its national number, its generation, its form count when it has more than one form, and its category when the leading language carries one; the form's artwork at a whole-number upscale of the source sprite together with the form's label; the form's types as pills; and four attributes — types, form with its kind, the game version that introduced it, and its roster standing.

Every string SHALL come from the string table rather than being composed in the template, so that both languages stay in one place.

#### Scenario: Header content

- **WHEN** the panel is open
- **THEN** the header shows the species' leading name, its secondary name, its national number, and its generation
- **AND** the form count appears when the species has more than one form
- **AND** the category appears when the leading language carries one

#### Scenario: Artwork keeps its pixel grid

- **WHEN** the form's artwork is rendered in the panel
- **THEN** its size is a whole-number multiple of the source sprite's size
- **AND** the nearest-neighbour scaling declaration is present on the artwork element itself, because that declaration is not inherited

#### Scenario: Artwork failure leaves the form's type mark

- **WHEN** the artwork has not yet loaded, or never loads
- **THEN** the box shows the form's first type mark rather than a gap
- **AND** the mark is removed once the artwork's load event fires, because the platform's error event does not fire on native

#### Scenario: Attributes are present for every form

- **WHEN** any form of any species is displayed
- **THEN** the panel shows its types, its form and kind, its introducing version, and its roster standing


<!-- @trace
source: port-champions-dex-detail
updated: 2026-07-29
code:
  - src/state/selection.ts
  - src/components/DexGrid.vue
  - design/HANDOFF.md
  - README.md
  - src/data/i18n.ts
  - src/components/AbilityList.vue
  - src/components/StatBars.vue
  - src/components/FormSwitcher.vue
  - src/App.css
  - src/App.vue
  - scripts/check-styles.mjs
  - src/components/SpeciesCard.vue
  - src/components/SpeciesDetail.vue
  - src/data/dex.ts
-->

---
### Requirement: Type pills spend type colour only in the mode allowed to

A type pill SHALL be filled with its type's colour, and its text set in the ink that reads on that colour, only in the mode whose declaration permits spending type colour. In the other mode the pill SHALL carry a border and no type colour, because that mode's palette is limited to its four tones and a type colour would exceed it.

The type mark inside the pill SHALL be drawn for the surface it actually sits on, so that it stays visible in both modes.

#### Scenario: Filled pill in the colour-spending mode

- **WHEN** a type pill renders in the mode that permits type colour
- **THEN** its background is that type's colour and its text is the ink that reads on that colour

#### Scenario: Bare pill in the four-tone mode

- **WHEN** a type pill renders in the four-tone mode
- **THEN** it carries a border and no type colour
- **AND** every colour the open panel actually paints is within that mode's four tones, the veil
  excepted — see the retro-theme spec for why that one layer composites outside the ramp

#### Scenario: The mark stays visible on the pill

- **WHEN** the type mark inside a pill is checked against the surface beneath it in both modes
- **THEN** its computed contrast against that surface is at or above the recorded floor


<!-- @trace
source: port-champions-dex-detail
updated: 2026-07-29
code:
  - src/state/selection.ts
  - src/components/DexGrid.vue
  - design/HANDOFF.md
  - README.md
  - src/data/i18n.ts
  - src/components/AbilityList.vue
  - src/components/StatBars.vue
  - src/components/FormSwitcher.vue
  - src/App.css
  - src/App.vue
  - scripts/check-styles.mjs
  - src/components/SpeciesCard.vue
  - src/components/SpeciesDetail.vue
  - src/data/dex.ts
-->

---
### Requirement: Roster and shared-artwork conditions are stated as warnings

When the displayed form is outside the current roster, the panel SHALL render the roster warning. When the form's artwork is the species' shared sprite because the form has none of its own, the panel SHALL render the approximation warning. When the form or its species carries a roster note, the panel SHALL render that note. Each warning's text SHALL come from the string table.

#### Scenario: Out-of-roster form

- **WHEN** the displayed form is outside the current roster
- **THEN** the panel renders the roster warning

#### Scenario: Shared artwork

- **WHEN** the displayed form's artwork is the species' shared sprite
- **THEN** the panel renders the approximation warning

#### Scenario: No warnings for an ordinary form

- **WHEN** the displayed form is in the roster, has its own artwork, and carries no note
- **THEN** the panel renders no warning


<!-- @trace
source: port-champions-dex-detail
updated: 2026-07-29
code:
  - src/state/selection.ts
  - src/components/DexGrid.vue
  - design/HANDOFF.md
  - README.md
  - src/data/i18n.ts
  - src/components/AbilityList.vue
  - src/components/StatBars.vue
  - src/components/FormSwitcher.vue
  - src/App.css
  - src/App.vue
  - scripts/check-styles.mjs
  - src/components/SpeciesCard.vue
  - src/components/SpeciesDetail.vue
  - src/data/dex.ts
-->

---
### Requirement: Base stats are six rows and a total, with the form's best row emphasised

The panel SHALL render the form's six base stats as one row each — label, value, and a bar — followed by the base-stat total. The bar's fill SHALL be a proportion of a fixed ceiling rather than a pixel width, so that it holds at any panel width. A value at or above the ceiling SHALL fill the bar completely, and a very low value SHALL still show a visible sliver rather than nothing.

The row holding the form's highest value SHALL be emphasised by colour and bar weight only. Emphasis SHALL NOT change the row's height, because a row that changes height as the form changes makes the whole block jump.

#### Scenario: Six rows and a total

- **WHEN** any form is displayed
- **THEN** the panel shows six stat rows and the base-stat total

#### Scenario: Bar fill is proportional

- **WHEN** a stat bar is rendered
- **THEN** its fill is a proportion of the fixed ceiling and carries no pixel width

##### Example: fill proportion against a ceiling of 230

| Stat value | Fill                      |
| ---------- | ------------------------- |
| 230        | full                      |
| 115        | half                      |
| 1          | the visible minimum       |
| 255        | full, clamped at the ceiling |

#### Scenario: Emphasis does not change row height

- **WHEN** the emphasised row is compared with the other five
- **THEN** it differs in colour and bar weight only
- **AND** all six rows have the same height

#### Scenario: Emphasis follows the form

- **WHEN** the displayed form changes to one whose highest stat is a different stat
- **THEN** the emphasis moves to that stat's row


<!-- @trace
source: port-champions-dex-detail
updated: 2026-07-29
code:
  - src/state/selection.ts
  - src/components/DexGrid.vue
  - design/HANDOFF.md
  - README.md
  - src/data/i18n.ts
  - src/components/AbilityList.vue
  - src/components/StatBars.vue
  - src/components/FormSwitcher.vue
  - src/App.css
  - src/App.vue
  - scripts/check-styles.mjs
  - src/components/SpeciesCard.vue
  - src/components/SpeciesDetail.vue
  - src/data/dex.ts
-->

---
### Requirement: Abilities are listed with both languages, a hidden marker, and prose descriptions

Each of the form's ability slots SHALL be rendered as its own block carrying the ability's name in the leading language, its name in the other language when one exists, a marker when the slot holds the species' hidden ability, and the ability's description.

A missing description SHALL cause the description to be omitted entirely rather than rendering an empty area. A missing name in the leading language SHALL fall back to the name that exists.

#### Scenario: Ability block content

- **WHEN** an ability slot is rendered
- **THEN** it shows the ability's name in the leading language
- **AND** the other language's name appears when it exists
- **AND** the hidden marker appears when the slot holds the hidden ability

#### Scenario: Missing description omits the area

- **WHEN** an ability carries no description in either language
- **THEN** the block renders its name row only, with no empty description area

#### Scenario: Missing leading-language name falls back

- **WHEN** an ability has no name in the leading language
- **THEN** the block shows the name that does exist


<!-- @trace
source: port-champions-dex-detail
updated: 2026-07-29
code:
  - src/state/selection.ts
  - src/components/DexGrid.vue
  - design/HANDOFF.md
  - README.md
  - src/data/i18n.ts
  - src/components/AbilityList.vue
  - src/components/StatBars.vue
  - src/components/FormSwitcher.vue
  - src/App.css
  - src/App.vue
  - scripts/check-styles.mjs
  - src/components/SpeciesCard.vue
  - src/components/SpeciesDetail.vue
  - src/data/dex.ts
-->

---
### Requirement: Inset shadows are absent and asserted by the style check

No stylesheet rule SHALL declare an inset box shadow, because the platform silently ignores such a declaration. Surfaces that the design document drew with an inset shadow SHALL instead be drawn with real borders, using a nested view with per-side border colours where a light-and-shadow diagonal is required.

The style check SHALL assert this, because the failure is nearly invisible: a missing hairline frame, plus the larger fact that a stylesheet rule was copied from the design document without being ported.

#### Scenario: No inset shadows in the stylesheets

- **WHEN** every stylesheet the application ships is inspected
- **THEN** no box-shadow declaration contains an inset keyword

#### Scenario: The check catches a reintroduced inset shadow

- **WHEN** an inset box shadow is added to any stylesheet and the style check runs
- **THEN** the check exits non-zero and names the offending file
- **AND** removing the declaration makes the check pass again


<!-- @trace
source: port-champions-dex-detail
updated: 2026-07-29
code:
  - src/state/selection.ts
  - src/components/DexGrid.vue
  - design/HANDOFF.md
  - README.md
  - src/data/i18n.ts
  - src/components/AbilityList.vue
  - src/components/StatBars.vue
  - src/components/FormSwitcher.vue
  - src/App.css
  - src/App.vue
  - scripts/check-styles.mjs
  - src/components/SpeciesCard.vue
  - src/components/SpeciesDetail.vue
  - src/data/dex.ts
-->

---
### Requirement: Layout uses the row-and-column primitives already in use, not a grid

The panel's rows SHALL be laid out with the same flexible box primitives the rest of the application uses. Grid layout SHALL NOT be introduced, because no existing stylesheet in the application uses it and this change is not the place to take on an unverified layout mode.

Attribute rows SHALL give the label a fixed width and let the value take the remaining space.

#### Scenario: No grid layout

- **WHEN** the panel's stylesheet rules are inspected
- **THEN** none declares grid layout

#### Scenario: Attribute rows fill the width

- **WHEN** an attribute row renders with a long value in either language
- **THEN** the label keeps its width, the value takes the rest, and the row does not overflow horizontally

<!-- @trace
source: port-champions-dex-detail
updated: 2026-07-29
code:
  - src/state/selection.ts
  - src/components/DexGrid.vue
  - design/HANDOFF.md
  - README.md
  - src/data/i18n.ts
  - src/components/AbilityList.vue
  - src/components/StatBars.vue
  - src/components/FormSwitcher.vue
  - src/App.css
  - src/App.vue
  - scripts/check-styles.mjs
  - src/components/SpeciesCard.vue
  - src/components/SpeciesDetail.vue
  - src/data/dex.ts
-->

---
### Requirement: The panel lists the form's learnset after its abilities

The panel SHALL render the displayed form's learnset as its final section, following the base stats and the abilities. The learnset section SHALL be the fifth and last section inside the scrolling container.

The panel SHALL hand the learnset table the displayed form and nothing else, following the arrangement already used for the base stats, which receive the six numbers rather than the species. The panel SHALL NOT compute the same-type attack bonus, sort the moves, or filter them; those belong to the learnset capability.

#### Scenario: The learnset is the last section

- **WHEN** the panel is open and its content is scrolled to the end
- **THEN** the learnset section is the final section and is fully visible

#### Scenario: The panel does not compute learnset behaviour

- **WHEN** the panel component is inspected
- **THEN** it contains no bonus computation, no move sorting and no move filtering

<!-- @trace
source: port-champions-dex-learnset
updated: 2026-07-30
code:
  - scripts/check-contrast.mjs
  - src/App.css
  - README.md
  - src/components/SpeciesDetail.vue
  - src/data/i18n.ts
  - src/state/learnset.ts
  - src/data/dex.ts
  - package.json
  - scripts/check-styles.mjs
  - src/components/LearnsetTable.vue
  - src/state/query.ts
  - src/theme/modes.ts
  - design/HANDOFF.md
-->

---
### Requirement: The panel's scrolling containers are limited to the panel body and the learnset table

The panel's content SHALL sit inside a scrolling container, and the panel's header SHALL sit outside that container so that it stays in place while the content scrolls.

Exactly two scrolling containers SHALL be permitted inside the panel: the panel body, and the learnset table's own bounded region. No other region inside the panel SHALL declare a scrolling container, because two nested scrolling layers compete for the same gesture and the platform's `scroll-view` element exposes no attribute that arbitrates between them. The exemption SHALL be limited to the learnset table — a second bounded region anywhere else in the panel is a violation rather than a precedent.

The learner list's scrolling container SHALL NOT count against this limit and SHALL NOT be read as a second exemption, because the list is a sibling of the panel's overlay rather than a region inside the panel. A region that is genuinely inside the panel remains a violation.

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

#### Scenario: The learner list's container is outside the panel

- **WHEN** the learner list is open and the element tree is inspected
- **THEN** the list's scrolling container is not a descendant of the panel
- **AND** the panel still declares exactly two scrolling containers

##### Example: which regions are permitted a scrolling container

| Region                                   | Scrolling container | Why                                                        |
| ---------------------------------------- | ------------------- | ---------------------------------------------------------- |
| panel body                               | yes                 | the panel's own content is taller than the panel           |
| learnset table                           | yes                 | bounded by the `learnset-table` capability, one exemption   |
| base stats section                       | no                  | six rows, never taller than the body                       |
| abilities section                        | no                  | at most three blocks                                       |
| artwork stage                            | no                  | fixed 192px                                                |
| attribute list                           | no                  | four rows                                                  |
| learner list                             | not counted         | a sibling of the panel's overlay, not a region inside it    |


<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
-->

---
### Requirement: The learner list is layered above the panel without changing how the panel is positioned

The learner list's overlay SHALL be a sibling of the detail panel's overlay inside the application's outermost view, positioned absolutely so that it covers the screen region, and drawn above the panel. It SHALL NOT be positioned relative to the viewport, for the reason this capability already records for the panel: the platform makes no documented commitment about that positioning mode and a failure to honour it is silent.

The panel's own positioning SHALL NOT change to accommodate the list.

The recorded fallback, if a third absolutely positioned layer does not cover the screen on a physical device, SHALL be to render the learner list as a full-screen region that replaces the panel, and the outcome SHALL be recorded in the design handoff document.

#### Scenario: The list covers the panel

- **WHEN** the learner list is open on a physical device
- **THEN** it covers the detail panel beneath it, reaching every edge of the screen region

#### Scenario: No viewport-fixed positioning

- **WHEN** the stylesheet rules for the learner list and its veil are inspected
- **THEN** neither declares viewport-fixed positioning

#### Scenario: The panel's positioning is unchanged

- **WHEN** the stylesheet rules for the panel and its veil are compared against their form before this change
- **THEN** their positioning declarations are unchanged

#### Scenario: Fallback is recorded, not improvised

- **WHEN** a third absolutely positioned layer fails to cover the screen on a physical device
- **THEN** the learner list is rendered as a full-screen region replacing the panel
- **AND** the outcome is recorded in the design handoff document

<!-- @trace
source: add-move-learners
updated: 2026-08-05
code:
  - design/champions-dex.html
  - src/data/dex.json
  - src/App.vue
  - src/state/moveLearners.ts
  - src/components/MoveLearners.vue
  - src/App.css
  - src/components/LearnsetTable.vue
  - src/data/dex.ts
  - src/data/i18n.ts
  - design/champions-dex.json
-->