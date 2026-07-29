## MODIFIED Requirements

### Requirement: Glyphs render as vector content, not canvas

A type glyph SHALL be rendered as vector artwork through whichever of the two device-verified mechanisms named in the recorded-fallback requirement is in force. The implementation SHALL NOT use a canvas element, because the platform's element set has none, and SHALL NOT expand the bitmap into individual shape nodes in the component template. The glyph component's input contract SHALL be identical under either mechanism, so that callers rendering a glyph on a card, a filter control, or a placeholder tile are unaffected by which one is in force.

#### Scenario: Glyph renders as a single vector node

- **WHEN** a glyph component renders
- **THEN** it emits one vector element carrying the whole eight-by-eight mark
- **AND** that element is either the SVG element receiving an SVG XML string on its content attribute or the image element referencing an SVG asset

#### Scenario: No per-pixel template nodes

- **WHEN** the glyph component's template is inspected
- **THEN** it contains no shape child elements and no per-pixel iteration in the template

#### Scenario: Callers are unaffected by the mechanism

- **WHEN** the rendering mechanism changes from one verified form to the other
- **THEN** the component's inputs remain the type name and the target surface name
- **AND** no calling component's markup changes

## ADDED Requirements

### Requirement: Glyph rendering strategy has a recorded fallback

The primary mechanism SHALL be the platform's SVG element receiving an SVG XML string on its content attribute. Because that mechanism has been measured not to render on one platform build while the documentation names it as supported, the mechanism SHALL be adjudicated by measurement on a physical device before the grid replaces the verification harness. When measurement shows the primary mechanism renders, it SHALL be kept unchanged. When measurement shows it does not render, the implementation SHALL fall back to an image element referencing an SVG asset, coloured per target surface by the platform's tint colour property. Either outcome SHALL be recorded in the design handoff document together with the form actually adopted.

The fallback SHALL NOT reference the asset as a data URI, because a data URI SVG has been measured not to render. The fallback SHALL NOT emit one asset per combination of type, target surface, and colour mode; eighteen single-colour assets tinted at the point of use SHALL be sufficient, because the tint applies to every non-transparent pixel.

A glyph that renders as nothing SHALL be treated as an acceptance failure. Hiding the glyph SHALL NOT be accepted as a degraded state, because the eighteen marks are the interface's primary means of naming a type.

#### Scenario: Primary mechanism holds on device

- **WHEN** measurement on a physical device shows the SVG element renders its content string
- **THEN** the component keeps that mechanism
- **AND** no SVG assets are added to the project
- **AND** the outcome is recorded in the design handoff document

#### Scenario: Primary mechanism fails on device

- **WHEN** measurement on a physical device shows the SVG element does not render its content string
- **THEN** the component renders an image element referencing an SVG asset, tinted per target surface
- **AND** the outcome and the adopted form are recorded in the design handoff document

#### Scenario: The fallback's asset count is bounded by type

- **WHEN** the fallback is in force and the SVG assets are counted
- **THEN** there are eighteen, one per type
- **AND** no asset is referenced as a data URI

#### Scenario: An invisible glyph fails acceptance

- **WHEN** any type's mark renders as nothing on a target surface
- **THEN** acceptance fails for that surface
- **AND** the glyph is not hidden as a substitute for rendering it

##### Example: measured outcomes per candidate form

| Candidate form                            | Desktop build result | Role                                    |
| ----------------------------------------- | -------------------- | --------------------------------------- |
| SVG element with an SVG XML content string | did not render       | primary, pending device adjudication    |
| SVG element referencing an SVG asset       | did not render       | rejected                                |
| image element referencing an SVG asset     | rendered sharply     | fallback when the primary is disproved  |
| image element with an SVG data URI         | did not render       | rejected                                |
