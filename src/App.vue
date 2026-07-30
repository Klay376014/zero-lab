<script setup lang="ts">
import { computed } from 'vue-lynx'

import './App.css'
import DexGrid from './components/DexGrid.vue'
import QueryBar from './components/QueryBar.vue'
import SpeciesDetail from './components/SpeciesDetail.vue'
import { dex } from './data/dex.js'
import { resultCountLabel, t } from './data/i18n.js'
import { cycleMode, lang, mode, toggleLang, tokenStyle } from './state/display.js'
import { results } from './state/query.js'
import { selected, selectedFormIndex } from './state/selection.js'

/**
 * The dataset's scale, as four figures with their labels.
 *
 * Order is fixed here rather than taken from the meta block's field order: the four read as a
 * progression from the coarsest unit to the finest, and a reordering makes the row read as an
 * arbitrary list. Every figure comes from the meta block, which the data layer asserts at load.
 */
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
            <view class="Chip" @tap="cycleMode">
              <text class="ChipText">{{ mode.id }}</text>
            </view>
            <view class="Chip" @tap="toggleLang">
              <text class="ChipText">{{ t('lang', lang) }}</text>
            </view>
          </view>

          <!-- Its own row rather than beside the title: four blocks and the title do not fit a
               handheld width. Inside the masthead, so it stays put while the cards scroll. -->
          <view class="Tally">
            <view v-for="item in tally" :key="item.key" class="TallyItem">
              <text class="TallyFigure">{{ item.figure }}</text>
              <text class="TallyLabel">{{ item.label }}</text>
            </view>
          </view>
        </view>

        <QueryBar />

        <DexGrid :results="results" />
      </view>
    </view>

    <!-- A sibling of the shell: the overlay is positioned against this root view, so anything
         between them would confine it. -->
    <SpeciesDetail
      v-if="selected"
      :species="selected"
      :form-index="selectedFormIndex"
    />
  </view>
</template>
