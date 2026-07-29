# dex-query Specification

## Purpose

What the grid is asked for, and what it answers with. Covers the shared search, type filter, generation filter and sort order and their independence from one another, matching against both languages at all times so that switching which language leads never changes what is reachable, filters judged across all of a species' forms, pairing each result with the form that actually matched the filter, and ranking by each species' strongest form rather than its base form.

## Requirements

### Requirement: Query state is shared and independently settable

The search string, the type filter, the generation filter, and the sort order SHALL be held as shared reactive state that any component reads without threading properties through the tree, following the same arrangement as the existing display state. Each of the four SHALL be settable without disturbing the other three. A reset operation SHALL return all four to their initial values. The query state SHALL expose a derived result sequence in which every element names a species together with the form index that species' card displays under the active query.

#### Scenario: Each control is independent

- **WHEN** the type filter is set
- **THEN** the search string, the generation filter, and the sort order are unchanged

#### Scenario: Reset returns every control to its initial value

- **WHEN** the reset operation runs after the search string, both filters, and the sort order have all been changed
- **THEN** all four read their initial values
- **AND** the result sequence contains every species

#### Scenario: The result sequence names a form per species

- **WHEN** the result sequence is read
- **THEN** every element names one species and one form index


<!-- @trace
source: port-champions-dex-grid
updated: 2026-07-29
code:
  - src/components/QueryBar.vue
  - design/HANDOFF.md
  - src/data/i18n.ts
  - src/state/query.ts
  - src/components/DexGrid.vue
  - src/App.css
  - src/App.vue
-->

---
### Requirement: Search matches across both languages at all times

The search string SHALL be matched against both the Traditional Chinese and the English species name regardless of which language is leading, because switching which language leads changes presentation and MUST NOT change which species are reachable. Latin matching SHALL be case-insensitive. A partial name SHALL match.

#### Scenario: Either language matches the same species

- **WHEN** the search string is one species' English name
- **THEN** that species is in the result sequence
- **AND** searching that species' Traditional Chinese name instead produces the same result sequence

#### Scenario: Leading language does not change the result set

- **WHEN** the leading language is switched while a search string is active
- **THEN** the result sequence is unchanged

##### Example: cross-language and partial matching

| Search string | Matches Charizard | Notes                          |
| ------------- | ----------------- | ------------------------------ |
| charizard     | yes               | English name, lower case       |
| CHARIZARD     | yes               | matching ignores letter case   |
| 噴火龍        | yes               | Traditional Chinese name       |
| char          | yes               | partial Latin name             |
| 噴火          | yes               | partial Traditional Chinese    |
| ditto         | no                | names a different species      |


<!-- @trace
source: port-champions-dex-grid
updated: 2026-07-29
code:
  - src/components/QueryBar.vue
  - design/HANDOFF.md
  - src/data/i18n.ts
  - src/state/query.ts
  - src/components/DexGrid.vue
  - src/App.css
  - src/App.vue
-->

---
### Requirement: Type and generation filters are evaluated across all of a species' forms

The type filter SHALL match a species when any of its forms carries the selected type, using the data layer's existing across-forms type accessor, so that a species whose only match is an alternate form remains reachable. The generation filter SHALL match on the species' introduction generation. When both filters and a search string are active, a species SHALL be in the result sequence only when it satisfies all three.

#### Scenario: A species matches on an alternate form's type

- **WHEN** the type filter selects a type that only one of a species' non-base forms carries
- **THEN** that species is in the result sequence

#### Scenario: Filters and search combine conjunctively

- **WHEN** a search string, a type filter, and a generation filter are all active
- **THEN** the result sequence contains only species satisfying all three

##### Example: type filter reaches alternate forms

| Type filter | Charizard in result | Reason                                              |
| ----------- | ------------------- | --------------------------------------------------- |
| Fire        | yes                 | the base form carries it                            |
| Flying      | yes                 | the base form carries it                            |
| Dragon      | yes                 | only Mega Charizard X carries it                    |
| Water       | no                  | no form carries it                                  |


<!-- @trace
source: port-champions-dex-grid
updated: 2026-07-29
code:
  - src/components/QueryBar.vue
  - design/HANDOFF.md
  - src/data/i18n.ts
  - src/state/query.ts
  - src/components/DexGrid.vue
  - src/App.css
  - src/App.vue
-->

---
### Requirement: A filtered card displays the form that matched the filter

When a type filter is active, the form index paired with a species in the result sequence SHALL be the first form carrying the selected type, so that the card answers the filter with the artwork, form label, and types that actually match it. When no type filter is active, the paired form index SHALL be the base form. A card whose species matched on an alternate form SHALL NOT display the base form, because a grid answering a Dragon filter with Fire and Flying artwork reads as broken.

#### Scenario: The matching form is displayed

- **WHEN** a type filter is active and a species matched on a non-base form
- **THEN** the paired form index names that form
- **AND** the card renders that form's artwork, form label, and types

#### Scenario: No type filter displays the base form

- **WHEN** no type filter is active
- **THEN** every paired form index names the base form

##### Example: the same species under different type filters

| Type filter | Form displayed for Charizard | Types shown on the card |
| ----------- | ---------------------------- | ----------------------- |
| none        | base                         | Fire, Flying            |
| Fire        | base                         | Fire, Flying            |
| Dragon      | Mega Charizard X             | Fire, Dragon            |


<!-- @trace
source: port-champions-dex-grid
updated: 2026-07-29
code:
  - src/components/QueryBar.vue
  - design/HANDOFF.md
  - src/data/i18n.ts
  - src/state/query.ts
  - src/components/DexGrid.vue
  - src/App.css
  - src/App.vue
-->

---
### Requirement: Sorting by base stats uses each species' strongest form

The base-stat sort order SHALL rank species by the highest base-stat total across all of that species' forms, using the data layer's existing strongest-form accessor, and SHALL NOT rank by the base form's total. Ranking by the base form buries every Mega form beneath unevolved totals. The sort order SHALL be a closed set containing at least national number and base-stat total. Base-stat total SHALL order from highest to lowest.

#### Scenario: Base-stat sort is descending by strongest form

- **WHEN** the sort order is base-stat total
- **THEN** each entry's strongest-form total is greater than or equal to the total of the entry after it

#### Scenario: National number sort is ascending

- **WHEN** the sort order is national number
- **THEN** each entry's national number is less than the national number of the entry after it

##### Example: strongest form decides the rank

| Species      | Base form total | Strongest form total | Sort value used |
| ------------ | --------------- | -------------------- | --------------- |
| Venusaur     | 525             | 625                  | 625             |
| Charizard    | 534             | 634                  | 634             |
| Crabominable | 478             | 578                  | 578             |
| Ditto        | 288             | 288                  | 288             |

##### Example: resulting order for those four species

- **GIVEN** the four species above and no active filters
- **WHEN** the sort order is base-stat total
- **THEN** the order is Charizard, Venusaur, Crabominable, Ditto

<!-- @trace
source: port-champions-dex-grid
updated: 2026-07-29
code:
  - src/components/QueryBar.vue
  - design/HANDOFF.md
  - src/data/i18n.ts
  - src/state/query.ts
  - src/components/DexGrid.vue
  - src/App.css
  - src/App.vue
-->