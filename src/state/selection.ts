/**
 * Which species the detail panel is open on, and which of its forms it shows.
 *
 * Module-level refs, for the same reason the display and query state use them. Kept apart
 * from the query state deliberately: a query is a statement about the whole set and its
 * result is a pure derivation, while a selection is a statement about one item and is
 * mutable. Putting the selection in `query.ts` would make `results` no longer purely
 * derived.
 *
 * This module is the only place that clamps the form index. Every caller hands it an index
 * from somewhere else — the query layer's form matching, or a switcher button — and none of
 * them should have to know how many forms the species has.
 */
import { ref } from 'vue-lynx'

import type { Species } from '../data/dex.js'

const selected = ref<Species | null>(null)
const selectedFormIndex = ref(0)

/**
 * `index` brought inside the range `species` allows.
 *
 * Clamped rather than rejected. An out-of-range index means the selection and the query
 * layer have gone out of step, and showing the species' first form is a better outcome than
 * a panel that fails to open — the caller has no recovery for the latter, and the user sees
 * a control that did nothing.
 */
function clamp(species: Species, index: number): number {
  const last = species.f.length - 1
  if (!(index > 0)) return 0 // also catches NaN, which Math.min would carry through
  return Math.min(index, last)
}

/** Open the detail for `species` on the form at `formIndex`. */
export function openDetail(species: Species, formIndex: number): void {
  selected.value = species
  selectedFormIndex.value = clamp(species, formIndex)
}

/** Show another of the selected species' forms. Does nothing when nothing is selected. */
export function selectForm(index: number): void {
  const species = selected.value
  if (species === null) return
  selectedFormIndex.value = clamp(species, index)
}

/** Close the detail, clearing the species and the form index together. */
export function closeDetail(): void {
  selected.value = null
  selectedFormIndex.value = 0
}

export { selected, selectedFormIndex }
