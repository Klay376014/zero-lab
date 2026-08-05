## MODIFIED Requirements

### Requirement: Derived value accessors

The data layer SHALL expose derived accessors for total base stats of a form, the highest total base stats across a species' forms, the set of every type across a species' forms, whether a species has any Mega form, the species that learn a given move, and the form of a species to open for a given move.

The last two SHALL be governed by the `move-learners` capability, which owns their ordering, their treatment of forms whose learnset sections differ, and their behaviour for indices outside the shared move table.

Accessors whose answer is a collection derived from the whole dataset SHALL be memoised by the key they are asked about, and SHALL be typed readonly so that the shared answer cannot be mutated by a caller. This is memoisation rather than caching: the dataset is loaded once and is readonly throughout, so no answer can change and nothing evicts or invalidates.

#### Scenario: Total base stats sums the six stat values

- **WHEN** the total for a form is requested
- **THEN** the result is the sum of its six base stat values

#### Scenario: Species-level total takes the strongest form

- **WHEN** the species-level total is requested
- **THEN** the result is the highest total across all of that species' forms

#### Scenario: A collection accessor returns a shared readonly answer

- **WHEN** a collection-returning accessor is asked about the same key twice
- **THEN** both calls return the same collection
- **AND** the collection's type forbids mutation

##### Example: derived values for concrete species

| Species      | Forms | Total per form   | Species total | Types across forms       | Has Mega |
| ------------ | ----- | ---------------- | ------------- | ------------------------ | -------- |
| Venusaur     | 2     | 525, 625         | 625           | Grass, Poison            | true     |
| Charizard    | 3     | 534, 634, 634    | 634           | Fire, Flying, Dragon     | true     |
| Ditto        | 1     | 288              | 288           | Normal                   | false    |
| Crabominable | 2     | 478, 578         | 578           | Fighting, Ice            | true     |

##### Example: the two move-directed accessors

| Input                        | Accessor            | Result                                      |
| ---------------------------- | ------------------- | ------------------------------------------- |
| a move learned by 207 species | learners of a move  | 207 species in dataset order                |
| Ninetales with an Ice move    | form to open        | the regional form, whose section holds it   |
| Ninetales with a Fire move    | form to open        | the base form, whose section holds it       |

## ADDED Requirements

### Requirement: The string table carries the learner list's strings in both languages

The user-facing string table SHALL carry the strings the learner list states — its heading, its learner count label, and its close control's label — in Chinese and in English alike.

A key present in one language and absent from the other SHALL be treated as a defect rather than a fallback, because the absent side renders the key name on screen instead of a word. This capability's existing rule that the two language tables share one key set governs both new keys.

#### Scenario: Both language tables carry every new key

- **WHEN** the string table is inspected
- **THEN** every key the learner list reads is present in the Chinese table and in the English table

#### Scenario: The learner list states words, not key names

- **WHEN** the learner list is open in either language
- **THEN** every label it states is a word in that language
