## MODIFIED Requirements

### Requirement: Search matches across both languages at all times

The search string SHALL be matched against a per-species haystack regardless of which language is leading, because switching which language leads changes presentation and MUST NOT change which species are reachable. Latin matching SHALL be case-insensitive. A partial name SHALL match.

The haystack SHALL carry: the Traditional Chinese and English species names, the Chinese category, the national number in both its bare and its four-digit zero-padded form, a generation token of the form `gen<n>`, every form's Traditional Chinese and English label, and every type carried by any of the species' forms under both its English and its Traditional Chinese name. These are the four things the search field's placeholder names — name, number, type, form — plus the category and generation that travel with them.

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
| gen5          | 29   | exactly the species the generation filter selects for 5              |
| alola         | 2    | Raichu and Ninetales, by form label                                   |
| 阿羅拉        | 2    | the same two, by the Chinese form label                               |
| 火焰寶可夢    | 2    | Charizard and Infernape, by Chinese category                          |
| mega charizard | 1   | both tokens must match; Charizard alone satisfies them                |
| gen5 dragon   | 1    | Hydreigon — the only fifth-generation Dragon                          |

The 25 for 龍 is the specified outcome, not a defect to fix. The Chinese type name and the Chinese species names occupy one haystack, and partial name matching is required above; the six extra species are 暴鯉龍, 化石翼龍, 戰槌龍, 護城龍, 龍頭地鼠 and 冰雪巨龍.

### Requirement: A filtered card displays the form that matched the filter

The form index paired with a species in the result sequence SHALL be resolved by the first of these four rules that yields a form, so that the card answers whatever the query identified most specifically rather than always showing the base form.

1. Take the search tokens the species' own two names do not already satisfy. When any remain and one of the species' forms has a label containing all of them, the paired index SHALL name the first such form.
2. Otherwise, when any remaining token is **exactly** a type name in either language, the paired index SHALL name the first form carrying that type.
3. Otherwise, when a type filter is active, the paired index SHALL be the first form carrying the selected type.
4. Otherwise the paired index SHALL be the base form.

Rule 1 SHALL discard the tokens the species names already satisfy before testing form labels. A Mega form's label embeds the species name, so testing the raw tokens would make a plain species-name query select that Mega — searching Charizard would answer with Mega Charizard X.

Rule 2 SHALL compare whole tokens against type names rather than as substrings, so that a token which merely contains a type name is not read as naming that type.

A card whose species matched on an alternate form SHALL NOT display the base form when a rule above names another, because a grid answering a Dragon query with Fire and Flying artwork reads as broken.

#### Scenario: The matching form is displayed

- **WHEN** a type filter is active and a species matched on a non-base form
- **THEN** the paired form index names that form
- **AND** the card renders that form's artwork, form label, and types

#### Scenario: No query and no type filter displays the base form

- **WHEN** no search string and no type filter are active
- **THEN** every paired form index names the base form

#### Scenario: A form label in the query selects that form

- **WHEN** the search string holds a token naming a form that the species' names do not contain
- **THEN** the paired form index names the first form whose label contains every such token

#### Scenario: A plain species name keeps the base form

- **WHEN** the search string is a species' name and nothing more
- **THEN** the paired form index names the base form, even for a species whose Mega label embeds that name

##### Example: the same species under different type filters

| Type filter | Form displayed for Charizard | Types shown on the card |
| ----------- | ---------------------------- | ----------------------- |
| none        | base                         | Fire, Flying            |
| Fire        | base                         | Fire, Flying            |
| Dragon      | Mega Charizard X             | Fire, Dragon            |

##### Example: the same species under different search strings, no type filter

| Search string    | Form displayed   | Rule that decided it                                  |
| ---------------- | ---------------- | ----------------------------------------------------- |
| charizard        | base             | 4 — the name satisfies every token, none remain       |
| 噴火龍           | base             | 4 — as above                                          |
| mega charizard   | Mega Charizard X | 1 — mega remains and the label carries it             |
| mega charizard y | Mega Charizard Y | 1 — mega and y both remain, and only that label has both |
| dragon           | Mega Charizard X | 2 — dragon remains and names a type this form carries |
| 龍               | base             | 4 — 龍 is inside 噴火龍, so no token remains          |
| fire             | base             | 2 — fire remains and the base form already carries it |

The last two rows are the point of the token-discarding step: 龍 is part of this species' own name, so the card answers with the species, while dragon can only be a type, so the card answers with the form carrying it.
