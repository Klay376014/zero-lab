<script setup lang="ts">
/**
 * The two tab controls, drawn on the shell rather than inside the screen.
 *
 * Mounted as a sibling of the screen view, so they read as keys on the device's bezel instead
 * of as another row of chips inside the display. That separation is the point: the mode and
 * language chips change how the screen looks, these two change what is on it, and putting them
 * at different physical levels states the difference without a label. The shell was otherwise an
 * idle surface contributing one ring of colour.
 *
 * Neither control is ever hidden behind a menu or a drawer. A tab reached by opening something
 * would invert the relationship between the tab and the layers drawn above it.
 */
import type { Strings } from '../data/i18n.js'
import { t } from '../data/i18n.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang } from '../state/display.js'
import type { Tab } from '../state/tabs.js'
import { activateTab, activeTab } from '../state/tabs.js'

interface TabControl {
  readonly id: Tab
  readonly label: keyof Strings
}

const TABS: readonly TabControl[] = [
  { id: 'dex', label: 'tabDex' },
  { id: 'moves', label: 'tabMoves' },
]

/**
 * Filled when active, never outlined. POCKET resolves the accent token and the line token to
 * the same tone, so a border cannot tell the two states apart — the same reason the chips
 * invert their background.
 */
function keyClass(tab: TabControl, index: number): string {
  const classes = ['TabKey']
  if (activeTab.value === tab.id) classes.push('TabKeyOn')
  if (index === TABS.length - 1) classes.push('TabKeyEnd')
  return classes.join(' ')
}

function keyTextClass(tab: TabControl): string {
  return activeTab.value === tab.id ? 'TabKeyText TabKeyTextOn' : 'TabKeyText'
}
</script>

<template>
  <view class="TabDeck">
    <!-- The three bindings go on the key itself. A binding placed on a component reaches an
         element only by attribute fall-through, and cancel is not optional: a press that
         becomes a drag produces a cancellation and never a release. -->
    <view
      v-for="(tab, index) in TABS"
      :key="tab.id"
      :class="keyClass(tab, index)"
      :main-thread-bindtouchstart="onPressStart"
      :main-thread-bindtouchend="onPressEnd"
      :main-thread-bindtouchcancel="onPressEnd"
      @tap="activateTab(tab.id)"
    >
      <text :class="keyTextClass(tab)">{{ t(tab.label, lang) }}</text>
    </view>
  </view>
</template>
