## MODIFIED Requirements

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

## ADDED Requirements

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
