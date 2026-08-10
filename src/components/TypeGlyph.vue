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
