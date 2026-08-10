import { computed, ref } from 'vue-lynx'

import { allTypes, bestBst, dex, hasMega, searchHaystack } from '../data/dex.js'
import type { Species } from '../data/dex.js'
import { TYPE_ORDER, typeName } from '../data/types.js'
import type { TypeName } from '../data/types.js'

export const SORT_ORDERS = ['number', 'stats'] as const

export type SortOrder = typeof SORT_ORDERS[number]

export interface Result {
  readonly species: Species
  readonly formIndex: number
}

const search = ref('')

const typeFilters = ref<readonly TypeName[]>([])

const megaOnly = ref(false)

const multiOnly = ref(false)

const sortOrder = ref<SortOrder>(SORT_ORDERS[0])

function matchesSearch(species: Species, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true
  const haystack = searchHaystack(species)
  return tokens.every((token) => haystack.includes(token))
}

function tokenise(search: string): string[] {
  return search.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/** Types combine disjunctively: a second selection widens the result, not narrows it. */
function matchesTypes(species: Species, types: readonly TypeName[]): boolean {
  if (types.length === 0) return true
  const carried = allTypes(species)
  return types.some((type) => carried.includes(type))
}

/** First match wins: a named form, a named type, the type filter, mega-only, then the base form. */
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

function sortRows(rows: Result[], order: SortOrder): Result[] {
  if (order === 'stats') {
    return rows.sort((a, b) => bestBst(b.species) - bestBst(a.species))
  }
  return rows.sort((a, b) => a.species.d - b.species.d)
}

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

export function resetQuery(): void {
  search.value = ''
  typeFilters.value = []
  megaOnly.value = false
  multiOnly.value = false
  sortOrder.value = SORT_ORDERS[0]
}

export function toggleType(type: TypeName): void {
  typeFilters.value = typeFilters.value.includes(type)
    ? typeFilters.value.filter((selected) => selected !== type)
    : [...typeFilters.value, type]
}

export function isTypeSelected(type: TypeName): boolean {
  return typeFilters.value.includes(type)
}

export function toggleMegaOnly(): void {
  megaOnly.value = !megaOnly.value
}

export function toggleMultiOnly(): void {
  multiOnly.value = !multiOnly.value
}

export function cycleSort(): void {
  const next = (SORT_ORDERS.indexOf(sortOrder.value) + 1) % SORT_ORDERS.length
  sortOrder.value = SORT_ORDERS[next]!
}

export { megaOnly, multiOnly, search, sortOrder, typeFilters }
