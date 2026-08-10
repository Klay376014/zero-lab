/**
 * How tall one row of each windowed sequence is, and how many items share a row.
 *
 * These are measured, not derived: the stylesheet declares no height for any of the three, and
 * text line heights are not declared either, so summing the rules would produce a number with no
 * relation to what the platform draws. Each figure is `scrollHeight` over the row count, taken on
 * a physical device — see design/HANDOFF.md §12.26 for the readings and the method.
 *
 * The range derivation needs a row pitch, and a pitch that disagrees with what is drawn makes the
 * window drift away from the scroll offset: rows go blank at one edge and pile up at the other,
 * with nothing raised. `scripts/check-row-heights.mjs` asserts each figure still matches the
 * stylesheet's reservation, so the two cannot part company unnoticed.
 *
 * The figures are calibrated at a 393pt viewport. Cards are half the row, so a different width
 * draws a different card height; that is a known limit of pinning a measured value rather than an
 * oversight, and the acceptance criterion — scrolling a whole sequence without a blank — is what
 * catches it having gone stale.
 */

export interface RowMetric {
  /** Row pitch in pixels, including borders and the gap to the next row. */
  readonly height: number
  /** Items laid out side by side within one row. */
  readonly perRow: number
}

/** 208 cards over 104 rows, measured in a container with no padding of its own. */
export const CARD_ROW: RowMetric = { height: 201, perRow: 2 }

/** 2520 over 105 rows. An exact integer, which is itself evidence the reading was clean. */
export const MOVE_ROW: RowMetric = { height: 24, perRow: 1 }

/**
 * 5599.33 over 104 rows.
 *
 * `perRow` is one, not two, even though a row shows two species: the learner list pairs its
 * species into rows before rendering, so the sequence being windowed is already rows. The grid is
 * the opposite — it hands over a flat list and lets the row wrap — which is why it declares two.
 */
export const LEARNER_ROW: RowMetric = { height: 53.84, perRow: 1 }

/**
 * How far beyond each edge to keep rendered, in screens.
 *
 * Not chosen: §12.25 measured the container travelling at most 118.67px between two consecutive
 * scroll reports, and a buffer smaller than that travel is one the scroll can outrun, which shows
 * as a blank edge. Half a screen clears that by a wide margin at every size this draws at, while
 * keeping the first paint near the ten visible cards the grid is aiming for.
 */
export const BUFFER_SCREENS = 0.5
