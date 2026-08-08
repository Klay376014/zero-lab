import { computed, ref } from 'vue-lynx'

import { allTypes, bestBst, dex, searchHaystack } from '../data/dex.js'
import type { Species } from '../data/dex.js'
import { TYPE_ORDER, typeName } from '../data/types.js'
import type { TypeName } from '../data/types.js'

/**
 * The sort set, in the order the sort control advances through it. Declared as the sequence
 * rather than as a union so that the type and the cycle cannot disagree: adding a member here
 * is the only edit needed to make the control reach it.
 */
export const SORT_ORDERS = ['number', 'stats'] as const

/** How the result sequence is ordered. */
export type SortOrder = typeof SORT_ORDERS[number]

/** One row of the result sequence: a species, and the index of the form its card draws. */
export interface Result {
  readonly species: Species
  readonly formIndex: number
}

const search = ref('')
const typeFilter = ref<TypeName | null>(null)
const sortOrder = ref<SortOrder>(SORT_ORDERS[0])

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
  const rows: Result[] = []
  for (const species of dex.species) {
    if (!matchesSearch(species, tokens)) continue
    if (!matchesType(species, type)) continue
    rows.push({ species, formIndex: matchingFormIndex(species, type, tokens) })
  }
  return sortRows(rows, sortOrder.value)
})

/** Return every control to its initial value. */
export function resetQuery(): void {
  search.value = ''
  typeFilter.value = null
  sortOrder.value = SORT_ORDERS[0]
}

/**
 * Advance the sort order to the next member of the sort set, wrapping at the end.
 *
 * The query bar states the sort order as a single control carrying the name of the order in
 * force, rather than one control per member: a full row spent on a two-member choice costs
 * more vertical space than the card grid can afford on a handheld.
 */
export function cycleSort(): void {
  const next = (SORT_ORDERS.indexOf(sortOrder.value) + 1) % SORT_ORDERS.length
  sortOrder.value = SORT_ORDERS[next]!
}

export { search, sortOrder, typeFilter }
