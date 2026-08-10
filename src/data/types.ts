import type { Lang } from './i18n.js'

export const TYPE_ORDER = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
] as const

export type TypeName = (typeof TYPE_ORDER)[number]

/** 8x8 glyph bitmap: eight rows of eight cells each. */
export type GlyphRows = readonly [
  string, string, string, string, string, string, string, string,
]

export const GLYPH_FILLED = '#'

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

export const TYPE_ABBR: Record<TypeName, string> = {
  Normal: 'NRM', Fire: 'FIR', Water: 'WTR', Electric: 'ELC', Grass: 'GRS', Ice: 'ICE',
  Fighting: 'FGT', Poison: 'PSN', Ground: 'GRD', Flying: 'FLY', Psychic: 'PSY',
  Bug: 'BUG', Rock: 'RCK', Ghost: 'GHT', Dragon: 'DRG', Dark: 'DRK', Steel: 'STL',
  Fairy: 'FRY',
}

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

export function isTypeName(name: string): name is TypeName {
  return name in GLYPHS
}

export function glyphRows(name: string): GlyphRows {
  return isTypeName(name) ? GLYPHS[name] : GLYPHS.Normal
}

export function typeColor(name: string): string | undefined {
  return isTypeName(name) ? TYPE_COLORS[name] : undefined
}

export function typeAbbr(name: string): string {
  return isTypeName(name) ? TYPE_ABBR[name] : name
}

export function typeName(name: string, lang: Lang): string {
  if (lang === 'en' || !isTypeName(name)) return name
  return TYPE_ZH[name]
}
