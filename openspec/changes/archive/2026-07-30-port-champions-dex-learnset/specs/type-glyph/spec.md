## MODIFIED Requirements

### Requirement: Glyph accepts a type and a target surface

The glyph component SHALL take the type name and the target surface name as its inputs, and SHALL obtain its fill from the theme layer's surface-aware fill selection. The component SHALL NOT inherit its colour from surrounding text colour, because the fill is written into the SVG string at production time.

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
