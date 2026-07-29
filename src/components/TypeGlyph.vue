<script setup lang="ts">
/**
 * One 8x8 type mark.
 *
 * Drawn as an SVG XML string handed to the platform's svg element, because the element set
 * has no canvas — and as a string rather than shape children in this template because the
 * documented contract for the element is a `content` attribute, which it parses off the UI
 * thread and renders as a single native view.
 *
 * The fill is written into the string, so a glyph can no more inherit a colour than the
 * canvas bitmap it replaces could. It has to be chosen against the surface it will sit on,
 * which is what the `surface` prop names.
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

// Keyed on everything that changes the output, so a mode switch recomputes and everything
// else reuses. A plain module-level Map rather than per-instance state: the same handful of
// strings is shared by every card on screen.
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
  <!--
    Sized by prop rather than by the surrounding text: an 8x8 source grid only stays sharp
    at whole-number scale factors, and 16 is the smallest that stays legible.
  -->
  <svg class="TypeGlyph" :content="content" :style="{ width: `${size}px`, height: `${size}px` }" />
</template>

<style>
.TypeGlyph {
  flex: none;
}
</style>
