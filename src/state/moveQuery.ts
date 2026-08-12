/**
 * What the moves tab is asked for, and what it answers with.
 *
 * Separate from `query.ts` rather than an extension of it. That module is species-shaped all the
 * way through — its result pairs a species with the form index its card displays, and
 * `matchingFormIndex`, `bestBst` and `hasMega` all answer "which form matched", a question the
 * move table has no form to answer. Sharing it would also share one reset, so clearing the dex
 * tab's query would clear the moves tab's conditions.
 *
 * Module-level refs, so the conditions outlive the components that set them: switching tabs or
 * opening a layer leaves them in effect, and only `resetMoveQuery` returns them to their initial
 * values. Same arrangement as `learnset.ts`, whose sort order and bonus filter outlive the panel.
 */
import { computed, ref } from 'vue-lynx'

import { dex, moveSearchHaystack } from '../data/dex.js'
import type { Move, MoveClass } from '../data/dex.js'
import type { TypeName } from '../data/types.js'

/** The three damage classes, in the order their chips are drawn. */
export const DAMAGE_CLASSES = ['Physical', 'Special', 'Status'] as const

export interface MoveResult {
  readonly move: Move
  /**
   * The move's index in the shared move table — its identity in this dataset.
   *
   * Taken from the source table before any condition is applied, so filtering cannot renumber it.
   * A position in the result would name a different move under every condition, and the row a tap
   * opens has to be the row's move; the windowed sequence already made the row's own position
   * useless for that, and filtering adds a second reason.
   */
  readonly index: number
}

const moveSearch = ref('')

const moveTypeFilters = ref<readonly TypeName[]>([])

const moveClassFilters = ref<readonly MoveClass[]>([])

function tokenise(search: string): string[] {
  return search.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

function matchesSearch(move: Move, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true
  const haystack = moveSearchHaystack(move)
  return tokens.every((token) => haystack.includes(token))
}

/** Types combine disjunctively, as they do on the dex tab: a second selection widens the result. */
function matchesTypes(move: Move, types: readonly TypeName[]): boolean {
  if (types.length === 0) return true
  return types.some((type) => type === move.ty)
}

/** Damage classes combine the same way, so one control shape carries one meaning throughout. */
function matchesClasses(move: Move, classes: readonly MoveClass[]): boolean {
  if (classes.length === 0) return true
  return classes.some((cls) => cls === move.dc)
}

/**
 * The moves the active conditions admit, each with its index in the shared move table.
 *
 * The three conditions narrow each other; the selections within each one widen. Iterating the
 * source table rather than filtering a mapped copy is what keeps `index` the table's own.
 */
export const moveResults = computed<MoveResult[]>(() => {
  const tokens = tokenise(moveSearch.value)
  const types = moveTypeFilters.value
  const classes = moveClassFilters.value
  const rows: MoveResult[] = []
  dex.moves.forEach((move, index) => {
    if (!matchesSearch(move, tokens)) return
    if (!matchesTypes(move, types)) return
    if (!matchesClasses(move, classes)) return
    rows.push({ move, index })
  })
  return rows
})

export function resetMoveQuery(): void {
  moveSearch.value = ''
  moveTypeFilters.value = []
  moveClassFilters.value = []
}

export function toggleMoveType(type: TypeName): void {
  moveTypeFilters.value = moveTypeFilters.value.includes(type)
    ? moveTypeFilters.value.filter((selected) => selected !== type)
    : [...moveTypeFilters.value, type]
}

export function isMoveTypeSelected(type: TypeName): boolean {
  return moveTypeFilters.value.includes(type)
}

export function toggleDamageClass(cls: MoveClass): void {
  moveClassFilters.value = moveClassFilters.value.includes(cls)
    ? moveClassFilters.value.filter((selected) => selected !== cls)
    : [...moveClassFilters.value, cls]
}

export function isDamageClassSelected(cls: MoveClass): boolean {
  return moveClassFilters.value.includes(cls)
}

export { moveClassFilters, moveSearch, moveTypeFilters }
