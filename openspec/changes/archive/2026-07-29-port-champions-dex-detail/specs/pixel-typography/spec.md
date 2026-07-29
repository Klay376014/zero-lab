## MODIFIED Requirements

### Requirement: Font roles are assigned by content kind

The pixel face SHALL be used for names, labels and numbers. Prose-length text SHALL NOT be set in the pixel face.

Prose-length text SHALL be set in the platform's own system face for now. The reading serif face the design document uses is distributed as WOFF2, which the platform's font registration does not accept on Android, and converting it to an accepted format roughly doubles its size and lands that size in the bundle. Neither the conversion nor the bundle cost SHALL be taken on by the slice that first renders prose, because that would put a font-size decision ahead of platform verification.

This placeholder SHALL be recorded as an open gap in the design handoff document, together with the fact that the design document's verification item for the division of typographic labour is not satisfied while it stands. It SHALL NOT be left as a silent divergence.

#### Scenario: Card typography uses the pixel face

- **WHEN** a card's species name, number, form label and type abbreviation are inspected
- **THEN** each is set in the pixel face

#### Scenario: Chinese text falls through to a system face

- **WHEN** Chinese text is rendered in a role assigned to the pixel face
- **THEN** it falls through to the platform's Chinese face, because the pixel face carries no Chinese glyphs
- **AND** it remains legible at the rendered size

#### Scenario: Prose text is not set in the pixel face

- **WHEN** an ability description or a warning paragraph is inspected
- **THEN** it is not set in the pixel face
- **AND** it names no embedded reading face, so it falls through to the platform's own face

##### Example: which face each role gets

| Content                   | Kind   | Face                     |
| ------------------------- | ------ | ------------------------ |
| Species name              | name   | pixel face               |
| Base-stat label and value | label  | pixel face               |
| National number           | number | pixel face               |
| Ability name              | name   | pixel face               |
| Ability description       | prose  | platform's system face   |
| Roster warning            | prose  | platform's system face   |

#### Scenario: The placeholder is recorded as a gap

- **WHEN** the design handoff document is inspected after prose text is first rendered
- **THEN** it records the system-face placeholder, the reason the reading face was not embedded, and the verification item that is unsatisfied while the placeholder stands

#### Scenario: No WOFF2 asset is introduced for prose

- **WHEN** the font registration rules and the font asset directory are inspected
- **THEN** no WOFF2 asset is present
