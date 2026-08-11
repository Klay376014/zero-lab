/**
 * The ordered stack of layers drawn above the active tab.
 *
 * There are exactly three kinds — species detail, move detail, the learner list — and the
 * navigation between them is a cycle: species detail leads to a move, a move leads to its
 * learners, and a learner leads back to species detail. Pushing on every opening would let a
 * reader following related entries accumulate layers without bound.
 *
 * So a kind holds at most one instance. Opening a kind already in the stack unwinds to it and
 * replaces its content instead of pushing a second one, which bounds the depth at three by
 * construction rather than by a limit. The rejected alternative was a cap that refuses to open
 * past N: that turns a legitimate navigation step into a failure, and the reader has no way to
 * tell why the tap did nothing.
 *
 * A layer is identified by what it is about — a species and its form, or a move index — never
 * by where it sits. Position identifies a different layer under each stack shape, which is
 * exactly the confusion a windowed list or an unwind produces.
 *
 * This module owns the content of every open layer. Nothing else may hold "which move's
 * learners are open" or "which species is shown": a second holder of the same fact can disagree
 * with this one — a layer in the stack while the other reports none, or the reverse — and
 * nothing would detect it. `src/state/selection.ts` reads the species layer from here rather
 * than keeping its own copy, for that reason.
 */
import { computed, shallowRef } from 'vue-lynx'

import type { Species } from '../data/dex.js'

export type LayerKind = 'species' | 'move' | 'learners'

export interface SpeciesLayer {
  readonly kind: 'species'
  readonly species: Species
  readonly formIndex: number
}

export interface MoveLayer {
  readonly kind: 'move'
  readonly moveIndex: number
}

export interface LearnersLayer {
  readonly kind: 'learners'
  readonly moveIndex: number
}

export type Layer = SpeciesLayer | MoveLayer | LearnersLayer

/** The bound this module's rule produces, stated so a test can assert it. */
export const MAX_DEPTH = 3

/**
 * Shallow, and every write below replaces the array rather than mutating it.
 *
 * A deep `ref` would wrap each layer — and the `Species` inside it — in a reactive proxy, so
 * the species this module handed back would not be the one the dataset holds. Two things break
 * on that: `dex.ts` memoises `allTypes` and `searchHaystack` in a `Map` keyed by species
 * identity, which a proxy misses, and the spec's own requirement is that a layer reports the
 * content it was opened with. Neither failure announces itself — the values compare equal.
 */
const layers = shallowRef<Layer[]>([])

const depth = computed(() => layers.value.length)

const topLayer = computed<Layer | null>(() => layers.value[layers.value.length - 1] ?? null)

function indexOfKind(kind: LayerKind): number {
  return layers.value.findIndex((layer) => layer.kind === kind)
}

export function layerOfKind<K extends LayerKind>(
  kind: K,
): Extract<Layer, { kind: K }> | null {
  const found = layers.value.find((layer) => layer.kind === kind)
  return (found ?? null) as Extract<Layer, { kind: K }> | null
}

export function hasLayer(kind: LayerKind): boolean {
  return indexOfKind(kind) >= 0
}

/**
 * Opens a layer, or unwinds to the one of its kind and replaces its content.
 *
 * The discarded layers are dropped, not remembered: no history is kept beyond the stack itself,
 * so closing afterwards cannot bring one back.
 */
export function openLayer(layer: Layer): void {
  const at = indexOfKind(layer.kind)
  if (at < 0) {
    layers.value = [...layers.value, layer]
    return
  }
  layers.value = [...layers.value.slice(0, at), layer]
}

/**
 * Replaces the content of an already-open layer in place, keeping the layers above it.
 *
 * Distinct from {@link openLayer}, which unwinds. Switching form inside species detail changes
 * what that layer is about without navigating: nothing above it has become stale. The two
 * happen to behave alike today, because the form switcher is only reachable while species
 * detail is topmost — a coincidence of the current layout, not a property worth depending on.
 */
export function setLayerContent(layer: Layer): void {
  const at = indexOfKind(layer.kind)
  if (at < 0) return
  const next = [...layers.value]
  next[at] = layer
  layers.value = next
}

/** Removes the topmost layer only, leaving everything beneath it and its content untouched. */
export function closeTopLayer(): void {
  if (layers.value.length === 0) return
  layers.value = layers.value.slice(0, -1)
}

/** Clears the stack. Not reachable from the interface — for test setup. */
export function resetLayers(): void {
  layers.value = []
}

export { depth, layers, topLayer }
