<script setup lang="ts">
/**
 * The six provenance segments: where each part of the dataset came from, the font licensing,
 * and the copyright notice.
 *
 * Rendered inside the grid's scrolling container rather than as a fixed region, so it is
 * reached by the same gesture that scrolls the roster. It carries no scrolling container of
 * its own — the panel's one nested-scroll exemption is the learnset table, and this side has
 * no reason to open a second.
 */
import { computed } from 'vue-lynx'

import { footerSegments } from '../data/i18n.js'
import { lang } from '../state/display.js'

const segments = computed(() => footerSegments(lang.value))
</script>

<template>
  <view class="DexFooter">
    <view v-for="segment in segments" :key="segment.heading" class="FooterSegment">
      <text class="FooterHeading">{{ segment.heading }}</text>
      <text class="FooterBody">{{ segment.body }}</text>
    </view>
  </view>
</template>
