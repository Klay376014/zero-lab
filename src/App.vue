<script setup lang="ts">
/**
 * The root: one of two tabs inside the screen, and the layer stack drawn above it.
 *
 * The tab decides what fills the screen; the stack decides what covers it. The two are separate
 * modules because they change independently — switching tabs leaves every open layer and its
 * content untouched, and opening a layer leaves the active tab untouched.
 *
 * Layers are rendered from the stack rather than from a flag per layer kind. A flag per kind is
 * what allowed a layer to be open while the thing holding its content reported nothing, with no
 * check able to see the disagreement; here the stack is the only answer to both what is open and
 * what it is about, and the order it holds is the order they draw in.
 */
import { computed } from 'vue-lynx'

import './App.css'
import { onPressEnd, onPressStart } from './interaction/press.js'
import DexGrid from './components/DexGrid.vue'
import MoveDetail from './components/MoveDetail.vue'
import MoveIndex from './components/MoveIndex.vue'
import MoveLearners from './components/MoveLearners.vue'
import QueryBar from './components/QueryBar.vue'
import SpeciesDetail from './components/SpeciesDetail.vue'
import TabDeck from './components/TabDeck.vue'
import { dex } from './data/dex.js'
import { moveCountLabel, resultCountLabel, t } from './data/i18n.js'
import { cycleMode, lang, mode, toggleLang, tokenStyle } from './state/display.js'
import type { Layer } from './state/layerStack.js'
import { layers } from './state/layerStack.js'
import { results } from './state/query.js'
import { activeTab } from './state/tabs.js'

/**
 * The masthead states what the active tab is showing.
 *
 * On the moves tab that is the size of the move table, read from the meta block rather than
 * counted here — the dex tab's result count is a statement about the query and would be a wrong
 * answer to a tab that has no query.
 */
const subtitle = computed(() => (
  activeTab.value === 'dex'
    ? resultCountLabel(results.value.length, dex.meta.species, lang.value)
    : moveCountLabel(dex.meta.moves, lang.value)
))

/**
 * A layer's identity for the render, its kind plus what it is about.
 *
 * The content has to be in the key, not just the kind. Keyed on the kind alone, an unwind that
 * replaces a layer's content reuses the mounted component — so the panel would keep the scroll
 * position of the species the reader just left, which is the behaviour the detail panel
 * deliberately does not have. Including the content remounts it at the top instead, while a form
 * switch, which changes neither, keeps it mounted.
 */
function layerKey(layer: Layer): string {
  return layer.kind === 'species'
    ? `species-${layer.species.d}`
    : `${layer.kind}-${layer.moveIndex}`
}
</script>

<template>
  <view class="Root" :style="tokenStyle">
    <view class="Shell">
      <view class="Screen">
        <view class="Masthead">
          <text class="Title">CHAMPIONS DEX</text>
          <view class="MastheadRow">
            <text class="Sub">{{ subtitle }}</text>
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

        <!-- The query bar belongs to the dex tab. The move index carries no query controls, and
             rendering the bar on that tab would offer controls with nothing to act on. -->
        <QueryBar v-if="activeTab === 'dex'" />
        <DexGrid v-if="activeTab === 'dex'" :results="results" />

        <MoveIndex v-if="activeTab === 'moves'" />
      </view>

      <!-- On the shell, outside the screen: these read as keys on the bezel rather than as
           another chip row in the display. -->
      <TabDeck />
    </view>

    <!-- Drawn in stack order, so a layer opened later covers the one beneath it. The key carries
         the layer's content as well as its kind — see layerKey. -->
    <template v-for="layer in layers" :key="layerKey(layer)">
      <SpeciesDetail
        v-if="layer.kind === 'species'"
        :species="layer.species"
        :form-index="layer.formIndex"
      />
      <MoveDetail
        v-else-if="layer.kind === 'move'"
        :move-index="layer.moveIndex"
      />
      <MoveLearners
        v-else-if="layer.kind === 'learners'"
        :move-index="layer.moveIndex"
      />
    </template>
  </view>
</template>
