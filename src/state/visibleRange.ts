/**
 * Derives which slice of a long sequence is worth having as elements.
 *
 * Why this exists: the platform charges roughly 1.3 ms per element created, independent of what
 * the element is — measured by elimination in design/HANDOFF.md §12.24, after network, image
 * cache, type glyphs, text shaping and main-thread touch bindings had each been ruled out. An
 * unfiltered grid holds about four thousand elements, and a hundred-and-five-move learnset about
 * nine hundred; both are paid in full before anything appears.
 *
 * The platform's scrolling container reports an absolute `scrollTop` (§12.25), so nothing here
 * accumulates deltas or needs correcting at the top.
 *
 * Everything is a pure function of numbers: no scroll container, no elements, no platform. That
 * is deliberate — the boundary arithmetic is where windowing goes wrong, and this way it can be
 * driven from a table in node rather than judged by eye on a device.
 */

export interface RangeInput {
  /** Absolute offset reported by the scrolling container. */
  readonly offset: number
  /** Height of the container's viewport. */
  readonly visible: number
  /** Height of one row. Rows are uniform; see the height invariant in the spec. */
  readonly itemHeight: number
  /** Items laid out side by side in one row. The grid uses two; the lists use one. */
  readonly perRow: number
  readonly total: number
  /** Buffer to keep beyond each edge, in screens. */
  readonly bufferScreens: number
}

export interface Range {
  /** First item index to render, inclusive. */
  readonly first: number
  /** Last item index to render, inclusive. -1 when there is nothing to render. */
  readonly last: number
  /** Height standing in for the rows before `first`. */
  readonly leading: number
  /** Height standing in for the rows after `last`. */
  readonly trailing: number
}

const EMPTY: Range = { first: 0, last: -1, leading: 0, trailing: 0 }

export function visibleRange(input: RangeInput): Range {
  const { offset, visible, itemHeight, perRow, total, bufferScreens } = input

  // A degenerate shape renders nothing rather than dividing by zero. Guarding here keeps every
  // caller from having to, and an empty sequence is a real state: a filter can produce one.
  if (total <= 0 || itemHeight <= 0 || perRow <= 0) return EMPTY

  const rowsTotal = Math.ceil(total / perRow)
  const bufferRows = Math.ceil((bufferScreens * visible) / itemHeight)

  // Clamped rather than trusted: the container can report an offset past its own content while
  // a rubber-band settles, and a filter can shorten the sequence under a stale offset.
  const safeOffset = Math.max(0, offset)

  const firstRow = Math.max(0, Math.floor(safeOffset / itemHeight) - bufferRows)
  const lastRow = Math.min(
    rowsTotal - 1,
    Math.floor((safeOffset + visible) / itemHeight) + bufferRows,
  )

  // A clamped-away range means the offset sat entirely beyond the content; render the last row
  // rather than nothing, so a shortened sequence still shows something while it settles.
  if (lastRow < firstRow) {
    const only = rowsTotal - 1
    return {
      first: only * perRow,
      last: total - 1,
      leading: only * itemHeight,
      trailing: 0,
    }
  }

  return {
    first: firstRow * perRow,
    last: Math.min(total - 1, (lastRow + 1) * perRow - 1),
    leading: firstRow * itemHeight,
    trailing: (rowsTotal - 1 - lastRow) * itemHeight,
  }
}

/** The rendered slice of a sequence, for a component to iterate. */
export function sliceForRange<T>(items: readonly T[], range: Range): readonly T[] {
  if (range.last < range.first) return []
  return items.slice(range.first, range.last + 1)
}
