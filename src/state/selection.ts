import { ref } from 'vue-lynx'

import type { Species } from '../data/dex.js'

const selected = ref<Species | null>(null)
const selectedFormIndex = ref(0)

function clamp(species: Species, index: number): number {
  const last = species.f.length - 1
  if (!(index > 0)) return 0
  return Math.min(index, last)
}

export function openDetail(species: Species, formIndex: number): void {
  selected.value = species
  selectedFormIndex.value = clamp(species, formIndex)
}

export function selectForm(index: number): void {
  const species = selected.value
  if (species === null) return
  selectedFormIndex.value = clamp(species, index)
}

export function closeDetail(): void {
  selected.value = null
  selectedFormIndex.value = 0
}

export { selected, selectedFormIndex }
