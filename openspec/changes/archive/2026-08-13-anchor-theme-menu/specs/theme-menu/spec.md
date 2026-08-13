## ADDED Requirements

### Requirement: The menu is anchored beneath its trigger by layout alone

The menu SHALL be rendered as a positioned descendant of a container that wraps its trigger, offset to that container's bottom edge and aligned to its left edge. Its position SHALL therefore be determined by layout, and SHALL NOT be computed at runtime from any source.

The placement SHALL NOT be derived from the trigger's measured rectangle: the platform's element measurement answers on neither target this project ships to, so a placement derived from it is a code path that never runs. The placement SHALL NOT be expressed as a constant offset from the root either: the trigger sits after a result count whose width changes with the number and with the language, so a constant names a position the trigger does not occupy as soon as a filter narrows the result set. Anchoring to the trigger's own container removes the need for either, because the offset is a relationship rather than a value.

The menu SHALL declare a stacking index that draws it above the controls it overlaps, which are later siblings of the masthead within the screen and would otherwise paint over it. A stacking index is permitted here because this arrangement has been measured on device: a positioned node anchored within the masthead paints above a later sibling of the masthead inside the screen, and no ancestor clips it at the masthead's edge. That measurement covers this arrangement only, and SHALL NOT be read as a warrant for a stacking index across a scroll container's boundary or at a greater nesting depth, neither of which has been measured.

#### Scenario: Pressing the trigger opens the menu directly beneath it

- **WHEN** the trigger is pressed
- **THEN** the menu opens with its top edge at the trigger's bottom edge and its left edge aligned to the trigger's left edge
- **AND** every row is legible and pressable

#### Scenario: The placement follows the trigger when the result count changes

- **WHEN** a filter narrows the result count, changing the width of the text that precedes the trigger, and the menu is opened again
- **THEN** the menu is still drawn directly beneath the trigger
- **AND** no offset constant was changed to achieve it

#### Scenario: The menu draws above the controls it overlaps

- **WHEN** the menu is open over the controls below the masthead
- **THEN** the menu is legible in full
- **AND** no part of it is painted over by those controls, and none of it is clipped at the masthead's edge

#### Scenario: The placement consults no runtime measurement

- **WHEN** the code that opens the menu is inspected
- **THEN** it queries neither the trigger's rectangle nor any coordinate carried by the press
- **AND** the menu opens whether or not any measurement facility on the platform answers

##### Example: what the placement is derived from

| Part           | Value                                        | Derived from                                      |
| -------------- | -------------------------------------------- | ------------------------------------------------- |
| containing block | the container wrapping the trigger          | the trigger's own position in the layout          |
| top            | the container's bottom edge                  | a layout relationship, not a value                |
| left           | the container's left edge                    | a layout relationship, not a value                |
| stacking       | above the later siblings the menu overlaps   | the arrangement measured on device                |

### Requirement: The container that positions the menu carries no press feedback

The container that establishes the menu's position SHALL NOT be the node carrying the trigger's press-feedback bindings, and SHALL carry no press-feedback binding of its own. It SHALL be a separate node wrapping that trigger.

Two consequences follow from positioning the menu against the pressed node, and both are avoided by this separation. The pressed appearance is a one-pixel downward displacement written as a transform, so a menu positioned against that node moves with the trigger for as long as the trigger is held. A transform additionally establishes a containing block for positioned descendants under the styling rules this project's stylesheet is written against, and whether this platform adopts that behaviour has not been measured — so the menu's position would rest on an unmeasured platform behaviour rather than on the layout.

#### Scenario: Holding the trigger does not move the menu

- **WHEN** the trigger is held down while the menu is open
- **THEN** the trigger shows its pressed displacement
- **AND** the menu does not move

#### Scenario: The positioning container declares no press binding

- **WHEN** the node establishing the menu's position is inspected
- **THEN** it carries no main-thread touch binding
- **AND** the trigger it wraps carries the bindings instead

### Requirement: The menu holds its widest row independently of the trigger's width

The menu SHALL declare a width of its own, sufficient to draw the longest mode name on one line. Its width SHALL NOT be left to be derived from the trigger it hangs beneath: an absolutely positioned box is limited to the width of its containing block, the containing block is the wrapper around a trigger that carries the name of the active mode, and that name is shorter than the longest one whenever the longest is not the active one. A menu left to derive its width therefore wraps its longest row in every mode except the one that names it.

The declared width SHALL be checked against the mode set rather than trusted. A mode whose name is too long for the declared width SHALL fail an automated check, because a name that overflows produces a wrapped row and no error — and the requirement that adding a mode adds a row and nothing else is otherwise silently broken by the addition. The check SHALL measure names in the face and size the menu actually draws them in, not in a substitute.

#### Scenario: The longest mode name is drawn on one line in every mode

- **WHEN** the menu is opened while any mode is in force
- **THEN** every row draws its mode's name on a single line
- **AND** the row of the longest name is drawn on one line even when a shorter name is the active one

#### Scenario: A mode too long for the declared width fails a check

- **WHEN** a mode is added whose name is wider than the menu's declared width allows
- **THEN** an automated check fails and names the mode and the width it needs
- **AND** the failure occurs without the menu having to be opened on a device

##### Example: mode names against the declared width

| Mode    | Name drawn in the menu's face and size | Fits the declared width |
| ------- | -------------------------------------- | ----------------------- |
| POCKET  | shortest of the three                  | yes                     |
| MODERN  | between the other two                  | yes                     |
| EMERALD | longest of the three, and the one that sets the width | yes      |

## REMOVED Requirements

### Requirement: The menu is drawn in the root's overlay band at declared offsets

**Reason**: Both platform facts this requirement rested on have been re-examined, and one of them no longer holds. It forbade a menu beside its trigger because nothing could lift such a menu above the query bar, this interface stacking by document order alone, and it forbade introducing a stacking index while its effect on the platform was unmeasured. That effect has now been measured on an iOS device: a stacking index does lift a node anchored within the masthead above a later sibling inside the screen, and no ancestor clips it. The requirement's other reason — that the trigger's runtime rectangle is unavailable — still holds and is carried forward, because anchoring to the trigger's container needs no rectangle at all.

**Migration**: Replaced by "The menu is anchored beneath its trigger by layout alone" and "The container that positions the menu carries no press feedback". The declared offsets of the shell's and the screen's padding are removed along with the overlay-band placement; nothing depends on those two literals elsewhere. The prohibition on deriving the placement from a measured rectangle is preserved verbatim in the replacing requirement.

## MODIFIED Requirements

### Requirement: The menu closes without a translucent layer

The menu SHALL close when its trigger is pressed a second time, and that mechanism SHALL NOT depend on any layer drawn behind the menu.

A translucent surface SHALL NOT be used to dismiss the menu. `retro-theme` exempts exactly one layer from POCKET's ramp — the detail veil — and states that a translucent surface anywhere else is a violation rather than a precedent.

A dismiss layer covering the rest of the screen SHALL declare no background colour at all, so that it paints nothing and composites nothing. Because whether such a layer receives touches on this platform has not been measured, the trigger SHALL remain sufficient to close the menu on its own. If the layer is measured not to receive touches, it SHALL be removed rather than left in place as a declaration with no effect.

The dismiss layer SHALL declare a stacking index below the menu's, so that a press landing on a menu row reaches the row rather than the layer. Declaring it is required rather than optional because the menu is anchored within the masthead while the layer covers the root, which makes the layer the later node — the arrangement that previously kept the menu above the layer no longer holds, and document order now favours the layer. This ordering sits one level above the arrangement measured on device, so it SHALL be confirmed on device. If the layer is measured to take the presses that belong to the menu's rows, it SHALL be removed under the same rule as above, leaving the trigger as the only way to close the menu.

#### Scenario: The trigger closes the menu

- **WHEN** the trigger is pressed while the menu is open
- **THEN** the menu closes
- **AND** the active mode is unchanged

#### Scenario: A press on a menu row reaches the row

- **WHEN** a menu row is pressed while the dismiss layer is present
- **THEN** the active mode becomes that row's mode
- **AND** the menu closes because the row was selected, not because the layer was pressed

#### Scenario: No translucent layer is introduced

- **WHEN** the menu's stylesheet rules and inline style bindings are inspected
- **THEN** no rule reduces the opacity of a painted surface
- **AND** any dismiss layer present declares no background colour
