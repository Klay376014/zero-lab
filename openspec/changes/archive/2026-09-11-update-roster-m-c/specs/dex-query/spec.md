## MODIFIED Requirements

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

##### Example: measured result counts over the 231-species dataset

| Search string | Hits | What it equals                                                        |
| ------------- | ---- | --------------------------------------------------------------------- |
| 475           | 1    | Gallade, by national number                                           |
| 0475          | 1    | the same species, by the zero-padded number                           |
| dragon        | 21   | exactly the species the Dragon type filter selects                    |
| 龍            | 27   | those 21, plus 6 whose Chinese name contains 龍 without the type      |
| mega          | 76   | every species carrying a Mega form (81 Mega forms over 76 species)    |
| 超級          | 76   | the same 76 species, by the Chinese Mega label                        |
| gen5          | 29   | every species introduced in the fifth generation                      |
| alola         | 3    | Raichu, Ninetales and Persian, by form label                          |
| 阿羅拉        | 3    | the same three, by the Chinese form label                             |
| 火焰寶可夢    | 2    | Charizard and Infernape, by Chinese category                          |
| mega charizard | 1   | both tokens must match; Charizard alone satisfies them                |
| gen5 dragon   | 1    | Hydreigon — the only fifth-generation Dragon                          |

### Requirement: The type filter is evaluated across all of a species' forms

The type filter SHALL match a species when any of its forms carries any of the selected types, using the data layer's existing across-forms type accessor, so that a species whose only match is an alternate form remains reachable. An empty selection SHALL match every species.

Selecting several types SHALL widen the result sequence rather than narrow it: the types SHALL combine disjunctively, so a species qualifies by carrying any one of them. Requiring a species to carry all selected types would make the second selection empty the grid for most pairs, which reads as the control being broken rather than as a precise query.

Selecting a type already selected SHALL remove it from the selection, so no separate control is needed to clear one type.

When the type filter and a search string are both active, a species SHALL be in the result sequence only when it satisfies both. The type filter, the search string, the Mega-only flag, and the multi-form-only flag SHALL combine conjunctively with one another; only the types within the type filter combine disjunctively.

No generation filter takes part in this conjunction, because the query state carries none.

#### Scenario: A species matches on an alternate form's type

- **WHEN** the type filter selects a type that only one of a species' non-base forms carries
- **THEN** that species is in the result sequence

#### Scenario: Several selected types combine disjunctively

- **WHEN** two types are selected
- **THEN** the result sequence holds every species carrying either type
- **AND** the count is not smaller than the count for either type selected alone

#### Scenario: Selecting a selected type removes it

- **WHEN** a type already in the selection is selected again
- **THEN** that type leaves the selection
- **AND** removing the last one returns the result sequence to every species

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

##### Example: two types widen rather than narrow

| Selection    | Count | Note                                          |
| ------------ | ----- | --------------------------------------------- |
| Fire         | 27    | single selection                              |
| Water        | 31    | single selection                              |
| Fire + Water | 55    | the union, since 3 species carry both         |
| none         | 231   | an empty selection matches every species      |

### Requirement: The Mega-only and multi-form-only filters narrow the result sequence

The query state SHALL carry two independent boolean filters. When the Mega-only filter is set, the result sequence SHALL hold only species having at least one Mega form. When the multi-form-only filter is set, the result sequence SHALL hold only species having more than one form. When a filter is not set it SHALL exclude nothing.

The two SHALL be independent of one another and SHALL be settable together. Neither SHALL disable or hide the other, because a control that disappears when another is pressed cannot be reasoned about from the interface.

Each SHALL combine conjunctively with the search string and with the type filter, so setting one never widens the result sequence.

#### Scenario: The Mega-only filter admits only species with a Mega form

- **WHEN** the Mega-only filter is set
- **THEN** every species in the result sequence has at least one Mega form

#### Scenario: The multi-form-only filter admits only multi-form species

- **WHEN** the multi-form-only filter is set
- **THEN** every species in the result sequence has more than one form

#### Scenario: Setting a filter never widens the result

- **WHEN** either boolean filter is set while a search string or type filter is already active
- **THEN** the result sequence is no longer than it was before

#### Scenario: Clearing a filter restores what it excluded

- **WHEN** a set boolean filter is unset
- **THEN** the result sequence returns to what the remaining active filters select

##### Example: the two filters over the full dataset

| Mega-only | Multi-form-only | Count | Note                                                        |
| --------- | --------------- | ----- | ----------------------------------------------------------- |
| off       | off             | 231   | every species                                               |
| on        | off             | 76    | species having a Mega form                                  |
| off       | on              | 105   | species having more than one form                           |
| on        | on              | 76    | every species with a Mega form already has more than one form |

The last row is worth stating because it looks like a fault: setting the multi-form filter on top of the Mega filter changes nothing. Every Mega species is by construction multi-form, since the Mega form is additional to a base form, so the Mega set is contained in the multi-form set. A count that does not move here is correct.
