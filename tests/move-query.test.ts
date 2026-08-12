/**
 * The `move-query` spec's Example tables, executed.
 *
 * Every number here is copied from `openspec/specs/move-query/spec.md` rather than derived, and
 * the tables are transcribed row for row — same rule as `dex-query.test.ts`. A count that moves
 * means either the code regressed or the spec was renegotiated without this file, and both are
 * worth stopping for.
 *
 * These drive the real move query state module. Nothing here re-implements a predicate.
 */
import { afterEach, describe, expect, it } from 'vitest'

import { dex } from '../src/data/dex.js'
import type { MoveClass } from '../src/data/dex.js'
import { moveName } from '../src/data/i18n.js'
import type { TypeName } from '../src/data/types.js'
import { resetQuery, search as dexSearch, toggleType as toggleDexType } from '../src/state/query.js'
import {
  isDamageClassSelected,
  isMoveTypeSelected,
  moveClassFilters,
  moveResults,
  moveSearch,
  moveTypeFilters,
  resetMoveQuery,
  toggleDamageClass,
  toggleMoveType,
} from '../src/state/moveQuery.js'
import { activateTab, activeTab } from '../src/state/tabs.js'

/** The whole move table, as the spec's tables count it. */
const ALL = 496

/** Move query state is module-level and shared, so every test has to hand it back. */
afterEach(() => {
  resetMoveQuery()
  resetQuery()
  activateTab('dex')
})

function selectTypes(...types: readonly TypeName[]): void {
  for (const type of types) toggleMoveType(type)
}

function selectClasses(...classes: readonly MoveClass[]): void {
  for (const cls of classes) toggleDamageClass(cls)
}

/** The result's Chinese names, which is how the spec's named examples identify moves. */
function matchedNames(): string[] {
  return moveResults.value.map((row) => moveName(row.move, 'zh'))
}

describe('the conditions are independently settable and reset together', () => {
  // Requirement: Move query state is shared, independently settable, and outlives the tab
  it('setting a type disturbs neither the search string nor the damage classes', () => {
    moveSearch.value = '牙'
    selectClasses('Physical')
    selectTypes('Water')

    expect(moveSearch.value).toBe('牙')
    expect(moveClassFilters.value).toEqual(['Physical'])
    expect(isMoveTypeSelected('Water')).toBe(true)
  })

  it('reset returns all three to their initial values', () => {
    moveSearch.value = '牙'
    selectTypes('Water', 'Dark')
    selectClasses('Physical')

    resetMoveQuery()

    expect(moveSearch.value).toBe('')
    expect(moveTypeFilters.value).toEqual([])
    expect(moveClassFilters.value).toEqual([])
    expect(moveResults.value).toHaveLength(ALL)
  })

  it('the conditions survive a tab switch', () => {
    moveSearch.value = 'fang'
    selectTypes('Fire')
    const before = moveResults.value.length

    activateTab('dex')
    activateTab('moves')

    expect(activeTab.value).toBe('moves')
    expect(moveSearch.value).toBe('fang')
    expect(isMoveTypeSelected('Fire')).toBe(true)
    expect(moveResults.value).toHaveLength(before)
  })

  it("clearing the dex tab's query leaves the move conditions alone", () => {
    moveSearch.value = '牙'
    selectTypes('Water')
    selectClasses('Physical')
    dexSearch.value = 'charizard'
    toggleDexType('Fire')

    resetQuery()

    expect(moveSearch.value).toBe('牙')
    expect(isMoveTypeSelected('Water')).toBe(true)
    expect(isDamageClassSelected('Physical')).toBe(true)
  })
})

describe('search matches move names in both languages and nothing else', () => {
  // Example: search strings against the 496-entry move table
  const table: readonly (readonly [string, number])[] = [
    ['', ALL],
    ['  ', ALL],
    ['牙', 7],
    ['fang', 6],
    ['火焰', 7],
    ['ice', 9],
    ['fire fang', 1],
    ['FIRE FANG', 1],
  ]

  it.each(table)('%o matches %i moves', (query, expected) => {
    moveSearch.value = query
    expect(moveResults.value).toHaveLength(expected)
  })

  it('reaches a Chinese name while the corpus is asked for in either language', () => {
    moveSearch.value = '火焰牙'
    expect(matchedNames()).toEqual(['火焰牙'])
  })

  it('does not carry the type into the corpus', () => {
    // 20 moves carry the Ice type; `ice` reaches only the 9 whose English name says so.
    moveSearch.value = 'ice'
    expect(moveResults.value).toHaveLength(9)
    expect(dex.moves.filter((move) => move.ty === 'Ice')).toHaveLength(20)
  })

  it('does not carry the description into the corpus', () => {
    // A word that appears in descriptions but in no move's name reaches nothing.
    const inDescriptions = dex.moves.filter((move) => move.de.toLowerCase().includes('paralyz'))
    expect(inDescriptions.length).toBeGreaterThan(0)
    moveSearch.value = 'paralyz'
    expect(moveResults.value).toHaveLength(0)
  })
})

describe('selections within a condition widen and the conditions narrow each other', () => {
  // Example: combined conditions against the 496-entry move table
  const table: readonly (readonly [string, readonly TypeName[], readonly MoveClass[], number])[] = [
    ['', [], [], 496],
    ['', ['Water'], [], 27],
    ['', ['Water', 'Dark'], [], 59],
    ['', [], ['Physical'], 204],
    ['', [], ['Status'], 172],
    ['', ['Water'], ['Physical'], 12],
    ['', ['Water', 'Dark'], ['Physical'], 31],
    ['', ['Water'], ['Physical', 'Status'], 16],
    ['', ['Ice'], ['Status'], 4],
    ['牙', [], [], 7],
    ['牙', [], ['Physical'], 7],
    ['牙', ['Water'], ['Physical'], 0],
  ]

  it.each(table)(
    'search %o, types %o, classes %o matches %i moves',
    (query, types, classes, expected) => {
      moveSearch.value = query
      selectTypes(...types)
      selectClasses(...classes)
      expect(moveResults.value).toHaveLength(expected)
    },
  )

  it('a second type widens rather than narrows', () => {
    selectTypes('Water')
    const one = moveResults.value.length
    selectTypes('Dark')
    expect(moveResults.value.length).toBeGreaterThanOrEqual(one)
  })

  it('a second damage class widens rather than narrows', () => {
    selectClasses('Physical')
    const one = moveResults.value.length
    selectClasses('Status')
    expect(moveResults.value.length).toBeGreaterThanOrEqual(one)
  })

  // Example: Ice moves of the status damage class
  it('the Ice type and the status damage class leave four moves', () => {
    selectTypes('Ice')
    selectClasses('Status')
    expect(matchedNames()).toEqual(['極光幕', '雪景', '黑霧', '冷笑話'])
  })

  // Example: a combination no move satisfies
  it('a combination no move satisfies leaves nothing', () => {
    moveSearch.value = '牙'
    const carried = moveResults.value.map((row) => row.move.ty)
    expect(carried).not.toContain('Water')

    selectTypes('Water')
    selectClasses('Physical')
    expect(moveResults.value).toEqual([])
  })
})

describe('every element carries its index in the shared move table', () => {
  it('unfiltered, each index equals its position in the table', () => {
    expect(moveResults.value.map((row) => row.index)).toEqual(dex.moves.map((_, index) => index))
  })

  // Example: indices survive filtering
  it('filtering does not renumber', () => {
    expect(moveName(dex.moves[0]!, 'zh')).toBe('極光幕')
    expect(moveName(dex.moves[1]!, 'zh')).toBe('雪崩')

    selectTypes('Ice')
    selectClasses('Status')

    const first = moveResults.value[0]!
    expect(first.index).toBe(0)
    expect(moveName(first.move, 'zh')).toBe('極光幕')
    expect(moveResults.value.map((row) => row.index)).not.toEqual([0, 1, 2, 3])
  })

  it('each element names the move the table holds at that index', () => {
    moveSearch.value = '牙'
    for (const row of moveResults.value) {
      expect(row.move).toBe(dex.moves[row.index])
    }
  })

  it('the result keeps the table\'s own relative order', () => {
    selectClasses('Status')
    const indices = moveResults.value.map((row) => row.index)
    expect(indices).toEqual([...indices].sort((a, b) => a - b))
  })
})
