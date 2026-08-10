/**
 * The `visible-range-window` spec's Example tables, driven against the real derivation.
 *
 * These tables are the agreed arithmetic, not illustrations — the boundary cases are exactly
 * where windowing produces blank rows and mismatched content, and neither shows up as an error
 * on a device. What node cannot reach is whether the container reports an offset at all; that is
 * recorded in design/HANDOFF.md §12.25.
 */
import { describe, expect, it } from 'vitest'

import { sliceForRange, visibleRange } from '../src/state/visibleRange.js'
import type { Range } from '../src/state/visibleRange.js'

const GRID = { visible: 480, itemHeight: 96, perRow: 2, total: 208, bufferScreens: 1 }
const LIST = { visible: 240, itemHeight: 24, perRow: 1, total: 105, bufferScreens: 1 }

function tuple(range: Range): [number, number, number, number] {
  return [range.first, range.last, range.leading, range.trailing]
}

/** Example: a two-column grid of 208 items, 96px rows, 480px visible, one screen of buffer. */
describe('the two-column grid example', () => {
  const rows: ReadonlyArray<[number, number, number, number, number]> = [
    [0, 0, 21, 0, 8928],
    [480, 0, 31, 0, 8448],
    [960, 10, 41, 480, 7968],
    [9600, 190, 207, 9120, 0],
  ]

  it.each(rows)('offset %i', (offset, first, last, leading, trailing) => {
    expect(tuple(visibleRange({ ...GRID, offset }))).toEqual([first, last, leading, trailing])
  })
})

/** Example: a single-column list of 105 items, 24px rows, 240px visible, one screen of buffer. */
describe('the single-column list example', () => {
  const rows: ReadonlyArray<[number, number, number, number, number]> = [
    [0, 0, 20, 0, 2016],
    [240, 0, 30, 0, 1776],
    [1200, 40, 70, 960, 816],
    [2280, 85, 104, 2040, 0],
  ]

  it.each(rows)('offset %i', (offset, first, last, leading, trailing) => {
    expect(tuple(visibleRange({ ...LIST, offset }))).toEqual([first, last, leading, trailing])
  })
})

/** spec.md, "Scroll height is preserved by spacers, not by altering the container". */
describe('scroll height is preserved', () => {
  const cases = [
    ...[0, 480, 960, 9600].map((offset) => ({ ...GRID, offset })),
    ...[0, 240, 1200, 2280].map((offset) => ({ ...LIST, offset })),
  ]

  it.each(cases)('spacers plus rendered rows equal the full extent (offset $offset)', (input) => {
    const range = visibleRange(input)
    const renderedRows = Math.ceil((range.last - range.first + 1) / input.perRow)
    const extent = range.leading + renderedRows * input.itemHeight + range.trailing
    expect(extent).toBe(Math.ceil(input.total / input.perRow) * input.itemHeight)
  })
})

/** spec.md, "A sequence that changes length clamps the range without commanding the container". */
describe('a sequence that changes length', () => {
  it('clamps to the new length when a filter shortens it under a stale offset', () => {
    // Scrolled far down over 208 cards, then a filter leaves twelve.
    const range = visibleRange({ ...GRID, offset: 9600, total: 12 })
    expect(range.first).toBeLessThanOrEqual(11)
    expect(range.last).toBeLessThanOrEqual(11)
    expect(range.last).toBeGreaterThanOrEqual(range.first)
  })

  it('never names an index the sequence does not have', () => {
    for (const total of [1, 2, 3, 7, 12, 105, 207, 208, 225]) {
      for (const offset of [0, 100, 1000, 9600, 99999]) {
        const range = visibleRange({ ...GRID, offset, total })
        expect(range.first, `total=${total} offset=${offset}`).toBeGreaterThanOrEqual(0)
        expect(range.last, `total=${total} offset=${offset}`).toBeLessThan(total)
      }
    }
  })

  it('renders nothing for an empty sequence', () => {
    const range = visibleRange({ ...GRID, offset: 0, total: 0 })
    expect(range.last).toBeLessThan(range.first)
    expect(sliceForRange([], range)).toEqual([])
  })
})

/** spec.md, "The range updates on a change of first index, not on every scroll event". */
describe('the first index is stable within one row', () => {
  it('does not move while the offset stays inside the same row', () => {
    const base = visibleRange({ ...LIST, offset: 1200 }).first
    for (const offset of [1200, 1205, 1210, 1215, 1223]) {
      expect(visibleRange({ ...LIST, offset }).first).toBe(base)
    }
  })

  it('moves once the offset crosses into the next row', () => {
    expect(visibleRange({ ...LIST, offset: 1224 }).first).not.toBe(
      visibleRange({ ...LIST, offset: 1200 }).first,
    )
  })
})

describe('degenerate input', () => {
  it('renders nothing rather than dividing by zero', () => {
    expect(visibleRange({ ...GRID, offset: 0, itemHeight: 0 }).last).toBe(-1)
    expect(visibleRange({ ...GRID, offset: 0, perRow: 0 }).last).toBe(-1)
  })

  it('treats a negative offset as the top', () => {
    expect(tuple(visibleRange({ ...GRID, offset: -500 })))
      .toEqual(tuple(visibleRange({ ...GRID, offset: 0 })))
  })
})

describe('the rendered slice', () => {
  it('holds exactly the items the range names', () => {
    const items = Array.from({ length: 105 }, (_, i) => i)
    const range = visibleRange({ ...LIST, offset: 1200 })
    const slice = sliceForRange(items, range)
    expect(slice.length).toBe(range.last - range.first + 1)
    expect(slice[0]).toBe(range.first)
    expect(slice[slice.length - 1]).toBe(range.last)
  })
})
