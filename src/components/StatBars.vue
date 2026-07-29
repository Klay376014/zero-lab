<script setup lang="ts">
/**
 * One form's six base stats and their total.
 *
 * Takes the six numbers and nothing else: it has no reason to know which species or form they
 * belong to, and keeping it that way means the panel can hand it any stat line.
 */
import { computed } from 'vue-lynx'

import { statLabels, t } from '../data/i18n.js'
import type { StatLine } from '../data/dex.js'
import { lang } from '../state/display.js'

const props = defineProps<{
  stats: StatLine
}>()

/**
 * The ceiling a bar is drawn against, carried over from the design document.
 *
 * Above the highest single stat in the dataset, so no bar is ever clipped, and low enough that
 * ordinary stats still occupy a readable share of the bar. Not the theoretical maximum — that
 * would leave every real stat in the left third.
 */
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

/**
 * The bar's fill as a percentage of the row, not a pixel width: the panel's width is relative,
 * so a pixel width would mean a different proportion on every screen.
 */
function fillPercent(value: number): string {
  const share = Math.round(Math.min(value, STAT_MAX) / STAT_MAX * 100)
  return `${Math.max(MIN_FILL_PERCENT, share)}%`
}
</script>

<template>
  <view class="Stats">
    <text class="StatsHead">{{ t('secStats', lang) }}</text>

    <!--
      The form's best stat earns emphasis through colour and bar weight only. Nothing here
      changes a row's height between the emphasised state and the plain one — a row that grew
      would make the whole block jump as the displayed form changes.
    -->
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
