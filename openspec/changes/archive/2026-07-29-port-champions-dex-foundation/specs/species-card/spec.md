## ADDED Requirements

### Requirement: Card composition

A species card SHALL render, in order: a header row carrying the zero-padded national number on the left and the Mega badge followed by the generation numeral on the right; the form's sprite; the leading species name; the alternate species name; the form label; and a type row carrying one glyph and one three-letter abbreviation per type, with the form-count badge aligned to its trailing edge.

#### Scenario: National number is zero-padded to four digits

- **WHEN** a card renders a species number
- **THEN** the number is prefixed and padded to four digits

#### Scenario: Generation renders as a Roman numeral

- **WHEN** a card renders the generation
- **THEN** the generation number is shown as its Roman numeral

#### Scenario: Mega badge appears only for species with a Mega form

- **WHEN** a species has no Mega form
- **THEN** no Mega badge is rendered

#### Scenario: Mega badge carries a count only when several exist

- **WHEN** a species has more than one Mega form
- **THEN** the badge shows the star followed by the count
- **AND** when exactly one Mega form exists the badge shows the star alone

#### Scenario: Form-count badge appears only for multi-form species

- **WHEN** a species has exactly one form
- **THEN** no form-count badge is rendered

##### Example: header and badge output for concrete species

| Species   | Number shown | Generation | Mega badge | Form-count badge | Type row      |
| --------- | ------------ | ---------- | ---------- | ---------------- | ------------- |
| Venusaur  | No.0003      | I          | star       | 2                | GRS, PSN      |
| Charizard | No.0006      | I          | star + 2   | 3                | FIR, FLY      |
| Ditto     | No.0132      | I          | none       | none             | NRM           |
| Heracross | No.0214      | II         | star       | 2                | BUG, FGT      |

### Requirement: Both languages stay on the card

A card SHALL render the leading species name and the alternate species name at the same time. Switching the active language SHALL swap which one leads and SHALL NOT remove either from the card.

#### Scenario: Language switch swaps the two name rows

- **WHEN** the active language changes while the card is mounted
- **THEN** the leading name row and the alternate name row exchange contents
- **AND** both rows remain rendered

### Requirement: Card height is stable when optional rows are empty

The alternate name row and the form label row SHALL reserve their height when their content is empty, so cards of differing content align on a shared baseline.

#### Scenario: Base form leaves the form label empty

- **WHEN** a card renders a form whose label is empty
- **THEN** the form label row reserves its height and the card's overall height matches a card whose form label is present

### Requirement: Long names wrap rather than truncate

A species name SHALL wrap onto additional lines when it exceeds the card width. A name SHALL NOT be clipped, ellipsised, or pushed outside the card bounds.

#### Scenario: Longest Latin name fits

- **WHEN** a card renders the species name Crabominable
- **THEN** the full name is visible, wrapped if needed, and no horizontal overflow occurs

#### Scenario: Longest Chinese name fits

- **WHEN** a card renders a five-character Chinese species name
- **THEN** the full name is visible and no horizontal overflow occurs

### Requirement: Sprite upscaling declares nearest-neighbour on the image element itself

Every image element that renders sprite artwork SHALL carry the pixelated image-rendering declaration on the element itself. The declaration SHALL NOT be placed only on an ancestor, because the platform applies this property to the declaring element alone and does not inherit it.

#### Scenario: Declaration sits on the image element

- **WHEN** the styles applied to a sprite image are inspected
- **THEN** the pixelated image-rendering declaration is present on that image element

#### Scenario: Upscaled sprite stays a sharp pixel grid

- **WHEN** a 96 pixel source sprite is rendered into a 192 pixel box on device
- **THEN** the result shows sharp square pixels rather than smooth interpolation

#### Scenario: Nearest-neighbour upscaling is unavailable on the platform

- **WHEN** the upscaled sprite renders with smooth interpolation on device despite the declaration
- **THEN** the fallback of rendering artwork at its native 96 pixel size is applied
- **AND** the observed platform behaviour is recorded in the design handoff document

### Requirement: Sprite artwork is never recoloured

Sprite artwork SHALL render unmodified in both colour modes. No tint, filter or quantisation SHALL be applied to it.

#### Scenario: Mode switch leaves artwork untouched

- **WHEN** the active mode changes
- **THEN** the sprite's own colours are unchanged while surrounding surfaces recolour

### Requirement: Sprite load failure falls back to a glyph tile

When sprite artwork fails to load, the card SHALL render a placeholder tile filling the sprite's box, using the secondary surface token as its background and the form's first type glyph centred within it. The fallback SHALL NOT render a broken-image indicator, SHALL NOT leave the sprite box empty, and SHALL NOT report an error to the console.

#### Scenario: Remote artwork is unreachable

- **WHEN** the sprite request fails because the artwork host is unreachable
- **THEN** the card renders the placeholder tile with the form's first type glyph
- **AND** the console records no error

#### Scenario: Placeholder occupies the same box as artwork

- **WHEN** the placeholder tile is rendered
- **THEN** its box matches the sprite box, so the card's height does not change

### Requirement: Card bevel is built from per-side border colours

The card's one-pixel bevel SHALL be produced by a nested view whose top and left border colours use the panel token and whose bottom and right border colours use the secondary surface token. Inset box shadows SHALL NOT be used, because the platform does not support the inset keyword. The bevel SHALL introduce no colour outside the active mode's token set.

#### Scenario: Bevel renders without inset shadow

- **WHEN** the card's styles are inspected
- **THEN** no box shadow declaration uses the inset keyword
- **AND** the bevel's light and shadow edges come from existing tokens

#### Scenario: Bevel is visible on device

- **WHEN** a card is viewed on device
- **THEN** a one-pixel light edge is visible along its top and left and a one-pixel darker edge along its bottom and right

#### Scenario: Border rendering makes the two-edge bevel unusable

- **WHEN** the one-pixel per-side borders render inconsistently on device
- **THEN** the bevel is reduced to the top and left light edge alone
- **AND** the observed platform behaviour is recorded in the design handoff document

### Requirement: Card reflects mode and language without remounting

A card SHALL re-render its colours on a mode change and its names on a language change, without being unmounted and recreated.

#### Scenario: Mode change recolours a mounted card

- **WHEN** the active mode changes
- **THEN** the card's surface, border, text and glyph colours update in place

### Requirement: Card takes a species and a form index

The card component SHALL take a species entry and a form index as its inputs, and SHALL render the form at that index. Form switching interaction is out of scope for this capability.

#### Scenario: Card renders the requested form

- **WHEN** a card is given a species and a form index pointing at a Mega form
- **THEN** the card renders that form's sprite, label and types rather than the base form's
