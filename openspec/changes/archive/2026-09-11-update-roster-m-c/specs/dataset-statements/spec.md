## MODIFIED Requirements

### Requirement: Dataset figures on screen are read from the dataset, never written as literals

Every figure the interface states about the dataset as a whole SHALL be read from the dataset's own meta block. No such figure SHALL appear as a literal value in component source, because the data layer already asserts these counts at load time and a second copy in the tree is a fact with no assertion protecting it.

This SHALL hold for the species total the result count is stated against. A component SHALL NOT recompute a figure the meta block already carries — recounting derives the number a second way, and a derivation that drifts from the pipeline's definition renders a figure that no invariant covers.

A count derived from a relation rather than stated about the dataset as a whole is outside this requirement. The number of species that learn a given move is such a count: it is produced by the derived accessor the `move-learners` capability defines, not carried by the meta block.

#### Scenario: The species total is not a literal

- **WHEN** the masthead's source is inspected
- **THEN** the species total is read from the dataset's meta block
- **AND** the value 231 does not appear as a literal in the masthead's source

#### Scenario: A whole-dataset figure is not recomputed

- **WHEN** a component states a figure that the meta block carries
- **THEN** it reads that figure from the meta block
- **AND** it does not derive the figure by iterating the species, form or move collections

#### Scenario: A relation count is permitted to be derived

- **WHEN** move detail states the number of species that learn its move
- **THEN** that number comes from the derived learner accessor
- **AND** this does not violate the rule above

### Requirement: The result count is a localised statement, not a bare ratio

The count of entries matching the active query SHALL be stated as a localised string carrying the matched count, the dataset's total for the unit being counted, and the unit itself. It SHALL NOT be rendered as two figures separated by a bare punctuation mark, because a bare ratio does not say what is being counted and reads identically in both languages while the rest of the interface changes.

This SHALL hold on both tabs. The dex tab states species matched against the species total; the moves tab states moves matched against the move table's total. Both totals SHALL be read from the dataset's own meta block rather than written as literals, as this capability already requires of every figure stated about the dataset.

The moves tab's statement SHALL be a result count rather than the move table's size. Stating the size alone was correct while that tab had no query — a matched count would then have been an answer to a question nobody had asked — and it is wrong now that conditions can shorten the sequence, because a reader who has filtered cannot otherwise tell a narrow result from a broken one.

The single-figure move count this replaces SHALL be removed rather than left unreferenced. Its absence from the string table SHALL be recorded as a replacement in the project roadmap's list of decisions taken against, because that roadmap treats a missing string-table key as the fastest indicator that a feature was never delivered, and this key's absence means the opposite.

#### Scenario: The result count names its unit

- **WHEN** the masthead's result count is rendered with the language set to Chinese
- **THEN** it states the matched count, the total for the unit, and the Chinese word for that unit

#### Scenario: The result count follows the language toggle

- **WHEN** the language is switched
- **THEN** the result count is restated in the new language

#### Scenario: The moves tab states a result count

- **WHEN** the moves tab is shown with conditions that leave 31 moves matching
- **THEN** the count states 31 and the move table's total

#### Scenario: An unfiltered moves tab states both figures

- **WHEN** the moves tab is shown with no condition set
- **THEN** the count states the move table's total as both the matched count and the total

#### Scenario: Both totals come from the meta block

- **WHEN** either tab's result count is rendered
- **THEN** the total it states is read from the dataset's meta block

##### Example: the same query in both languages

| Tab | Language | Matched | Rendered |
| --- | -------- | ------- | -------- |
| Dex | Chinese | 231 | 231 / 231 種類 |
| Dex | Chinese | 19 | 19 / 231 種類 |
| Dex | English | 231 | 231 / 231 species |
| Dex | English | 19 | 19 / 231 species |
| Moves | Chinese | 511 | 511 / 511 個招式 |
| Moves | Chinese | 31 | 31 / 511 個招式 |
| Moves | Chinese | 0 | 0 / 511 個招式 |
| Moves | English | 511 | 511 / 511 moves |
| Moves | English | 31 | 31 / 511 moves |
| Moves | English | 0 | 0 / 511 moves |
