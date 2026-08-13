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
import MoveFilterBar from './components/MoveFilterBar.vue'
import MoveIndex from './components/MoveIndex.vue'
import MoveLearners from './components/MoveLearners.vue'
import QueryBar from './components/QueryBar.vue'
import SpeciesDetail from './components/SpeciesDetail.vue'
import TabDeck from './components/TabDeck.vue'
import ThemeMenu from './components/ThemeMenu.vue'
import { dex } from './data/dex.js'
import { moveResultCountLabel, resultCountLabel, t } from './data/i18n.js'
import { closeThemeMenu, lang, themeMenuOpen, toggleLang, tokenStyle } from './state/display.js'
import type { Layer } from './state/layerStack.js'
import { layers } from './state/layerStack.js'
import { moveResults } from './state/moveQuery.js'
import { results } from './state/query.js'
import { activeTab } from './state/tabs.js'

/**
 * The masthead states what the active tab is showing.
 *
 * Both tabs state a result count: matched, the dataset's total for the unit, and the unit. Each
 * total is read from the meta block rather than counted here.
 *
 * The moves tab stated the move table's size until it had conditions to answer for. A matched
 * count would have been an answer to a question nobody had asked; now that the conditions can
 * shorten the sequence, the size alone leaves a reader who has filtered unable to tell a narrow
 * result from a broken one.
 */
const subtitle = computed(() => (
  activeTab.value === 'dex'
    ? resultCountLabel(results.value.length, dex.meta.species, lang.value)
    : moveResultCountLabel(moveResults.value.length, dex.meta.moves, lang.value)
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
            <ThemeMenu />
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

        <!-- One bar per tab, and neither crosses over: the query bar's sort orders and its
             Mega-only and multi-form-only filters are statements about species, which the move
             table has no answer for, and the filter row's damage classes have no meaning for a
             species. -->
        <QueryBar v-if="activeTab === 'dex'" />
        <DexGrid v-if="activeTab === 'dex'" :results="results" />

        <MoveFilterBar v-if="activeTab === 'moves'" />
        <MoveIndex v-if="activeTab === 'moves'" />
      </view>

      <!-- On the shell, outside the screen: these read as keys on the bezel rather than as
           another chip row in the display. -->
      <TabDeck />
    </view>

    <!-- Only the theme menu's dismiss layer is drawn here; the menu itself is anchored to its
         trigger inside the masthead. This layer stays behind because its whole job is to cover a
         screen the trigger's wrapper is a small part of.

         It declares no background colour at all — nothing painted, nothing composited, so POCKET's
         four-tone contract is untouched. It is the later node now, so what keeps it below the menu
         is the stacking index each declares rather than document order. -->
    <view v-if="themeMenuOpen" class="ThemeMenuCatcher" @tap="closeThemeMenu" />

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
