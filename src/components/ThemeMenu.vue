<script setup lang="ts">
/**
 * The trigger that opens the theme menu.
 *
 * The menu itself is drawn from `App.vue`, in the root's overlay band, and this component knows
 * nothing about where. Two measurements put it there rather than beside the trigger:
 *
 * A menu drawn inside the masthead is painted over by the query bar — this port stacks by document
 * order alone, the query bar is a later sibling in the screen, and no stacking index exists anywhere
 * in the stylesheet for anything to lift it with. The band this list uses is where the detail
 * overlay already sits, which is the arrangement §12.15 measured.
 *
 * Placing it from the trigger's runtime rect — how a dropdown is positioned on other platforms,
 * where the menu goes into a portal or a second window and follows the anchor it was opened from —
 * was built and then removed: the platform's element measurement answers on neither target this
 * project ships to (§12.28), so the correcting path never ran. What is left is the placement the
 * stylesheet declares, which is a panel over the masthead.
 */
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
</template>
