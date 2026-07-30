import { GLYPH_FILLED } from '../data/types.js'
import type { GlyphRows } from '../data/types.js'

/** `rows` painted in `fill`, as an SVG document with an 8x8 view box. One rect per filled run. */
export function buildGlyphSvg(rows: GlyphRows, fill: string): string {
  const rects: string[] = []
  rows.forEach((row, y) => {
    let runStart = -1
    // One past the end so a run reaching the last cell still gets closed.
    for (let x = 0; x <= row.length; x += 1) {
      const filled = row[x] === GLYPH_FILLED
      if (filled && runStart < 0) runStart = x
      if (!filled && runStart >= 0) {
        rects.push(`<rect x="${runStart}" y="${y}" width="${x - runStart}" height="1"/>`)
        runStart = -1
      }
    }
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" fill="${fill}">${rects.join('')}</svg>`
}
