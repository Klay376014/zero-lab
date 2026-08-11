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

import { moveFlagLabel } from '../src/data/i18n.js'
import {
  allTypes,
  assertFlagsNamed,
  bestBst,
  bst,
  dex,
  hasMega,
  megaForms,
  searchHaystack,
} from '../src/data/dex.js'

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
 * The flag figures are asserted here rather than in the interface. `move-detail` draws 17 of the
 * 21 as short labels, so a pipeline change that dropped or reshaped `fl` would show up on screen
 * as labels quietly going missing — the silent-omission shape this project keeps paying for, and
 * the reason the counts are stated here where a reader sees them.
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

/**
 * Example: the shape of the flag identifier table — spec.md, "The dataset names every move flag
 * identifier".
 *
 * The table names all 21 including the four `move-detail` does not draw, because which flags are
 * drawn is decided by which identifiers the string table gives a label to. A table filtered down
 * to the displayed 17 would put that decision in the dataset, where changing it would mean
 * re-running the pipeline.
 */
describe('Example: the shape of the flag identifier table', () => {
  it('names 21 identifiers', () => {
    expect(Object.keys(dex.moveFlags).length).toBe(21)
  })

  it('names every identifier that applies to at least one move', () => {
    const used = [...new Set(dex.moves.flatMap((move) => move.fl ?? []))]
    expect(used.filter((id) => dex.moveFlags[String(id)] === undefined)).toEqual([])
  })

  it('names the four identifiers no move detail draws', () => {
    const named = new Set(Object.values(dex.moveFlags))
    for (const identifier of ['mirror', 'snatch', 'non-sky-battle', 'distance']) {
      expect(named.has(identifier)).toBe(true)
    }
  })

  it('carries no label text — the identifiers are ASCII upstream names', () => {
    const nonAscii = Object.values(dex.moveFlags).filter((name) => /[^\u0020-\u007e]/.test(name))
    expect(nonAscii).toEqual([])
  })

  it('the load-time invariant throws on an id no table entry names', () => {
    const move = { ...dex.moves[0], fl: [99] }
    expect(() => assertFlagsNamed([move], dex.moveFlags))
      .toThrow(/flag id\(s\) 99 apply to a move but are not named in moveFlags/)
  })

  it('the load-time invariant accepts the shipped dataset', () => {
    expect(() => assertFlagsNamed(dex.moves, dex.moveFlags)).not.toThrow()
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

/**
 * Which flag labels read as the name of the move they sit under.
 *
 * Five of the 17 labels are also names in this dataset: `守住`, `蓄力` and `重力` are moves, `穿透`
 * is an ability, and `波動` is part of six move names. Three of those are harmless because the
 * label points at the very move the flag is about — `守住` means "blocked by Protect", and Protect
 * is that move.
 *
 * What matters is a label landing on the move it describes. Exactly one does, and only in English:
 * the move Bite carries the `bite` flag, so its English detail reads `Flags: … Bite`. That is
 * tautological but true — Bite is a biting move, which is what the flag says — so it is pinned
 * here rather than renamed. Chinese is clean: the move is 咬住 and the label is 啃咬.
 *
 * Pinned as an exact set, not asserted empty. Nothing upstream prevents a second one: a re-fetch
 * that added `charge` to Stockpile would put a 蓄力 chip on the move 蓄力, and that one would be a
 * genuine misread rather than a tautology. A new entry here is a decision to make, not a test to
 * relax.
 */
describe('flag labels that read as their own move name', () => {
  const selfNaming = (lang: 'zh' | 'en') => dex.moves
    .filter((move) => (move.fl ?? [])
      .some((id) => moveFlagLabel(id, lang) === (lang === 'zh' ? move.z : move.n)))
    .map((move) => move.n)

  it('no move states a label equal to its Chinese name', () => {
    expect(selfNaming('zh')).toEqual([])
  })

  it('exactly one move states a label equal to its English name, and it is Bite', () => {
    expect(selfNaming('en')).toEqual(['Bite'])
  })

  it('Bite is a biting move, so the label states something true of it', () => {
    const bite = dex.moves.find((move) => move.n === 'Bite')!
    expect(bite.z).toBe('咬住')
    expect(bite.fl!.map((id) => moveFlagLabel(id, 'zh'))).toContain('啃咬')
    expect(moveFlagLabel(bite.fl!.find((id) => moveFlagLabel(id, 'en') === 'Bite')!, 'zh'))
      .toBe('啃咬')
  })

  it('the three moves whose names are also labels carry no flag that would name them', () => {
    const labelsOf = (zh: string) => (dex.moves.find((move) => move.z === zh)!.fl ?? [])
      .map((id) => moveFlagLabel(id, 'zh'))
    expect(labelsOf('守住')).not.toContain('守住')
    expect(labelsOf('蓄力')).not.toContain('蓄力')
    expect(labelsOf('重力')).not.toContain('重力')
  })

  it('Rebound does not name any move, where Reflect would have', () => {
    const names = new Set(dex.moves.map((move) => move.n))
    expect(names.has('Reflect')).toBe(true)
    expect(names.has('Rebound')).toBe(false)
  })
})
