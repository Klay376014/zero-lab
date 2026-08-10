<script setup lang="ts">
import { computed } from 'vue-lynx'

import './App.css'
import { onPressEnd, onPressStart } from './interaction/press.js'
import DexGrid from './components/DexGrid.vue'
import MoveLearners from './components/MoveLearners.vue'
import QueryBar from './components/QueryBar.vue'
import SpeciesDetail from './components/SpeciesDetail.vue'
import { dex } from './data/dex.js'
import { resultCountLabel, t } from './data/i18n.js'
import { cycleMode, lang, mode, toggleLang, tokenStyle } from './state/display.js'
import { openMove } from './state/moveLearners.js'
import { results } from './state/query.js'
import { selected, selectedFormIndex } from './state/selection.js'

const tally = computed(() => [
  { key: 'species', figure: dex.meta.species, label: t('tSpecies', lang.value) },
  { key: 'forms', figure: dex.meta.formEntries, label: t('tForms', lang.value) },
  { key: 'mega', figure: dex.meta.megas, label: t('tMega', lang.value) },
  { key: 'moves', figure: dex.meta.moves, label: t('tMoves', lang.value) },
])

</script>

<template>
  <view class="Root" :style="tokenStyle">
    <view class="Shell">
      <view class="Screen">
        <view class="Masthead">
          <text class="Title">CHAMPIONS DEX</text>
          <view class="MastheadRow">
            <text class="Sub">{{ resultCountLabel(results.length, dex.meta.species, lang) }}</text>
            <view
              class="Chip"
              :main-thread-bindtouchstart="onPressStart"
              :main-thread-bindtouchend="onPressEnd"
              :main-thread-bindtouchcancel="onPressEnd"
              @tap="cycleMode"
            >
              <text class="ChipText">{{ mode.id }}</text>
            </view>
            <view
              class="Chip"
              :main-thread-bindtouchstart="onPressStart"
              :main-thread-bindtouchend="onPressEnd"
              :main-thread-bindtouchcancel="onPressEnd"
              @tap="toggleLang"
            >
              <text class="ChipText">{{ t('lang', lang) }}</text>
            </view>
          </view>
        </view>

        <QueryBar />

        <DexGrid :results="results" />
      </view>
    </view>

    <!-- Keyed on species number: switching form keeps the panel mounted and its scroll
         position; replacing the species remounts it scrolled to the top. -->
    <SpeciesDetail
      v-if="selected"
      :key="selected.d"
      :species="selected"
      :form-index="selectedFormIndex"
    />

    <MoveLearners v-if="openMove !== null" :move-index="openMove" />
  </view>
</template>
