import rawDex from './dex.json'
import { typeName } from './types.js'

/** Where a form comes from in the roster table. */
export type FormKind = 'base' | 'other' | 'regional' | 'mega'

/** Six base stats, in HP / Attack / Defense / Sp. Attack / Sp. Defense / Speed order. */
export type StatLine = readonly [number, number, number, number, number, number]

/** An ability slot: index into {@link Dex.abilities}, plus a hidden-ability flag element. */
export type AbilityRef = readonly [number] | readonly [number, number]

/** How a move deals damage. */
export type MoveClass = 'Physical' | 'Special' | 'Status'

export interface Form {
  readonly l: string // English form label; empty for a base form
  readonly lz: string // Chinese form label; empty for a base form
  readonly k: FormKind
  readonly t: readonly string[] // one or two type names
  readonly s: string // sprite file name, resolved against the sprite host
  readonly st: StatLine
  readonly ab: readonly AbilityRef[]
  readonly si: number // index into the owning species' Species.sec
  readonly a?: 1 // sprite is the species' shared artwork
  readonly x?: 1 // outside the current roster
  readonly v?: string // game version, when it differs from the species'
}

export interface Species {
  readonly d: number // national dex number
  readonly m: string // English name
  readonly mz: string // Chinese name
  readonly gz: string // Chinese category; empty when PokeAPI carries none
  readonly g: number // generation, 1 through 9
  readonly v: string // game version that introduced this species
  readonly x: 0 | 1 // outside the current roster
  readonly n: string // roster note, empty for most species
  readonly f: readonly Form[]
  readonly sec: readonly (readonly number[])[] // learnset sections, indices into Dex.moves
}

export interface Move {
  readonly n: string // English name
  readonly z: string // Chinese name, Traditional; non-empty for every move
  readonly ty: string
  readonly dc: MoveClass
  readonly pw: number | null // null for moves with no fixed damage
  readonly ac: number | null // null for moves that never miss
  readonly pp: number
  readonly d: string // Chinese description, from the 52poke move list
  readonly de: string // English description, from PokeAPI's newest version group
  /**
   * Identifiers of the move flags that apply, ascending. Absent — not empty — for the 71 moves
   * to which none applies.
   *
   * Names for these ids are in {@link Dex.moveFlags}; the labels drawn on screen are in the
   * string table, keyed by the name rather than by the id. Which flags are drawn is decided by
   * which names the string table gives a label to — 17 of the 21 — so this field carries all of
   * them and encodes no display decision.
   *
   * Absence still states nothing. 71 moves carry no flag because the upstream source has not
   * recorded them, which is not the same statement as those moves lacking the properties, and
   * `move-detail` therefore states only the flags that are present and never their absence.
   */
  readonly fl?: readonly number[]
}

export interface Ability {
  readonly n: string // English name
  readonly z: string // Chinese name; empty for the two abilities without one
  readonly d: string // Chinese description; empty for the 19 abilities without one
  readonly de: string // English description
}

export interface DexMeta {
  readonly species: number
  readonly formEntries: number
  readonly megas: number
  readonly regional: number
  readonly moves: number
  readonly moveRefs: number
  readonly abilities: number
  readonly zhMoves: number
  readonly zhAbilities: number
  readonly abilDescZh: number
  readonly abilDescEn: number
  readonly roster: string
  readonly source: string
}

export interface Dex {
  readonly meta: DexMeta
  readonly species: readonly Species[]
  readonly moves: readonly Move[]
  readonly abilities: readonly Ability[]
  /**
   * What each move flag id is called upstream, keyed by the id in string form — all 21, including
   * the four no screen draws.
   *
   * Two hops rather than one (id to name, name to label) so that an upstream renumbering resolves
   * to the same label and an upstream rename resolves to no label at all. Keying labels by the id
   * directly would mislabel silently instead, and nothing outside the tests reads this field.
   */
  readonly moveFlags: Readonly<Record<string, string>>
}

const EXPECTED = {
  'species count': 208,
  'form entries': 360,
  'mega forms': 75,
  'regional forms': 16,
  'move table entries': 496,
  'ability entries': 200,
} as const

function assertCount(invariant: keyof typeof EXPECTED, actual: number): void {
  const expected = EXPECTED[invariant]
  if (actual !== expected) {
    throw new Error(
      `dex dataset invariant violated: ${invariant} — expected ${expected}, actual ${actual}. `
      + 'A mismatch means the dataset changed upstream; read design/HANDOFF.md '
      + '§ "資料層的驗證不變式" before relaxing this.',
    )
  }
}

const dex = rawDex as Dex

let formCount = 0
let megaCount = 0
let regionalCount = 0
for (const species of dex.species) {
  for (const form of species.f) {
    formCount += 1
    if (form.k === 'mega') megaCount += 1
    else if (form.k === 'regional') regionalCount += 1
  }
}

assertCount('species count', dex.species.length)
assertCount('form entries', formCount)
assertCount('mega forms', megaCount)
assertCount('regional forms', regionalCount)
assertCount('move table entries', dex.moves.length)
assertCount('ability entries', dex.abilities.length)

/**
 * Every flag id a move references has to be one the flag table can name.
 *
 * Not a count. The table and the flag-to-move map are a matched pair from one upstream export, so
 * an id applied to a move but absent from the table means the pair came apart — a dataset that
 * contradicts itself, which is what this catches. Upstream *adding* a flag keeps the pair
 * consistent and passes here by design; the table's size is asserted in the tests instead.
 *
 * Exported and taking its inputs as arguments so a test can hand it a dataset that violates it.
 * The other invariants compare against fixed counts and can be checked by reading the real
 * dataset, but this one is a relation between two of its fields, and the shipped dataset
 * satisfies it — the only way to test the failure is to construct one.
 */
export function assertFlagsNamed(
  moves: readonly Move[],
  names: Readonly<Record<string, string>>,
): void {
  const unnamed = [...new Set(moves.flatMap((move) => move.fl ?? []))]
    .filter((id) => names[String(id)] === undefined)
    .sort((a, b) => a - b)
  if (unnamed.length > 0) {
    throw new Error(
      `dex dataset invariant violated: flag id(s) ${unnamed.join(', ')} apply to a move but are `
      + 'not named in moveFlags. The flag table and the flag-to-move map are one upstream '
      + 'export — delete both CSVs and re-run design/pipeline/fetch_sources.sh rather than '
      + 'patching either.',
    )
  }
}

assertFlagsNamed(dex.moves, dex.moveFlags)

assertCount('species count', dex.meta.species)
assertCount('form entries', dex.meta.formEntries)
assertCount('mega forms', dex.meta.megas)
assertCount('regional forms', dex.meta.regional)
assertCount('move table entries', dex.meta.moves)
assertCount('ability entries', dex.meta.abilities)

export { dex }

/** Generation numerals, indexed by generation number. Index 0 is unused. */
export const GEN_ROMAN = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX',
] as const

export function genNumeral(species: Species): string {
  return GEN_ROMAN[species.g] ?? String(species.g)
}

export function bst(form: Form): number {
  let total = 0
  for (const stat of form.st) total += stat
  return total
}

export function bestBst(species: Species): number {
  let best = 0
  for (const form of species.f) {
    const total = bst(form)
    if (total > best) best = total
  }
  return best
}

const typesBySpecies = new Map<Species, readonly string[]>()
const haystackBySpecies = new Map<Species, string>()
const haystackByMove = new Map<Move, string>()

export function allTypes(species: Species): readonly string[] {
  const hit = typesBySpecies.get(species)
  if (hit !== undefined) return hit
  const seen: string[] = []
  for (const form of species.f) {
    for (const type of form.t) {
      if (!seen.includes(type)) seen.push(type)
    }
  }
  typesBySpecies.set(species, seen)
  return seen
}

/** Everything about a species that the search string is matched against, lower-cased. */
export function searchHaystack(species: Species): string {
  const hit = haystackBySpecies.get(species)
  if (hit !== undefined) return hit
  const types = allTypes(species)
  const haystack = [
    species.m,
    species.mz,
    species.gz,
    String(species.d),
    String(species.d).padStart(4, '0'),
    `gen${species.g}`,
    ...species.f.map((form) => form.l),
    ...species.f.map((form) => form.lz),
    ...types,
    ...types.map((type) => typeName(type, 'zh')),
  ].join(' ').toLowerCase()
  haystackBySpecies.set(species, haystack)
  return haystack
}

/**
 * Everything about a move that the move index's search string is matched against, lower-cased.
 *
 * Both names, and nothing else. Deliberately narrower than {@link searchHaystack}, which carries
 * its species' types: there, the search string is the only way to reach a type by name for a
 * reader who has not found the type chips; here the type chips sit in the same block of controls
 * and answer that question exactly, so carrying type names would let a search return all 94
 * Normal moves and duplicate the control less precisely. Description text is excluded for the
 * same reason §12.18 excludes bare generation tokens from the species corpus — prose matches too
 * diffusely to distinguish from a broken search.
 *
 * Both languages are always present, independent of which one leads, so switching the leading
 * language never changes which moves are reachable. The two are not symmetric and are not meant
 * to be: 「牙」 reaches seven moves and `fang` six, because 以牙還牙 / Payback carries the
 * character without carrying the word.
 */
export function moveSearchHaystack(move: Move): string {
  const hit = haystackByMove.get(move)
  if (hit !== undefined) return hit
  const haystack = `${move.n} ${move.z}`.toLowerCase()
  haystackByMove.set(move, haystack)
  return haystack
}

export function hasMega(species: Species): boolean {
  return species.f.some((form) => form.k === 'mega')
}

export function megaForms(species: Species): Form[] {
  return species.f.filter((form) => form.k === 'mega')
}

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'

export function spriteUrl(form: Form): string {
  return SPRITE_BASE + form.s
}

export function abilityOf(ref: AbilityRef): Ability {
  const ability = dex.abilities[ref[0]]
  if (ability === undefined) {
    throw new Error(
      `ability slot refers to index ${ref[0]}, which is outside the ability table. `
      + 'A slot and the table it indexes are built together by design/pipeline, so this '
      + 'means the two came from different builds.',
    )
  }
  return ability
}

export function isHidden(ref: AbilityRef): boolean {
  return ref.length > 1
}

export function learnsetOf(species: Species, form: Form): readonly number[] {
  return species.sec[form.si] ?? []
}

const learnersByMove = new Map<number, readonly Species[]>()

export function learnersOf(index: number): readonly Species[] {
  const hit = learnersByMove.get(index)
  if (hit !== undefined) return hit
  moveOf(index)
  const found: Species[] = []
  for (const species of dex.species) {
    if (species.sec.some((section) => section.includes(index))) found.push(species)
  }
  learnersByMove.set(index, found)
  return found
}

function baseFormIndex(species: Species): number {
  const found = species.f.findIndex((form) => form.k === 'base')
  return found < 0 ? 0 : found
}

/** The base form when it knows the move, otherwise the first form that does. */
export function formIndexForMove(species: Species, index: number): number {
  const base = baseFormIndex(species)
  const baseForm = species.f[base]
  if (baseForm !== undefined && learnsetOf(species, baseForm).includes(index)) return base
  const owner = species.f.findIndex((form) => learnsetOf(species, form).includes(index))
  return owner < 0 ? base : owner
}

export function moveOf(index: number): Move {
  const move = dex.moves[index]
  if (move === undefined) {
    throw new Error(
      `learnset refers to move index ${index}, which is outside the move table. `
      + 'A section and the table it indexes are built together by design/pipeline, so this '
      + 'means the two came from different builds.',
    )
  }
  return move
}
