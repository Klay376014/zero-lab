## MODIFIED Requirements

### Requirement: Query state is shared and independently settable

The search string, the type filter selection, the Mega-only flag, the multi-form-only flag, and the sort order SHALL be held as shared reactive state that any component reads without threading properties through the tree, following the same arrangement as the existing display state. Each of the five SHALL be settable without disturbing the other four. A reset operation SHALL return all five to their initial values. The query state SHALL expose a derived result sequence in which every element names a species together with the form index that species' card displays under the active query.

The type filter selection SHALL hold zero or more types. It SHALL be represented so that changing it replaces the whole value rather than mutating a collection in place, because no reactive collection has been exercised on this platform and a mutation that fails to notify produces a control that visibly does nothing while raising no error.

The query state SHALL NOT carry a generation filter, and the query bar SHALL NOT present any control that selects a generation. The generation dimension has no control-level entry point. The nine generation buttons occupied a full row of the query bar on a handheld while carrying the least-used of the four controls, and the vertical space they held is worth more to the card grid than the filter is to the reader.

#### Scenario: Each control is independent

- **WHEN** the type filter selection is changed
- **THEN** the search string, both boolean filters, and the sort order are unchanged

#### Scenario: Reset returns every control to its initial value

- **WHEN** the reset operation runs after the search string, the type filter selection, both boolean filters, and the sort order have all been changed
- **THEN** all five read their initial values
- **AND** the result sequence contains every species

#### Scenario: The result sequence names a form per species

- **WHEN** the result sequence is read
- **THEN** every element names one species and one form index

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
| Fire         | 26    | single selection                              |
| Water        | 29    | single selection                              |
| Fire + Water | 52    | the union, since 3 species carry both         |
| none         | 208   | an empty selection matches every species      |

### Requirement: A filtered card displays the form that matched the filter

The form index paired with a species in the result sequence SHALL be resolved by the first of these five rules that yields a form, so that the card answers whatever the query identified most specifically rather than always showing the base form.

1. Take the search tokens the species' own two names do not already satisfy. When any remain and one of the species' forms has a label containing all of them, the paired index SHALL name the first such form.
2. Otherwise, when any remaining token is **exactly** a type name in either language, the paired index SHALL name the first form carrying that type.
3. Otherwise, when the type filter selection is not empty, the paired index SHALL be the first form carrying any selected type.
4. Otherwise, when the Mega-only flag is set, the paired index SHALL be the first Mega form.
5. Otherwise the paired index SHALL be the base form.

Rule 1 SHALL discard the tokens the species names already satisfy before testing form labels. A Mega form's label embeds the species name, so testing the raw tokens would make a plain species-name query select that Mega — searching Charizard would answer with Mega Charizard X.

Rule 2 SHALL compare whole tokens against type names rather than as substrings, so that a token which merely contains a type name is not read as naming that type.

Rule 4 SHALL sit below rule 3 rather than above it. A type selection is a type the reader named; the Mega-only flag is a boolean that names no form. When both are active the card SHALL answer the more specific of the two.

A card whose species matched on an alternate form SHALL NOT display the base form when a rule above names another, because a grid answering a Dragon query with Fire and Flying artwork reads as broken.

#### Scenario: The matching form is displayed

- **WHEN** a type filter is active and a species matched on a non-base form
- **THEN** the paired form index names that form
- **AND** the card renders that form's artwork, form label, and types

#### Scenario: No query and no filter displays the base form

- **WHEN** no search string is active, the type filter selection is empty, and neither boolean filter is set
- **THEN** every paired form index names the base form

#### Scenario: The Mega-only flag alone selects the Mega form

- **WHEN** the Mega-only flag is set and the type filter selection is empty
- **THEN** every paired form index names that species' first Mega form

#### Scenario: A type selection outranks the Mega-only flag

- **WHEN** the Mega-only flag is set and a type is selected
- **THEN** the paired form index names the first form carrying that type

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

##### Example: Charizard under the boolean filters, no search string

| Type filter | Mega-only | Form displayed   | Rule that decided it                     |
| ----------- | --------- | ---------------- | ---------------------------------------- |
| none        | off       | base             | 5 — nothing more specific applies        |
| none        | on        | Mega Charizard X | 4 — the first Mega form                   |
| Fire        | on        | base             | 3 — the base form carries Fire, and 3 outranks 4 |
| Dragon      | on        | Mega Charizard X | 3 — only that form carries Dragon        |

##### Example: the same species under different search strings, no type filter

| Search string    | Form displayed   | Rule that decided it                                  |
| ---------------- | ---------------- | ----------------------------------------------------- |
| charizard        | base             | 5 — the name satisfies every token, none remain       |
| 噴火龍           | base             | 5 — as above                                          |
| mega charizard   | Mega Charizard X | 1 — mega remains and the label carries it             |
| mega charizard y | Mega Charizard Y | 1 — mega and y both remain, and only that label has both |
| dragon           | Mega Charizard X | 2 — dragon remains and names a type this form carries |
| 龍               | base             | 5 — 龍 is inside 噴火龍, so no token remains          |
| fire             | base             | 2 — fire remains and the base form already carries it |

The last two rows are the point of the token-discarding step: 龍 is part of this species' own name, so the card answers with the species, while dragon can only be a type, so the card answers with the form carrying it.

## ADDED Requirements

### Requirement: The query bar occupies three rows and states the sort order as its current value

The query bar SHALL present its controls in exactly three rows. The first row SHALL carry the sort control, the search field, and the reset control, in that order. The second row SHALL carry the type filter's label followed by the eighteen type filter buttons. The third row SHALL carry the Mega-only and multi-form-only filter buttons.

The third row SHALL be its own row rather than an addition to the second. The second row's wrap position is a property of its container alone — this is why the label that introduces it sits outside that container — and appending controls to that row would put the eighteen buttons' nine-and-nine break at risk.

This row costs the card grid vertical space, which elsewhere in this capability is reason enough to refuse a row: the generation filter was removed for exactly that cost. That reasoning has been weighed again for these two controls and the row is accepted, because two buttons restoring filters the design study carries is a different trade from nine buttons carrying the least-used filter. The reasoning is recorded so that a later reader finds a decision rather than an oversight.

The sort control SHALL be a single button whose text is the name of the sort order currently in force. Pressing it SHALL advance the sort order to the next member of the sort set and SHALL update the button's text to name that member. The sort set is closed and holds two members, so pressing the button twice SHALL return the sort order to where it started. The sort order SHALL NOT be presented as one button per member, because a full row spent on a two-member choice costs more vertical space than the card grid can afford on a handheld.

The search field SHALL NOT be introduced by a separate text label. Its placeholder names the four things the search reaches, and that placeholder MUST NOT be truncated at either language's rendered width; a label consumes the width the placeholder needs while naming only what a placeheld search field already announces.

The eighteen type filter buttons SHALL be laid out nine to a row across exactly two rows, each button occupying an equal share of the row's width so that the button in a given position on the second row aligns with the button in the same position on the first. Layout SHALL be achieved with proportional widths and padding-based gutters rather than margins, because the platform counts padding inside a declared width and a margin falls outside the proportion and displaces the ninth button onto the following row. Buttons SHALL NOT shrink to admit a tenth button to a row.

Every filter button SHALL show its selected state by a means that survives both colour modes, using the same selected treatment the type filter buttons already use rather than a new one, because one mode resolves the accent and line tokens to the same tone and a border alone cannot distinguish the two states there.

#### Scenario: The query bar has three rows

- **WHEN** the query bar is rendered
- **THEN** exactly three rows of controls are present
- **AND** the first row holds the sort control, the search field, and the reset control
- **AND** the second row holds the type filter label and the eighteen type filter buttons
- **AND** the third row holds the Mega-only and multi-form-only buttons

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

#### Scenario: The third row does not disturb the type buttons' wrap

- **WHEN** the third row is present
- **THEN** the eighteen type filter buttons still break nine and nine

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
| off       | off             | 208   | every species                                               |
| on        | off             | 73    | species having a Mega form                                  |
| off       | on              | 99    | species having more than one form                           |
| on        | on              | 73    | every species with a Mega form already has more than one form |

The last row is worth stating because it looks like a fault: setting the multi-form filter on top of the Mega filter changes nothing. Every Mega species is by construction multi-form, since the Mega form is additional to a base form, so the Mega set is contained in the multi-form set. A count that does not move here is correct.

## REMOVED Requirements

### Requirement: The query bar occupies two rows and states the sort order as its current value

**Reason**: The query bar now carries a third row for the Mega-only and multi-form-only filters, so a requirement whose name asserts two rows cannot remain. Its content is carried forward in full by the added requirement `The query bar occupies three rows and states the sort order as its current value`, which keeps every clause about the sort control, the unlabelled search field, and the eighteen type buttons' nine-and-nine layout, and adds the third row plus the selected-state rule the new buttons share with the type buttons.

**Migration**: Read `The query bar occupies three rows and states the sort order as its current value`. Nothing that the two-row requirement demanded has been dropped; the row count changed and clauses were added. This is written as a removal plus an addition rather than a rename because `spectra archive` does not apply a `RENAMED Requirements` block — it reports `renamed: 0` without erroring, which previously left this very requirement family with a heading that contradicted its own body.
