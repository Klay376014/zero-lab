## ADDED Requirements

### Requirement: Cards sharing a grid row are the same height

The two cards occupying one row of the grid SHALL draw outlines of equal height, whichever of them has the taller content. A card SHALL fill the cell it is placed in rather than stopping at its own content height.

A wrapping row already stretches both of its cells to the taller one, so the cell is not what needs fixing — the card inside it is. A card that stops early leaves a gap between its own bottom outline and the bottom of its stretched cell, and beside a taller neighbour that gap reads as a rendering fault rather than as a longer name. Both the card outline and the bevel drawn inside it SHALL reach the cell's full height, or the bevel's light and shadow edges float above the outline they belong to.

This SHALL be expressed with a property the platform passes through to layout rather than with flex growth. On the web target every flex property is rewritten into a custom property, and for these elements nothing consumes it, so an authored flex declaration resolves to nothing while appearing to have handled the case.

#### Scenario: A wrapped name does not shorten its neighbour

- **WHEN** one card in a row renders a species name that wraps to two lines and the other does not
- **THEN** both cards' outlines end at the same height
- **AND** both cards' bevels end at the same height

##### Example: the measured pair at a phone width

- **GIVEN** the grid at a 375px width with English leading and the pixel face loaded
- **WHEN** Crabominable, whose name wraps to two lines, sits beside Lycanroc, whose name does not
- **THEN** both card outlines measure 209px, where the shorter card previously measured 193px

##### Example: every row of the full grid

- **GIVEN** the grid at a 375px width with English leading and the pixel face loaded
- **WHEN** all 104 rows are measured
- **THEN** no row holds two cards whose outlines end more than half a pixel apart
