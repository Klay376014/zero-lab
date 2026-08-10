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

export type ModeId = 'POCKET' | 'MODERN'

interface Mode {
  readonly id: ModeId
  readonly tones?: Tones
  readonly tokens?: Tokens
  readonly typeColor?: boolean
}

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

export function glyphOn(mode: Mode, type: string, surface: GlyphSurface): string {
  const tones = mode.tones
  if (tones) return surface === 'accent' ? tones[3] : tones[0]
  const tokens = mode.tokens as Tokens
  if (surface === 'typechip') return inkOn(typeColor(type) ?? '#888888')
  if (surface === 'accent') return tokens.accentInk
  return typeColor(type) ?? tokens.ink
}

export function glyphBackdrop(mode: Mode, type: string, surface: GlyphSurface): string {
  const tokens = tokensOf(mode)
  if (surface === 'accent') return tokens.accent
  if (surface === 'typechip') return typeColor(type) ?? '#888888'
  if (surface === 'panel') return tokens.panel
  if (surface === 'surface2') return tokens.surface2
  return tokens.surface
}

export type { Mode }
