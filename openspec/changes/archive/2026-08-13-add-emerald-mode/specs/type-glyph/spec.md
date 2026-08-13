## MODIFIED Requirements

### Requirement: Glyph box size is fixed

A glyph SHALL render its mark into a box of exactly sixteen by sixteen pixels regardless of the surrounding font size, because an eight by eight source grid stays sharp only at integer scale factors.

A plate, when the theme layer reports one, SHALL surround that box with exactly one pixel on each side and SHALL NOT change the mark's box. The drawn control is then eighteen by eighteen pixels while the mark stays sixteen. Insetting the mark to keep the outer box at sixteen SHALL NOT be done: the mark would land on a fractional scale factor and stop being sharp, which is the same rule that fixes the box in the first place.

#### Scenario: Glyph size is independent of text size

- **WHEN** a glyph is placed next to text of any size
- **THEN** its rendered mark box is sixteen by sixteen pixels

#### Scenario: A larger glyph keeps the grid whole

- **WHEN** a caller asks for a larger glyph, as the sprite placeholder does
- **THEN** the rendered box is a whole-number multiple of eight pixels

#### Scenario: A plate grows the control, not the mark

- **WHEN** a glyph is rendered in a mode that plates it
- **THEN** the mark box is unchanged at sixteen by sixteen pixels
- **AND** the plate adds exactly one pixel on each side

### Requirement: Glyph accepts a type and a target surface

The glyph component SHALL take the type name and the target surface name as its inputs, and SHALL obtain its fill and its plate from the theme layer's single surface-aware paint selection. The component SHALL NOT inherit its colour from surrounding text colour, because the fill is written into the SVG string at production time. The component SHALL NOT decide for itself whether a plate is drawn, and callers SHALL NOT be given a way to ask for one: the plate belongs to the mode, so every call site gets the plated or unplated form without naming it.

The target surface SHALL be one of five named members: surface, accent, typechip, panel and surface2. The panel member names the panel's own background, which the unmarked learnset rows sit on. The surface2 member names the secondary surface, which the bonus-marked learnset rows sit on. A caller SHALL name the surface the glyph will actually sit on, and SHALL NOT reuse a near neighbour: the two ramp tones behind panel and surface coincide in POCKET but differ in MODERN, so reusing one for the other reports a background the glyph is not on and makes the measured contrast meaningless.

#### Scenario: Same type renders different fills on different surfaces

- **WHEN** the same type is rendered on the card surface and on the selected accent surface
- **THEN** the two renders carry different fill colours

#### Scenario: Unrecognised type name

- **WHEN** a glyph is requested for a type name absent from the bitmap table
- **THEN** the Normal bitmap is rendered and no error is raised

#### Scenario: The learnset rows name their own backgrounds

- **WHEN** a learnset row that is not marked for the bonus renders its type glyph
- **THEN** the glyph names the panel surface

#### Scenario: A bonus-marked row names the secondary surface

- **WHEN** a learnset row marked for the bonus renders its type glyph
- **THEN** the glyph names the surface2 surface

#### Scenario: The plate follows the mode without the caller asking

- **WHEN** the active mode changes between one that plates its glyphs and one that does not
- **THEN** every glyph on a neutral surface gains or loses its plate
- **AND** no call site changed the inputs it passes

#### Scenario: Callers cannot request a plate

- **WHEN** the glyph component's inputs are inspected
- **THEN** they name a type, a target surface and a size, and carry nothing that selects a plate
