## MODIFIED Requirements

### Requirement: Glyph fill is chosen by the surface it will sit on

A type glyph's fill colour SHALL be selected from the type and the named surface it renders onto, where the surface is one of surface, accent, typechip, panel or surface2. A glyph SHALL NOT be filled with the same colour as the surface beneath it.

The function that reports a glyph's effective background SHALL report the panel token for the panel member and the surface2 token for the surface2 member. Both functions SHALL be extended together: extending only the fill selection leaves the contrast measurement computing against a background the glyph is not on, which yields numbers that look ordinary and mean nothing.

#### Scenario: POCKET spends no colour on glyphs

- **WHEN** a glyph fill is selected in POCKET
- **THEN** the fill is the lightest ramp tone on the accent surface and the darkest ramp tone otherwise

#### Scenario: MODERN colours the glyph on a neutral surface

- **WHEN** a glyph fill is selected in MODERN for the surface, panel, or surface2 target
- **THEN** the fill is the type's own colour

#### Scenario: MODERN inverts the glyph on a type-coloured chip

- **WHEN** a glyph fill is selected in MODERN for the typechip target, whose background is the type's own colour
- **THEN** the fill is the ink candidate with higher measured contrast against that type colour

#### Scenario: No combination renders an invisible glyph

- **WHEN** the measured contrast of every mode, type and surface combination is computed against its effective background
- **THEN** no combination measures below 2.5

#### Scenario: The bonus row is legible without relying on the glyph's contrast

- **WHEN** a bonus-marked learnset row renders a type whose glyph contrast on surface2 is the lowest measured
- **THEN** the row still states the bonus through its star text node, which does not take its colour from the type

##### Example: measured contrast floors and ceilings per combination

| Mode   | Surface  | Glyph fill source        | Lowest measured        | Highest measured        |
| ------ | -------- | ------------------------ | ---------------------- | ----------------------- |
| POCKET | surface  | darkest ramp tone        | 15.86 (all types)      | 15.86 (all types)       |
| POCKET | panel    | darkest ramp tone        | 15.86 (all types)      | 15.86 (all types)       |
| POCKET | surface2 | darkest ramp tone        | 7.52 (all types)       | 7.52 (all types)        |
| POCKET | accent   | lightest ramp tone       | 15.86 (all types)      | 15.86 (all types)       |
| MODERN | surface  | the type's own colour    | 2.95 (Poison)          | 9.71 (Electric)         |
| MODERN | panel    | the type's own colour    | 3.39 (Poison)          | 11.18 (Electric)        |
| MODERN | surface2 | the type's own colour    | 2.53 (Poison)          | 8.34 (Electric)         |
| MODERN | accent   | accent ink token         | 15.97 (all types)      | 15.97 (all types)       |
| MODERN | typechip | higher-contrast ink      | 4.47 (Fire)            | 11.42 (Electric)        |

##### Example: MODERN types measuring below 2.9 on surface2

| Type   | Measured on surface2 | Notes                                                              |
| ------ | -------------------- | ------------------------------------------------------------------ |
| Poison | 2.53                 | the new floor; the same type that floors the surface member at 2.95 |
| Dragon | 2.71                 | above 2.9 on surface, below it on the lighter surface2             |
| Ghost  | 2.89                 | marginally below the previous floor                                |
