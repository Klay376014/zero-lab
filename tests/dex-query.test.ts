/**
 * The `dex-query` spec's Example tables, executed.
 *
 * Every number here is copied from `openspec/specs/dex-query/spec.md` rather than derived, and
 * the tables are transcribed row for row. That is the point: the spec states what the grid
 * answers with, and until now nothing checked that it still does. If a count moves, exactly one
 * of two things is true — the code regressed, or the spec was renegotiated and this file was not
 * updated with it. Both are worth stopping for.
 *
 * These drive the real query state module. Nothing here re-implements a predicate.
 */
import { afterEach, describe, expect, it } from 'vitest'

import { speciesName } from '../src/data/i18n.js'
import type { TypeName } from '../src/data/types.js'
import {
  megaOnly,
  multiOnly,
  resetQuery,
  results,
  search,
  toggleMegaOnly,
  toggleMultiOnly,
  toggleType,
  typeFilters,
} from '../src/state/query.js'

/** The whole dataset, as the spec's tables count it. */
const ALL = 208

/** Query state is module-level and shared, so every test has to hand it back. */
afterEach(() => {
  resetQuery()
})

/** Selects `types`, replacing whatever was selected. */
function selectTypes(...types: readonly TypeName[]): void {
  for (const type of types) toggleType(type)
}

/** The English name of the form the card would draw for `dexNo`, or null when filtered out. */
function displayedForm(dexNo: number): string | null {
  const row = results.value.find((result) => result.species.d === dexNo)
  if (row === undefined) return null
  const form = row.species.f[row.formIndex]!
  return form.l === '' ? 'base' : form.l
}

describe('search reaches a species by either language', () => {
  // Example: Charizard by name — spec.md, "Search matches across both languages at all times"
  const table: readonly (readonly [string, boolean])[] = [
    ['charizard', true],
    ['CHARIZARD', true],
    ['噴火龍', true],
    ['char', true],
    ['噴火', true],
    ['ditto', false],
  ]

  it.each(table)('%s matches Charizard: %s', (query, expected) => {
    search.value = query
    const found = results.value.some((result) => result.species.d === 6)
    expect(found).toBe(expected)
  })
})

describe('search hit counts', () => {
  // Example: what each search string equals — the table that documents why the corpus holds
  // what it holds. `龍` being 25 rather than 19 is the load-bearing row: it is the count that
  // separates a name match from a type match.
  const table: readonly (readonly [string, number])[] = [
    ['475', 1],
    ['0475', 1],
    ['dragon', 19],
    ['龍', 25],
    ['mega', 73],
    ['超級', 73],
    ['gen5', 29],
    ['alola', 2],
    ['阿羅拉', 2],
  ]

  it.each(table)('%s yields %i', (query, count) => {
    search.value = query
    expect(results.value.length).toBe(count)
  })

  it('475 finds Gallade specifically, not merely one species', () => {
    search.value = '475'
    expect(speciesName(results.value[0]!.species, 'en').lead).toBe('Gallade')
  })
})

describe('the type filter is judged across all of a species forms', () => {
  // Example: type filter reaches alternate forms. Dragon is the row that matters — Charizard
  // carries it on no form but Mega X.
  const table: readonly (readonly [TypeName, boolean])[] = [
    ['Fire', true],
    ['Flying', true],
    ['Dragon', true],
    ['Water', false],
  ]

  it.each(table)('%s includes Charizard: %s', (type, expected) => {
    selectTypes(type)
    const found = results.value.some((result) => result.species.d === 6)
    expect(found).toBe(expected)
  })
})

describe('several selected types combine disjunctively', () => {
  // Example: two types widen rather than narrow.
  it('Fire alone selects 26', () => {
    selectTypes('Fire')
    expect(results.value.length).toBe(26)
  })

  it('Water alone selects 29', () => {
    selectTypes('Water')
    expect(results.value.length).toBe(29)
  })

  it('Fire and Water together select 52, the union rather than the intersection', () => {
    selectTypes('Fire', 'Water')
    expect(results.value.length).toBe(52)
  })

  it('an empty selection matches every species', () => {
    expect(typeFilters.value.length).toBe(0)
    expect(results.value.length).toBe(ALL)
  })

  it('the union is not smaller than either part', () => {
    selectTypes('Fire')
    const fire = results.value.length
    toggleType('Water')
    expect(results.value.length).toBeGreaterThanOrEqual(fire)
  })

  it('selecting a selected type removes it', () => {
    selectTypes('Fire', 'Water')
    toggleType('Water')
    expect(results.value.length).toBe(26)
    toggleType('Fire')
    expect(results.value.length).toBe(ALL)
  })
})

describe('the Mega-only and multi-form-only filters', () => {
  // Example: the two filters over the full dataset. The last row is the one worth having a
  // test for — it looks like a fault and is not.
  const table: readonly (readonly [boolean, boolean, number])[] = [
    [false, false, ALL],
    [true, false, 73],
    [false, true, 99],
    [true, true, 73],
  ]

  it.each(table)('mega=%s multi=%s yields %i', (mega, multi, count) => {
    if (mega) toggleMegaOnly()
    if (multi) toggleMultiOnly()
    expect(megaOnly.value).toBe(mega)
    expect(multiOnly.value).toBe(multi)
    expect(results.value.length).toBe(count)
  })

  it('adding the multi-form filter on top of Mega changes nothing, because every Mega species is multi-form', () => {
    toggleMegaOnly()
    const megaCount = results.value.length
    toggleMultiOnly()
    expect(results.value.length).toBe(megaCount)
  })

  it('setting a filter never widens the result', () => {
    selectTypes('Fire')
    const fire = results.value.length
    toggleMegaOnly()
    expect(results.value.length).toBeLessThanOrEqual(fire)
  })
})

describe('a filtered card displays the form that matched', () => {
  // Example: the same species under different type filters.
  it('no filter shows the base form', () => {
    expect(displayedForm(6)).toBe('base')
  })

  it('Fire shows the base form, which already carries it', () => {
    selectTypes('Fire')
    expect(displayedForm(6)).toBe('base')
  })

  it('Dragon shows Mega Charizard X, the only form carrying it', () => {
    selectTypes('Dragon')
    expect(displayedForm(6)).toBe('Mega Charizard X')
  })

  // Example: Charizard under the boolean filters. Rule 3 outranking rule 4 is the row that
  // encodes a decision rather than a mechanism.
  it('the Mega-only flag alone shows the first Mega form', () => {
    toggleMegaOnly()
    expect(displayedForm(6)).toBe('Mega Charizard X')
  })

  it('a selected type outranks the Mega-only flag', () => {
    toggleMegaOnly()
    selectTypes('Fire')
    expect(displayedForm(6)).toBe('base')
  })

  it('Dragon with the Mega flag still shows Mega Charizard X', () => {
    toggleMegaOnly()
    selectTypes('Dragon')
    expect(displayedForm(6)).toBe('Mega Charizard X')
  })

  // Example: the same species under different search strings. The last two rows are the point
  // of the token-discarding step.
  const searchTable: readonly (readonly [string, string])[] = [
    ['charizard', 'base'],
    ['噴火龍', 'base'],
    ['mega charizard', 'Mega Charizard X'],
    ['mega charizard y', 'Mega Charizard Y'],
    ['dragon', 'Mega Charizard X'],
    ['龍', 'base'],
    ['fire', 'base'],
  ]

  it.each(searchTable)('searching %s shows %s', (query, form) => {
    search.value = query
    expect(displayedForm(6)).toBe(form)
  })
})

describe('query state is shared and independently settable', () => {
  it('each control leaves the others alone', () => {
    search.value = 'char'
    selectTypes('Fire')
    toggleMegaOnly()
    expect(search.value).toBe('char')
    expect(typeFilters.value).toEqual(['Fire'])
    expect(megaOnly.value).toBe(true)
    expect(multiOnly.value).toBe(false)
  })

  it('reset returns all five to their initial values', () => {
    search.value = 'char'
    selectTypes('Fire', 'Water')
    toggleMegaOnly()
    toggleMultiOnly()

    resetQuery()

    expect(search.value).toBe('')
    expect(typeFilters.value).toEqual([])
    expect(megaOnly.value).toBe(false)
    expect(multiOnly.value).toBe(false)
    expect(results.value.length).toBe(ALL)
  })

  it('every element names one species and one form index', () => {
    for (const row of results.value) {
      expect(row.formIndex).toBeGreaterThanOrEqual(0)
      expect(row.formIndex).toBeLessThan(row.species.f.length)
    }
  })
})
