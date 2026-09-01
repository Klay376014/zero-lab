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

##### Example: measured result counts over the 208-species dataset

| Search string | Hits | What it equals                                                        |
| ------------- | ---- | --------------------------------------------------------------------- |
| 475           | 1    | Gallade, by national number                                           |
| 0475          | 1    | the same species, by the zero-padded number                           |
| dragon        | 19   | exactly the species the Dragon type filter selects                    |
| 龍            | 25   | those 19, plus 6 whose Chinese name contains 龍 without the type      |
| mega          | 73   | every species carrying a Mega form (78 Mega forms over 73 species)    |
| 超級          | 73   | the same 73 species, by the Chinese Mega label                        |
| gen5          | 29   | every species introduced in the fifth generation                      |
| alola         | 2    | Raichu and Ninetales, by form label                                   |
| 阿羅拉        | 2    | the same two, by the Chinese form label                               |
| 火焰寶可夢    | 2    | Charizard and Infernape, by Chinese category                          |
| mega charizard | 1   | both tokens must match; Charizard alone satisfies them                |
| gen5 dragon   | 1    | Hydreigon — the only fifth-generation Dragon                          |

The 25 for 龍 is the specified outcome, not a defect to fix. The Chinese type name and the Chinese species names occupy one haystack, and partial name matching is required above; the six extra species are 暴鯉龍, 化石翼龍, 戰槌龍, 護城龍, 龍頭地鼠 and 冰雪巨龍.

The count of species carrying a Mega form stays at 73 while the Mega form total rises, because a species already carrying a Mega form gains nothing from carrying a second one. A Mega form total that moves without moving the species count is the expected shape of a change that adds a Mega form to a species that already had one.

##### Example: a species gaining a second Mega form

- **GIVEN** Absol, which already carries Mega Absol
- **WHEN** a second Mega form is added to Absol
- **THEN** the Mega form total rises by one
- **AND** the hits for the search string `mega` stay at 73
