## MODIFIED Requirements

### Requirement: Card composition

A species card SHALL render, in order: a header row carrying the zero-padded national number on the left and the Mega badge followed by the generation numeral on the right; the form's sprite; the leading species name; the alternate species name; the form label; and a type row carrying one glyph and one three-letter abbreviation per type, with a trailing group aligned to the type row's trailing edge.

The trailing group SHALL contain, in order, the base-stat figure and the form-count badge. Each member SHALL be rendered only when its own condition holds, and the group SHALL reserve no space for a member that is absent. When both members are absent the type row SHALL occupy the same height as it does when both are present.

The trailing group SHALL be aligned to the trailing edge by a mechanism already proven on this platform. Individual members SHALL NOT each claim the free space, because two members both claiming it would place one at the leading edge of the remaining space and one at the trailing edge rather than grouping them together.

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

#### Scenario: Trailing group keeps its members in a fixed order

- **WHEN** both the base-stat figure and the form-count badge are rendered
- **THEN** the base-stat figure precedes the form-count badge
- **AND** both sit at the type row's trailing edge as one group

##### Example: header and badge output for concrete species

| Species   | Number shown | Generation | Mega badge | Form-count badge | Type row      |
| --------- | ------------ | ---------- | ---------- | ---------------- | ------------- |
| Venusaur  | No.0003      | I          | star       | 2                | GRS, PSN      |
| Charizard | No.0006      | I          | star + 2   | 3                | FIR, FLY      |
| Ditto     | No.0132      | I          | none       | none             | NRM           |
| Heracross | No.0214      | II         | star       | 2                | BUG, FGT      |

## ADDED Requirements

### Requirement: Base-stat figure is shown exactly when it decides the order

A card SHALL render the base-stat figure when, and only when, the active sort order is by base stats. Under any other sort order the figure SHALL NOT be rendered.

The figure SHALL be the highest base-stat total across all of the species' forms, and SHALL be the same value the sort uses to order that card. It SHALL NOT be the base-stat total of the form the card is currently drawing, because a card showing one figure while being ordered by another gives the reader a number that does not explain the position it sits in.

The card SHALL obtain the active sort order from application state rather than from a component input. Taking a species entry and a form index as inputs governs which species and which form the card draws; it does not govern ambient display state, which the card already reads directly for the active language.

#### Scenario: Figure appears under base-stat sort

- **WHEN** the active sort order is by base stats
- **THEN** every visible card renders its base-stat figure in the type row's trailing group

#### Scenario: Figure disappears under number sort

- **WHEN** the active sort order changes from base stats to national number
- **THEN** no card renders a base-stat figure
- **AND** the cards are not unmounted and recreated

#### Scenario: Figure reflects the strongest form, not the drawn form

- **WHEN** a card draws a species' base form while that species has a stronger Mega form
- **THEN** the figure shown is the Mega form's base-stat total

#### Scenario: Figure is consistent with the order it explains

- **WHEN** the grid is sorted by base stats
- **THEN** reading the figures from the first card onward yields a sequence that never increases

##### Example: trailing group contents by sort order and form count

| Species  | Forms | Sort order | Base-stat figure | Form-count badge |
| -------- | ----- | ---------- | ---------------- | ---------------- |
| Venusaur | 2     | base stats | shown            | 2                |
| Venusaur | 2     | number     | absent           | 2                |
| Ditto    | 1     | base stats | shown            | absent           |
| Ditto    | 1     | number     | absent           | absent           |
