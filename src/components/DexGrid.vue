<script setup lang="ts">
/**
 * The species grid: every result of the active query, as cards.
 *
 * A plain scrolling container, not the platform's recycling list element, against that
 * element's own guidance: vue-lynx's list binding implements only append-at-end, so a
 * filtered sequence keeps stale items and a sorted one pairs cells with the wrong species.
 * See design/HANDOFF.md §12.13 for the evidence and the trigger for revisiting this.
 */
import { ref, watch } from 'vue-lynx'

import SpeciesCard from './SpeciesCard.vue'
import { t } from '../data/i18n.js'
import { lang } from '../state/display.js'
import type { Result } from '../state/query.js'
import { openDetail } from '../state/selection.js'

const props = defineProps<{
  /** The active query's results, each already paired with the form its card draws. */
  results: readonly Result[]
}>()

/** Milliseconds of delay added per card, carried over from the design document. */
const REVEAL_STEP_MS = 14

/** The index past which every card carries the same delay. */
const REVEAL_CAP_INDEX = 26

/**
 * Whether the staggered reveal is armed. Disarmed on the first query change, deliberately not
 * on a timer: laying out 208 cells can outlast any fixed window, which disarmed the reveal
 * before the platform had painted anything.
 */
const booting = ref(true)

watch(() => props.results, () => {
  booting.value = false
})

/**
 * The reveal delay for the card at `index`, in milliseconds. A resolved number, not a
 * custom property in `calc()`: that leans on two platform behaviours at once.
 */
function revealDelayMs(index: number): number {
  return Math.min(index, REVEAL_CAP_INDEX) * REVEAL_STEP_MS
}

/**
 * A card's reconciliation identity: species number and displayed form, never position. The
 * form index is load-bearing — a card holds its own sprite load state, which must not survive
 * a form change.
 */
function cardKey(result: Result): string {
  return `${result.species.d}-${result.formIndex}`
}

/** Opens the detail for a tapped cell, on the form that cell is displaying. */
function onCellTap(result: Result): void {
  openDetail(result.species, result.formIndex)
}
</script>

<template>
  <scroll-view class="DexGrid" scroll-orientation="vertical">
    <text v-if="results.length === 0" class="DexGridEmpty">{{ t('empty', lang) }}</text>

    <view v-else class="Cards">
      <!-- Tap bound on this cell, not the card component: a binding on a component reaches an
           element only by attribute fall-through. See design/HANDOFF.md §12.14. -->
      <view
        v-for="(result, index) in results"
        :key="cardKey(result)"
        :class="booting ? 'DexCell CardReveal' : 'DexCell'"
        :style="booting ? { animationDelay: `${revealDelayMs(index)}ms` } : undefined"
        @tap="onCellTap(result)"
      >
        <SpeciesCard :species="result.species" :form-index="result.formIndex" />
      </view>
    </view>
  </scroll-view>
</template>
