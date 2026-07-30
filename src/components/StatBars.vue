<script setup lang="ts">
import { computed } from 'vue-lynx'

import { statLabels, t } from '../data/i18n.js'
import type { StatLine } from '../data/dex.js'
import { lang } from '../state/display.js'

const props = defineProps<{
  stats: StatLine
}>()

/** The ceiling a bar is drawn against: above the dataset's highest single stat, so none clips. */
const STAT_MAX = 230

/** Below this the fill would be invisible, which reads as a missing bar rather than a low one. */
const MIN_FILL_PERCENT = 2

const total = computed(() => {
  let sum = 0
  for (const value of props.stats) sum += value
  return sum
})

const peak = computed(() => Math.max(...props.stats))

const labels = computed(() => statLabels(lang.value))

/** The bar's fill as a percentage of the row, not a pixel width — the panel's width is relative. */
function fillPercent(value: number): string {
  const share = Math.round(Math.min(value, STAT_MAX) / STAT_MAX * 100)
  return `${Math.max(MIN_FILL_PERCENT, share)}%`
}
</script>

<template>
  <view class="Stats">
    <text class="StatsHead">{{ t('secStats', lang) }}</text>

    <!-- The peak stat is emphasised by colour and weight only: a row that changed height would
         make the block jump as the displayed form changes. -->
    <view
      v-for="(value, index) in stats"
      :key="index"
      class="StatRow"
    >
      <text :class="value === peak ? 'StatKey StatKeyPeak' : 'StatKey'">
        {{ labels[index] }}
      </text>
      <text :class="value === peak ? 'StatValue StatValuePeak' : 'StatValue'">
        {{ value }}
      </text>
      <view class="StatBar">
        <view
          :class="value === peak ? 'StatFill StatFillPeak' : 'StatFill'"
          :style="{ width: fillPercent(value) }"
        />
      </view>
    </view>

    <view class="StatTotal">
      <text class="StatTotalKey">{{ t('total', lang) }}</text>
      <text class="StatTotalValue">{{ total }}</text>
    </view>
  </view>
</template>
