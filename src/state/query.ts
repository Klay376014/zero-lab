import { computed, ref } from 'vue-lynx'

import { allTypes, bestBst, dex, searchHaystack } from '../data/dex.js'
import type { Species } from '../data/dex.js'
import { TYPE_ORDER, typeName } from '../data/types.js'
import type { TypeName } from '../data/types.js'

/** How the result sequence is ordered. */
export type SortOrder = 'number' | 'stats'

/** One row of the result sequence: a species, and the index of the form its card draws. */
export interface Result {
  readonly species: Species
  readonly formIndex: number
}

const search = ref('')
const typeFilter = ref<TypeName | null>(null)
const genFilter = ref<number | null>(null)
const sortOrder = ref<SortOrder>('number')

/** Whether `species` matches every one of `tokens`, which are already lower-cased. */
function matchesSearch(species: Species, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true
  const haystack = searchHaystack(species)
  return tokens.every((token) => haystack.includes(token))
}

/** The search string as lower-cased tokens. Whitespace alone yields none, matching everything. */
function tokenise(search: string): string[] {
  return search.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/** Whether `species` carries `type` on any of its forms. */
function matchesType(species: Species, type: TypeName | null): boolean {
  if (type === null) return true
  return allTypes(species).includes(type)
}

/** Whether `species` was introduced in `gen`. */
function matchesGen(species: Species, gen: number | null): boolean {
  return gen === null || species.g === gen
}

/**
 * Which form the card draws for `species` under the active query. Four rules, first match
 * wins: a named form, a named type, the type filter, then the base form.
 *
 * Tokens the species' own names already satisfy are discarded first — a Mega's label embeds
 * the species name, so testing raw tokens makes a plain name query select the Mega.
 */
function matchingFormIndex(
  species: Species,
  type: TypeName | null,
  tokens: readonly string[],
): number {
  const named = `${species.m} ${species.mz}`.toLowerCase()
  const rest = tokens.filter((token) => !named.includes(token))

  if (rest.length > 0) {
    const labelled = species.f.findIndex((form) => (
      form.l !== '' && rest.every((token) => `${form.l} ${form.lz}`.toLowerCase().includes(token))
    ))
    if (labelled !== -1) return labelled

    // Whole-token comparison, not a substring: 龍 would otherwise read as Dragon inside any
    // word holding it.
    const asTypes = TYPE_ORDER.filter((candidate) => rest.some((token) => (
      candidate.toLowerCase() === token || typeName(candidate, 'zh') === token
    )))
    if (asTypes.length > 0) {
      const typed = species.f.findIndex((form) => asTypes.every((name) => form.t.includes(name)))
      if (typed !== -1) return typed
    }
  }

  if (type !== null) {
    const filtered = species.f.findIndex((form) => form.t.includes(type))
    if (filtered !== -1) return filtered
  }

  return 0
}

/** Orders `rows` in place and returns them. */
function sortRows(rows: Result[], order: SortOrder): Result[] {
  if (order === 'stats') {
    return rows.sort((a, b) => bestBst(b.species) - bestBst(a.species))
  }
  return rows.sort((a, b) => a.species.d - b.species.d)
}

/** The species matching the active query, each paired with the form its card draws. */
export const results = computed<Result[]>(() => {
  const tokens = tokenise(search.value)
  const type = typeFilter.value
  const gen = genFilter.value
  const rows: Result[] = []
  for (const species of dex.species) {
    if (!matchesSearch(species, tokens)) continue
    if (!matchesType(species, type)) continue
    if (!matchesGen(species, gen)) continue
    rows.push({ species, formIndex: matchingFormIndex(species, type, tokens) })
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
