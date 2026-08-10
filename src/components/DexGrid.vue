<script setup lang="ts">
import { ref, watch } from 'vue-lynx'

import DexFooter from './DexFooter.vue'
import SpeciesCard from './SpeciesCard.vue'
import { t } from '../data/i18n.js'
import { lang } from '../state/display.js'
import type { Result } from '../state/query.js'
import { openDetail } from '../state/selection.js'

const props = defineProps<{
  results: readonly Result[]
}>()

const REVEAL_STEP_MS = 14

const REVEAL_CAP_INDEX = 26

const booting = ref(true)

watch(() => props.results, () => {
  booting.value = false
})

function revealDelayMs(index: number): number {
  return Math.min(index, REVEAL_CAP_INDEX) * REVEAL_STEP_MS
}

function cardKey(result: Result): string {
  return `${result.species.d}-${result.formIndex}`
}

function onCellTap(result: Result): void {
  openDetail(result.species, result.formIndex)
}
</script>

<template>
  <scroll-view class="DexGrid" scroll-orientation="vertical">
    <text v-if="results.length === 0" class="DexGridEmpty">{{ t('empty', lang) }}</text>

    <view v-else class="Cards">
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

    <DexFooter />
  </scroll-view>
</template>
