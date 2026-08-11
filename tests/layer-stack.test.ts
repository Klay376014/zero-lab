/**
 * The `layer-stack` spec's unwinding rule, and the tab module beside it.
 *
 * Driven directly against the state modules, with no element tree: the rule is arithmetic over
 * a list of layers, and the spec's own acceptance criteria are stated as depths and members
 * rather than as anything drawn. That is what makes it checkable here — the platform facts this
 * project keeps paying for live in layout and gestures, not in a list.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { dex } from '../src/data/dex.js'
import type { Species } from '../src/data/dex.js'
import {
  MAX_DEPTH,
  closeTopLayer,
  depth,
  hasLayer,
  layerOfKind,
  layers,
  openLayer,
  resetLayers,
  setLayerContent,
  topLayer,
} from '../src/state/layerStack.js'
import { bonusOnly, moveSort, resetLearnsetView } from '../src/state/learnset.js'
import {
  cycleSort,
  isTypeSelected,
  megaOnly,
  resetQuery,
  results,
  search,
  sortOrder,
  toggleType,
} from '../src/state/query.js'
import { activateTab, activeTab } from '../src/state/tabs.js'
import { closeDetail, openDetail, selectForm, selected, selectedFormIndex } from '../src/state/selection.js'

const speciesA: Species = dex.species[0]!
const speciesB: Species = dex.species[1]!

/** A move in A's learnset, so the cycle the spec describes is a real path through the data. */
const moveInA = dex.species[0]!.sec[0]![0]!
const moveX = 12
const moveY = 34

function kinds(): string[] {
  return layers.value.map((layer) => layer.kind)
}

/**
 * Captured at import time, before any `beforeEach` has touched either module.
 *
 * The reset below sets the tab deliberately, so a test asserting `activeTab` after it would
 * only prove the reset ran. These two are the modules' own starting values.
 */
const INITIAL_TAB = activeTab.value
const INITIAL_DEPTH = depth.value

beforeEach(() => {
  resetLayers()
  activateTab('dex')
})

describe('the active tab', () => {
  it('starts on the dex tab, with no layer open', () => {
    expect(INITIAL_TAB).toBe('dex')
    expect(INITIAL_DEPTH).toBe(0)
  })

  it('reports the tab that was activated', () => {
    activateTab('moves')
    expect(activeTab.value).toBe('moves')
    activateTab('dex')
    expect(activeTab.value).toBe('dex')
  })

  it('does not hold the selection or the stack', () => {
    activateTab('moves')
    openLayer({ kind: 'move', moveIndex: moveX })
    expect(activeTab.value).toBe('moves')
    expect(depth.value).toBe(1)
    // Opening a layer left the tab alone, and activating a tab leaves the stack alone.
    activateTab('dex')
    expect(depth.value).toBe(1)
    expect(kinds()).toEqual(['move'])
  })
})

describe('opening an absent kind pushes it', () => {
  it('species detail then move detail', () => {
    openDetail(speciesA, 0)
    openLayer({ kind: 'move', moveIndex: moveInA })
    expect(kinds()).toEqual(['species', 'move'])
  })
})

describe('opening a present kind unwinds to it', () => {
  it('replaces the content and discards everything above', () => {
    openDetail(speciesA, 0)
    openLayer({ kind: 'move', moveIndex: moveInA })
    openLayer({ kind: 'learners', moveIndex: moveInA })
    openDetail(speciesB, 0)

    expect(kinds()).toEqual(['species'])
    expect(selected.value).toBe(speciesB)
  })
})

describe('the stack never holds two of a kind', () => {
  it('holds one of each at most, whatever the sequence', () => {
    const sequence = [
      () => openDetail(speciesA, 0),
      () => openLayer({ kind: 'move', moveIndex: moveX }),
      () => openLayer({ kind: 'learners', moveIndex: moveX }),
      () => openDetail(speciesB, 0),
      () => openLayer({ kind: 'move', moveIndex: moveY }),
      () => openLayer({ kind: 'learners', moveIndex: moveY }),
    ]
    for (const step of sequence) {
      step()
      expect(new Set(kinds()).size).toBe(kinds().length)
      expect(depth.value).toBeLessThanOrEqual(MAX_DEPTH)
    }
  })
})

/**
 * Example: one full cycle from each tab — spec.md, "A layer type holds at most one instance,
 * and re-entry unwinds". One row per step, asserting the stack and the depth the table states.
 */
describe('Example: one full cycle from each tab', () => {
  it('walks the dex-tab cycle', () => {
    const rows: readonly [() => void, string[], number][] = [
      [() => {}, [], 0],
      [() => openDetail(speciesA, 0), ['species'], 1],
      [() => openLayer({ kind: 'move', moveIndex: moveInA }), ['species', 'move'], 2],
      [() => openLayer({ kind: 'learners', moveIndex: moveInA }), ['species', 'move', 'learners'], 3],
      [() => openDetail(speciesB, 0), ['species'], 1],
    ]
    for (const [step, want, wantDepth] of rows) {
      step()
      expect(kinds()).toEqual(want)
      expect(depth.value).toBe(wantDepth)
    }
  })

  it('walks the moves-tab cycle', () => {
    activateTab('moves')
    const rows: readonly [() => void, string[], number][] = [
      [() => {}, [], 0],
      [() => openLayer({ kind: 'move', moveIndex: moveX }), ['move'], 1],
      [() => openLayer({ kind: 'learners', moveIndex: moveX }), ['move', 'learners'], 2],
      [() => openDetail(speciesB, 0), ['move', 'learners', 'species'], 3],
      // A move in B's learnset: move detail is already in the stack, so this unwinds to it.
      [() => openLayer({ kind: 'move', moveIndex: moveY }), ['move'], 1],
    ]
    for (const [step, want, wantDepth] of rows) {
      step()
      expect(kinds()).toEqual(want)
      expect(depth.value).toBe(wantDepth)
    }
  })
})

/** Example: the cycle does not accumulate — spec.md, same requirement. */
describe('Example: the cycle does not accumulate', () => {
  it('holds at most three through ten cycles, and one after the tenth', () => {
    for (let cycle = 0; cycle < 10; cycle += 1) {
      openDetail(speciesA, 0)
      expect(depth.value).toBeLessThanOrEqual(MAX_DEPTH)
      openLayer({ kind: 'move', moveIndex: moveInA })
      expect(depth.value).toBeLessThanOrEqual(MAX_DEPTH)
      openLayer({ kind: 'learners', moveIndex: moveInA })
      expect(depth.value).toBeLessThanOrEqual(MAX_DEPTH)
      openDetail(speciesB, 0)
      expect(depth.value).toBeLessThanOrEqual(MAX_DEPTH)
    }
    expect(depth.value).toBe(1)
    expect(kinds()).toEqual(['species'])
  })
})

describe('closing removes only the topmost layer', () => {
  it('leaves the layer beneath with its content unchanged', () => {
    openDetail(speciesA, 1)
    openLayer({ kind: 'move', moveIndex: moveInA })
    closeTopLayer()

    expect(kinds()).toEqual(['species'])
    expect(selected.value).toBe(speciesA)
    expect(selectedFormIndex.value).toBe(1)
  })

  it('returns to the tab when the last layer closes', () => {
    openLayer({ kind: 'move', moveIndex: moveX })
    closeTopLayer()
    expect(depth.value).toBe(0)
    expect(topLayer.value).toBeNull()
  })

  it('does not restore a layer an earlier unwinding discarded', () => {
    openDetail(speciesA, 0)
    openLayer({ kind: 'move', moveIndex: moveInA })
    openLayer({ kind: 'learners', moveIndex: moveInA })
    openDetail(speciesB, 0) // unwinds; move detail and the learner list are discarded
    closeDetail()

    expect(depth.value).toBe(0)
    expect(hasLayer('move')).toBe(false)
    expect(hasLayer('learners')).toBe(false)
  })

  it('closing an empty stack is not an error', () => {
    closeTopLayer()
    expect(depth.value).toBe(0)
  })
})

describe('a layer is identified by its content, not its position', () => {
  it('reports what it was opened with after an unwind', () => {
    openLayer({ kind: 'move', moveIndex: moveX })
    openLayer({ kind: 'learners', moveIndex: moveX })
    openDetail(speciesA, 0)
    // Position 0 held move detail for moveX; opening moveY unwinds and replaces its content.
    openLayer({ kind: 'move', moveIndex: moveY })

    expect(layerOfKind('move')?.moveIndex).toBe(moveY)
    expect(layers.value[0]).toEqual({ kind: 'move', moveIndex: moveY })
  })

  it('carries the open move on the learner layer, not beside it', () => {
    openLayer({ kind: 'move', moveIndex: moveX })
    openLayer({ kind: 'learners', moveIndex: moveY })
    expect(layerOfKind('learners')?.moveIndex).toBe(moveY)
    expect(layerOfKind('move')?.moveIndex).toBe(moveX)
  })
})

describe('a tab switch leaves the stack intact', () => {
  it('keeps both layers and their content', () => {
    openDetail(speciesA, 1)
    openLayer({ kind: 'move', moveIndex: moveInA })
    const before = [...layers.value]

    activateTab('moves')

    expect(layers.value).toEqual(before)
    expect(selected.value).toBe(speciesA)
    expect(selectedFormIndex.value).toBe(1)
    expect(layerOfKind('move')?.moveIndex).toBe(moveInA)
  })
})

/**
 * The four scenarios the `move-learners` capability states, under its own wording.
 *
 * They were two special-cased rules before this change — choosing a learner replaced the
 * selection rather than stacking, and closing returned to the grid rather than to the source
 * species. Both now fall out of the unwinding rule above rather than being written separately,
 * so they are asserted here to show the generalisation did not lose them.
 */
describe('move-learners: choosing a learner', () => {
  it('replaces the selection when species detail is already open', () => {
    openDetail(speciesA, 0)
    openLayer({ kind: 'move', moveIndex: moveInA })
    openLayer({ kind: 'learners', moveIndex: moveInA })

    openDetail(speciesB, 0) // chosen from the list

    expect(selected.value).toBe(speciesB)
    expect(kinds()).toEqual(['species'])
  })

  it('is pushed when species detail is not open, above the move and the list', () => {
    activateTab('moves')
    openLayer({ kind: 'move', moveIndex: moveX })
    openLayer({ kind: 'learners', moveIndex: moveX })

    openDetail(speciesB, 0)

    expect(selected.value).toBe(speciesB)
    expect(kinds()).toEqual(['move', 'learners', 'species'])
    expect(topLayer.value).toEqual({ kind: 'species', species: speciesB, formIndex: 0 })
  })

  it('closing returns to the tab, not to the species the reader came from', () => {
    openDetail(speciesA, 0)
    openLayer({ kind: 'move', moveIndex: moveInA })
    openLayer({ kind: 'learners', moveIndex: moveInA })
    openDetail(speciesB, 0)

    closeDetail()

    expect(depth.value).toBe(0)
    expect(selected.value).toBeNull()
  })

  it('leaves the learnset table state alone across the replacement', () => {
    moveSort.value = 'power'
    bonusOnly.value = true

    openDetail(speciesA, 0)
    openLayer({ kind: 'move', moveIndex: moveInA })
    openLayer({ kind: 'learners', moveIndex: moveInA })
    openDetail(speciesB, 0)

    // Held outside the panel, and deliberately not reset by the replacement.
    expect(moveSort.value).toBe('power')
    expect(bonusOnly.value).toBe(true)
    resetLearnsetView()
  })

  it('closing the list without choosing leaves the layer beneath intact', () => {
    openDetail(speciesA, 1)
    openLayer({ kind: 'move', moveIndex: moveInA })
    openLayer({ kind: 'learners', moveIndex: moveInA })

    closeTopLayer()

    expect(kinds()).toEqual(['species', 'move'])
    expect(layerOfKind('move')?.moveIndex).toBe(moveInA)
    expect(selectedFormIndex.value).toBe(1)
  })
})

/**
 * Closing unwinds one step at a time, back the way the reader came.
 *
 * Stated as an acceptance criterion during review: open a move from a species, and closing returns
 * to that species; closing again returns to where you started. It follows from "closing removes
 * only the topmost layer", but it is the sequence a reader actually performs, so it is asserted as
 * a sequence rather than left implied by the single-step rules above.
 */
describe('closing walks back one layer at a time', () => {
  it('species, move, close, close', () => {
    openDetail(speciesA, 1)
    openLayer({ kind: 'move', moveIndex: moveInA })
    expect(kinds()).toEqual(['species', 'move'])

    closeTopLayer()
    // Back to the species that was open, with the same content — not to the grid.
    expect(kinds()).toEqual(['species'])
    expect(selected.value).toBe(speciesA)
    expect(selectedFormIndex.value).toBe(1)

    closeTopLayer()
    expect(depth.value).toBe(0)
    expect(activeTab.value).toBe('dex')
  })

  it('species, move, learners, close, close, close', () => {
    openDetail(speciesA, 0)
    openLayer({ kind: 'move', moveIndex: moveInA })
    openLayer({ kind: 'learners', moveIndex: moveInA })

    closeTopLayer()
    expect(kinds()).toEqual(['species', 'move'])
    expect(layerOfKind('move')?.moveIndex).toBe(moveInA)

    closeTopLayer()
    expect(kinds()).toEqual(['species'])
    expect(selected.value).toBe(speciesA)

    closeTopLayer()
    expect(depth.value).toBe(0)
  })

  it('moves tab: move, learners, close, close', () => {
    activateTab('moves')
    openLayer({ kind: 'move', moveIndex: moveX })
    openLayer({ kind: 'learners', moveIndex: moveX })

    closeTopLayer()
    expect(kinds()).toEqual(['move'])
    expect(layerOfKind('move')?.moveIndex).toBe(moveX)

    closeTopLayer()
    expect(depth.value).toBe(0)
    expect(activeTab.value).toBe('moves')
  })
})

/**
 * Example: query state survives a round trip — view-tabs spec.md, "Switching tabs preserves the
 * other tab's state". The query module is driven directly; what a switch must not do is reset it.
 */
describe('view-tabs: switching tabs preserves the other tab state', () => {
  it('keeps the search text, the type filter and the sort order', () => {
    search.value = 'char'
    toggleType('Fire')
    megaOnly.value = true
    cycleSort()
    const order = sortOrder.value
    const sequence = results.value.map((row) => row.species.d)
    expect(sequence.length).toBeGreaterThan(0)

    activateTab('moves')
    activateTab('dex')

    expect(search.value).toBe('char')
    expect(isTypeSelected('Fire')).toBe(true)
    expect(megaOnly.value).toBe(true)
    expect(sortOrder.value).toBe(order)
    expect(results.value.map((row) => row.species.d)).toEqual(sequence)
    resetQuery()
  })

  it('keeps the learnset table state', () => {
    moveSort.value = 'type'
    bonusOnly.value = true
    activateTab('moves')
    activateTab('dex')
    expect(moveSort.value).toBe('type')
    expect(bonusOnly.value).toBe(true)
    resetLearnsetView()
  })
})

describe('switching form changes the layer in place', () => {
  it('keeps the layers above it', () => {
    openDetail(speciesA, 0)
    openLayer({ kind: 'move', moveIndex: moveInA })
    selectForm(1)

    expect(kinds()).toEqual(['species', 'move'])
    expect(selectedFormIndex.value).toBe(Math.min(1, speciesA.f.length - 1))
  })

  it('clamps to the form range and ignores a call with nothing open', () => {
    openDetail(speciesA, 99)
    expect(selectedFormIndex.value).toBe(speciesA.f.length - 1)

    resetLayers()
    selectForm(2)
    expect(depth.value).toBe(0)
  })

  it('replaces content without pushing a second species layer', () => {
    openDetail(speciesA, 0)
    setLayerContent({ kind: 'species', species: speciesB, formIndex: 0 })
    expect(kinds()).toEqual(['species'])
    expect(selected.value).toBe(speciesB)
  })
})
