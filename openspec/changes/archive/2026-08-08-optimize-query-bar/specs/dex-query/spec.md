## MODIFIED Requirements

### Requirement: Query state is shared and independently settable

The search string, the type filter, and the sort order SHALL be held as shared reactive state that any component reads without threading properties through the tree, following the same arrangement as the existing display state. Each of the three SHALL be settable without disturbing the other two. A reset operation SHALL return all three to their initial values. The query state SHALL expose a derived result sequence in which every element names a species together with the form index that species' card displays under the active query.

The query state SHALL NOT carry a generation filter, and the query bar SHALL NOT present any control that selects a generation. The generation dimension has no control-level entry point. The nine generation buttons occupied a full row of the query bar on a handheld while carrying the least-used of the four controls, and the vertical space they held is worth more to the card grid than the filter is to the reader.

#### Scenario: Each control is independent

- **WHEN** the type filter is set
- **THEN** the search string and the sort order are unchanged

#### Scenario: Reset returns every control to its initial value

- **WHEN** the reset operation runs after the search string, the type filter, and the sort order have all been changed
- **THEN** all three read their initial values
- **AND** the result sequence contains every species

#### Scenario: The result sequence names a form per species

- **WHEN** the result sequence is read
- **THEN** every element names one species and one form index

#### Scenario: No control selects a generation

- **WHEN** the query bar is rendered
- **THEN** no control that selects a generation is present
- **AND** the result sequence is unaffected by any generation

### Requirement: Search matches across both languages at all times

The search string SHALL be matched against a per-species haystack regardless of which language is leading, because switching which language leads changes presentation and MUST NOT change which species are reachable. Latin matching SHALL be case-insensitive. A partial name SHALL match.

The haystack SHALL carry: the Traditional Chinese and English species names, the Chinese category, the national number in both its bare and its four-digit zero-padded form, a generation token of the form `gen<n>`, every form's Traditional Chinese and English label, and every type carried by any of the species' forms under both its English and its Traditional Chinese name. These are the four things the search field's placeholder names — name, number, type, form — plus the category and generation that travel with them.

The generation token SHALL remain in the haystack even though no control selects a generation. It is a search capability in its own right, not the surviving half of a removed filter: the haystack is the one place the dataset's own fields are made reachable by typing, and generation is one of those fields. Nothing in the interface advertises the token, and no requirement elsewhere depends on it. A future proposal that removes it MUST argue against this paragraph rather than treat it as a leftover.

The haystack SHALL NOT carry a bare roman numeral for the generation. A single-letter token matched as a substring reaches most of the dataset, which is indistinguishable on screen from a search that is not working.

The search string SHALL be split on whitespace, and a species SHALL match only when **every** token appears in its haystack. A multi-token query SHALL NOT be matched as one substring, because no single field holds two tokens that name different things.

#### Scenario: Either language matches the same species

- **WHEN** the search string is one species' English name
- **THEN** that species is in the result sequence
- **AND** searching that species' Traditional Chinese name instead produces the same result sequence

#### Scenario: Leading language does not change the result set

- **WHEN** the leading language is switched while a search string is active
- **THEN** the result sequence is unchanged

#### Scenario: A national number reaches its species

- **WHEN** the search string is a species' national number, in either its bare or its zero-padded form
- **THEN** that species is in the result sequence

#### Scenario: A type name reaches every species carrying it on any form

- **WHEN** the search string is an English type name
- **THEN** the result sequence holds exactly the species the type filter would select for that type

#### Scenario: Every token must match

- **WHEN** the search string holds two tokens naming different things
- **THEN** only species whose haystack contains both are in the result sequence

#### Scenario: A generation token still reaches its species

- **WHEN** the search string is a generation token of the form `gen<n>`
- **THEN** the result sequence holds exactly the species introduced in that generation

##### Example: cross-language and partial matching, unchanged from before

| Search string | Matches Charizard | Notes                          |
| ------------- | ----------------- | ------------------------------ |
| charizard     | yes               | English name, lower case       |
| CHARIZARD     | yes               | matching ignores letter case   |
| 噴火龍        | yes               | Traditional Chinese name       |
| char          | yes               | partial Latin name             |
| 噴火          | yes               | partial Traditional Chinese    |
| ditto         | no                | names a different species      |

##### Example: measured result counts over the 208-species dataset

| Search string | Hits | What it equals                                                        |
| ------------- | ---- | --------------------------------------------------------------------- |
| 475           | 1    | Gallade, by national number                                           |
| 0475          | 1    | the same species, by the zero-padded number                           |
| dragon        | 19   | exactly the species the Dragon type filter selects                    |
| 龍            | 25   | those 19, plus 6 whose Chinese name contains 龍 without the type      |
| mega          | 73   | every species carrying a Mega form (75 Mega forms over 73 species)    |
| 超級          | 73   | the same 73 species, by the Chinese Mega label                        |
| gen5          | 29   | every species introduced in the fifth generation                      |
| alola         | 2    | Raichu and Ninetales, by form label                                   |
| 阿羅拉        | 2    | the same two, by the Chinese form label                               |
| 火焰寶可夢    | 2    | Charizard and Infernape, by Chinese category                          |
| mega charizard | 1   | both tokens must match; Charizard alone satisfies them                |
| gen5 dragon   | 1    | Hydreigon — the only fifth-generation Dragon                          |

The 25 for 龍 is the specified outcome, not a defect to fix. The Chinese type name and the Chinese species names occupy one haystack, and partial name matching is required above; the six extra species are 暴鯉龍, 化石翼龍, 戰槌龍, 護城龍, 龍頭地鼠 and 冰雪巨龍.

### Requirement: Type and generation filters are evaluated across all of a species' forms

The type filter SHALL match a species when any of its forms carries the selected type, using the data layer's existing across-forms type accessor, so that a species whose only match is an alternate form remains reachable. When both the type filter and a search string are active, a species SHALL be in the result sequence only when it satisfies both.

No generation filter takes part in this conjunction, because the query state carries none.

#### Scenario: A species matches on an alternate form's type

- **WHEN** the type filter selects a type that only one of a species' non-base forms carries
- **THEN** that species is in the result sequence

#### Scenario: The type filter and search combine conjunctively

- **WHEN** a search string and a type filter are both active
- **THEN** the result sequence contains only species satisfying both

##### Example: type filter reaches alternate forms

| Type filter | Charizard in result | Reason                                              |
| ----------- | ------------------- | --------------------------------------------------- |
| Fire        | yes                 | the base form carries it                            |
| Flying      | yes                 | the base form carries it                            |
| Dragon      | yes                 | only Mega Charizard X carries it                    |
| Water       | no                  | no form carries it                                  |

## ADDED Requirements

### Requirement: The query bar occupies two rows and states the sort order as its current value

The query bar SHALL present its controls in exactly two rows. The first row SHALL carry the sort control, the search field, and the reset control, in that order. The second row SHALL carry the type filter's label followed by the eighteen type filter buttons.

The sort control SHALL be a single button whose text is the name of the sort order currently in force. Pressing it SHALL advance the sort order to the next member of the sort set and SHALL update the button's text to name that member. The sort set is closed and holds two members, so pressing the button twice SHALL return the sort order to where it started. The sort order SHALL NOT be presented as one button per member, because a full row spent on a two-member choice costs more vertical space than the card grid can afford on a handheld.

The search field SHALL NOT be introduced by a separate text label. Its placeholder names the four things the search reaches, and that placeholder MUST NOT be truncated at either language's rendered width; a label consumes the width the placeholder needs while naming only what a placeheld search field already announces.

The eighteen type filter buttons SHALL be laid out nine to a row across exactly two rows, each button occupying an equal share of the row's width so that the button in a given position on the second row aligns with the button in the same position on the first. Layout SHALL be achieved with proportional widths and padding-based gutters rather than margins, because the platform counts padding inside a declared width and a margin falls outside the proportion and displaces the ninth button onto the following row. Buttons SHALL NOT shrink to admit a tenth button to a row.

#### Scenario: The query bar has two rows

- **WHEN** the query bar is rendered
- **THEN** exactly two rows of controls are present
- **AND** the first row holds the sort control, the search field, and the reset control
- **AND** the second row holds the type filter label and the eighteen type filter buttons

#### Scenario: The sort control names the sort order in force

- **WHEN** the sort order is national number
- **THEN** the sort control's text names national number

#### Scenario: Pressing the sort control advances the sort order

- **WHEN** the sort control is pressed while the sort order is national number
- **THEN** the sort order becomes base-stat total
- **AND** the sort control's text names base-stat total
- **AND** pressing it once more returns the sort order to national number

#### Scenario: Type filter buttons are nine to a row

- **WHEN** the query bar is rendered
- **THEN** the first row of type filter buttons holds nine buttons
- **AND** the second row holds the remaining nine
- **AND** the leading edge of the button at a given position on the second row aligns with the leading edge of the button at the same position on the first

#### Scenario: The search field carries no separate label

- **WHEN** the query bar is rendered
- **THEN** no text label introduces the search field
- **AND** the search field's placeholder is rendered without truncation

##### Example: the sort control's cycle

| Press count | Sort order in force | Control text names |
| ----------- | ------------------- | ------------------ |
| 0           | national number     | national number    |
| 1           | base-stat total     | base-stat total    |
| 2           | national number     | national number    |
| 3           | base-stat total     | base-stat total    |

## RENAMED Requirements

- FROM: `### Requirement: Type and generation filters are evaluated across all of a species' forms`
- TO: `### Requirement: The type filter is evaluated across all of a species' forms`
