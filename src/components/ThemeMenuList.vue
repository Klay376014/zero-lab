<script setup lang="ts">
/**
 * The menu's rows. Where it is drawn is the caller's business — the caller passes the positioning
 * class — so this file has nothing to say about placement and did not change when the placement
 * did. It is currently `AnchorPanel`, which hangs the list below the control it is wrapped in.
 *
 * The rows come from the theme layer's ordered mode set rather than a list here: a fourth mode is
 * then an addition to `MODES` and nothing else.
 *
 * A row carries its mode's name and no colour sample. A sample would paint one mode's tones onto
 * another mode's screen, which in POCKET puts a colour outside the four-tone ramp on the display —
 * and `retro-theme` limits that exemption to the detail veil, saying in as many words that it is
 * not a precedent. The preview a sample would give is one press away, because selecting a mode
 * recolours the running screen without remounting anything.
 */
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { closeThemeMenu, mode, setMode } from '../state/display.js'
import { MODES } from '../theme/modes.js'
import type { ModeId } from '../theme/modes.js'

function pick(id: ModeId): void {
  setMode(id)
  closeThemeMenu()
}
</script>

<template>
  <view class="ThemeMenu">
    <view
      v-for="entry in MODES"
      :key="entry.id"
      class="ThemeMenuRow"
      :class="entry.id === mode.id ? 'ThemeMenuRowOn' : undefined"
      :main-thread-bindtouchstart="onPressStart"
      :main-thread-bindtouchend="onPressEnd"
      :main-thread-bindtouchcancel="onPressEnd"
      @tap="pick(entry.id)"
    >
      <text
        class="ThemeMenuText"
        :class="entry.id === mode.id ? 'ThemeMenuTextOn' : undefined"
      >{{ entry.id }}</text>
    </view>
  </view>
</template>
