## MODIFIED Requirements

### Requirement: Move names occupy one line and truncate rather than wrap

The name column SHALL limit its content to a single line and SHALL truncate a name that exceeds the column. A name SHALL NOT wrap onto a second line, because a table scanned down its columns depends on every row having the same height, unlike the species cards where wrapping is required.

The line limit SHALL be declared as the platform's line-limit **attribute on the text element**, not as a style property. As a style declaration it is silently inert: the name wraps on device while the stylesheet reads as though the case were handled. The overflow the platform requires alongside that attribute, and the ellipsis, SHALL be in the stylesheet.

No name in the dataset SHALL reach that truncation at any target device width. Truncation is the guard for a dataset that later grows a longer name, not the mechanism the present one relies on — an ellipsis in the middle of a move name is less readable than either alternative, so the column has to be wide enough that none appears.

Widening SHALL come from the fixed columns beside it rather than from a smaller type size. Reducing the type was measured and rejected: fitting the widest name into the column the design study's widths left over would have taken 9.8px, smaller than every figure in the same row.

#### Scenario: The line limit is an attribute, not a style declaration

- **WHEN** the table's markup and stylesheet are inspected
- **THEN** the name element carries the line-limit attribute
- **AND** no stylesheet rule declares the line limit as a property

#### Scenario: No name is truncated at any target width

- **WHEN** every move name in the dataset is measured against the name column at each target device width, on a row carrying the bonus star
- **THEN** none exceeds the column
- **AND** every row in the table has the same height

##### Example: the name column against the widest name

The row is the device width less the chrome the panel sits inside — the root padding the overlay inherits, the panel border and the section padding. The fixed columns and, on a marked row, the star and its margins come off what is left.

| Device width | Row  | Name column | On a starred row | Widest name at 12px |
| ------------ | ---- | ----------- | ---------------- | ------------------- |
| 375px        | 315  | 187px       | 171px            | 160.5px             |
| 390px        | 330  | 202px       | 186px            | 160.5px             |
| 393px        | 333  | 205px       | 189px            | 160.5px             |
| 430px        | 370  | 242px       | 226px            | 160.5px             |

All 511 names fit in every row of this table, the narrowest case leaving 10.5px. The widest are Stomping Tantrum and Burning Jealousy at 160.5px each; the second is a Fire move, so on a Fire-typed form it carries the star and takes the 171px case. The roster rotation that brought the table to 511 added no wider name: the widest it added is Revival Blessing at 153.0px.

### Requirement: A move with no Chinese name falls back to its English name

When Chinese leads and a move has no Chinese name, the name column SHALL render that move's English name. The table SHALL NOT render an empty name cell, and SHALL NOT mark the row as incomplete.

#### Scenario: A move with no Chinese name renders in English

- **WHEN** Chinese leads and the table renders a move whose Chinese name is absent
- **THEN** the name column shows that move's English name

##### Example: no move in the dataset currently exercises the fallback

| Property                       | Value |
| ------------------------------ | ----- |
| moves in the shared move table | 511   |
| moves with no Chinese name     | 0     |

Syrup Bomb and Matcha Gotcha were the two, for as long as the PokeAPI name column was the source. The `dex-data` capability now requires Traditional Chinese move names to come from the 52poke move list, which carries one for every numbered move and is asserted at fetch, so this requirement has no case left to answer.

It is kept rather than removed because it is the guard for that source regressing: a name column that went empty again would otherwise render a blank cell that no check reports. The `move-index` and `move-detail` capabilities deliberately do **not** carry a fallback of their own — they were written after the guarantee was in place, and duplicating an unreachable branch in three places would have made the guarantee harder to find than the branches.
