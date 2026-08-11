## REMOVED Requirements

### Requirement: The masthead states the dataset's scale as four counts

**Reason**: The four counts — species, form entries, Mega forms, and move table entries — are constants of the bundled dataset. They do not respond to the query, the language beyond their labels, or anything the reader does, so a reader gains nothing from the second viewing onward while they occupy masthead height on every screen. The masthead's vertical space is contested: the query bar was compacted to reclaim it, and the tab controls this change introduces need a permanent home.

The requirement has also been unmet in the delivered application since it was written. It was delivered under the change that introduced it and then removed from the element tree by a later hand edit, leaving an unread computed value and four unused stylesheet rules behind. None of the four checks detects this: the style check reads the stylesheet rather than the element tree, the type check does not report an unused computed value, and the tests do not build an element tree. Removing the requirement resolves the divergence in the direction the reader is better served by.

**Migration**: No reader-facing migration. The four figures remain available in the dataset's meta block and are still asserted at load time by the `dex-data` capability, so nothing that depends on them is lost. The removal SHALL be recorded in the project roadmap's list of decisions taken against, because that roadmap records that a missing string-table key is the fastest indicator of an undelivered feature — without the record, a later reader would read the four absent keys as a regression and restore them.

#### Scenario: No scale count remains in the masthead

- **WHEN** the masthead is rendered in either language
- **THEN** no count of species, form entries, Mega forms or move table entries appears
- **AND** the application source carries no unread value producing them

## MODIFIED Requirements

### Requirement: Dataset figures on screen are read from the dataset, never written as literals

Every figure the interface states about the dataset as a whole SHALL be read from the dataset's own meta block. No such figure SHALL appear as a literal value in component source, because the data layer already asserts these counts at load time and a second copy in the tree is a fact with no assertion protecting it.

This SHALL hold for the species total the result count is stated against. A component SHALL NOT recompute a figure the meta block already carries — recounting derives the number a second way, and a derivation that drifts from the pipeline's definition renders a figure that no invariant covers.

A count derived from a relation rather than stated about the dataset as a whole is outside this requirement. The number of species that learn a given move is such a count: it is produced by the derived accessor the `move-learners` capability defines, not carried by the meta block.

#### Scenario: The species total is not a literal

- **WHEN** the masthead's source is inspected
- **THEN** the species total is read from the dataset's meta block
- **AND** the value 208 does not appear as a literal in the masthead's source

#### Scenario: A whole-dataset figure is not recomputed

- **WHEN** a component states a figure that the meta block carries
- **THEN** it reads that figure from the meta block
- **AND** it does not derive the figure by iterating the species, form or move collections

#### Scenario: A relation count is permitted to be derived

- **WHEN** move detail states the number of species that learn its move
- **THEN** that number comes from the derived learner accessor
- **AND** this does not violate the rule above
