import rawDex from './dex.json'
// Value import, not type-only: safe because types.ts imports nothing at runtime. Importing
// anything else here would cycle through i18n.
import { typeName } from './types.js'

/** Where a form comes from in the roster table. */
export type FormKind = 'base' | 'other' | 'regional' | 'mega'

/** Six base stats, in HP / Attack / Defense / Sp. Attack / Sp. Defense / Speed order. */
export type StatLine = readonly [number, number, number, number, number, number]

/**
 * An ability slot: an index into {@link Dex.abilities}, plus a second element when the
 * slot holds the species' hidden ability.
 */
export type AbilityRef = readonly [number] | readonly [number, number]

/** How a move deals damage. */
export type MoveClass = 'Physical' | 'Special' | 'Status'

export interface Form {
  /** English form label. Empty for a species' base form. */
  readonly l: string
  /** Chinese form label. Empty for a species' base form. */
  readonly lz: string
  readonly k: FormKind
  /** One or two type names, keyed into the type reference tables. */
  readonly t: readonly string[]
  /** Sprite file name, resolved against the sprite host. */
  readonly s: string
  readonly st: StatLine
  readonly ab: readonly AbilityRef[]
  /** Index into the owning species' {@link Species.sec} learnset sections. */
  readonly si: number
  /** 1 when the sprite is the species' shared artwork because this form has none of its own. */
  readonly a?: 1
  /** 1 when this form sits outside the current roster. */
  readonly x?: 1
  /** Game version that introduced this form, when it differs from the species'. */
  readonly v?: string
}

export interface Species {
  /** National dex number. */
  readonly d: number
  /** English species name. */
  readonly m: string
  /** Chinese species name. */
  readonly mz: string
  /** Chinese category. Empty for species PokeAPI carries no category for. */
  readonly gz: string
  /** Generation number, 1 through 9. */
  readonly g: number
  /** Game version that introduced this species. */
  readonly v: string
  /** 1 when the species sits outside the current roster. */
  readonly x: 0 | 1
  /** Roster note, empty for most species. */
  readonly n: string
  readonly f: readonly Form[]
  /** Learnset sections. Each is a list of indices into {@link Dex.moves}. */
  readonly sec: readonly (readonly number[])[]
}

export interface Move {
  /** English move name. */
  readonly n: string
  /** Chinese move name. Empty for the two moves with no Chinese name yet. */
  readonly z: string
  readonly ty: string
  readonly dc: MoveClass
  /** Power, or null for moves that deal no fixed damage. */
  readonly pw: number | null
  /** Accuracy, or null for moves that never miss. */
  readonly ac: number | null
  readonly pp: number
}

export interface Ability {
  /** English ability name. */
  readonly n: string
  /** Chinese ability name. Empty for the two abilities with no Chinese name yet. */
  readonly z: string
  /** Chinese description. Empty for the 19 abilities with no Chinese description. */
  readonly d: string
  /** English description. Present for all 200 abilities. */
  readonly de: string
}

/**
 * What the dataset says about itself. The six counts that have a matching invariant are
 * asserted at load, so a figure read from here is a figure {@link EXPECTED} protects.
 */
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
  /** Which roster the dataset was built from. */
  readonly roster: string
  /** Where each part of the dataset came from. */
  readonly source: string
}

export interface Dex {
  readonly meta: DexMeta
  readonly species: readonly Species[]
  readonly moves: readonly Move[]
  readonly abilities: readonly Ability[]
}

// Read design/HANDOFF.md § "資料層的驗證不變式" before relaxing any of these.
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

// The same six invariants against the meta block. The assertions above prove the collections
// are intact; these prove the dataset's own header agrees with them. Without this pair a
// figure read from meta and rendered on screen would carry no assertion at all.
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

/** The generation numeral for a species, or the bare number if it falls outside the table. */
export function genNumeral(species: Species): string {
  return GEN_ROMAN[species.g] ?? String(species.g)
}

/** Total base stats for one form. */
export function bst(form: Form): number {
  let total = 0
  for (const stat of form.st) total += stat
  return total
}

/** The highest base-stat total across a species' forms. */
export function bestBst(species: Species): number {
  let best = 0
  for (const form of species.f) {
    const total = bst(form)
    if (total > best) best = total
  }
  return best
}

/**
 * Derivations of a species that the query recomputes for every species on every keystroke.
 *
 * Both are pure functions of `dex`, which is loaded once and is readonly throughout — so a
 * species' answer can never change, and the first one computed is the one to keep. Keyed on
 * the species object rather than its number because the objects are the identities the query
 * already holds; there are 208 of them and they live as long as the module does.
 *
 * This is memoisation, not a cache in the sense of something that can miss twice: nothing
 * evicts, because nothing invalidates.
 */
const typesBySpecies = new Map<Species, readonly string[]>()
const haystackBySpecies = new Map<Species, string>()

/**
 * Every type appearing on any of a species' forms, in first-seen order.
 *
 * The array is shared with every other caller and must not be mutated — hence the readonly
 * return type, which is what stops that at the type level.
 */
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

/**
 * Everything about a species that the search string is matched against, lower-cased.
 *
 * The bare generation numeral is deliberately absent: a search for `V` would reach 125 of the
 * 208 species. The `gen<n>` token reaches the same set with nothing to collide with.
 *
 * Note what the string does *not* depend on: the active language. Both names are always in it,
 * so a language change does not invalidate anything here.
 */
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

/** Whether any of a species' forms is a Mega evolution. */
export function hasMega(species: Species): boolean {
  return species.f.some((form) => form.k === 'mega')
}

/** The species' Mega forms, in dataset order. */
export function megaForms(species: Species): Form[] {
  return species.f.filter((form) => form.k === 'mega')
}

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'

/** The artwork URL for one form. */
export function spriteUrl(form: Form): string {
  return SPRITE_BASE + form.s
}

/** The ability an ability slot refers to. */
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

/** Whether an ability slot holds the species' hidden ability. */
export function isHidden(ref: AbilityRef): boolean {
  return ref.length > 1
}

/**
 * The move indices `form` can learn, from the owning species' learnset sections.
 *
 * Yields an empty list rather than throwing, unlike {@link abilityOf}: an empty learnset is a
 * state the table already renders, and a throw inside a computed surfaces on this platform as
 * unexplained broken layout rather than as an error.
 */
export function learnsetOf(species: Species, form: Form): readonly number[] {
  return species.sec[form.si] ?? []
}

/**
 * Every species that learns the move at `index`, in the dataset's own species order.
 *
 * Memoised on the same terms as {@link allTypes}: `dex` is loaded once and is readonly, so a
 * move's answer cannot change and nothing evicts. Keyed by move index rather than by the move
 * object because the index is what a learnset section already holds.
 *
 * Built on demand rather than all at once at load. The relation is 12,939 pairs across 496
 * moves, and the launch path is the one path this project has measured as slower than
 * intuition — a move nobody opens should cost nothing. See design/HANDOFF.md §12.14.
 *
 * Every section is searched, not just the one the base form points at. Fifteen species carry
 * sections that differ between forms; restricting the search to base forms would drop 174 of
 * the 12,939 pairs, all of them regional forms — Alolan Ninetales' Ice moves among them.
 *
 * The array is shared with every other caller and must not be mutated, which the readonly
 * return type is what stops.
 */
const learnersByMove = new Map<number, readonly Species[]>()

export function learnersOf(index: number): readonly Species[] {
  const hit = learnersByMove.get(index)
  if (hit !== undefined) return hit
  // Range check before the walk, so an out-of-range index raises the move table's own
  // diagnostic rather than being reported a second way as an empty result.
  moveOf(index)
  const found: Species[] = []
  for (const species of dex.species) {
    if (species.sec.some((section) => section.includes(index))) found.push(species)
  }
  learnersByMove.set(index, found)
  return found
}

/** The index of a species' base form, or 0 for the rare species that declares none. */
function baseFormIndex(species: Species): number {
  const found = species.f.findIndex((form) => form.k === 'base')
  return found < 0 ? 0 : found
}

/**
 * Which form to open when a species is reached by way of the move at `index`.
 *
 * The base form when it knows the move, otherwise the first form that does. Opening the base
 * form unconditionally would be wrong on 174 pairs in a way nothing on screen would show: the
 * reader arrives from a move and is given a form whose learnset does not contain it — no
 * error, no empty state, just a different set of moves.
 *
 * Returns the base form when no section holds the move rather than throwing. That state is
 * unreachable for a species that came from {@link learnersOf}, and a throw inside a computed
 * surfaces on this platform as unexplained broken layout rather than as an error.
 */
export function formIndexForMove(species: Species, index: number): number {
  const base = baseFormIndex(species)
  const baseForm = species.f[base]
  if (baseForm !== undefined && learnsetOf(species, baseForm).includes(index)) return base
  const owner = species.f.findIndex((form) => learnsetOf(species, form).includes(index))
  return owner < 0 ? base : owner
}

/** The move at `index` in the shared move table. */
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
