/**
 * The five type reference tables.
 *
 * Keying every table on {@link TypeName} rather than `string` means a type missing from
 * one table is a compile error, not a hole that shows up as a blank glyph at runtime.
 */
import type { Lang } from './i18n.js'

export const TYPE_ORDER = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
] as const

export type TypeName = (typeof TYPE_ORDER)[number]

/** An 8x8 glyph bitmap: eight rows of eight cells each. */
export type GlyphRows = readonly [
  string, string, string, string, string, string, string, string,
]

/** The cell marker that means "filled" in a {@link GlyphRows} row. */
export const GLYPH_FILLED = '#'

/** Canonical series type colours. Only MODERN can afford to spend them. */
export const TYPE_COLORS: Record<TypeName, string> = {
  Normal: '#9FA19F', Fire: '#E62829', Water: '#2980EF', Electric: '#FAC000',
  Grass: '#3FA129', Ice: '#3DCEF3', Fighting: '#FF8000', Poison: '#9141CB',
  Ground: '#B0913B', Flying: '#81B9EF', Psychic: '#EF4179', Bug: '#91A119',
  Rock: '#AFA981', Ghost: '#9060A0', Dragon: '#5060E1', Dark: '#8A6E64',
  Steel: '#60A1B8', Fairy: '#EF70EF',
}

export const TYPE_ZH: Record<TypeName, string> = {
  Normal: '一般', Fire: '火', Water: '水', Electric: '電', Grass: '草', Ice: '冰',
  Fighting: '格鬥', Poison: '毒', Ground: '地面', Flying: '飛行', Psychic: '超能',
  Bug: '蟲', Rock: '岩石', Ghost: '幽靈', Dragon: '龍', Dark: '惡', Steel: '鋼',
  Fairy: '妖精',
}

/**
 * Cards are narrow and two types must fit. Three-letter codes are both what the era's
 * status screens did and the only thing that fits on the grid.
 */
export const TYPE_ABBR: Record<TypeName, string> = {
  Normal: 'NRM', Fire: 'FIR', Water: 'WTR', Electric: 'ELC', Grass: 'GRS', Ice: 'ICE',
  Fighting: 'FGT', Poison: 'PSN', Ground: 'GRD', Flying: 'FLY', Psychic: 'PSY',
  Bug: 'BUG', Rock: 'RCK', Ghost: 'GHT', Dragon: 'DRG', Dark: 'DRK', Steel: 'STL',
  Fairy: 'FRY',
}

/**
 * 18 type marks, hand-plotted on an 8x8 grid — the only honest way to signal type when
 * the palette has no colour left to spend on it.
 */
export const GLYPHS: Record<TypeName, GlyphRows> = {
  Normal: ['..####..', '.#....#.', '#......#', '#..##..#', '#..##..#', '#......#', '.#....#.', '..####..'],
  Fire: ['...##...', '..####..', '..####..', '.######.', '.######.', '##.##.##', '#..##..#', '.######.'],
  Water: ['...##...', '...##...', '..####..', '..####..', '.######.', '.######.', '.######.', '..####..'],
  Electric: ['.....##.', '....##..', '...##...', '..#####.', '.####...', '...##...', '..##....', '.##.....'],
  Grass: ['......##', '....####', '..######', '.#####..', '.####.#.', '.###..#.', '##...#..', '#...#...'],
  Ice: ['#..#..#.', '.#.#.#..', '..###...', '#######.', '..###...', '.#.#.#..', '#..#..#.', '........'],
  Fighting: ['..####..', '.######.', '########', '##.##.##', '########', '.######.', '..####..', '........'],
  Poison: ['..####..', '.######.', '##.##.##', '########', '.#.##.#.', '..####..', '.#.##.#.', '........'],
  Ground: ['........', '........', '..####..', '.######.', '########', '########', '########', '########'],
  Flying: ['........', '##......', '####....', '.#####..', '..#####.', '...####.', '....##..', '........'],
  Psychic: ['..####..', '.#....#.', '#..##..#', '#.####.#', '#.####.#', '#..##..#', '.#....#.', '..####..'],
  Bug: ['#..##..#', '.######.', '##.##.##', '########', '##.##.##', '.######.', '#..##..#', '........'],
  Rock: ['........', '.####...', '.####...', '.######.', '####.##.', '####.##.', '.######.', '........'],
  Ghost: ['..####..', '.######.', '##.##.##', '########', '########', '########', '#.#.#.#.', '........'],
  Dragon: ['......##', '....####', '..######', '.#####..', '######..', '.####...', '..##.#..', '.#...##.'],
  Dark: ['...###..', '..####..', '.####...', '.####...', '.####...', '.####...', '..####..', '...###..'],
  Steel: ['.#.##.#.', '.######.', '###..###', '##....##', '##....##', '###..###', '.######.', '.#.##.#.'],
  Fairy: ['...#....', '...#....', '..###...', '#######.', '..###...', '...#....', '...#....', '........'],
}

/** True when `name` is one of the eighteen known types. */
export function isTypeName(name: string): name is TypeName {
  return name in GLYPHS
}

/**
 * The glyph bitmap for `name`, falling back to Normal for an unrecognised type so an
 * upstream type rename shows a mark rather than a blank.
 */
export function glyphRows(name: string): GlyphRows {
  return isTypeName(name) ? GLYPHS[name] : GLYPHS.Normal
}

/**
 * The series colour for `name`, or undefined when unrecognised. The caller substitutes a
 * token — the neutral ink — because only the theme layer knows the active palette.
 */
export function typeColor(name: string): string | undefined {
  return isTypeName(name) ? TYPE_COLORS[name] : undefined
}

/** The three-letter code for `name`, falling back to the name itself. */
export function typeAbbr(name: string): string {
  return isTypeName(name) ? TYPE_ABBR[name] : name
}

/** The type's name in `lang`, falling back to the English name. */
export function typeName(name: string, lang: Lang): string {
  if (lang === 'en' || !isTypeName(name)) return name
  return TYPE_ZH[name]
}
