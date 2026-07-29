/**
 * What the grid is being asked for, and what it answers with.
 *
 * Module-level refs rather than props or provide/inject, for the same reason the display
 * state uses them: every part of the query bar and the grid reads the active query, and
 * threading it would put props on the entire tree.
 *
 * The grid holds the platform's list element directly — there is deliberately no list or
 * virtualisation wrapper between them. What lives behind this module instead is the part
 * with actual behaviour: cross-language matching, which form each card shows under the
 * active filter, and the sort key.
 */
import { computed, ref } from 'vue-lynx'

import { allTypes, bestBst, dex } from '../data/dex.js'
import type { Species } from '../data/dex.js'
import type { TypeName } from '../data/types.js'

/** How the result sequence is ordered. */
export type SortOrder = 'number' | 'stats'

/**
 * One row of the result sequence: a species, and the index of the form its card draws.
 *
 * The form travels with the species rather than being decided by the card, because which
 * form answers the query is a property of the query, not of the card.
 */
export interface Result {
  readonly species: Species
  readonly formIndex: number
}

const search = ref('')
const typeFilter = ref<TypeName | null>(null)
const genFilter = ref<number | null>(null)
const sortOrder = ref<SortOrder>('number')

/**
 * Whether `species` matches `needle`, which is already lower-cased.
 *
 * Both names are always searched, whichever language is leading. The toggle changes which
 * name reads first, and it must not change which species are reachable — otherwise a
 * language switch silently empties a query the user already typed.
 *
 * Lower-casing leaves CJK unchanged, so the Chinese comparison works against the same
 * needle without a second pass.
 */
function matchesSearch(species: Species, needle: string): boolean {
  if (!needle) return true
  return species.m.toLowerCase().includes(needle) || species.mz.includes(needle)
}

/**
 * Whether `species` carries `type` on any of its forms.
 *
 * Judged across every form rather than the base form, so a species whose only claim to a
 * type is an alternate form stays reachable — filtering for Dragon has to reach Charizard,
 * which is Fire/Flying until Mega Charizard X.
 */
function matchesType(species: Species, type: TypeName | null): boolean {
  if (type === null) return true
  return allTypes(species).includes(type)
}

/** Whether `species` was introduced in `gen`. */
function matchesGen(species: Species, gen: number | null): boolean {
  return gen === null || species.g === gen
}

/**
 * Which form the card draws for `species` under the active type filter.
 *
 * A grid answering a Dragon filter with Fire/Flying artwork reads as broken, so the card
 * shows the form that actually matched: the first one carrying the filtered type. With no
 * type filter there is nothing to answer, so it shows the base form.
 *
 * Falls back to the base form if no form carries the type, which cannot happen for a
 * species that passed {@link matchesType} but keeps the return total.
 */
function matchingFormIndex(species: Species, type: TypeName | null): number {
  if (type === null) return 0
  const index = species.f.findIndex((form) => form.t.includes(type))
  return index === -1 ? 0 : index
}

/**
 * Orders `rows` in place and returns them.
 *
 * The stats order ranks by the strongest form's total rather than the base form's. Ranking
 * by the base form buries all 75 Megas under unevolved figures — Venusaur would sort on 525
 * instead of 625, so the comparison the order exists for stops working.
 */
function sortRows(rows: Result[], order: SortOrder): Result[] {
  if (order === 'stats') {
    return rows.sort((a, b) => bestBst(b.species) - bestBst(a.species))
  }
  return rows.sort((a, b) => a.species.d - b.species.d)
}

/**
 * The species matching the active query, each paired with the form its card draws.
 *
 * The search string and both filters are conjunctive: a species has to satisfy all three
 * that are active.
 *
 * Recomputed in full on every keystroke. 208 rows is small enough that indexing or
 * debouncing would be paying complexity for an imagined problem; if input ever feels
 * delayed on device, that is the point to revisit.
 */
export const results = computed<Result[]>(() => {
  const needle = search.value.trim().toLowerCase()
  const type = typeFilter.value
  const gen = genFilter.value
  const rows: Result[] = []
  for (const species of dex.species) {
    if (!matchesSearch(species, needle)) continue
    if (!matchesType(species, type)) continue
    if (!matchesGen(species, gen)) continue
    rows.push({ species, formIndex: matchingFormIndex(species, type) })
  }
  return sortRows(rows, sortOrder.value)
})

/** Return every control to its initial value. */
export function resetQuery(): void {
  search.value = ''
  typeFilter.value = null
  genFilter.value = null
  sortOrder.value = 'number'
}

export { genFilter, search, sortOrder, typeFilter }
