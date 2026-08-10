<script setup lang="ts">
import { computed } from 'vue-lynx'

import { statLabels, t } from '../data/i18n.js'
import type { StatLine } from '../data/dex.js'
import { lang } from '../state/display.js'

const props = defineProps<{
  stats: StatLine
}>()

const STAT_MAX = 230

const MIN_FILL_PERCENT = 2

const total = computed(() => {
  let sum = 0
  for (const value of props.stats) sum += value
  return sum
})

const peak = computed(() => Math.max(...props.stats))

const labels = computed(() => statLabels(lang.value))

function fillPercent(value: number): string {
  const share = Math.round(Math.min(value, STAT_MAX) / STAT_MAX * 100)
  return `${Math.max(MIN_FILL_PERCENT, share)}%`
}
</script>

<template>
  <view class="Stats">
    <text class="StatsHead">{{ t('secStats', lang) }}</text>

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
