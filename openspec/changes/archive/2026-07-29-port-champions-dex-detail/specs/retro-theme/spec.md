## MODIFIED Requirements

### Requirement: POCKET derives its tokens from four tones

POCKET SHALL derive its ten tokens from an ordered four-tone greyscale ramp rather than declaring them individually, because the same ramp is the colour source for later sprite placeholders and the ambience layer. MODERN SHALL declare its ten tokens directly. The count of distinct colours POCKET's interface renders SHALL NOT exceed four, because the card bevel's secondary surface tone is painted even at rest, which puts the resting count at four rather than three. The invariant this count protects is that no colour outside the ramp is ever introduced; it does not pin the count to one particular value.

Two things are outside the count, and only these two: sprite artwork, which is the one thing on screen deliberately carrying original colour, and the detail veil, which dims the dex behind an open panel.

The veil SHALL be exempt because its colours are composited rather than chosen: it paints a ramp tone at reduced strength over whatever is beneath it. Hiding the dex outright instead would keep the count at four, but the panel would then stop reading as something sitting above the dex, which is the reason it overlays rather than replaces the grid. The exemption SHALL be limited to that one layer — no other surface may reach outside the ramp by compositing, and a translucent surface anywhere else is a violation rather than a precedent.

#### Scenario: POCKET tokens come from the ramp

- **WHEN** POCKET's token set is resolved
- **THEN** every token value is one of the four ramp tones

#### Scenario: POCKET introduces no colour outside its ramp

- **WHEN** the distinct colours rendered by POCKET's interface are collected, excluding sprite artwork and the detail veil
- **THEN** every one of them is a member of the four-tone ramp
- **AND** the count does not exceed four

#### Scenario: The veil dims rather than hides, in both modes

- **WHEN** the detail panel is open in either mode
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
