import { typeColor } from '../data/types.js'
import { inkOn } from './contrast.js'

export interface Tokens {
  readonly bg: string
  readonly shell: string
  readonly panel: string
  readonly surface: string
  readonly surface2: string
  readonly ink: string
  readonly ink2: string
  readonly line: string
  readonly accent: string
  readonly accentInk: string
}

/** Darkest first. */
export type Tones = readonly [string, string, string, string]

export type ModeId = 'POCKET' | 'MODERN' | 'EMERALD'

interface Mode {
  readonly id: ModeId
  readonly tones?: Tones
  readonly tokens?: Tokens
  readonly typeColor?: boolean
  /**
   * Whether a glyph on a neutral surface brings its own plate of the type's colour.
   *
   * Declared per mode rather than derived from the tokens' luminance, so that reading this file
   * answers which arrangement a mode uses. Declaring it wrong is not silent: a light mode without
   * the flag fills glyphs with the type colour and `scripts/check-contrast.mjs` fails on the floor.
   */
  readonly plateGlyphs?: boolean
}

/**
 * The modes, in the order the theme menu offers them.
 *
 * Ordered rather than keyed, because the menu presents them as a sequence and a fourth mode should
 * be an addition here and nowhere else.
 */
export const MODES: readonly Mode[] = [
  { id: 'POCKET', tones: ['#0d0d0d', '#4f4f4f', '#a1a1a1', '#e8e8e8'] },
  {
    id: 'MODERN',
    typeColor: true,
    tokens: {
      bg: '#0b0d10', shell: '#171b21', panel: '#0f1319', surface: '#1b212a',
      surface2: '#252d38', ink: '#e9eef4', ink2: '#93a0b0', line: '#2b3441',
      accent: '#e9eef4', accentInk: '#0f1319',
    },
  },
  /*
   * Daylight, and the only mode whose neutral surfaces are lighter than the type colours — which
   * is why it plates its glyphs. The ten values come from a Hoenn overworld map.
   *
   * The source image, design/emerald-palette-source.jpg, is 460x916 and stacks two generations:
   * rows 8-452 are the generation this mode is named for, rows 470-912 a later one. Naming the
   * depicted feature is not enough to say where a value came from, because every feature name
   * holds in both halves — this palette was once sampled entirely from the wrong half and nothing
   * caught it. So each value below records the rectangle it is the channel mean of, as top-left
   * through bottom-right pixels, or the factor it scales an already-sampled value's HSL lightness
   * by. All rectangles are inside rows 8-452.
   *
   *   shell     sampled  tree canopy          (120,246)-(132,304)
   *   panel     sampled  sand path            (218,145)-(252,190)
   *   surface2  sampled  ochre building roof   (196,62)-(264,96)
   *   accent    sampled  house roof           (141,258)-(194,276)
   *   bg        derived  shell        x0.5149 HSL lightness; ink and line reuse it
   *   ink2      derived  grass        x0.40   from (202,142)-(212,180), measuring #73BF9F
   *   surface   derived  house wall   x1.43   from (142,284)-(151,300), measuring #BAA376
   *
   * accentInk reuses surface rather than bg because accent is dark: bg measures 1.97 against it,
   * under the floor scripts/check-contrast.mjs enforces, and surface measures 3.80. An accent
   * light enough to flip that comparison has to flip accentInk with it.
   *
   * See design/theme-emerald-mock.html.
   */
  {
    id: 'EMERALD',
    typeColor: true,
    plateGlyphs: true,
    tokens: {
      bg: '#2C491E', shell: '#568E3A', panel: '#D8C780', surface: '#E6DDCD',
      surface2: '#CCAB67', ink: '#2C491E', ink2: '#265441', line: '#2C491E',
      accent: '#AE505D', accentInk: '#E6DDCD',
    },
  },
]

export function tokensOf(mode: Mode): Tokens {
  if (mode.tokens) return mode.tokens
  const tones = mode.tones as Tones
  return {
    bg: tones[0], shell: tones[1], panel: tones[3], surface: tones[3],
    surface2: tones[2], ink: tones[0], ink2: tones[1], line: tones[0],
    accent: tones[0], accentInk: tones[3],
  }
}

export type GlyphSurface = 'surface' | 'accent' | 'typechip' | 'panel' | 'surface2'

/** The fallback type colour, for a type name outside the table. */
const UNKNOWN_TYPE = '#888888'

export interface GlyphPaint {
  readonly fill: string
  /** The plate the glyph paints behind itself, absent when it sits straight on the surface. */
  readonly plate?: string
}

/**
 * A glyph's fill and, where the mode plates, the plate beneath it.
 *
 * One function rather than two, because a fill and the thing behind it that cannot be read from
 * the tokens have to agree — `glyphBackdrop` reads the plate from here for that reason.
 *
 * The plate is the arrangement the typechip surface already uses: the type's colour behind, the
 * higher-contrast ink candidate on top. A light surface cannot take the type colour as a fill at
 * all — Electric measures 1.65 against white itself — so plating is not a preference here, it is
 * the only arrangement that clears the floor without inventing a second set of type colours.
 *
 * Plates are for the three neutral surfaces only. Accent and typechip already carry a chosen
 * background, and plating them would paint over it.
 */
export function glyphPaint(mode: Mode, type: string, surface: GlyphSurface): GlyphPaint {
  const tones = mode.tones
  if (tones) return { fill: surface === 'accent' ? tones[3] : tones[0] }
  const tokens = mode.tokens as Tokens
  if (surface === 'typechip') return { fill: inkOn(typeColor(type) ?? UNKNOWN_TYPE) }
  if (surface === 'accent') return { fill: tokens.accentInk }
  if (mode.plateGlyphs) {
    const plate = typeColor(type) ?? UNKNOWN_TYPE
    return { fill: inkOn(plate), plate }
  }
  return { fill: typeColor(type) ?? tokens.ink }
}

export function glyphBackdrop(mode: Mode, type: string, surface: GlyphSurface): string {
  const tokens = tokensOf(mode)
  if (surface === 'accent') return tokens.accent
  if (surface === 'typechip') return typeColor(type) ?? UNKNOWN_TYPE
  const { plate } = glyphPaint(mode, type, surface)
  if (plate) return plate
  if (surface === 'panel') return tokens.panel
  if (surface === 'surface2') return tokens.surface2
  return tokens.surface
}

export type { Mode }
