## ADDED Requirements

### Requirement: Glyphs render as vector content, not canvas

A type glyph SHALL be rendered by the platform's SVG element from an SVG XML string supplied as its content attribute. The implementation SHALL NOT use a canvas element, because the platform's element set has none, and SHALL NOT expand the bitmap into individual shape nodes in the component template.

#### Scenario: Glyph renders from a content string

- **WHEN** a glyph component renders
- **THEN** it passes a single SVG XML string to the SVG element's content attribute

#### Scenario: No per-pixel template nodes

- **WHEN** the glyph component's template is inspected
- **THEN** it contains no shape child elements and no per-pixel iteration in the template

### Requirement: Bitmap rows are emitted as merged horizontal runs

The SVG string SHALL encode each row's consecutive filled pixels as one rectangle rather than one rectangle per pixel, and SHALL declare a view box of eight by eight units so that the source grid maps to integer coordinates.

#### Scenario: Consecutive filled pixels merge

- **WHEN** a bitmap row contains a run of consecutive filled pixels
- **THEN** the emitted string contains one rectangle spanning that run

##### Example: one row of the Normal glyph

- **GIVEN** the row pattern for row 0 of the Normal glyph, which is two empty pixels, four filled pixels, then two empty pixels
- **WHEN** the SVG string is produced
- **THEN** that row contributes exactly one rectangle at x=2, y=0, width=4, height=1

### Requirement: Glyph box size is fixed

A glyph SHALL render into a box of exactly sixteen by sixteen pixels regardless of the surrounding font size, because an eight by eight source grid stays sharp only at integer scale factors.

#### Scenario: Glyph size is independent of text size

- **WHEN** a glyph is placed next to text of any size
- **THEN** its rendered box is sixteen by sixteen pixels

#### Scenario: A larger glyph keeps the grid whole

- **WHEN** a caller asks for a larger glyph, as the sprite placeholder does
- **THEN** the rendered box is a whole-number multiple of eight pixels

### Requirement: Glyph strings are memoised

Produced SVG strings SHALL be cached keyed by the combination of active mode, type name and target surface, and the cache SHALL be invalidated when the active mode changes.

#### Scenario: Repeated render reuses the cached string

- **WHEN** the same type and surface combination is rendered again under the same mode
- **THEN** the cached string is reused and no new string is produced

#### Scenario: Mode change invalidates cached strings

- **WHEN** the active mode changes
- **THEN** cached strings are discarded so fills are recomputed for the new mode

### Requirement: Glyph accepts a type and a target surface

The glyph component SHALL take the type name and the target surface name as its inputs, and SHALL obtain its fill from the theme layer's surface-aware fill selection. The component SHALL NOT inherit its colour from surrounding text colour, because the fill is written into the SVG string at production time.

#### Scenario: Same type renders different fills on different surfaces

- **WHEN** the same type is rendered on the card surface and on the selected accent surface
- **THEN** the two renders carry different fill colours

#### Scenario: Unrecognised type name

- **WHEN** a glyph is requested for a type name absent from the bitmap table
- **THEN** the Normal bitmap is rendered and no error is raised
