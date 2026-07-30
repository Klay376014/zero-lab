<script setup lang="ts">
import { computed } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import { t } from '../data/i18n.js'
import { TYPE_ORDER, typeColor } from '../data/types.js'
import type { TypeName } from '../data/types.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang, mode, tokens } from '../state/display.js'
import { genFilter, resetQuery, search, sortOrder, typeFilter } from '../state/query.js'
import type { SortOrder } from '../state/query.js'
import type { GlyphSurface } from '../theme/modes.js'

/** The nine generations the roster spans. */
const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

/** Toggling an active filter clears it, so a filter never needs a separate clear control. */
function pickType(type: TypeName): void {
  typeFilter.value = typeFilter.value === type ? null : type
}

/**
 * What a type chip is painted. Selection is carried by the background, not the border: POCKET
 * resolves accent and line to the same tone, so a border cannot tell the two states apart.
 */
function chipBackground(type: TypeName): Record<string, string> {
  if (typeFilter.value === type) return {}
  if (!mode.value.typeColor) return {}
  return { backgroundColor: typeColor(type) ?? '' }
}

function chipSurface(type: TypeName): GlyphSurface {
  return typeFilter.value === type ? 'accent' : 'typechip'
}

function pickGen(gen: number): void {
  genFilter.value = genFilter.value === gen ? null : gen
}

function pickSort(order: SortOrder): void {
  sortOrder.value = order
}

/**
 * Both shapes are read: the platform documents the value at the top level, and its prose and
 * shipped behaviour have disagreed before (design/HANDOFF.md §12.6, §12.13).
 */
function onSearchInput(event: { value?: string, detail?: { value?: string } }): void {
  search.value = event.value ?? event.detail?.value ?? ''
}

/**
 * The search field's three colours, written onto the element rather than left to `var()`.
 *
 * Measured on device: the native text field keeps the colours it was created with, and neither
 * a stylesheet nor an inline style update repaints it. Hence the mode key in the template —
 * creation is the only point that applies them. The tokens are the same ones `var(--ink)`,
 * `var(--surface)` and `var(--line)` resolve to.
 */
const inputStyle = computed<Record<string, string>>(() => ({
  color: tokens.value.ink,
  backgroundColor: tokens.value.surface,
  borderColor: tokens.value.line,
}))
</script>

<template>
  <view class="QueryBar">
    <view class="QueryRow">
      <text class="Label">{{ t('search', lang) }}</text>
      <!-- Keyed on the mode so a mode change builds a fresh field; see `inputStyle`. Costs
           focus when the mode changes mid-typing, which the shared `search` state survives. -->
      <input
        :key="mode.id"
        class="QueryInput"
        :style="inputStyle"
        :value="search"
        :placeholder="t('searchPlaceholder', lang)"
        @input="onSearchInput"
      />
      <!-- All three touch bindings go together on every control below: cancel is what releases
           a press that became a scroll. -->
      <view
        class="Chip"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="resetQuery"
      >
        <text class="ChipText">{{ t('reset', lang) }}</text>
      </view>
    </view>

    <view class="QueryRow QueryRowWrap">
      <text class="Label">{{ t('type', lang) }}</text>
      <view
        v-for="type in TYPE_ORDER"
        :key="type"
        class="TypeChip"
        :class="typeFilter === type ? 'TypeChipOn' : undefined"
        :style="chipBackground(type)"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="pickType(type)"
      >
        <TypeGlyph :type="type" :surface="chipSurface(type)" />
      </view>
    </view>

    <view class="QueryRow QueryRowWrap">
      <text class="Label">{{ t('gen', lang) }}</text>
      <view
        v-for="gen in GENERATIONS"
        :key="gen"
        class="Chip"
        :class="genFilter === gen ? 'ChipOn' : undefined"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="pickGen(gen)"
      >
        <text class="ChipText" :class="genFilter === gen ? 'ChipTextOn' : undefined">{{ gen }}</text>
      </view>
    </view>

    <view class="QueryRow">
      <text class="Label">{{ t('sort', lang) }}</text>
      <view
        class="Chip"
        :class="sortOrder === 'number' ? 'ChipOn' : undefined"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="pickSort('number')"
      >
        <text class="ChipText" :class="sortOrder === 'number' ? 'ChipTextOn' : undefined">{{ t('sortDex', lang) }}</text>
      </view>
      <view
        class="Chip"
        :class="sortOrder === 'stats' ? 'ChipOn' : undefined"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="pickSort('stats')"
      >
        <text class="ChipText" :class="sortOrder === 'stats' ? 'ChipTextOn' : undefined">{{ t('sortBst', lang) }}</text>
      </view>
    </view>
  </view>
</template>
