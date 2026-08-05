## ADDED Requirements

### Requirement: A move row is a control that opens that move's learners

Each rendered move row SHALL be a control. Tapping a row SHALL open the learner list for that row's move, governed by the `move-learners` capability.

The tap SHALL be bound on the row element itself rather than on a component boundary, because a binding placed on a component reaches an element only by attribute fall-through.

The row SHALL carry the press mark, and its three main-thread touch bindings SHALL be applied together — start, end, and cancel. The cancel binding is load-bearing rather than defensive: move rows sit inside the detail panel's scrolling container and inside the table's own bounded region, so a press that becomes a scroll produces a cancellation and never a release.

The column header row SHALL NOT be a control and SHALL NOT carry the press mark. It states the columns and has no behaviour.

The row's tappability SHALL NOT be signalled by a hover-dependent affordance, consistent with this capability's existing exclusion of hover-dependent tooltips.

#### Scenario: Tapping a row opens its learners

- **WHEN** a move row is tapped
- **THEN** the learner list for that row's move opens

#### Scenario: A row press that becomes a scroll recovers

- **WHEN** a move row is pressed and the finger then moves to scroll the table rather than lifting on the row
- **THEN** the row's press mark is cleared

#### Scenario: The column header is not a control

- **WHEN** the column header row is pressed
- **THEN** it is not displaced
- **AND** no learner list opens

##### Example: which rows respond to a tap

| Row                                  | Press mark | Tap opens learners |
| ------------------------------------ | ---------- | ------------------ |
| a move row                           | yes        | yes                |
| a move row marked with the bonus     | yes        | yes                |
| the column header row                | no         | no                 |
| the words shown for an empty result  | no         | no                 |

### Requirement: The row a tap opens is the row's move, not the row's position

The move carried to the learner list SHALL be the move rendered in the tapped row, resolved through the same move reference the row was built from.

The row's position SHALL NOT be used to identify the move. Rows are reordered by the three sort orders and removed by the bonus filter, so a position identifies a different move under each combination of the two.

#### Scenario: A tap after sorting opens the right move

- **WHEN** the table is sorted by power and the first row is tapped
- **THEN** the learner list opens for the move rendered in that row

#### Scenario: A tap under the bonus filter opens the right move

- **WHEN** the bonus filter is on and a row is tapped
- **THEN** the learner list opens for the move rendered in that row
- **AND** not for the move that occupied the same position with the filter off
