/**
 * The string table's completeness, and the accessors that read it.
 *
 * What this is for: `Strings` is an interface, so `vue-tsc` already refuses a table missing a
 * key. What it cannot refuse is a key present in both languages and *empty* in one, which
 * renders as a blank label — visible only to whoever happens to read that screen in that
 * language. This project's recurring failure shape, and the reason `dex-data` requires the
 * table to carry every user-facing string in both languages.
 *
 * The key set is read from the table itself rather than restated, so a key added to `Strings`
 * is covered here the moment it exists. The named list below is the opposite check: it fails
 * if one of the strings this change introduced is ever dropped.
 */
import { describe, expect, it } from 'vitest'

import { dex } from '../src/data/dex.js'
import type { Lang, Strings } from '../src/data/i18n.js'
import {
  I18N,
  learnerCountLabel,
  moveCountLabel,
  moveDescription,
  moveFlagLabel,
  moveHeads,
  moveName,
  t,
} from '../src/data/i18n.js'

const LANGS: readonly Lang[] = ['zh', 'en']

describe('every string is present in both languages', () => {
  it('the two tables carry the same keys', () => {
    expect(Object.keys(I18N.zh).sort()).toEqual(Object.keys(I18N.en).sort())
  })

  for (const lang of LANGS) {
    it(`no ${lang} string is empty`, () => {
      const blank = Object.entries(I18N[lang])
        .filter(([, value]) => value.trim() === '')
        .map(([key]) => key)
      expect(blank).toEqual([])
    })
  }
})

/**
 * Example: the keys this change adds — spec.md, "The string table carries the tab, move index
 * and move detail strings in both languages".
 *
 * The move index's column labels are absent from this list on purpose: its columns are the
 * learnset table's columns, so it reads `moveHeads` rather than carrying a second copy of the
 * same six strings.
 */
const ADDED: readonly (keyof Strings)[] = [
  'tabDex', 'tabMoves',
  'mdType', 'mdClass', 'mdPower', 'mdAcc', 'mdPp', 'mdDesc', 'mdLearners',
]

describe('the strings this change adds', () => {
  for (const key of ADDED) {
    it(`${key} resolves in both languages`, () => {
      for (const lang of LANGS) {
        expect(t(key, lang)).toBeTruthy()
      }
    })
  }

  it('the move index reads its column labels from the shared heads', () => {
    for (const lang of LANGS) {
      const heads = moveHeads(lang)
      // Six columns: the glyph column's label is empty by design, the other five are stated.
      expect(heads).toHaveLength(6)
      expect(heads.slice(1).every((head) => head !== '')).toBe(true)
    }
  })
})

describe('the count statements', () => {
  it('states a move count in both languages', () => {
    expect(moveCountLabel(dex.meta.moves, 'zh')).toBe('496 個招式')
    expect(moveCountLabel(dex.meta.moves, 'en')).toBe('496 moves')
  })

  it('states a learner count in both languages', () => {
    expect(learnerCountLabel(207, 'zh')).toBe('207 隻')
    expect(learnerCountLabel(207, 'en')).toBe('207 species')
  })
})

/**
 * Example: description coverage — move-detail spec.md, "Every move carries a description in
 * both languages".
 *
 * Asserted against the real dataset rather than a fixture: the guarantee being checked is the
 * pipeline's, and a fixture would only prove the fixture.
 */
describe('every move carries a description in both languages', () => {
  it('no move has an empty description in either language', () => {
    const missing = dex.moves.filter(
      (move) => !moveDescription(move, 'zh') || !moveDescription(move, 'en'),
    )
    expect(missing.map((move) => move.n)).toEqual([])
  })

  it('the description follows the leading language', () => {
    const move = dex.moves.find((entry) => entry.n === 'Stone Edge')!
    expect(moveDescription(move, 'zh')).toBe(move.d)
    expect(moveDescription(move, 'en')).toBe(move.de)
    expect(moveDescription(move, 'zh')).not.toBe(moveDescription(move, 'en'))
  })
})

describe('every move carries a Chinese name', () => {
  it('no move falls back to its English name', () => {
    const nameless = dex.moves.filter((move) => !move.z)
    expect(nameless.map((move) => move.n)).toEqual([])
  })

  it('the name follows the leading language', () => {
    const move = dex.moves.find((entry) => entry.n === 'Stone Edge')!
    expect(moveName(move, 'zh')).toBe('尖石攻擊')
    expect(moveName(move, 'en')).toBe('Stone Edge')
  })
})

/**
 * Example: the two labels that are not literal renderings of their identifier, and the coverage
 * split — spec.md, "The string table carries a short label for each displayed move flag".
 *
 * Read through `moveFlagLabel` rather than off the label table, so what is asserted is the
 * resolution the interface actually performs: id to upstream identifier via the dataset, then
 * identifier to label via the string table. A test reading the table directly would pass even if
 * that first hop were broken.
 *
 * The absent four are the point of the coverage assertion. Their absence *is* the exclusion —
 * there is no separate list of excluded flags — so a label accidentally added for one of them
 * would put it on screen with nothing else changing.
 */
describe('the short label for each displayed move flag', () => {
  const ids = Object.keys(dex.moveFlags).map(Number)
  const EXCLUDED = ['mirror', 'snatch', 'non-sky-battle', 'distance']

  it('17 of the 21 flags resolve to a label in both languages', () => {
    for (const lang of LANGS) {
      const labelled = ids.filter((id) => moveFlagLabel(id, lang) !== '')
      expect(labelled.length).toBe(17)
    }
    expect(ids.length).toBe(21)
  })

  it('the same 17 are labelled in both languages', () => {
    const zh = ids.filter((id) => moveFlagLabel(id, 'zh') !== '')
    const en = ids.filter((id) => moveFlagLabel(id, 'en') !== '')
    expect(zh).toEqual(en)
  })

  for (const identifier of EXCLUDED) {
    it(`${identifier} resolves to no label in either language`, () => {
      const id = ids.find((candidate) => dex.moveFlags[String(candidate)] === identifier)!
      expect(id).toBeDefined()
      for (const lang of LANGS) {
        expect(moveFlagLabel(id, lang)).toBe('')
      }
    })
  }

  it('an id the dataset does not name resolves to an empty string rather than throwing', () => {
    for (const lang of LANGS) {
      expect(() => moveFlagLabel(99, lang)).not.toThrow()
      expect(moveFlagLabel(99, lang)).toBe('')
    }
  })

  it('protect is labelled despite applying to 340 of the 496 moves', () => {
    const id = ids.find((candidate) => dex.moveFlags[String(candidate)] === 'protect')!
    expect(moveFlagLabel(id, 'zh')).toBe('守住')
    expect(moveFlagLabel(id, 'en')).toBe('Protect')
    expect(dex.moves.filter((move) => move.fl?.includes(id)).length).toBe(340)
  })

  it('the two labels that are not literal renderings of their identifier', () => {
    const idOf = (identifier: string) =>
      ids.find((candidate) => dex.moveFlags[String(candidate)] === identifier)!
    expect(moveFlagLabel(idOf('authentic'), 'en')).toBe('Pierce')
    expect(moveFlagLabel(idOf('authentic'), 'zh')).toBe('穿透')
    expect(moveFlagLabel(idOf('reflectable'), 'en')).toBe('Rebound')
    expect(moveFlagLabel(idOf('reflectable'), 'zh')).toBe('反彈')
  })

  it('dance is 舞蹈 rather than 舞者 — a move is not a dancer', () => {
    const id = ids.find((candidate) => dex.moveFlags[String(candidate)] === 'dance')!
    expect(moveFlagLabel(id, 'zh')).toBe('舞蹈')
    expect(moveFlagLabel(id, 'en')).toBe('Dance')
  })
})

/**
 * Example: the flag row's own label — spec.md, "Move detail states the move's flags as short
 * labels".
 *
 * Separate from the `ADDED` list above, which belongs to the change that added the moves tab.
 */
describe('the flag row label', () => {
  it('mdFlags resolves in both languages', () => {
    for (const lang of LANGS) {
      expect(t('mdFlags', lang)).toBeTruthy()
    }
  })

  it('is a plain noun in Chinese and the upstream word in English', () => {
    expect(t('mdFlags', 'zh')).toBe('性質')
    expect(t('mdFlags', 'en')).toBe('Flags')
  })
})

/**
 * Example: four moves as rendered — spec.md, "Move detail states the move's flags as short
 * labels".
 *
 * The four rows of the spec's table, driven through the same resolution the component performs:
 * the move's `fl` in the ascending order the dataset guarantees, each id to a label, unlabelled
 * ids dropped. What this cannot reach is whether the row itself is absent for the last two — that
 * is an element-tree fact, and Node has no element tree. It is on the device acceptance list.
 */
describe('Example: four moves as rendered', () => {
  const CASES: readonly { move: string, zh: readonly string[], en: readonly string[] }[] = [
    { move: 'Attract', zh: ['守住', '反彈', '穿透', '心靈'], en: ['Protect', 'Rebound', 'Pierce', 'Mental'] },
    { move: 'Stone Edge', zh: ['守住'], en: ['Protect'] },
    { move: 'Aurora Veil', zh: [], en: [] },
    { move: 'Ice Spinner', zh: [], en: [] },
  ]

  for (const { move: name, zh, en } of CASES) {
    it(`${name} states ${zh.length} label(s)`, () => {
      const move = dex.moves.find((entry) => entry.n === name)!
      const labels = (lang: Lang) => (move.fl ?? [])
        .map((id) => moveFlagLabel(id, lang))
        .filter((label) => label !== '')
      expect(labels('zh')).toEqual(zh)
      expect(labels('en')).toEqual(en)
    })
  }

  it('Aurora Veil carries a flag yet states none, and Ice Spinner carries none at all', () => {
    const auroraVeil = dex.moves.find((entry) => entry.n === 'Aurora Veil')!
    const iceSpinner = dex.moves.find((entry) => entry.n === 'Ice Spinner')!
    expect(auroraVeil.fl).toBeDefined()
    expect(iceSpinner.fl).toBeUndefined()
  })
})

/**
 * Example: label coverage across the flag vocabulary — spec.md, same requirement.
 *
 * The per-move counts, computed over the whole table rather than asserted move by move. The `4`
 * is the one the layer is built for: it is what "at most four labels" means, and it is a
 * consequence of the exclusions rather than a cap anyone imposed.
 */
describe('Example: label coverage across the flag vocabulary', () => {
  const stated = dex.moves.map((move) => (move.fl ?? [])
    .filter((id) => moveFlagLabel(id, 'zh') !== '').length)

  it('at most four labels are stated for any move', () => {
    expect(Math.max(...stated)).toBe(4)
  })

  it('113 moves state no label — 71 carrying none, 42 whose every flag is excluded', () => {
    expect(stated.filter((count) => count === 0).length).toBe(113)
    expect(dex.moves.filter((move) => move.fl === undefined).length).toBe(71)
    expect(dex.moves.filter((move) => move.fl !== undefined
      && move.fl.every((id) => moveFlagLabel(id, 'zh') === '')).length).toBe(42)
  })

  it('the per-move distribution of stated labels', () => {
    const distribution = stated.reduce<Record<number, number>>((counts, count) => {
      counts[count] = (counts[count] ?? 0) + 1
      return counts
    }, {})
    expect(distribution).toEqual({ 0: 113, 1: 137, 2: 180, 3: 52, 4: 14 })
  })
})
