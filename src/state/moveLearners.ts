// Held apart from selection.ts rather than inside it: the two close independently. Closing the
// learner list must leave the selection alone, and choosing from the list replaces the selection
// while the list is closing. One module holding both would have to express that as a rule; two
// modules express it by construction.
import { ref } from 'vue-lynx'

/** The move whose learners are being viewed, as an index into the shared move table. */
const openMove = ref<number | null>(null)

/** Show the species that learn the move at `index`. */
export function openMoveLearners(index: number): void {
  openMove.value = index
}

/** Dismiss the list. The species selection is deliberately untouched. */
export function closeMoveLearners(): void {
  openMove.value = null
}

export { openMove }
