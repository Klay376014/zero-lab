<script setup lang="ts">
/**
 * The trigger that opens the theme menu, and the menu hanging beneath it.
 *
 * Two nodes, and which one is which matters. The outer wrapper is the menu's containing block; the
 * chip inside it is what the finger presses. They are separate because the chip is displaced a
 * pixel downward while it is held (`press-feedback`), so a menu anchored to the chip would travel
 * with it — and a transform additionally establishes a containing block for positioned descendants
 * under the rules this project's stylesheet is written against, which the platform has not been
 * asked about. The wrapper is never transformed, so neither question arises.
 *
 * The menu used to be drawn from `App.vue` in the root's overlay band, at offsets the stylesheet
 * declared. Two facts put it there, and only one of them still holds:
 *
 * The one that no longer holds: a menu inside the masthead was said to be unliftable above the
 * query bar, because this port stacked by document order alone and declared no stacking index
 * anywhere. §12.29 measured a stacking index on an iOS device and it works — a node anchored inside
 * the masthead paints above the query bar, unclipped. `design/theme-menu-variants.html` called this
 * arrangement a bet on unmeasured behaviour; it is not one any more.
 *
 * The one that still holds: the platform answers for no element's rectangle on either target this
 * project ships to (§12.28), so a placement derived from a measured rect is a code path that never
 * runs. Anchoring needs no rect — the position is a layout relationship — which is why this is a
 * way around that hole rather than a fix for it. §12.29 also found that a touch event carries
 * coordinates, but a menu that opens wherever the finger landed is a different control from one
 * that opens under a named chip, and this is the latter.
 */
import ThemeMenuList from './ThemeMenuList.vue'
import type { GlyphRows } from '../data/types.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { closeThemeMenu, mode, openThemeMenu, themeMenuOpen, tokens } from '../state/display.js'
import { buildGlyphSvg } from '../theme/glyphSvg.js'

/**
 * The caret, drawn on the same eight-by-eight grid as a type mark.
 *
 * Not the character `▾`: the pixel face carries no glyph for those, so it would fall through to the
 * system face and break the grid — the same reason the card's form-count badge is drawn rather than
 * typed. This goes through `buildGlyphSvg`, which is the one vector path measured on a device.
 */
const CARET: GlyphRows = [
  '........',
  '........',
  '........',
  '.######.',
  '..####..',
  '...##...',
  '........',
  '........',
]

function onTriggerTap(): void {
  if (themeMenuOpen.value) closeThemeMenu()
  else openThemeMenu()
}
</script>

<template>
  <!-- The wrapper positions the menu; the trigger inside it answers the press. They are two nodes
       rather than one because the trigger is displaced while it is held, and a menu positioned
       against the displaced node would travel with it. See `.Anchor` in App.css. -->
  <view class="Anchor">
    <view
      class="Chip ThemeMenuTrigger"
      :main-thread-bindtouchstart="onPressStart"
      :main-thread-bindtouchend="onPressEnd"
      :main-thread-bindtouchcancel="onPressEnd"
      @tap="onTriggerTap"
    >
      <text class="ChipText">{{ mode.id }}</text>
      <svg class="ThemeMenuCaret" :content="buildGlyphSvg(CARET, tokens.ink)" />
    </view>

    <!-- Inside the wrapper, so its placement is a layout relationship to the trigger rather than a
         pair of offsets from the root. The dismiss layer stays in the root's overlay band, because
         it has to cover a screen this wrapper is only a small part of. -->
    <ThemeMenuList v-if="themeMenuOpen" class="AnchorPanel" />
  </view>
</template>
