## ADDED Requirements

### Requirement: The switcher appears only for species with more than one form

The form switcher SHALL be rendered only when the selected species has more than one form. For a single-form species the switcher SHALL be absent rather than rendered as one disabled control, because a control that can never do anything is noise.

#### Scenario: Multi-form species shows the switcher

- **WHEN** the detail is open for a species with more than one form
- **THEN** the switcher is present and lists every form of that species

#### Scenario: Single-form species has no switcher

- **WHEN** the detail is open for a species with exactly one form
- **THEN** no switcher is present in the panel

---

### Requirement: Forms are grouped by kind in a fixed order

Form buttons SHALL be grouped by form kind, in the fixed order base, other, regional, mega. Each group present SHALL carry a label naming its kind, drawn from the string table. A group with no forms SHALL be omitted entirely.

Grouping exists so that a species with a large number of cosmetic forms stays navigable: twenty buttons in one undifferentiated row cannot be read, while the same twenty under a named group can.

#### Scenario: Groups appear in the fixed order

- **WHEN** a species with forms of several kinds is displayed
- **THEN** its groups appear in the order base, other, regional, mega
- **AND** each group carries its kind label

##### Example: grouping by species

| Species   | Forms                                        | Groups rendered      |
| --------- | -------------------------------------------- | -------------------- |
| Venusaur  | base, Mega Venusaur                          | base, mega           |
| Charizard | base, Mega Charizard X, Mega Charizard Y     | base, mega           |
| Vivillon  | twenty patterns, every one of kind other     | other                |
| Floette   | Eternal Flower, Mega Floette                 | regional, mega       |

Neither Vivillon nor Floette has a form of the base kind, which is why neither renders a base
group. A species without a base form is normal in this dataset, not a gap to be filled.

#### Scenario: Empty groups are omitted

- **WHEN** a species has no form of a given kind
- **THEN** no group label for that kind is rendered

#### Scenario: A large cosmetic-form set stays readable

- **WHEN** a species with twenty forms is displayed at the narrowest width the port targets
- **THEN** its group labels are legible, its buttons wrap onto further rows, and the switcher does not overflow horizontally

---

### Requirement: A form button carries type marks only when that form retypes the species

A form button SHALL carry the form's type marks only when that form's type combination differs from the species' first form's type combination. When the combination is the same, the button SHALL carry its label alone.

A type mark on a button means "this form retypes the Pokémon". Stamping every cosmetic form with the same type pair the species already has says nothing and turns the switcher into a wall of repeated marks.

A form of the mega kind SHALL additionally carry the star that marks it as a mega form.

#### Scenario: Retyping form carries marks

- **WHEN** a form's type combination differs from the species' first form's
- **THEN** its button carries that form's type marks

#### Scenario: Same-type form carries none

- **WHEN** a form's type combination equals the species' first form's
- **THEN** its button carries its label with no type marks

##### Example: marks by form

| Species   | Form               | First form's types | This form's types | Marks |
| --------- | ------------------ | ------------------ | ----------------- | ----- |
| Venusaur  | Mega Venusaur      | Grass/Poison       | Grass/Poison      | none  |
| Charizard | Mega Charizard X   | Fire/Flying        | Fire/Dragon       | shown |
| Charizard | Mega Charizard Y   | Fire/Flying        | Fire/Flying       | none  |
| Vivillon  | any pattern        | Bug/Flying         | Bug/Flying        | none  |
| Ninetales | Alolan Form        | Fire               | Ice/Fairy         | shown |

Charizard's two Megas answer differently, which is the point of comparing signatures rather than
marking every alternate form.

#### Scenario: Mega forms carry the star

- **WHEN** a form of the mega kind is rendered as a button
- **THEN** its button carries the mega star

---

### Requirement: The selected button is visibly distinct and its rule cannot be cancelled by its base

Exactly one form button SHALL be in the selected state at any time, and that state SHALL be visibly distinct from the unselected state. The selected-state rule SHALL follow the base rule it overrides in source order, and SHALL be named by the project's selected-state naming convention so that the existing style check asserts the ordering.

Both rules are single-class selectors and therefore carry equal weight, so source order decides. A selected rule placed above its base is cancelled on every property they share, and the control then renders identically whether or not it is selected — with no error and nothing to notice except that the switcher stopped answering.

#### Scenario: One button is selected

- **WHEN** the switcher is rendered
- **THEN** exactly one button is in the selected state, and it is the button for the displayed form

#### Scenario: The selected state is visible

- **WHEN** the selected button is compared with an unselected one in either mode
- **THEN** they differ visibly

#### Scenario: The style check asserts the rule order

- **WHEN** the style check runs
- **THEN** the switcher's selected-state rule follows its base rule and the check passes

#### Scenario: The mark on a selected button stays visible

- **WHEN** a selected button carries type marks
- **THEN** those marks are drawn for the selected button's surface rather than the unselected one's
- **AND** their computed contrast against that surface is at or above the recorded floor

---

### Requirement: Selecting a form replaces the panel's content without moving the scroll position

Selecting a form SHALL replace the artwork, form label, type pills, attribute rows, base stats and abilities with that form's. The panel's scroll position SHALL NOT move, and no code SHALL read or write that scroll position: the framework's reactive update replaces only the nodes that changed, so the position is preserved on its own.

The switcher SHALL report the chosen form to its caller rather than writing the selection state itself, so that the panel remains the one place that knows how a form change is applied.

#### Scenario: Content follows the chosen form

- **WHEN** another form is selected
- **THEN** the artwork, form label, type pills, attributes, base stats and abilities are that form's

#### Scenario: The scroll position stays put

- **WHEN** the panel is scrolled to its abilities section and another form is selected
- **THEN** the panel remains scrolled at the same position

#### Scenario: No scroll-position code

- **WHEN** the panel and switcher sources are inspected
- **THEN** neither reads nor writes a scroll position

#### Scenario: Artwork for the newly chosen form

- **WHEN** another form is selected and its artwork has not yet loaded
- **THEN** the box shows that form's first type mark until the artwork's load event fires
