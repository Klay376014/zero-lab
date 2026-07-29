/**
 * WCAG relative luminance and contrast, used to pick ink against an arbitrary background.
 *
 * Ported unchanged from the design document. The comparison is deliberately between two
 * measured contrast ratios rather than a luminance cut-off: a mid-tone like Rock's
 * #AFA981 sits right at the crossover, and a fixed threshold hands it white — the worse
 * of the two by a factor of more than three.
 */

/** The two ink candidates. Nothing else is ever used as ink over an unknown surface. */
export const INK_DARK = '#101010'
export const INK_LIGHT = '#ffffff'

function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

/** WCAG relative luminance of a `#rrggbb` colour. */
export function relLum(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two `#rrggbb` colours. Order does not matter. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** Whichever ink candidate measures higher contrast against `bgHex`. */
export function inkOn(bgHex: string): string {
  return contrast(INK_DARK, bgHex) >= contrast(INK_LIGHT, bgHex) ? INK_DARK : INK_LIGHT
}
