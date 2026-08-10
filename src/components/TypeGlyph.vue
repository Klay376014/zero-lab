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
import { glyphOn } from '../theme/modes.js'

const props = withDefaults(defineProps<{
  type: string
  surface: GlyphSurface
  /** Keep it a whole multiple of the 8px source grid, or the mark stops being sharp. */
  size?: number
}>(), { size: 16 })

const content = computed(() => {
  const key = `${mode.value.id}:${props.type}:${props.surface}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const svg = buildGlyphSvg(glyphRows(props.type), glyphOn(mode.value, props.type, props.surface))
  cache.set(key, svg)
  return svg
})
</script>

<template>
  <svg class="TypeGlyph" :content="content" :style="{ width: `${size}px`, height: `${size}px` }" />
</template>

<style>
.TypeGlyph {
  flex: none;
}
</style>
