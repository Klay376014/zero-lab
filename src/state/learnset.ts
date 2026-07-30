// Held here rather than in the table, and deliberately not reset on close: the panel is
// unmounted on close, so state inside it would not survive from one species to the next.
import { ref } from 'vue-lynx'

/** How the rows are ordered. Named apart from the query state's `SortOrder`, which is the grid's. */
export type MoveSort = 'name' | 'power' | 'type'

const moveSort = ref<MoveSort>('name')
const bonusOnly = ref(false)

/** Return both controls to their initial values. Not called on panel close. */
export function resetLearnsetView(): void {
  moveSort.value = 'name'
  bonusOnly.value = false
}

export { bonusOnly, moveSort }
