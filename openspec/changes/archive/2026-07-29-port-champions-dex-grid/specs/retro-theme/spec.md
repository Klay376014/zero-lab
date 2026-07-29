## MODIFIED Requirements

### Requirement: POCKET derives its tokens from four tones

POCKET SHALL derive its ten tokens from an ordered four-tone greyscale ramp rather than declaring them individually, because the same ramp is the colour source for later sprite placeholders and the ambience layer. MODERN SHALL declare its ten tokens directly. The count of distinct colours POCKET's interface renders SHALL NOT exceed four, because the card bevel's secondary surface tone is painted even at rest, which puts the resting count at four rather than three. The invariant this count protects is that no colour outside the ramp is ever introduced; it does not pin the count to one particular value.

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
