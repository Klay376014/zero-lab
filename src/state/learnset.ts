/**
 * How the learnset table is ordered, and whether it is filtered to the bonus moves.
 *
 * Module-level refs, for the same reason the display, query and selection state use them.
 *
 * Kept out of `selection.ts` deliberately: that module answers which species and which form,
 * and owns the clamping that goes with a form index. A sort preference is not part of a
 * selection — it outlives every selection made under it.
 *
 * Neither value is reset when the panel closes. The panel is mounted on open and unmounted
 * on close, so state held inside the table would return to its default every time it opened,
 * and a reader who set the order to power did so in order to compare several species under
 * it. The design document keeps both across species for the same reason.
 */
import { ref } from 'vue-lynx'

/**
 * How the rows are ordered. A closed set: the table offers exactly these three.
 *
 * Named `MoveSort` rather than `SortOrder` because the query state already exports that name
 * for the grid's own order, and a component reading both would otherwise import two
 * different types under one word.
 */
export type MoveSort = 'name' | 'power' | 'type'

const moveSort = ref<MoveSort>('name')
const bonusOnly = ref(false)

/**
 * Return both controls to their initial values.
 *
 * Not called on panel close — see the module note. It exists so the pair has one definition
 * of its initial state rather than two literals repeated at each call site.
 */
export function resetLearnsetView(): void {
  moveSort.value = 'name'
  bonusOnly.value = false
}

export { bonusOnly, moveSort }
