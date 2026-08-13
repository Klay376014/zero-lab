/**
 * The `retro-theme` and `theme-menu` spec's Example tables and token contract, executed.
 *
 * Every value here is copied from `openspec/specs/retro-theme/spec.md` and
 * `openspec/specs/theme-menu/spec.md` rather than derived. The contrast figures in particular are
 * the spec's own: `scripts/check-contrast.mjs` asserts the floor across every combination, and
 * these pin the specific numbers the spec tables state, so a palette edit has to move both.
 *
 * These drive the real theme and display modules. Nothing here re-implements a selection rule.
 *
 * What this cannot reach: where the menu is drawn, and whether a view that paints nothing receives
 * touches. Both were settled on a device instead — see the change's design and §12.28.
 */
import { afterEach, describe, expect, it } from 'vitest'

import { lang, mode, setMode, toggleLang } from '../src/state/display.js'
import { closeThemeMenu, openThemeMenu, themeMenuOpen } from '../src/state/display.js'
import { contrast } from '../src/theme/contrast.js'
import { glyphBackdrop, glyphPaint, MODES, tokensOf } from '../src/theme/modes.js'
import type { GlyphSurface, ModeId, Tokens } from '../src/theme/modes.js'

/** The ten semantic tokens the contract names, in the spec's order. */
const TOKENS: readonly (keyof Tokens)[] = [
  'bg', 'shell', 'panel', 'surface', 'surface2', 'ink', 'ink2', 'line', 'accent', 'accentInk',
]

/** Mode and menu state are module-level and shared, so every test has to hand them back. */
afterEach(() => {
  setMode('POCKET')
  closeThemeMenu()
  if (lang.value !== 'zh') toggleLang()
})

describe('colour modes share one token contract', () => {
  it('defines at least two modes, currently three, as one ordered set', () => {
    expect(MODES.length).toBe(3)
    expect(MODES.map((entry) => entry.id)).toEqual(['POCKET', 'MODERN', 'EMERALD'])
  })

  it.each(['POCKET', 'MODERN', 'EMERALD'] as const)('%s resolves all ten tokens', (id) => {
    const resolved = tokensOf(MODES.find((entry) => entry.id === id)!)
    expect(Object.keys(resolved).sort()).toEqual([...TOKENS].sort())
    for (const token of TOKENS) expect(resolved[token]).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('adds no eleventh token', () => {
    for (const entry of MODES) expect(Object.keys(tokensOf(entry)).length).toBe(10)
  })
})

describe('POCKET derives its tokens from four tones', () => {
  /** The spec's own derivation table. */
  const DERIVED: Record<keyof Tokens, string> = {
    bg: '#0d0d0d', shell: '#4f4f4f', panel: '#e8e8e8', surface: '#e8e8e8', surface2: '#a1a1a1',
    ink: '#0d0d0d', ink2: '#4f4f4f', line: '#0d0d0d', accent: '#0d0d0d', accentInk: '#e8e8e8',
  }

  it('resolves every token to a member of the ramp', () => {
    const pocket = MODES[0]!
    expect(tokensOf(pocket)).toEqual(DERIVED)
    const ramp = new Set(pocket.tones)
    for (const value of Object.values(tokensOf(pocket))) expect(ramp.has(value)).toBe(true)
  })

  it('leaves MODERN and EMERALD declaring their tokens directly', () => {
    for (const entry of MODES.slice(1)) {
      expect(entry.tones).toBeUndefined()
      expect(entry.tokens).toBeDefined()
    }
  })
})

describe('EMERALD declares the sampled palette', () => {
  /** The spec's table of EMERALD's ten tokens. */
  const EMERALD: Record<keyof Tokens, string> = {
    bg: '#15301F', shell: '#266047', panel: '#E1CF95', surface: '#F0E7C6', surface2: '#C2BE8E',
    ink: '#15301F', ink2: '#3D5A2F', line: '#15301F', accent: '#E37C31', accentInk: '#15301F',
  }

  it('resolves the ten values the spec records', () => {
    expect(tokensOf(MODES[2]!)).toEqual(EMERALD)
  })

  /** The spec's measured text contrast table. */
  it.each([
    ['ink', 'panel', 9.20],
    ['ink', 'surface', 11.50],
    ['ink2', 'surface', 6.27],
    ['accentInk', 'accent', 4.88],
  ] as const)('%s on %s measures %s', (fore, back, expected) => {
    expect(contrast(EMERALD[fore], EMERALD[back])).toBeCloseTo(expected, 2)
  })
})

describe('glyph fill is chosen by the surface it will sit on', () => {
  const NEUTRAL: readonly GlyphSurface[] = ['surface', 'panel', 'surface2']
  const emerald = MODES[2]!
  const modern = MODES[1]!
  const pocket = MODES[0]!

  it('plates the glyph on every neutral surface in EMERALD', () => {
    for (const surface of NEUTRAL) {
      const paint = glyphPaint(emerald, 'Fire', surface)
      expect(paint.plate).toBe('#E62829')
      expect(paint.fill).toBe('#ffffff')
      expect(glyphBackdrop(emerald, 'Fire', surface)).toBe('#E62829')
    }
  })

  it('plates nothing where a background is already chosen', () => {
    for (const surface of ['accent', 'typechip'] as const) {
      expect(glyphPaint(emerald, 'Fire', surface).plate).toBeUndefined()
    }
  })

  it('leaves MODERN filling with the type colour, unplated', () => {
    for (const surface of NEUTRAL) {
      const paint = glyphPaint(modern, 'Fire', surface)
      expect(paint.fill).toBe('#E62829')
      expect(paint.plate).toBeUndefined()
    }
  })

  it('leaves POCKET spending no colour on glyphs', () => {
    expect(glyphPaint(pocket, 'Fire', 'surface')).toEqual({ fill: '#0d0d0d' })
    expect(glyphPaint(pocket, 'Fire', 'accent')).toEqual({ fill: '#e8e8e8' })
  })

  /** The spec's floors and ceilings for EMERALD: the plate reuses the typechip arrangement. */
  it.each(['surface', 'panel', 'surface2', 'typechip'] as const)(
    'the plated arrangement floors at 4.47 on %s',
    (surface) => {
      const measured = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
        'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy']
        .map((type) => contrast(
          glyphPaint(emerald, type, surface).fill,
          glyphBackdrop(emerald, type, surface),
        ))
        .sort((a, b) => a - b)
      expect(measured[0]).toBeCloseTo(4.47, 2)
      expect(measured[measured.length - 1]!).toBeCloseTo(11.42, 2)
    },
  )

  it('measures 4.88 for every type on the accent surface', () => {
    for (const type of ['Normal', 'Fairy'] as const) {
      expect(contrast(
        glyphPaint(emerald, type, 'accent').fill,
        glyphBackdrop(emerald, type, 'accent'),
      )).toBeCloseTo(4.88, 2)
    }
  })

  /** Why a light surface cannot take the type colour as a fill, from the spec's third table. */
  it.each([
    ['Electric', '#FAC000', 1.67, 1.34],
    ['Ice', '#3DCEF3', 1.85, 1.50],
    ['Flying', '#81B9EF', 2.08, 1.68],
  ] as const)('%s measures %s on white and %s on EMERALD surface', (_type, colour, onWhite, onSurface) => {
    expect(contrast(colour, '#ffffff')).toBeCloseTo(onWhite, 2)
    expect(contrast(colour, '#F0E7C6')).toBeCloseTo(onSurface, 2)
  })
})

describe('active language and active mode are shared reactive state', () => {
  it.each(['POCKET', 'MODERN', 'EMERALD'] as const)('is selected by name: %s', (id: ModeId) => {
    setMode(id)
    expect(mode.value.id).toBe(id)
  })

  it('is inert when set to the mode already in force', () => {
    setMode('EMERALD')
    const before = tokensOf(mode.value)
    setMode('EMERALD')
    expect(tokensOf(mode.value)).toEqual(before)
  })

  it('switches language without disturbing the mode', () => {
    setMode('EMERALD')
    toggleLang()
    expect(lang.value).toBe('en')
    expect(mode.value.id).toBe('EMERALD')
  })
})

describe('the theme menu is open state only', () => {
  it('opens and closes', () => {
    openThemeMenu()
    expect(themeMenuOpen.value).toBe(true)
    closeThemeMenu()
    expect(themeMenuOpen.value).toBe(false)
  })

  it('closes without changing the active mode', () => {
    setMode('MODERN')
    openThemeMenu()
    closeThemeMenu()
    expect(themeMenuOpen.value).toBe(false)
    expect(mode.value.id).toBe('MODERN')
  })

  it('leaves the language alone when it opens and closes', () => {
    toggleLang()
    openThemeMenu()
    closeThemeMenu()
    expect(lang.value).toBe('en')
  })
})
