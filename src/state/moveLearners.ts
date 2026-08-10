import { ref } from 'vue-lynx'

const openMove = ref<number | null>(null)

export function openMoveLearners(index: number): void {
  openMove.value = index
}

export function closeMoveLearners(): void {
  openMove.value = null
}

export { openMove }
