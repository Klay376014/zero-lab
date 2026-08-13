/**
 * Asserts every type glyph stays visible on every surface it is drawn onto.
 *
 * A glyph is an SVG shape with its fill written into the string, so it inherits nothing and has
 * to be filled against the surface beneath it. Get that pairing wrong and the mark does not
 * render wrong — it renders as nothing at all, on a clean console and a successful build. The
 * same class of silent failure the style checks exist for.
 *
 * The palette is read out of the theme source rather than restated here. A second copy of
 * eighteen colours would drift, and a check reading a stale copy is worse than no check.
 *
 *   node scripts/check-contrast.mjs
 */
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const TYPES = join(ROOT, 'src/data/types.ts')
const MODES = join(ROOT, 'src/theme/modes.ts')
const CONTRAST = join(ROOT, 'src/theme/contrast.ts')

/**
 * The floor recorded in the retro-theme spec.
 *
 * Not a WCAG threshold: MODERN spends the type's own colour on toned surfaces, and four of the
 * eighteen are dark enough that no arrangement clears 3.0 without giving up the type colours
 * that are the mode's whole point. The floor is what the arrangement actually measures, so that
 * a change which lowers it has to change this number and say why.
 */
const FLOOR = 2.5

/**
 * Counts the parse must hit. A regex that silently matches less would check nothing.
 *
 * `modes` is here because this check once read the theme with a non-global match for a single
 * `tokens` block and a hand-written list of two modes. A third mode then measured nothing at all
 * while the check still printed ok — the failure this file exists to prevent, in the file itself.
 * Every mode is parsed now, and the count is asserted so a fourth cannot slip through either.
 */
const EXPECTED = { typeColours: 18, modes: 3, tones: 4, tokensPerMode: 10 }

/** Every surface name the glyph fill selection accepts, as this check understands them. */
const KNOWN_SURFACES = ['surface', 'panel', 'surface2', 'accent', 'typechip']

function fail(message) {
  console.log('FAIL  every glyph is visible on every surface it is drawn onto')
  console.log(`      ${message}`)
  process.exit(1)
}

const typesSrc = readFileSync(TYPES, 'utf8')
const modesSrc = readFileSync(MODES, 'utf8')
const contrastSrc = readFileSync(CONTRAST, 'utf8')

function hexTable(source, label) {
  const out = {}
  for (const [, key, hex] of source.matchAll(/(\w+):\s*'(#[0-9A-Fa-f]{6})'/g)) out[key] = hex
  if (Object.keys(out).length === 0) fail(`${label}: found no colour literals; the source shape changed`)
  return out
}

const typeColours = hexTable(typesSrc.match(/TYPE_COLORS[^}]+}/s)?.[0] ?? '', 'TYPE_COLORS')

/**
 * Every mode the theme declares, read from the MODES array rather than restated here.
 *
 * Split on the `id` field, so each chunk is one mode's declaration whatever order its other fields
 * appear in. A mode either carries a four-tone ramp or its ten tokens outright, and the two flags
 * that change how a glyph is painted are read from the same chunk.
 */
const modesBody = modesSrc.match(/export const MODES[^=]*=\s*\[([\s\S]*?)\n]/)?.[1] ?? ''
if (!modesBody) fail('could not read the MODES declaration; the source shape changed')

const parsedModes = modesBody.split(/(?=id: ')/).slice(1).map((chunk) => {
  const id = chunk.match(/id: '(\w+)'/)?.[1] ?? '?'
  const ramp = [...(chunk.match(/tones:\s*\[([^\]]+)\]/)?.[1] ?? '').matchAll(/'(#[0-9A-Fa-f]{6})'/g)]
    .map((m) => m[1])
  const declared = chunk.match(/tokens:\s*\{[^}]+}/s)?.[0]
  return {
    id,
    tones: ramp.length ? ramp : null,
    tokens: declared ? hexTable(declared, `${id} tokens`) : null,
    typeColor: /typeColor:\s*true/.test(chunk),
    plateGlyphs: /plateGlyphs:\s*true/.test(chunk),
  }
})

if (parsedModes.some((mode) => !mode.tones && !mode.tokens)) {
  fail(`a mode declares neither tones nor tokens: [${parsedModes.map((m) => m.id).join(', ')}]`)
}

const found = {
  typeColours: Object.keys(typeColours).length,
  modes: parsedModes.length,
  tones: parsedModes.find((mode) => mode.tones)?.tones.length ?? 0,
  tokensPerMode: Math.min(
    ...parsedModes.map((mode) => Object.keys(mode.tokens ?? {}).length || EXPECTED.tokensPerMode),
  ),
}
for (const [what, want] of Object.entries(EXPECTED)) {
  if (found[what] !== want) {
    fail(
      `parsed ${found[what]} ${what} from the theme source but expected ${want}. `
      + 'Either the palette changed — update EXPECTED and the retro-theme spec table together — '
      + 'or the declaration was reshaped and this check is now reading it wrong.',
    )
  }
}

/**
 * The surfaces declared in the theme, so a new one cannot be added without this check noticing.
 *
 * Silently skipping an unknown surface is the failure mode worth guarding: the check would keep
 * printing ok while the newest surface — the one most likely to be wrong — went unmeasured.
 */
const declared = (modesSrc.match(/export type GlyphSurface =([^\n]+)/)?.[1] ?? '')
  .split('|').map((part) => part.trim().replace(/'/g, '')).filter(Boolean)
const unknown = declared.filter((name) => !KNOWN_SURFACES.includes(name))
const stale = KNOWN_SURFACES.filter((name) => !declared.includes(name))
if (unknown.length || stale.length) {
  fail(
    `the theme declares [${declared.join(', ')}] but this check knows [${KNOWN_SURFACES.join(', ')}]`
    + `${unknown.length ? `; unmeasured: ${unknown.join(', ')}` : ''}`
    + `${stale.length ? `; no longer declared: ${stale.join(', ')}` : ''}. `
    + 'Add the surface here and to the retro-theme spec table, or drop it from both.',
  )
}

// The relative-luminance and contrast formulas, kept in step with src/theme/contrast.ts by the
// assertions below rather than by hope: this script cannot import TypeScript.
const INK_DARK = contrastSrc.match(/INK_DARK = '(#[0-9a-fA-F]{6})'/)?.[1]
const INK_LIGHT = contrastSrc.match(/INK_LIGHT = '(#[0-9a-fA-F]{6})'/)?.[1]
if (!INK_DARK || !INK_LIGHT) fail('could not read the two ink candidates from the contrast module')

function relLum(hex) {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(a, b) {
  const [x, y] = [relLum(a), relLum(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const inkOn = (bg) => (contrast(INK_DARK, bg) >= contrast(INK_LIGHT, bg) ? INK_DARK : INK_LIGHT)

/** tokensOf(): a ramp mode derives its ten tokens from four tones, the others declare them. */
function tokensOf(mode) {
  if (mode.tokens) return mode.tokens
  const [t0, t1, t2, t3] = mode.tones
  return {
    bg: t0, shell: t1, panel: t3, surface: t3, surface2: t2,
    ink: t0, ink2: t1, line: t0, accent: t0, accentInk: t3,
  }
}

const MODE_LIST = parsedModes.map((mode) => ({ ...mode, tokens: tokensOf(mode) }))

/** glyphPaint(): the fill, and the plate the glyph paints behind itself where the mode plates. */
function glyphPaint(mode, type, surface) {
  if (mode.tones) return { fill: surface === 'accent' ? mode.tones[3] : mode.tones[0] }
  if (surface === 'typechip') return { fill: inkOn(typeColours[type] ?? '#888888') }
  if (surface === 'accent') return { fill: mode.tokens.accentInk }
  if (mode.plateGlyphs) {
    const plate = typeColours[type] ?? '#888888'
    return { fill: inkOn(plate), plate }
  }
  return { fill: typeColours[type] ?? mode.tokens.ink }
}

function glyphBackdrop(mode, type, surface) {
  if (surface === 'accent') return mode.tokens.accent
  if (surface === 'typechip') return typeColours[type] ?? '#888888'
  const { plate } = glyphPaint(mode, type, surface)
  if (plate) return plate
  if (surface === 'panel') return mode.tokens.panel
  if (surface === 'surface2') return mode.tokens.surface2
  return mode.tokens.surface
}

/**
 * Whether `mode` ever draws a glyph on `surface`.
 *
 * The type chip only exists in the mode allowed to spend type colours — POCKET's filter chips
 * keep the plain surface token and their marks are drawn for it. Measuring a combination the
 * interface never renders would report a number nobody can see, which is the same dishonesty as
 * measuring against the wrong backdrop.
 */
function isRendered(mode, surface) {
  return surface !== 'typechip' || mode.typeColor
}

const rows = []
const violations = []
for (const mode of MODE_LIST) {
  for (const surface of KNOWN_SURFACES) {
    if (!isRendered(mode, surface)) continue
    const measured = Object.keys(typeColours)
      .map((type) => [type, contrast(glyphPaint(mode, type, surface).fill, glyphBackdrop(mode, type, surface))])
      .sort((a, b) => a[1] - b[1])
    const [lowType, low] = measured[0]
    const [highType, high] = measured[measured.length - 1]
    rows.push({ mode: mode.id, surface, low, lowType, high, highType })
    for (const [type, value] of measured) {
      if (value < FLOOR) {
        violations.push(
          `${mode.id} ${surface} ${type}: ${value.toFixed(2)}, below the recorded floor of ${FLOOR}. `
          + `Fill ${glyphPaint(mode, type, surface).fill} on backdrop ${glyphBackdrop(mode, type, surface)}.`,
        )
      }
    }
  }
}

if (violations.length) {
  console.log('FAIL  every glyph is visible on every surface it is drawn onto')
  for (const violation of violations) console.log(`      ${violation}`)
  console.log(
    `      Lowering the floor is a decision, not a fix: change ${relative(ROOT, MODES)} so the `
    + 'pairing measures higher, or change the floor here and the retro-theme spec table together.',
  )
  process.exit(1)
}

console.log('ok    every glyph is visible on every surface it is drawn onto')
for (const row of rows) {
  console.log(
    `      ${row.mode.padEnd(7)} ${row.surface.padEnd(9)}`
    + ` ${row.low.toFixed(2)} (${row.lowType}) – ${row.high.toFixed(2)} (${row.highType})`,
  )
}
console.log(`\n${rows.length} combination(s), floor ${FLOOR}, 0 violation(s)`)
