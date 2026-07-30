// Kept out of query.ts so that `results` stays a pure derivation. This is the only place
// that clamps a form index.
import { ref } from 'vue-lynx'

import type { Species } from '../data/dex.js'

const selected = ref<Species | null>(null)
const selectedFormIndex = ref(0)

/** `index` brought inside the range `species` allows. Clamped rather than rejected. */
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
