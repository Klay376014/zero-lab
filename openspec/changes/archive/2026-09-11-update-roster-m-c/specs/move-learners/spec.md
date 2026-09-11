## MODIFIED Requirements

### Requirement: A move resolves to the species that learn it

The data layer SHALL expose a derived accessor that takes a move's index into the shared move table and returns the species that learn that move, in the dataset's own species order.

A species SHALL be included when the move appears in any of that species' learnset sections, not only the section its base form points at. The dataset holds eighteen species whose sections differ between forms, and restricting the answer to base forms would omit one hundred and ninety-six of the fourteen thousand three hundred and nineteen move-to-species pairs.

The returned collection SHALL be shared with every caller and SHALL be typed readonly, so that no caller can mutate an answer another caller holds.

An index outside the shared move table SHALL raise the same diagnostic the existing single-move accessor raises, rather than being reported a second way.

#### Scenario: Every form's section is searched

- **WHEN** the learners of a move are requested
- **AND** a species learns that move only through a form other than its base form
- **THEN** that species is present in the result

#### Scenario: The result is ordered by the dataset, not by relevance

- **WHEN** the learners of a move are requested
- **THEN** the species appear in the dataset's own species order

#### Scenario: An out-of-range move index is rejected

- **WHEN** the learners of a move index outside the shared move table are requested
- **THEN** the same error the single-move accessor raises is raised
- **AND** no empty result is returned in its place

##### Example: measured shape of the learner relation

| Property                                            | Value                  |
| --------------------------------------------------- | ---------------------- |
| moves in the shared move table                       | 511                    |
| moves with at least one learner                      | 511                    |
| largest learner count for a single move              | 230 of 231 species     |
| median learner count                                 | 16                     |
| total move-to-species pairs                          | 14319                  |
| species whose sections differ between forms          | 18                     |
| pairs reachable only through a non-base form         | 196                    |
