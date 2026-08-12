## ADDED Requirements

### Requirement: Move query state is shared, independently settable, and outlives the tab

The search string, the type selection, and the damage class selection SHALL be held as shared reactive state that any component reads without threading properties through the tree, following the same arrangement as the existing query, display and learnset state. Each of the three SHALL be settable without disturbing the other two.

This state SHALL NOT be held by the moves tab's components, so that switching tabs or opening and closing a layer leaves it intact. Only the reset operation SHALL return all three to their initial values: an empty search string, no types selected, and no damage classes selected.

The state SHALL be separate from the dex tab's query state. The dex tab's query answers which species and which of its forms match, a question the move table has no form to answer, and a shared reset would return both tabs to their initial values when a reader clears one.

#### Scenario: Each condition is settable without disturbing the others

- **WHEN** a type is selected while a search string is present
- **THEN** the search string is unchanged
- **AND** the damage class selection is unchanged

#### Scenario: Reset returns all three to their initial values

- **WHEN** the reset operation runs with a search string present, two types selected and one damage class selected
- **THEN** the search string is empty, no type is selected, and no damage class is selected

#### Scenario: The state survives a tab switch

- **WHEN** conditions are set on the moves tab, the dex tab is shown, and the moves tab is shown again
- **THEN** the same conditions are still in effect

#### Scenario: Clearing the dex tab's query leaves the move conditions alone

- **WHEN** the dex tab's reset runs while move conditions are set
- **THEN** the move conditions are unchanged

---
### Requirement: Move search matches names in both languages and matches nothing else

The search corpus for a move SHALL be its English name and its Chinese name, and nothing else. The corpus SHALL NOT include the move's type, its damage class, or its description text.

Both names SHALL be in the corpus at all times, independent of which language leads the interface, so that switching the leading language never changes which moves are reachable by search.

Type is excluded because the type control sits in the same block of controls and answers that question exactly, while a corpus carrying type names would let a search return every move of a type and duplicate the control less precisely. Description text is excluded because matching prose produces hits too diffuse to distinguish from a broken search.

The search string SHALL be split on whitespace into tokens, lowercased, and a move SHALL match only when every token is found in its corpus. A search string that is empty or contains only whitespace SHALL impose no condition.

The corpus SHALL be derived once per move and retained, rather than rebuilt on each evaluation.

#### Scenario: A search matches the Chinese name while English leads

- **WHEN** the leading language is English and the search string is a Chinese substring of a move's Chinese name
- **THEN** that move matches

#### Scenario: Every token must be found

- **WHEN** the search string holds two tokens
- **THEN** only moves whose corpus contains both tokens match

#### Scenario: A whitespace-only search imposes no condition

- **WHEN** the search string contains only whitespace
- **THEN** every move in the shared move table matches

#### Scenario: Type is not in the corpus

- **WHEN** the search string is a type name and no move's name contains that text
- **THEN** no move matches on account of carrying that type

##### Example: search strings against the 496-entry move table

| Search string | Matches | Notes |
| ------------- | ------- | ----- |
| (empty) | 496 | no condition |
| two spaces | 496 | whitespace only imposes no condition |
| 牙 | 7 | includes 以牙還牙 / Payback, whose type is Dark — a name hit, not a type hit |
| fang | 6 | one fewer than 牙; the two languages' corpora are not symmetric, which is correct |
| 火焰 | 7 | includes 噴射火焰 / Flamethrower and 火焰踢 / Blaze Kick |
| ice | 9 | English name hits only; the Ice type has 20 moves |
| fire fang | 1 | 火焰牙 / Fire Fang — every token must be found |
| FIRE FANG | 1 | matching is case insensitive |

---
### Requirement: Selections within a condition combine disjunctively and the three conditions combine conjunctively

Several selected types SHALL combine disjunctively: a move matches when its type is any of the selected types, so a second selection widens the result rather than narrowing it. Several selected damage classes SHALL combine the same way.

The three conditions SHALL combine conjunctively: a move appears in the result only when it satisfies the search condition, the type condition, and the damage class condition together.

A condition with nothing selected SHALL impose no restriction, so that an empty selection admits every move rather than excluding every move.

Disjunction within the type condition follows the rule the `dex-query` capability already sets for the dex tab's type filter, so that the same control carries one meaning throughout the interface. The damage class condition follows it for the same reason.

#### Scenario: A second type widens the result

- **WHEN** one type is selected and a second type is then selected
- **THEN** the result holds every move of either type
- **AND** the result is no smaller than it was with one type selected

#### Scenario: A second damage class widens the result

- **WHEN** one damage class is selected and a second is then selected
- **THEN** the result holds every move of either damage class

#### Scenario: Conditions narrow each other

- **WHEN** a type is selected and a damage class is selected
- **THEN** the result holds only moves that carry that type and that damage class

#### Scenario: An empty selection imposes no restriction

- **WHEN** no type is selected
- **THEN** the type condition admits every move

##### Example: combined conditions against the 496-entry move table

| Search | Types | Damage classes | Matches |
| ------ | ----- | -------------- | ------- |
| (empty) | (none) | (none) | 496 |
| (empty) | Water | (none) | 27 |
| (empty) | Water, Dark | (none) | 59 |
| (empty) | (none) | Physical | 204 |
| (empty) | (none) | Status | 172 |
| (empty) | Water | Physical | 12 |
| (empty) | Water, Dark | Physical | 31 |
| (empty) | Water | Physical, Status | 16 |
| (empty) | Ice | Status | 4 |
| 牙 | (none) | (none) | 7 |
| 牙 | (none) | Physical | 7 |
| 牙 | Water | Physical | 0 |

##### Example: Ice moves of the status damage class

- **GIVEN** the shared move table's 20 Ice moves
- **WHEN** the Ice type and the status damage class are both selected
- **THEN** four moves match: 極光幕 / Aurora Veil, 雪景 / Snowscape, 黑霧 / Haze, 冷笑話 / Chilly Reception

##### Example: a combination no move satisfies

- **GIVEN** the seven moves whose name contains 牙, whose types are Dark, Fire, Ice, Psychic, Electric, Poison and Normal, all of the physical damage class
- **WHEN** the search string is 牙, the Water type is selected, and the physical damage class is selected
- **THEN** no move matches, because none of the seven carries the Water type

---
### Requirement: The derived sequence names each move together with its index in the shared move table

The move query state SHALL expose a derived result sequence in which every element names a move together with that move's index in the shared move table.

Each element's index SHALL be the move's index in the shared move table, not its position in the result sequence. The index SHALL be taken from the source table before the conditions are applied, so that filtering cannot renumber it.

An index that named a position in the result would name a different move under every condition, and the `move-index` capability requires the move a row opens to be the row's move rather than the row's position. Carrying the source index is what lets that requirement hold once the sequence can be filtered.

#### Scenario: Every element carries its source index

- **WHEN** the derived sequence is produced with no condition set
- **THEN** each element's index equals its position in the shared move table

#### Scenario: Filtering does not renumber

- **WHEN** a condition removes earlier moves from the result
- **THEN** each remaining element still carries its index in the shared move table
- **AND** those indices are not consecutive from zero

##### Example: indices survive filtering

- **GIVEN** the shared move table, in which 極光幕 / Aurora Veil is the first entry and 雪崩 / Avalanche the second
- **WHEN** the Ice type and the status damage class are selected, which 雪崩 / Avalanche does not satisfy
- **THEN** the first element of the result still carries the index 極光幕 / Aurora Veil holds in the shared move table
