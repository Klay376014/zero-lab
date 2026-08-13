## MODIFIED Requirements

### Requirement: Two colour modes share one token contract

The theme layer SHALL define at least two colour modes and SHALL define them as one ordered set, so that adding a mode is an addition to that set rather than a change to any control that reads it. The set currently holds three: POCKET, MODERN and EMERALD. Each mode SHALL resolve the same ten semantic tokens: bg, shell, panel, surface, surface2, ink, ink2, line, accent and accentInk. No component style SHALL hard-code a colour value; every colour SHALL be read from a token.

Adding a mode SHALL NOT add an eleventh token. A mode needing a colour the ten do not carry is a change to the contract for every mode, not an addition of one.

#### Scenario: Every mode resolves every token

- **WHEN** the token set for any mode in the ordered set is resolved
- **THEN** all ten semantic tokens carry a colour value

#### Scenario: Component styles reference tokens only

- **WHEN** the stylesheets of this slice are inspected for colour literals
- **THEN** no colour literal appears outside the theme layer

#### Scenario: The mode set is readable as a sequence

- **WHEN** a control needs to present every available mode
- **THEN** it reads the ordered set from the theme layer rather than naming the modes itself

### Requirement: POCKET derives its tokens from four tones

POCKET SHALL derive its ten tokens from an ordered four-tone greyscale ramp rather than declaring them individually, because the same ramp is the colour source for the sprite placeholders. MODERN and EMERALD SHALL each declare their ten tokens directly. The count of distinct colours POCKET's interface renders SHALL NOT exceed four, because the card bevel's secondary surface tone is painted even at rest, which puts the resting count at four rather than three. The invariant this count protects is that no colour outside the ramp is ever introduced; it does not pin the count to one particular value.

Two things are outside the count, and only these two: sprite artwork, which is the one thing on screen deliberately carrying original colour, and the detail veil, which dims the dex behind an open panel.

The veil SHALL be exempt because its colours are composited rather than chosen: it paints a ramp tone at reduced strength over whatever is beneath it. Hiding the dex outright instead would keep the count at four, but the panel would then stop reading as something sitting above the dex, which is the reason it overlays rather than replaces the grid. The exemption SHALL be limited to that one layer — no other surface SHALL reach outside the ramp by compositing, and a translucent surface anywhere else is a violation rather than a precedent.

The theme menu is inside the count, not outside it: while POCKET is in force the menu SHALL paint only ramp tones, which is why its rows name their modes in text rather than sampling their colours.

#### Scenario: POCKET tokens come from the ramp

- **WHEN** POCKET's token set is resolved
- **THEN** every token value is one of the four ramp tones

#### Scenario: POCKET introduces no colour outside its ramp

- **WHEN** the distinct colours rendered by POCKET's interface are collected, excluding sprite artwork and the detail veil
- **THEN** every one of them is a member of the four-tone ramp
- **AND** the count does not exceed four

#### Scenario: The veil dims rather than hides, in every mode

- **WHEN** the detail panel is open in any mode
- **THEN** the dex is visible through the veil at reduced strength
- **AND** the veil names no colour of its own, taking a theme token at reduced opacity instead

#### Scenario: No other surface composites outside the ramp

- **WHEN** POCKET's stylesheets and inline style bindings are inspected
- **THEN** the detail veil is the only rule that reduces the opacity of a painted surface

##### Example: POCKET token derivation from the ramp

| Token     | Ramp position | Value   |
| --------- | ------------- | ------- |
| bg        | tone 0        | #0d0d0d |
| shell     | tone 1        | #4f4f4f |
| panel     | tone 3        | #e8e8e8 |
| surface   | tone 3        | #e8e8e8 |
| surface2  | tone 2        | #a1a1a1 |
| ink       | tone 0        | #0d0d0d |
| ink2      | tone 1        | #4f4f4f |
| line      | tone 0        | #0d0d0d |
| accent    | tone 0        | #0d0d0d |
| accentInk | tone 3        | #e8e8e8 |

##### Example: EMERALD's ten declared tokens and their measured text contrast

| Token     | Value   | Drawn onto        | Measured |
| --------- | ------- | ----------------- | -------- |
| bg        | #15301F | —                 | —        |
| shell     | #266047 | —                 | —        |
| panel     | #E1CF95 | —                 | —        |
| surface   | #F0E7C6 | —                 | —        |
| surface2  | #C2BE8E | —                 | —        |
| ink       | #15301F | panel             | 9.20     |
| ink       | #15301F | surface           | 11.50    |
| ink2      | #3D5A2F | surface           | 6.27     |
| line      | #15301F | —                 | —        |
| accent    | #E37C31 | —                 | —        |
| accentInk | #15301F | accent            | 4.88     |

### Requirement: Glyph fill is chosen by the surface it will sit on

A type glyph's paint SHALL be selected from the type and the named surface it renders onto, where the surface is one of surface, accent, typechip, panel or surface2. The selection SHALL return a fill colour and, for modes that plate their glyphs, the colour of a plate the glyph paints behind itself. A glyph SHALL NOT be filled with the same colour as whatever is immediately beneath it.

A mode whose neutral surfaces are lighter than the type colours SHALL plate its glyphs rather than fill them with the type colour. Filling with the type colour on a light surface is not a matter of choosing better values: the brightest type colours measure below the floor against white itself, so no light surface clears it. Plating restores the arrangement the typechip surface already uses — the type's colour as the background, the higher-contrast ink candidate as the fill — so it introduces no colour and no new floor.

A plate SHALL be painted only for the surface, panel and surface2 members. The accent and typechip members already carry a chosen background, and plating them would hide it.

The function that reports a glyph's effective background SHALL report the plate colour whenever a plate is in force, the panel token for the panel member, and the surface2 token for the surface2 member. Fill, plate and reported background SHALL be produced by one selection so they cannot disagree: reporting a background the glyph is not on yields numbers that look ordinary and mean nothing.

#### Scenario: POCKET spends no colour on glyphs

- **WHEN** a glyph fill is selected in POCKET
- **THEN** the fill is the lightest ramp tone on the accent surface and the darkest ramp tone otherwise
- **AND** no plate is returned

#### Scenario: MODERN colours the glyph on a neutral surface

- **WHEN** a glyph fill is selected in MODERN for the surface, panel, or surface2 target
- **THEN** the fill is the type's own colour
- **AND** no plate is returned

#### Scenario: MODERN inverts the glyph on a type-coloured chip

- **WHEN** a glyph fill is selected in MODERN for the typechip target, whose background is the type's own colour
- **THEN** the fill is the ink candidate with higher measured contrast against that type colour

#### Scenario: EMERALD plates the glyph on a neutral surface

- **WHEN** a glyph paint is selected in EMERALD for the surface, panel, or surface2 target
- **THEN** the plate is the type's own colour
- **AND** the fill is the ink candidate with higher measured contrast against that type colour
- **AND** the reported background is the plate colour

#### Scenario: No mode plates a glyph that already has a chosen background

- **WHEN** a glyph paint is selected for the accent or typechip target in any mode
- **THEN** no plate is returned

#### Scenario: No combination renders an invisible glyph

- **WHEN** the measured contrast of every mode, type and surface combination is computed against its effective background
- **THEN** no combination measures below 2.5

#### Scenario: The bonus row is legible without relying on the glyph's contrast

- **WHEN** a bonus-marked learnset row renders a type whose glyph contrast on surface2 is the lowest measured
- **THEN** the row still states the bonus through its star text node, which does not take its colour from the type

##### Example: measured contrast floors and ceilings per combination

| Mode    | Surface  | Glyph fill source        | Lowest measured        | Highest measured        |
| ------- | -------- | ------------------------ | ---------------------- | ----------------------- |
| POCKET  | surface  | darkest ramp tone        | 15.86 (all types)      | 15.86 (all types)       |
| POCKET  | panel    | darkest ramp tone        | 15.86 (all types)      | 15.86 (all types)       |
| POCKET  | surface2 | darkest ramp tone        | 7.52 (all types)       | 7.52 (all types)        |
| POCKET  | accent   | lightest ramp tone       | 15.86 (all types)      | 15.86 (all types)       |
| MODERN  | surface  | the type's own colour    | 2.95 (Poison)          | 9.71 (Electric)         |
| MODERN  | panel    | the type's own colour    | 3.39 (Poison)          | 11.18 (Electric)        |
| MODERN  | surface2 | the type's own colour    | 2.53 (Poison)          | 8.34 (Electric)         |
| MODERN  | accent   | accent ink token         | 15.97 (all types)      | 15.97 (all types)       |
| MODERN  | typechip | higher-contrast ink      | 4.47 (Fire)            | 11.42 (Electric)        |
| EMERALD | surface  | higher-contrast ink on a plate of the type's colour | 4.47 (Fire) | 11.42 (Electric) |
| EMERALD | panel    | higher-contrast ink on a plate of the type's colour | 4.47 (Fire) | 11.42 (Electric) |
| EMERALD | surface2 | higher-contrast ink on a plate of the type's colour | 4.47 (Fire) | 11.42 (Electric) |
| EMERALD | accent   | accent ink token         | 4.88 (all types)       | 4.88 (all types)        |
| EMERALD | typechip | higher-contrast ink      | 4.47 (Fire)            | 11.42 (Electric)        |

##### Example: MODERN types measuring below 2.9 on surface2

| Type   | Measured on surface2 | Notes                                                              |
| ------ | -------------------- | ------------------------------------------------------------------ |
| Poison | 2.53                 | the new floor; the same type that floors the surface member at 2.95 |
| Dragon | 2.71                 | above 2.9 on surface, below it on the lighter surface2             |
| Ghost  | 2.89                 | marginally below the previous floor                                |

##### Example: why a light surface cannot carry the type colour as a fill

The white column is the ceiling: no light surface can measure higher than white does, so a type
below the floor against white is below it against every light surface there is.

| Type     | Colour  | Against white | Against surface #F0E7C6 | Against panel #E1CF95 |
| -------- | ------- | ------------- | ----------------------- | --------------------- |
| Electric | #FAC000 | 1.67          | 1.34                    | 1.08                  |
| Ice      | #3DCEF3 | 1.85          | 1.50                    | 1.20                  |
| Flying   | #81B9EF | 2.08          | 1.68                    | 1.34                  |

Counted across all eighteen types, the fill arrangement leaves 10 below the floor on surface,
13 on panel and 15 on surface2.

### Requirement: Active language and active mode are shared reactive state

The active mode and the active language SHALL be held as shared reactive state readable by any component without prop threading. Both SHALL be switchable at runtime.

The active mode SHALL be set by naming a mode, not by advancing a position in the mode set. No operation that advances the active mode to the next member SHALL be exposed, because a control built on it states neither how many modes exist nor which one is in force, and the set is expected to grow.

Setting the active mode to the mode already in force SHALL leave the interface unchanged.

#### Scenario: Two components observe the same switch

- **WHEN** the active mode changes
- **THEN** every component reading the shared state re-renders with the new mode

#### Scenario: Language and mode switch independently

- **WHEN** the active language changes
- **THEN** the active mode is unaffected

#### Scenario: The mode is selected by name

- **WHEN** a mode is set by naming it
- **THEN** the active mode becomes that mode, whatever its position in the ordered set

#### Scenario: Setting the active mode again is inert

- **WHEN** the active mode is set to the mode already in force
- **THEN** no token value changes and no component is remounted

## RENAMED Requirements

- FROM: `### Requirement: Two colour modes share one token contract`
- TO: `### Requirement: Colour modes share one token contract`
