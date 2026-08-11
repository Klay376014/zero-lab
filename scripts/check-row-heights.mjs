/**
 * Asserts the row pitches the windowing derives from still match what the stylesheet reserves.
 *
 * Why this is worth automating: the windowed sequences work out which rows to draw from one
 * scroll offset and one row height. Change a padding, a font size or a border and the drawn row
 * grows past its reservation — the window then drifts away from the offset, blanking rows at one
 * edge and stacking them at the other. Nothing raises, nothing looks broken in review, and the
 * numbers live in two files that have no reason to be opened together.
 *
 * The figures themselves are device measurements, not derivations: the stylesheet declares no
 * height for any of these rows and no line height for the text inside them, so they cannot be
 * computed from source. See design/HANDOFF.md §12.26 for the readings and the method.
 *
 *   node scripts/check-row-heights.mjs
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const METRICS = join(ROOT, 'src/state/rowMetrics.ts')
const SHEET = join(ROOT, 'src/App.css')

/** Which constant reserves which rule. The pairing is the thing being asserted. */
const PAIRS = [
  { constant: 'CARD_ROW', selector: '.DexCell', what: 'grid card' },
  { constant: 'MOVE_ROW', selector: '.MoveRow', what: 'learnset row' },
  { constant: 'LEARNER_ROW', selector: '.LearnersRow', what: 'learner row' },
  { constant: 'MOVE_INDEX_ROW', selector: '.MoveIndexRow', what: 'move index row' },
]

const metricsSrc = readFileSync(METRICS, 'utf8')
const sheetSrc = readFileSync(SHEET, 'utf8')

/** `export const NAME: RowMetric = { height: 201, perRow: 2 }` */
function declaredHeight(constant) {
  const match = metricsSrc.match(
    new RegExp(`export const ${constant}\\s*:\\s*RowMetric\\s*=\\s*\\{[^}]*height:\\s*([\\d.]+)`),
  )
  return match ? Number(match[1]) : null
}

/** The `min-height` inside one rule block, which is where the reservation lives. */
function reservedHeight(selector) {
  const escaped = selector.replace('.', '\\.')
  const block = sheetSrc.match(new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, 'm'))
  if (!block) return null
  const declaration = block[1].match(/min-height:\s*([\d.]+)px/)
  return declaration ? Number(declaration[1]) : null
}

const failures = []

for (const pair of PAIRS) {
  const constant = declaredHeight(pair.constant)
  const reserved = reservedHeight(pair.selector)

  if (constant === null) {
    failures.push(`${pair.what}: could not read ${pair.constant}.height from src/state/rowMetrics.ts`)
    continue
  }
  if (reserved === null) {
    failures.push(
      `${pair.what}: ${pair.selector} declares no min-height in src/App.css. `
      + `The window derives its rows from ${pair.constant}.height (${constant}px); without the `
      + 'reservation the drawn row is free to disagree with it.',
    )
    continue
  }
  if (constant !== reserved) {
    failures.push(
      `${pair.what}: ${pair.constant}.height is ${constant} but ${pair.selector} reserves `
      + `${reserved}px. Re-measure on a device (design/HANDOFF.md §12.26) and move both, or the `
      + 'window drifts away from the scroll offset.',
    )
  }
}

const name = 'row pitches match the stylesheet reservations'
if (failures.length === 0) {
  console.log(`ok    ${name}`)
  for (const pair of PAIRS) {
    console.log(`      ${pair.selector.padEnd(14)} ${declaredHeight(pair.constant)}px`)
  }
} else {
  console.log(`FAIL  ${name}`)
  for (const failure of failures) console.log(`      ${failure}`)
}

console.log(`\n${PAIRS.length} row pitch(es), ${failures.length} violation(s)`)
process.exit(failures.length === 0 ? 0 : 1)
