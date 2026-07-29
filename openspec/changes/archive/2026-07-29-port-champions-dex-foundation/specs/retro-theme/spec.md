## ADDED Requirements

### Requirement: Two colour modes share one token contract

The theme layer SHALL define exactly two colour modes, POCKET and MODERN, and each SHALL resolve the same ten semantic tokens: bg, shell, panel, surface, surface2, ink, ink2, line, accent and accentInk. No component style SHALL hard-code a colour value; every colour SHALL be read from a token.

#### Scenario: Both modes resolve every token

- **WHEN** the token set for either mode is resolved
- **THEN** all ten semantic tokens carry a colour value

#### Scenario: Component styles reference tokens only

- **WHEN** the stylesheets of this slice are inspected for colour literals
- **THEN** no colour literal appears outside the theme layer

### Requirement: POCKET derives its tokens from four tones

POCKET SHALL derive its ten tokens from an ordered four-tone greyscale ramp rather than declaring them individually, because the same ramp is the colour source for later sprite placeholders and the ambience layer. MODERN SHALL declare its ten tokens directly. The count of distinct colours POCKET's interface renders SHALL remain three.

#### Scenario: POCKET tokens come from the ramp

- **WHEN** POCKET's token set is resolved
- **THEN** every token value is one of the four ramp tones

#### Scenario: POCKET introduces no colour outside its ramp

- **WHEN** the distinct colours rendered by POCKET's interface are collected, excluding sprite artwork
- **THEN** every one of them is a member of the four-tone ramp
- **AND** the count does not exceed four

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

### Requirement: Tokens are applied as inline CSS variables on the root view

The active mode's token set SHALL be applied as inline CSS custom properties on the application's outermost view. Changing the mode SHALL update those properties and SHALL NOT require remounting the component tree.

#### Scenario: Switching mode recolours the running screen

- **WHEN** the active mode changes while the screen is mounted
- **THEN** every rendered surface, border and text colour updates to the new mode's tokens
- **AND** no component is remounted

### Requirement: Ink colour is chosen by measured contrast

Ink selection over an arbitrary background SHALL compare the measured WCAG contrast of the dark ink candidate and the light ink candidate against that background and return whichever measures higher. Selection SHALL NOT use a fixed luminance threshold.

#### Scenario: Ink selection returns the higher-contrast candidate

- **WHEN** ink is selected for a background colour
- **THEN** the returned candidate is the one whose measured contrast against that background is higher

#### Scenario: A background near the crossover point

- **WHEN** ink is selected for the Rock type colour
- **THEN** the dark ink candidate is returned

##### Example: measured contrast at the crossover

- **GIVEN** the Rock type colour #AFA981
- **WHEN** contrast is measured against both ink candidates
- **THEN** the dark candidate #101010 measures 7.99 and the light candidate #ffffff measures 2.38, so the dark candidate is returned

### Requirement: Glyph fill is chosen by the surface it will sit on

A type glyph's fill colour SHALL be selected from the type and the named surface it renders onto, where the surface is one of surface, accent or typechip. A glyph SHALL NOT be filled with the same colour as the surface beneath it.

#### Scenario: POCKET spends no colour on glyphs

- **WHEN** a glyph fill is selected in POCKET
- **THEN** the fill is the lightest ramp tone on the accent surface and the darkest ramp tone otherwise

#### Scenario: MODERN colours the glyph on a neutral surface

- **WHEN** a glyph fill is selected in MODERN for the surface or accent target
- **THEN** the fill is the type's own colour on surface, and the accent ink token on accent

#### Scenario: MODERN inverts the glyph on a type-coloured chip

- **WHEN** a glyph fill is selected in MODERN for the typechip target, whose background is the type's own colour
- **THEN** the fill is the ink candidate with higher measured contrast against that type colour

#### Scenario: No combination renders an invisible glyph

- **WHEN** the measured contrast of every mode, type and surface combination is computed against its effective background
- **THEN** no combination measures below 2.9

##### Example: measured contrast floors and ceilings per combination

| Mode   | Surface  | Glyph fill source        | Lowest measured        | Highest measured        |
| ------ | -------- | ------------------------ | ---------------------- | ----------------------- |
| POCKET | surface  | darkest ramp tone        | 15.86 (all types)      | 15.86 (all types)       |
| POCKET | accent   | lightest ramp tone       | 15.86 (all types)      | 15.86 (all types)       |
| MODERN | surface  | the type's own colour    | 2.95 (Poison)          | 9.71 (Electric)         |
| MODERN | accent   | accent ink token         | 15.97 (all types)      | 15.97 (all types)       |
| MODERN | typechip | higher-contrast ink      | 4.47 (Fire)            | 11.42 (Electric)        |

### Requirement: Active language and active mode are shared reactive state

The active mode and the active language SHALL be held as shared reactive state readable by any component without prop threading. Both SHALL be switchable at runtime.

#### Scenario: Two components observe the same switch

- **WHEN** the active mode changes
- **THEN** every component reading the shared state re-renders with the new mode

#### Scenario: Language and mode switch independently

- **WHEN** the active language changes
- **THEN** the active mode is unaffected
