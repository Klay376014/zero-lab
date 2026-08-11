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
