<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx'

import DexFooter from './DexFooter.vue'
import SpeciesCard from './SpeciesCard.vue'
import { t } from '../data/i18n.js'
import { lang } from '../state/display.js'
import type { Result } from '../state/query.js'
import { CARD_ROW, BUFFER_SCREENS } from '../state/rowMetrics.js'
import { openDetail } from '../state/selection.js'
import { viewportHeight } from '../state/viewport.js'
import type { Range } from '../state/visibleRange.js'
import { sliceForRange, visibleRange } from '../state/visibleRange.js'

const props = defineProps<{
  results: readonly Result[]
}>()

const REVEAL_STEP_MS = 14

const REVEAL_CAP_INDEX = 26

const booting = ref(true)

watch(() => props.results, () => {
  booting.value = false
})

/**
 * Only the cards within reach are made. The platform charges about 1.3 ms per element created and
 * an unfiltered grid holds around four thousand of them, all paid before anything appears
 * (design/HANDOFF.md §12.24).
 *
 * The offset is the container's own report rather than anything read back off an element, and
 * nothing here ever tells the container where to go — a reactive update leaves the scroll position
 * alone, and code that manages it is rejected for this project.
 */
let offset = 0

function rangeAt(scrollTop: number): Range {
  return visibleRange({
    offset: scrollTop,
    visible: viewportHeight(),
    itemHeight: CARD_ROW.height,
    perRow: CARD_ROW.perRow,
    total: props.results.length,
    bufferScreens: BUFFER_SCREENS,
  })
}

/**
 * Held as state rather than derived from the offset, so that a scroll which does not change the
 * range does not produce a new object and re-render the grid. Within one row's travel the set of
 * cards is identical, and the platform reports far more often than that (241 reports over one
 * traverse, §12.25). No timer paces this — §12.14 measured that waiting a fixed span after an
 * event is unreliable here, and index granularity already bounds how often a render can happen.
 */
const range = ref<Range>(rangeAt(0))

function commit(next: Range): void {
  if (next.first === range.value.first && next.last === range.value.last) return
  range.value = next
}

// A filter or a sort changes the length under a scroll position that was valid for the old one.
// The derivation clamps to the new total; nothing here tells the container to move.
watch(() => props.results, () => { commit(rangeAt(offset)) })

const shown = computed(() => sliceForRange(props.results, range.value))

function onScroll(event: unknown): void {
  const source = event as Record<string, unknown>
  const detail = { ...source, ...((source.detail ?? {}) as Record<string, unknown>) }
  const top = detail.scrollTop
  if (typeof top !== 'number') return
  offset = top
  commit(rangeAt(top))
}

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
  <scroll-view class="DexGrid" scroll-orientation="vertical" @scroll="onScroll">
    <text v-if="results.length === 0" class="DexGridEmpty">{{ t('empty', lang) }}</text>

    <view v-else class="Cards">
      <!-- The rows before and after the rendered range, so the scrollable extent stays the one
           the whole sequence would occupy and a card sits at the same offset either way. -->
      <view class="GridSpacer" :style="{ height: `${range.leading}px` }" />

      <view
        v-for="(result, index) in shown"
        :key="cardKey(result)"
        :class="booting ? 'DexCell CardReveal' : 'DexCell'"
        :style="booting ? { animationDelay: `${revealDelayMs(index)}ms` } : undefined"
        @tap="onCellTap(result)"
      >
        <SpeciesCard :species="result.species" :form-index="result.formIndex" />
      </view>

      <view class="GridSpacer" :style="{ height: `${range.trailing}px` }" />
    </view>

    <DexFooter />
  </scroll-view>
</template>
