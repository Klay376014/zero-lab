/**
 * The species detail layer, under the names the grid and the panel already call it by.
 *
 * This module holds no state of its own any more. It reads the species layer out of the layer
 * stack and writes through to it, so there is exactly one answer to "which species is shown"
 * and it lives where the layer does. A second copy here could disagree with the stack — a
 * species selected while no layer is open, or the reverse — and nothing would report it, which
 * is the arrangement the `move-learners` capability rejects for the open move and there is no
 * reason to keep it for the selection.
 */
import { computed } from 'vue-lynx'

import type { Species } from '../data/dex.js'
import { closeTopLayer, layerOfKind, openLayer, setLayerContent } from './layerStack.js'

function clamp(species: Species, index: number): number {
  const last = species.f.length - 1
  if (!(index > 0)) return 0
  return Math.min(index, last)
}

const speciesLayer = computed(() => layerOfKind('species'))

const selected = computed<Species | null>(() => speciesLayer.value?.species ?? null)
const selectedFormIndex = computed(() => speciesLayer.value?.formIndex ?? 0)

export function openDetail(species: Species, formIndex: number): void {
  openLayer({ kind: 'species', species, formIndex: clamp(species, formIndex) })
}

export function selectForm(index: number): void {
  const layer = layerOfKind('species')
  if (layer === null) return
  setLayerContent({
    kind: 'species',
    species: layer.species,
    formIndex: clamp(layer.species, index),
  })
}

export function closeDetail(): void {
  closeTopLayer()
}

export { selected, selectedFormIndex }
