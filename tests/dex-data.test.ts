/**
 * The `dex-data` spec's asserted invariants, and the derived accessors built on them.
 *
 * The six invariants already throw at module load, so importing the data layer at all is most
 * of this check — a violated invariant makes every test in the run fail to collect rather than
 * fail an assertion. What the load-time assertions cannot do is state the numbers where someone
 * reading a test file will see them, or prove the meta block agrees with the collections it
 * describes. That is what this adds.
 */
import { describe, expect, it } from 'vitest'

import { allTypes, bestBst, bst, dex, hasMega, megaForms, searchHaystack } from '../src/data/dex.js'

/** Example: asserted invariants — spec.md, "Dataset integrity is asserted at load time". */
const EXPECTED = {
  'species count': 208,
  'form entries': 360,
  'mega forms': 75,
  'regional forms': 16,
  'move table entries': 496,
  'ability entries': 200,
} as const

describe('the six asserted invariants', () => {
  it('species count', () => {
    expect(dex.species.length).toBe(EXPECTED['species count'])
  })

  it('form entries across species', () => {
    const forms = dex.species.reduce((total, species) => total + species.f.length, 0)
    expect(forms).toBe(EXPECTED['form entries'])
  })

  it('forms of kind mega', () => {
    const megas = dex.species.reduce((total, species) => total + megaForms(species).length, 0)
    expect(megas).toBe(EXPECTED['mega forms'])
  })

  it('forms of kind regional', () => {
    const regional = dex.species.reduce(
      (total, species) => total + species.f.filter((form) => form.k === 'regional').length,
      0,
    )
    expect(regional).toBe(EXPECTED['regional forms'])
  })

  it('shared move table entries', () => {
    expect(dex.moves.length).toBe(EXPECTED['move table entries'])
  })

  it('ability entries', () => {
    expect(dex.abilities.length).toBe(EXPECTED['ability entries'])
  })
})

describe('the meta block agrees with the collections it describes', () => {
  // The data layer asserts both sides separately. This states the relation between them, which
  // is what makes a figure rendered from meta trustworthy on screen.
  it('meta species count matches the species collection', () => {
    expect(dex.meta.species).toBe(dex.species.length)
  })

  it('meta form entries match the summed forms', () => {
    const forms = dex.species.reduce((total, species) => total + species.f.length, 0)
    expect(dex.meta.formEntries).toBe(forms)
  })

  it('meta Mega count matches the Mega forms', () => {
    const megas = dex.species.reduce((total, species) => total + megaForms(species).length, 0)
    expect(dex.meta.megas).toBe(megas)
  })

  it('meta move count matches the move table', () => {
    expect(dex.meta.moves).toBe(dex.moves.length)
  })
})

/**
 * Example: the shape of the added fields — spec.md, "Move records carry a bilingual description
 * and flag identifiers".
 *
 * The flag figures are asserted here and nowhere in the interface, because nothing renders them:
 * this batch stores flags and displays none. Without a test they would be the one part of the
 * record that no check reads, so a pipeline change that dropped or reshaped them would surface
 * only whenever a later batch came to display them.
 */
describe('Example: the shape of the added move fields', () => {
  const flagged = dex.moves.filter((move) => move.fl !== undefined)

  it('every move carries a Chinese and an English description', () => {
    expect(dex.moves.filter((move) => move.d).length).toBe(496)
    expect(dex.moves.filter((move) => move.de).length).toBe(496)
  })

  it('every move carries a Chinese name', () => {
    expect(dex.moves.filter((move) => move.z).length).toBe(496)
  })

  it('425 moves carry at least one flag and 71 omit the field', () => {
    expect(flagged.length).toBe(425)
    expect(dex.moves.length - flagged.length).toBe(71)
  })

  it('21 distinct flag identifiers are in use', () => {
    const distinct = new Set(flagged.flatMap((move) => [...move.fl!]))
    expect(distinct.size).toBe(21)
  })

  it('at most 6 flags apply to one move', () => {
    const most = flagged.reduce((peak, move) => Math.max(peak, move.fl!.length), 0)
    expect(most).toBe(6)
  })

  it('a move with no flags omits the field rather than carrying an empty array', () => {
    expect(dex.moves.some((move) => move.fl !== undefined && move.fl.length === 0)).toBe(false)
  })

  it('flag identifiers ascend', () => {
    const unsorted = flagged.filter((move) => {
      const ids = [...move.fl!]
      return ids.join() !== [...ids].sort((a, b) => a - b).join()
    })
    expect(unsorted.map((move) => move.n)).toEqual([])
  })
})

describe('derived accessors', () => {
  const charizard = dex.species.find((species) => species.d === 6)!
  const ditto = dex.species.find((species) => species.d === 132)!

  it('allTypes gathers across every form, not just the base', () => {
    // Dragon appears on no Charizard form but Mega X. This is the property the type filter
    // depends on to keep alternate-form species reachable.
    expect(allTypes(charizard)).toContain('Dragon')
    expect(charizard.f[0]!.t).not.toContain('Dragon')
  })

  it('bestBst takes the strongest form, not the base form', () => {
    expect(bst(charizard.f[0]!)).toBe(534)
    expect(bestBst(charizard)).toBe(634)
  })

  it('bestBst equals the base total when a species has one form', () => {
    expect(ditto.f.length).toBe(1)
    expect(bestBst(ditto)).toBe(bst(ditto.f[0]!))
  })

  it('hasMega distinguishes the two', () => {
    expect(hasMega(charizard)).toBe(true)
    expect(hasMega(ditto)).toBe(false)
  })

  it('every species has at least one form, so a card always has something to draw', () => {
    for (const species of dex.species) expect(species.f.length).toBeGreaterThan(0)
  })
})

describe('the search corpus', () => {
  const charizard = dex.species.find((species) => species.d === 6)!

  it('is lower-cased, so matching can ignore letter case by lower-casing the query alone', () => {
    expect(searchHaystack(charizard)).toBe(searchHaystack(charizard).toLowerCase())
  })

  it('carries both names, the zero-padded number and the form labels', () => {
    const corpus = searchHaystack(charizard)
    expect(corpus).toContain('charizard')
    expect(corpus).toContain('噴火龍')
    expect(corpus).toContain('0006')
    expect(corpus).toContain('mega charizard x')
  })

  it('does not carry a bare Roman generation numeral', () => {
    // Recorded in HANDOFF §12.18 and forbidden by the search requirement: a bare V would match
    // 125 of the 208 species, which cannot be told apart from a broken search.
    const bareRoman = dex.species.filter((species) => {
      const corpus = searchHaystack(species)
      return / v /.test(corpus) || corpus.endsWith(' v')
    })
    expect(bareRoman.length).toBe(0)
  })
})
