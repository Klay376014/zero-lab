import { ref } from 'vue-lynx'

export type MoveSort = 'name' | 'power' | 'type'

const moveSort = ref<MoveSort>('name')
const bonusOnly = ref(false)

export function resetLearnsetView(): void {
  moveSort.value = 'name'
  bonusOnly.value = false
}

export { bonusOnly, moveSort }
