/**
 * Asserts style invariants that fail silently if broken.
 *
 * Exits non-zero on violation, in the same spirit as the dataset pipeline's stage assertions:
 * the failures worth automating are the ones that do not announce themselves. A wrong colour
 * is visible; a selected control that looks exactly like an unselected one is not.
 *
 *   node scripts/check-styles.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(ROOT, 'src')

/** Every stylesheet the app ships: the sheet plus any single-file component `<style>` block. */
function styleSources() {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) {
        walk(path)
        continue
      }
      if (entry.endsWith('.css')) {
        out.push({ path, css: readFileSync(path, 'utf8') })
        continue
      }
      if (entry.endsWith('.vue')) {
        const block = readFileSync(path, 'utf8').match(/<style[^>]*>([\s\S]*?)<\/style>/)
        if (block) out.push({ path, css: block[1] })
      }
    }
  }
  walk(SRC)
  return out
}

/**
 * Collects each class rule's first line and the properties it declares.
 *
 * Deliberately a small line-based reader rather than a CSS parser: adding a parser dependency
 * to check one ordering rule would cost more than the rule protects. It only has to
 * understand the shape this project writes — one selector per rule, one property per line.
 */
function readRules(css) {
  const rules = new Map()
  let current = null
  css.split('\n').forEach((line, i) => {
    const open = line.match(/^\.([A-Za-z0-9]+)\s*\{/)
    if (open) {
      current = open[1]
      if (!rules.has(current)) rules.set(current, { line: i + 1, props: new Set() })
      return
    }
    if (line.trimEnd() === '}') {
      current = null
      return
    }
    if (current) {
      const prop = line.match(/^\s+([a-z-]+)\s*:/)
      if (prop) rules.get(current).props.add(prop[1])
    }
  })
  return rules
}

/**
 * A `.XOn` selected-state rule must appear after the `.X` rule it overrides.
 *
 * Both are single-class selectors, so they carry equal weight and source order decides. A
 * selected rule placed above its base is cancelled by it on every property they share, and
 * the control then renders identically whether or not it is selected — no error, no warning,
 * nothing to notice except that the interface stopped answering. This file exists because
 * that happened to the generation and sort chips.
 */
function checkSelectedStateOrder({ path, css }) {
  const rules = readRules(css)
  const failures = []
  for (const [name, on] of rules) {
    if (!name.endsWith('On')) continue
    const base = rules.get(name.slice(0, -2))
    if (!base) continue
    if (on.line > base.line) continue
    const shared = [...on.props].filter((p) => base.props.has(p))
    if (shared.length === 0) continue
    failures.push(
      `${relative(ROOT, path)}: .${name} (line ${on.line}) sits above `
      + `.${name.slice(0, -2)} (line ${base.line}), which cancels it on `
      + `${shared.join(', ')} — the selected state will not be visible. `
      + 'Move the selected rule below its base.',
    )
  }
  return failures
}

/**
 * No rule may declare an inset box shadow.
 *
 * The platform ignores such a declaration outright — it does not fall back, warn, or fail to
 * build. What is left is a surface missing a hairline frame, which is close to invisible in a
 * screenshot, and the larger fact that a design-document rule was copied rather than ported.
 * Every surface that the design document drew with an inset shadow is a bordered view here.
 *
 * Matches the declaration only. The word appears in this project's prose too — the comments
 * explaining why the bevel is two views — and a check that failed on those would teach people
 * to stop writing the explanation.
 */
function checkNoInsetShadow({ path, css }) {
  const failures = []
  css.split('\n').forEach((line, i) => {
    const declaration = line.match(/^\s*box-shadow\s*:\s*(.+?);?\s*$/)
    if (!declaration) return
    if (!/\binset\b/.test(declaration[1])) return
    failures.push(
      `${relative(ROOT, path)}:${i + 1}: box-shadow declares inset, which the platform `
      + 'silently ignores — the surface will simply have no frame. Draw it with a bordered '
      + 'view instead, as the card bevel does.',
    )
  })
  return failures
}

const PROSE_FACE = join(SRC, 'assets/fonts/Literata-Prose.ttf')
const DEX = join(SRC, 'data/dex.json')
const STRINGS = join(SRC, 'data/i18n.ts')

/**
 * The characters the prose face has to be able to draw.
 *
 * Derived rather than listed: a hand-written list of expected characters drifts from the data it
 * is meant to describe, and the drift is invisible until something renders a box.
 *
 * From the dataset, the text that is actually set as prose — ability descriptions and roster
 * notes. From the string table, every literal, deliberately more than prose needs: the extra
 * characters are Latin ones the face already covers, and being broad here means a string that
 * later moves into a prose role is already accounted for.
 *
 * CJK is excluded. The prose face carries none, and Chinese falls through the declared stack to
 * a system serif by design — asking the face to cover it would fail on correct behaviour. So are
 * the few marks no embedded face carries; see the two predicates below.
 */
function proseCorpus() {
  const text = []
  const dex = JSON.parse(readFileSync(DEX, 'utf8'))
  for (const ability of dex.abilities) text.push(ability.de, ability.d)
  for (const species of dex.species) text.push(species.n)
  // Move descriptions joined the corpus when move detail began setting them as prose. Without
  // them the check would report ok while an English description drew a missing-glyph box — the
  // corpus is only as wide as the text someone remembered to add.
  for (const move of dex.moves) text.push(move.de, move.d)
  // Every literal in the string table — single quoted, double quoted, or a template literal.
  //
  // Template literals are matched deliberately. They were missed until a footer string was
  // written with backticks and the whole segment left the corpus while this check went on
  // reporting ok: a gap that reads exactly like coverage. They differ from the other two in
  // two ways, so they get their own pattern: they may span newlines, and they may carry
  // `${...}` interpolations, which are code rather than text the face has to draw.
  //
  // Escapes are left as written in all three, and a literal carrying a backslash is skipped:
  // an escape sequence contributes no character the face has to draw.
  const source = readFileSync(STRINGS, 'utf8')
  const literals = /'([^'\\\n]*)'|"([^"\\\n]*)"|`([^`\\]*)`/g
  for (const [, single, double, template] of source.matchAll(literals)) {
    if (template !== undefined) text.push(template.replaceAll(/\$\{[^}]*\}/g, ''))
    else text.push(single ?? double)
  }

  const chars = new Set()
  for (const value of text) {
    if (!value) continue
    for (const char of value) {
      const code = char.codePointAt(0)
      if (code < 0x20) continue // control characters are not drawn
      if (isEastAsian(code)) continue
      if (isUncoveredMark(code)) continue
      chars.add(char)
    }
  }
  return chars
}

/**
 * Whether a code point belongs to the East Asian text the prose face is not responsible for.
 *
 * Unified ideographs, the extension A block, CJK symbols and punctuation, and the halfwidth and
 * fullwidth forms. All of these fall through the declared stack to a system serif, which is the
 * design document's own behaviour rather than a gap.
 */
function isEastAsian(code) {
  return (code >= 0x3000 && code <= 0x303f)
    || (code >= 0x3400 && code <= 0x4dbf)
    || (code >= 0x4e00 && code <= 0x9fff)
    || (code >= 0xff00 && code <= 0xffef)
}

/**
 * Marks no embedded face carries, and none is expected to.
 *
 * Both sit in General Punctuation or Miscellaneous Symbols rather than a CJK block, so the range
 * check above misses them, and neither is present in upstream Literata or upstream Silkscreen —
 * so no widening of the subset range could ever cover them. Both fall through to a system font,
 * which the platform does per character rather than per run, so a mark in the middle of a
 * Latin or Chinese string still draws.
 *
 * The reference mark appears only in the Chinese warnings (the English ones open with "NB") and
 * falls through with the Chinese it prefixes. The star is a control label and a row marker drawn
 * in the pixel stack, never in prose — the corpus only sees it because it collects every string
 * literal, which is deliberately broader than prose.
 *
 * Kept as an explicit list rather than folded into the range check: an entry here is a claim
 * about one character with a reason, and a range check cannot carry a reason.
 */
function isUncoveredMark(code) {
  return code === 0x203b // ※ REFERENCE MARK — prefixes the Chinese warnings
    || code === 0x2605 // ★ BLACK STAR — Mega badge, bonus row marker, bonus filter label
    // ♀ / ♂ reached the corpus with the move descriptions. One move carries them: Attract, whose
    // Chinese description reads ♂誘惑♀而♀誘惑♂ — so they sit inside CJK text that is already
    // falling through to the system serif, and they fall through the same way, per character.
    // Measured on the upstream variable font before adding them here: Literata carries neither,
    // along with neither of the two above, so no widening of the subset range could cover them.
    || code === 0x2640 // ♀ FEMALE SIGN — in Attract's Chinese description
    || code === 0x2642 // ♂ MALE SIGN — likewise
}

/**
 * The code points a TrueType font can draw, read from its character map.
 *
 * Parsed here rather than with a font library, for the same reason this file reads CSS with a
 * line reader rather than a parser: one invariant does not justify a dependency. Only the two
 * subtable formats the project's own subsetting step emits are understood — anything else throws
 * rather than returning a partial set, because a partial set would pass the check by accident.
 */
function tableOffsets(font) {
  const tableCount = font.getUint16(4)
  const offsets = {}
  for (let i = 0; i < tableCount; i += 1) {
    const record = 12 + i * 16
    const tag = String.fromCharCode(...[0, 1, 2, 3].map((b) => font.getUint8(record + b)))
    offsets[tag] = font.getUint32(record + 8)
  }
  return offsets
}

function fontCodePoints(path) {
  const font = new DataView(readFileSync(path).buffer.slice(0))
  const cmapOffset = tableOffsets(font).cmap ?? null
  if (cmapOffset === null) throw new Error(`${path} has no cmap table`)

  // Prefer a full-repertoire subtable over a basic-plane one; either is enough for Latin.
  const encodingCount = font.getUint16(cmapOffset + 2)
  let best = null
  for (let i = 0; i < encodingCount; i += 1) {
    const record = cmapOffset + 4 + i * 8
    const platform = font.getUint16(record)
    const encoding = font.getUint16(record + 2)
    const subtable = cmapOffset + font.getUint32(record + 4)
    const unicode = (platform === 3 && (encoding === 1 || encoding === 10)) || platform === 0
    if (!unicode) continue
    const format = font.getUint16(subtable)
    if (best === null || format === 12) best = { subtable, format }
  }
  if (best === null) throw new Error(`${path} has no Unicode cmap subtable`)

  const points = new Set()
  if (best.format === 4) {
    const segCount = font.getUint16(best.subtable + 6) / 2
    const ends = best.subtable + 14
    const starts = ends + segCount * 2 + 2
    for (let s = 0; s < segCount; s += 1) {
      const start = font.getUint16(starts + s * 2)
      const end = font.getUint16(ends + s * 2)
      if (start === 0xffff) continue
      for (let code = start; code <= end; code += 1) points.add(code)
    }
  } else if (best.format === 12) {
    const groupCount = font.getUint32(best.subtable + 12)
    for (let g = 0; g < groupCount; g += 1) {
      const group = best.subtable + 16 + g * 12
      const start = font.getUint32(group)
      const end = font.getUint32(group + 4)
      for (let code = start; code <= end; code += 1) points.add(code)
    }
  } else {
    throw new Error(`${path} uses cmap subtable format ${best.format}, which this check cannot read`)
  }
  return points
}

/**
 * Every character of the prose corpus must exist in the prose face.
 *
 * The face is subset to a declared range, so a character outside that range is not a build error
 * or a warning — it is a box on screen, with a clean console and a successful build. That is the
 * class of failure this file exists for.
 */
function checkProseCoverage() {
  let points
  try {
    points = fontCodePoints(PROSE_FACE)
  } catch (error) {
    const missing = error.code === 'ENOENT'
    return [
      `${relative(ROOT, PROSE_FACE)}: ${missing ? 'not found' : error.message}. `
      + 'Run design/pipeline/fetch_fonts.sh to derive it.',
    ]
  }

  const missing = [...proseCorpus()].filter((char) => !points.has(char.codePointAt(0))).sort()
  if (missing.length === 0) return []
  const shown = missing
    .map((char) => `${char} (U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})`)
    .join(', ')
  return [
    `${relative(ROOT, PROSE_FACE)}: the prose corpus needs ${missing.length} character(s) the `
    + `face does not carry — ${shown}. These render as missing-glyph boxes with no error. `
    + 'Widen the subset range in design/pipeline/fetch_fonts.sh and re-run it.',
  ]
}

const PIXEL_FACE = join(SRC, 'assets/fonts/Silkscreen-Bold.ttf')
const MODES = join(SRC, 'theme/modes.ts')
const SHEET = join(SRC, 'App.css')

/**
 * How wide a string is drawn, from the face's own advance widths.
 *
 * A second walk of the character map rather than a reuse of `fontCodePoints`: that one answers
 * which code points exist, this one needs the glyph each maps to so it can look up an advance.
 * Deriving one from the other would mean filtering out the code points that map to no glyph,
 * which would change what the prose check measures.
 *
 * Reading the face is the whole point. The same question asked of the web preview gets a
 * confident wrong answer, because the pixel face does not load there and Latin text is drawn in
 * a system font — see the top of design/HANDOFF.md §12.
 */
function textWidth(path, text, sizePx, letterSpacingPx) {
  const font = new DataView(readFileSync(path).buffer.slice(0))
  const t = tableOffsets(font)
  for (const required of ['head', 'hhea', 'hmtx', 'cmap']) {
    if (t[required] === undefined) throw new Error(`${path} has no ${required} table`)
  }
  const unitsPerEm = font.getUint16(t.head + 18)
  const metricCount = font.getUint16(t.hhea + 34)

  const encodingCount = font.getUint16(t.cmap + 2)
  let best = null
  for (let i = 0; i < encodingCount; i += 1) {
    const record = t.cmap + 4 + i * 8
    const platform = font.getUint16(record)
    const encoding = font.getUint16(record + 2)
    const subtable = t.cmap + font.getUint32(record + 4)
    if (!((platform === 3 && (encoding === 1 || encoding === 10)) || platform === 0)) continue
    const format = font.getUint16(subtable)
    if (best === null || format === 12) best = { subtable, format }
  }
  if (best === null) throw new Error(`${path} has no Unicode cmap subtable`)
  if (best.format !== 4 && best.format !== 12) {
    throw new Error(`${path} uses cmap subtable format ${best.format}, which this check cannot read`)
  }

  const glyphOf = (code) => {
    if (best.format === 12) {
      const groupCount = font.getUint32(best.subtable + 12)
      for (let g = 0; g < groupCount; g += 1) {
        const group = best.subtable + 16 + g * 12
        const start = font.getUint32(group)
        const end = font.getUint32(group + 4)
        if (code >= start && code <= end) return font.getUint32(group + 8) + (code - start)
      }
      return 0
    }
    const segCount = font.getUint16(best.subtable + 6) / 2
    const ends = best.subtable + 14
    const starts = ends + segCount * 2 + 2
    const deltas = starts + segCount * 2
    const rangeOffsets = deltas + segCount * 2
    for (let s = 0; s < segCount; s += 1) {
      const start = font.getUint16(starts + s * 2)
      const end = font.getUint16(ends + s * 2)
      if (code < start || code > end) continue
      const rangeOffset = font.getUint16(rangeOffsets + s * 2)
      if (rangeOffset === 0) return (code + font.getInt16(deltas + s * 2)) & 0xffff
      const glyph = font.getUint16(rangeOffsets + s * 2 + rangeOffset + (code - start) * 2)
      return glyph === 0 ? 0 : (glyph + font.getInt16(deltas + s * 2)) & 0xffff
    }
    return 0
  }

  let units = 0
  for (const char of text) {
    const glyph = glyphOf(char.codePointAt(0))
    if (glyph === 0) throw new Error(`${path} cannot draw ${JSON.stringify(char)}`)
    // The last entry of `hmtx` repeats for every glyph beyond it — monospaced tails are stored once.
    units += font.getUint16(t.hmtx + Math.min(glyph, metricCount - 1) * 4)
  }
  return (units / unitsPerEm) * sizePx + letterSpacingPx * [...text].length
}

/** One rule's declared values, so the check asserts against the stylesheet rather than a copy. */
function declaredValues(css, selector) {
  const block = css.match(new RegExp(`^\\.${selector}\\s*\\{([^}]*)\\}`, 'm'))
  if (block === null) return null
  const values = new Map()
  for (const line of block[1].split('\n')) {
    const declaration = line.match(/^\s*([a-z-]+)\s*:\s*(.+?);/)
    if (declaration) values.set(declaration[1], declaration[2].trim())
  }
  return values
}

/** The left-or-right component of a padding shorthand, which is the second value when there is one. */
function sidePadding(shorthand) {
  const parts = (shorthand ?? '0').trim().split(/\s+/).map((p) => Number.parseFloat(p) || 0)
  return parts.length === 1 ? parts[0] : parts[1]
}

/**
 * The theme menu's declared width must hold the longest mode name on one line.
 *
 * This is here because of how the failure looks. The menu hangs beneath a trigger carrying the
 * *active* mode's name, and an absolutely positioned box is capped at its containing block — so a
 * menu without a width of its own is as wide as whichever name is in force, and its longest row
 * wraps in every mode except the one that names it. That reached a device once already.
 *
 * The reason it is worth a check rather than a careful number is the promise it protects:
 * `theme-menu` says adding a mode adds a row and nothing else. A fourth mode with a longer name
 * would break that silently — a wrapped row raises nothing and builds fine. This turns it into a
 * failure here, before anyone opens the menu.
 *
 * Every figure is read back out of the stylesheet, so the check cannot drift from the rules it is
 * about. The width is treated as covering padding and border — the stricter box model, which is
 * the safe assumption while the platform has not been asked which one it uses.
 */
function checkThemeMenuWidth() {
  const css = readFileSync(SHEET, 'utf8')
  const menu = declaredValues(css, 'ThemeMenu')
  const row = declaredValues(css, 'ThemeMenuRow')
  const text = declaredValues(css, 'ThemeMenuText')
  if (menu === null || row === null || text === null) {
    return [`${relative(ROOT, SHEET)}: expected .ThemeMenu, .ThemeMenuRow and .ThemeMenuText rules`]
  }

  const declared = Number.parseFloat(menu.get('width') ?? '')
  if (!Number.isFinite(declared)) {
    return [
      `${relative(ROOT, SHEET)}: .ThemeMenu declares no width. Without one the menu is capped at `
      + 'its trigger, and the longest mode name wraps in every mode but its own.',
    ]
  }

  const chrome = 2 * sidePadding(menu.get('padding'))
    + 2 * (Number.parseFloat(menu.get('border-width') ?? '0') || 0)
    + 2 * sidePadding(row.get('padding'))
  const size = Number.parseFloat(text.get('font-size') ?? '')
  const letterSpacing = Number.parseFloat(text.get('letter-spacing') ?? '0') || 0

  const modes = [...readFileSync(MODES, 'utf8').matchAll(/\bid:\s*'([^']+)'/g)].map((m) => m[1])
  if (modes.length === 0) return [`${relative(ROOT, MODES)}: found no mode ids to measure`]

  const failures = []
  for (const mode of modes) {
    const needed = textWidth(PIXEL_FACE, mode, size, letterSpacing) + chrome
    if (needed <= declared) continue
    failures.push(
      `${relative(ROOT, SHEET)}: .ThemeMenu is ${declared}px wide but the ${mode} row needs `
      + `${needed.toFixed(2)}px — the name wraps onto a second line, with no error anywhere. `
      + `Widen .ThemeMenu to at least ${Math.ceil(needed)}px.`,
    )
  }
  return failures
}

const CHECKS = [
  { name: 'selected-state rules follow the rules they override', run: checkSelectedStateOrder },
  { name: 'no inset box shadows', run: checkNoInsetShadow },
  // Asks about one asset and one corpus, not about each stylesheet in turn.
  { name: 'prose face covers the prose corpus', run: checkProseCoverage, once: true },
  // Asks about one rule against one mode set, likewise.
  { name: 'the theme menu holds its longest mode name', run: checkThemeMenuWidth, once: true },
]

const sources = styleSources()
let failed = 0

for (const check of CHECKS) {
  const failures = check.once ? check.run() : sources.flatMap((source) => check.run(source))
  if (failures.length === 0) {
    console.log(`ok    ${check.name}`)
    continue
  }
  failed += failures.length
  console.log(`FAIL  ${check.name}`)
  for (const failure of failures) console.log(`      ${failure}`)
}

console.log(
  `\n${sources.length} stylesheet(s), ${CHECKS.length} check(s), ${failed} violation(s)`,
)
process.exit(failed === 0 ? 0 : 1)
