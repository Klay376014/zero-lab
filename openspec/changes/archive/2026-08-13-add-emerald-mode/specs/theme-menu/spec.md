## ADDED Requirements

### Requirement: The theme menu is the only control that selects a colour mode

Selecting the active colour mode SHALL be done through one menu control, and no other control SHALL change the active mode. The control SHALL consist of a trigger carrying the active mode's name and a menu carrying one row per colour mode.

Advancing through the modes by repeated presses SHALL NOT be offered, because a control that advances a position states neither how many modes exist nor which one is in force, and the number of modes is expected to grow.

Selecting a row SHALL set the active mode to that row's mode and SHALL close the menu. Selecting the row of the mode already in force SHALL close the menu and leave the interface unchanged.

#### Scenario: Selecting a mode from the menu

- **WHEN** a menu row other than the active one is pressed
- **THEN** the active mode becomes that row's mode
- **AND** the menu closes

#### Scenario: Selecting the mode already in force

- **WHEN** the row of the active mode is pressed
- **THEN** the menu closes
- **AND** the active mode is unchanged

#### Scenario: No other control changes the mode

- **WHEN** the application's controls are inspected for mode changes
- **THEN** the theme menu's rows are the only ones that set the active mode

### Requirement: The menu names every mode and marks the one in force

The menu SHALL render one row for every mode the theme layer defines, in the order the theme layer defines them, so that adding a mode adds a row without touching this control. The row of the active mode SHALL be drawn with the accent token as its background and the accent-ink token as its text, which is the pair every other selected control in this interface already uses. Every other row SHALL be drawn with the surface token as its background and the ink token as its text.

A row SHALL carry the mode's name and nothing else. A row SHALL NOT carry a colour sample of the mode it names: a sample paints one mode's tones onto another mode's screen, which in POCKET puts a colour outside the four-tone ramp on the display, and `retro-theme` limits that exemption to the detail veil and states it is not a precedent. The preview a sample would give is one press away, because selecting a mode recolours the running screen without remounting.

#### Scenario: Every defined mode has a row

- **WHEN** the menu is open
- **THEN** it carries exactly one row per mode defined by the theme layer, in the theme layer's order

#### Scenario: The active row is marked with the accent pair

- **WHEN** the menu is open
- **THEN** the active mode's row carries the accent background and the accent-ink text
- **AND** every other row carries the surface background and the ink text

#### Scenario: No row samples a mode's colours

- **WHEN** a menu row is inspected for painted colour
- **THEN** the row names its mode in text only, and paints no colour drawn from the mode it names

##### Example: rows drawn while POCKET is in force

| Row     | Background      | Text            | Carries a colour sample |
| ------- | --------------- | --------------- | ----------------------- |
| POCKET  | accent token    | accentInk token | no                      |
| MODERN  | surface token   | ink token       | no                      |
| EMERALD | surface token   | ink token       | no                      |

### Requirement: The menu is drawn in the root's overlay band at declared offsets

The menu SHALL be drawn in the same layer band as the detail panel — an absolutely positioned child of the root view — and SHALL NOT be drawn as a child of the masthead beside its trigger. A menu drawn beside the trigger is painted over by the query bar, which is a later sibling inside the screen; this interface stacks by document order alone and declares no stacking index anywhere, so nothing lifts it. Introducing one to lift it SHALL NOT be done while its effect on the platform is unmeasured.

The menu's offsets SHALL be declared in the stylesheet, as the sum of the shell's and the screen's padding from the root's padding edge, which draws the menu over the masthead. They SHALL NOT be derived from the trigger's runtime rect: the platform's element measurement answers on neither target this project ships to, so a placement derived from it is a code path that never runs. A dropdown on another platform is positioned from its anchor's measured rect, and that arrangement was built and removed here for exactly that reason.

The menu SHALL NOT be positioned under its trigger by constants either. The trigger's horizontal offset sits after the result count, whose width changes with the number and with the language, and its vertical offset depends on line heights the stylesheet does not declare — so a constant would be wrong as soon as a filter narrowed the result set.

#### Scenario: The menu is not drawn beside its trigger

- **WHEN** the rendered tree is inspected while the menu is open
- **THEN** the menu is a child of the root view, in the same band as the detail panel
- **AND** no stacking index is declared for it

#### Scenario: Pressing the trigger opens the menu over the masthead

- **WHEN** the trigger is pressed
- **THEN** the menu opens at the offsets the stylesheet declares
- **AND** every row is legible and pressable

#### Scenario: The placement does not move with the result count

- **WHEN** a filter narrows the result count and the menu is opened again
- **THEN** the menu is drawn at the same offsets as before

##### Example: what the placement is derived from

| Part | Value                                         | Derived from                                        |
| ---- | --------------------------------------------- | --------------------------------------------------- |
| band | an absolutely positioned child of the root    | the one positioning arrangement measured on device   |
| left | the shell's padding plus the screen's padding | the stylesheet's own literals                        |
| top  | the same sum                                  | the stylesheet's own literals                        |

### Requirement: The menu closes without a translucent layer

The menu SHALL close when its trigger is pressed a second time, and that mechanism SHALL NOT depend on any layer drawn behind the menu.

A translucent surface SHALL NOT be used to dismiss the menu. `retro-theme` exempts exactly one layer from POCKET's ramp — the detail veil — and states that a translucent surface anywhere else is a violation rather than a precedent.

A dismiss layer covering the rest of the screen SHALL declare no background colour at all, so that it paints nothing and composites nothing. Because whether such a layer receives touches on this platform has not been measured, the trigger SHALL remain sufficient to close the menu on its own. If the layer is measured not to receive touches, it SHALL be removed rather than left in place as a declaration with no effect.

#### Scenario: The trigger closes the menu

- **WHEN** the trigger is pressed while the menu is open
- **THEN** the menu closes
- **AND** the active mode is unchanged

#### Scenario: No translucent layer is introduced

- **WHEN** the menu's stylesheet rules and inline style bindings are inspected
- **THEN** no rule reduces the opacity of a painted surface
- **AND** any dismiss layer present declares no background colour

### Requirement: The trigger announces the menu with drawn artwork, not a text character

The trigger SHALL indicate that it opens a menu with a mark rendered through the same vector mechanism the type glyphs use, from an eight by eight bitmap at a whole-number multiple of eight pixels. The mark SHALL NOT be a text character such as a downward triangle: the pixel face carries no glyph for those, so the character falls through to the system face and breaks the pixel grid — the same reason the card's form-count badge is drawn rather than typed.

The mark SHALL take its colour from the ink token, so it reads as part of the trigger's text rather than as a separate control.

#### Scenario: The mark is drawn, not typed

- **WHEN** the trigger is inspected
- **THEN** the menu indicator is vector artwork produced from an eight by eight bitmap
- **AND** no text node in the trigger contains a box-drawing or geometric-shape character

#### Scenario: The mark follows the mode

- **WHEN** the active mode changes
- **THEN** the mark is redrawn with the new mode's ink token
