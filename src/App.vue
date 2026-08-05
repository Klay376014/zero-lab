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
            <!-- Press feedback is bound on the element, never on a component, so the landing
                 point is certain rather than dependent on attribute fall-through. All three
                 touch bindings go together: cancel is what releases a press that became a
                 scroll. -->
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
    <!-- Keyed on the species so that replacing one with another — which the learner list does
         without the panel closing in between — is an unmount and a mount rather than a content
         update in place. That is what makes the panel's three mount consequences hold for a
         replacement too, the load-bearing one being that the content starts at the top: a
         reader arriving from the learnset table would otherwise land partway down the new
         species' panel. Reaching the same result by writing the scroll position is forbidden.

         The key is the species' number, not the form index: switching form deliberately keeps
         the scroll position, and replacing the selection with the species already selected
         must not remount. -->
    <SpeciesDetail
      v-if="selected"
      :key="selected.d"
      :species="selected"
      :form-index="selectedFormIndex"
    />

    <!-- A sibling of the detail overlay, not a section inside it. The list carries its own
         scrolling container, and the panel is allowed exactly two — placing it inside would be
         a third, and the style check cannot see that. Later in source order so it draws above
         the panel without either layer declaring a stacking order. -->
    <MoveLearners v-if="openMove !== null" :move-index="openMove" />
  </view>
</template>
