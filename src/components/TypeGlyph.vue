<script setup lang="ts">
/**
 * One 8x8 type mark, as an SVG XML string: the element set has no canvas, and the svg
 * element's documented contract is a `content` attribute, not shape children.
 */
import { computed } from 'vue-lynx'

import { glyphRows } from '../data/types.js'
import { mode } from '../state/display.js'
import { buildGlyphSvg } from '../theme/glyphSvg.js'
import type { GlyphSurface } from '../theme/modes.js'
import { glyphOn } from '../theme/modes.js'

const props = withDefaults(defineProps<{
  /** English type name. An unrecognised name falls back to the Normal mark. */
  type: string
  /** Which surface the glyph is about to sit on. */
  surface: GlyphSurface
  /**
   * Box side in pixels. Keep it a whole multiple of the 8px source grid — anything else
   * lands the cells on fractional pixels and the mark stops being sharp.
   */
  size?: number
}>(), { size: 16 })

// Module-level, not per-instance: every card on screen shares the same handful of strings.
const cache = new Map<string, string>()

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
