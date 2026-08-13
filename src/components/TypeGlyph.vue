<script lang="ts">
/*
 * Module scope, so the cache is one map rather than one per component instance. `<script setup>`
 * runs per instance, so a map declared there is rebuilt for every glyph and never sees a repeat
 * — which is the only thing this memoisation exists to catch: eighteen distinct marks stand
 * behind hundreds of glyph elements, one per card and one per learnset row.
 *
 * Not a performance fix. Measured on device (design/HANDOFF.md §12.24): glyph production is not
 * what any slow screen here is waiting for. This is the `type-glyph` spec's memoisation
 * requirement actually holding rather than only appearing to.
 *
 * The key carries the mode, so both modes' entries coexist and a mode switch discards nothing.
 */
const cache = new Map<string, string>()

export default { name: 'TypeGlyph' }
</script>

<script setup lang="ts">
import { computed } from 'vue-lynx'

import { glyphRows } from '../data/types.js'
import { mode } from '../state/display.js'
import { buildGlyphSvg } from '../theme/glyphSvg.js'
import type { GlyphSurface } from '../theme/modes.js'
import { glyphPaint } from '../theme/modes.js'

const props = withDefaults(defineProps<{
  type: string
  surface: GlyphSurface
  /** Keep it a whole multiple of the 8px source grid, or the mark stops being sharp. */
  size?: number
}>(), { size: 16 })

/**
 * The mode decides whether a plate is drawn, not the caller: the plate belongs to the arrangement
 * a mode's surfaces force, and nine call sites each deciding it would be the same decision copied
 * nine times.
 */
const paint = computed(() => glyphPaint(mode.value, props.type, props.surface))

const content = computed(() => {
  const key = `${mode.value.id}:${props.type}:${props.surface}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const svg = buildGlyphSvg(glyphRows(props.type), paint.value.fill)
  cache.set(key, svg)
  return svg
})

const box = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))
</script>

<template>
  <!-- Two forms rather than one wrapper that is sometimes painted: an unplated mode renders exactly
       what it rendered before, which keeps a view per glyph off the card sequence's first paint. -->
  <view v-if="paint.plate" class="TypeGlyphPlate" :style="{ backgroundColor: paint.plate }">
    <svg class="TypeGlyph" :content="content" :style="box" />
  </view>
  <svg v-else class="TypeGlyph" :content="content" :style="box" />
</template>

<style>
.TypeGlyph {
  flex: none;
}

/* One pixel on each side, so the mark's box stays sixteen and stays on whole multiples of its
   eight-pixel grid. Insetting the mark to hold the outer box at sixteen would land it on a
   fractional scale factor, which is the thing the fixed box exists to prevent. */
.TypeGlyphPlate {
  display: flex;
  padding: 1px;
  flex: none;
}
</style>
