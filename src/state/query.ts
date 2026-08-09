import { computed, ref } from 'vue-lynx'

import { allTypes, bestBst, dex, hasMega, searchHaystack } from '../data/dex.js'
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

/**
 * The selected types, held as a list that is replaced whole rather than mutated.
 *
 * Deliberately not a reactive `Set`. Nothing in this project has ever put a Set or Map into
 * reactive state — every one of them is a non-reactive cache or a local computation — so
 * whether a collection proxy notifies on `add` is unmeasured here. The failure that would
 * produce is the platform's usual shape: the call succeeds, nothing errors, and the grid
 * simply does not update. Replacing the value sidesteps the question, and at eighteen possible
 * members the copy costs nothing.
 *
 * Plural on purpose. A singular name holding a collection is what makes the next reader take
 * this for a single-selection filter.
 */
const typeFilters = ref<readonly TypeName[]>([])

/** Keep only species having a Mega form. Independent of `multiOnly`; both may be set. */
const megaOnly = ref(false)

/** Keep only species having more than one form. */
const multiOnly = ref(false)

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

/**
 * Whether `species` carries any of `types` on any of its forms.
 *
 * The selected types combine disjunctively: a second selection widens the result rather than
 * narrowing it. Requiring every selected type would empty the grid for most pairs, which reads
 * as a broken control rather than as a precise query.
 */
function matchesTypes(species: Species, types: readonly TypeName[]): boolean {
  if (types.length === 0) return true
  const carried = allTypes(species)
  return types.some((type) => carried.includes(type))
}

/**
 * Which form the card draws for `species` under the active query. Five rules, first match
 * wins: a named form, a named type, the type filter, the Mega-only filter, then the base form.
 *
 * Tokens the species' own names already satisfy are discarded first — a Mega's label embeds
 * the species name, so testing raw tokens makes a plain name query select the Mega.
 *
 * The Mega rule sits below the type rule, not above it: a selected type is a type the reader
 * named, while the Mega flag names no form at all, so when both are active the card answers
 * the more specific of the two.
 */
function matchingFormIndex(
  species: Species,
  types: readonly TypeName[],
  megaWanted: boolean,
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

  if (types.length > 0) {
    const filtered = species.f.findIndex((form) => types.some((type) => form.t.includes(type)))
    if (filtered !== -1) return filtered
  }

  if (megaWanted) {
    const mega = species.f.findIndex((form) => form.k === 'mega')
    if (mega !== -1) return mega
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

/**
 * The species matching the active query, each paired with the form its card draws.
 *
 * The four conditions combine conjunctively — each one only ever narrows. Disjunction lives
 * inside the type condition alone, among the selected types.
 */
export const results = computed<Result[]>(() => {
  const tokens = tokenise(search.value)
  const types = typeFilters.value
  const mega = megaOnly.value
  const multi = multiOnly.value
  const rows: Result[] = []
  for (const species of dex.species) {
    if (!matchesSearch(species, tokens)) continue
    if (!matchesTypes(species, types)) continue
    if (mega && !hasMega(species)) continue
    if (multi && species.f.length < 2) continue
    rows.push({ species, formIndex: matchingFormIndex(species, types, mega, tokens) })
  }
  return sortRows(rows, sortOrder.value)
})

/** Return every control to its initial value. */
export function resetQuery(): void {
  search.value = ''
  typeFilters.value = []
  megaOnly.value = false
  multiOnly.value = false
  sortOrder.value = SORT_ORDERS[0]
}

/**
 * Add `type` to the selection, or remove it when already selected — so selecting a selected
 * type is how one type is cleared, and no separate control is needed for it.
 *
 * Builds a new list rather than mutating the current one. See `typeFilters` for why.
 */
export function toggleType(type: TypeName): void {
  typeFilters.value = typeFilters.value.includes(type)
    ? typeFilters.value.filter((selected) => selected !== type)
    : [...typeFilters.value, type]
}

/** Whether `type` is in the selection. */
export function isTypeSelected(type: TypeName): boolean {
  return typeFilters.value.includes(type)
}

/** Flip the Mega-only filter. Leaves every other control alone. */
export function toggleMegaOnly(): void {
  megaOnly.value = !megaOnly.value
}

/** Flip the multi-form-only filter. Leaves every other control alone. */
export function toggleMultiOnly(): void {
  multiOnly.value = !multiOnly.value
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

export { megaOnly, multiOnly, search, sortOrder, typeFilters }
