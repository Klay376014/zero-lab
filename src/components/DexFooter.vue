<script setup lang="ts">
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
