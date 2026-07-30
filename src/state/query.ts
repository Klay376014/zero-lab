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

import { allTypes, bestBst, dex, searchHaystack } from '../data/dex.js'
import type { Species } from '../data/dex.js'
import { TYPE_ORDER, typeName } from '../data/types.js'
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
 * Whether `species` matches every one of `tokens`, which are already lower-cased.
 *
 * Matched against the species' whole haystack — names in both languages, category, number,
 * generation, every form label and every type in both languages. Whichever language is
 * leading, all of it is searched: the toggle changes which name reads first, and it must not
 * change which species are reachable, or a language switch silently empties a query the user
 * already typed.
 *
 * Every token has to land, and each may land somewhere different. That is the point — the
 * field's placeholder offers name, number, type and form, and `mega charizard` names two of
 * them at once. Matching the raw string as one substring finds nothing, because no single
 * field holds both words.
 *
 * Lower-casing leaves CJK unchanged, so the Chinese comparison works against the same tokens
 * without a second pass.
 */
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
 * Which form the card draws for `species` under the active query.
 *
 * A grid answering a Dragon query with Fire/Flying artwork reads as broken, so the card shows
 * the form that answers whatever the query identified most specifically. Four rules, first one
 * that yields a form wins: a named form, a named type, the type filter, then the base form.
 *
 * The tokens the species' own two names already satisfy are discarded before any form label is
 * tested, and that step is the whole reason this is not the design document's version of the
 * rule. A Mega's label embeds the species name — `Mega Charizard X` contains `charizard` —
 * while a base form carries no label at all, so testing the raw tokens makes a plain
 * species-name query select the Mega. The design document does exactly that.
 *
 * The consequence worth understanding before changing any of it: a search for 龍 shows
 * Charizard's base form, because 龍 sits inside 噴火龍 and so is discarded, while a search for
 * `dragon` shows Mega Charizard X, because `dragon` can only be naming a type. The card
 * answers whichever thing the query actually picked out. That asymmetry is the design, not an
 * inconsistency to iron out.
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

    // Whole-token comparison, not a substring: a token that merely contains a type name is not
    // naming that type. Without this, 龍 would be read as Dragon inside any word holding it.
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
