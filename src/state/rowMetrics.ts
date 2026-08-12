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
 * The move index's row, 496 of them — the longest fixed sequence in the application.
 *
 * Unlike the three above, this figure is a *reservation* rather than a device reading: the row
 * is new, so there was nothing to measure. `.MoveIndexRow` declares the same number as its
 * `min-height`, and this platform counts padding inside a declared height (the box model note
 * on `.TypeCell`), so the drawn pitch is this number as long as the content fits inside it —
 * which 12px text in a 34px row does with room to spare.
 *
 * That makes the row-height check a weaker guarantee here than for the other three: it asserts
 * the constant and the stylesheet agree, not that either matches what the device draws. Scrolling
 * the whole index on a device is what would catch it, and is listed as an acceptance step for
 * that reason.
 *
 * Taller than the learnset table's 24px because this row is a primary navigation target on a
 * full-width surface rather than a line in a table inside a panel.
 */
export const MOVE_INDEX_ROW: RowMetric = { height: 34, perRow: 1 }

/**
 * The height the move index's scrolling container gets, for deriving its visible range.
 *
 * The screen area less the masthead and the tab deck, at the 393pt viewport the other figures
 * are calibrated at. Deliberately generous: overstating it renders more rows than are visible,
 * which costs elements, while understating it lets the scroll outrun the window and blank an
 * edge. Only the second failure is silent.
 *
 * **Not reduced for the filter row**, and that is a decision rather than an omission. The filter
 * row makes the container shorter, so this figure becomes a larger overstatement and the failure
 * it can produce stays the non-silent one — roughly four extra rows at this pitch and buffer,
 * about 5ms of element cost. Reducing it would take a device reading: every other figure in this
 * file is measured, and a hand-computed replacement would carry no relation to what the platform
 * draws. Scrolling the whole index on a device is what would catch this having gone stale, and it
 * is an acceptance step for that reason.
 */
export const MOVE_INDEX_VIEWPORT = 640

/**
 * How far beyond each edge to keep rendered, in screens.
 *
 * Not chosen: §12.25 measured the container travelling at most 118.67px between two consecutive
 * scroll reports, and a buffer smaller than that travel is one the scroll can outrun, which shows
 * as a blank edge. Half a screen clears that by a wide margin at every size this draws at, while
 * keeping the first paint near the ten visible cards the grid is aiming for.
 */
export const BUFFER_SCREENS = 0.5
