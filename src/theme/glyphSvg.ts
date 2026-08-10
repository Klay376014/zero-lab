import { GLYPH_FILLED } from '../data/types.js'
import type { GlyphRows } from '../data/types.js'

export function buildGlyphSvg(rows: GlyphRows, fill: string): string {
  const rects: string[] = []
  rows.forEach((row, y) => {
    let runStart = -1
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
