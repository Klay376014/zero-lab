<script setup lang="ts">
import { computed } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import { t } from '../data/i18n.js'
import { TYPE_ORDER, typeColor } from '../data/types.js'
import type { TypeName } from '../data/types.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang, mode, tokens } from '../state/display.js'
import {
  cycleSort,
  isTypeSelected,
  megaOnly,
  multiOnly,
  resetQuery,
  search,
  sortOrder,
  toggleMegaOnly,
  toggleMultiOnly,
  toggleType,
} from '../state/query.js'
import type { GlyphSurface } from '../theme/modes.js'

/**
 * What a type chip is painted. Selection is carried by the background, not the border: POCKET
 * resolves accent and line to the same tone, so a border cannot tell the two states apart.
 */
function chipBackground(type: TypeName): Record<string, string> {
  if (isTypeSelected(type)) return {}
  if (!mode.value.typeColor) return {}
  return { backgroundColor: typeColor(type) ?? '' }
}

function chipSurface(type: TypeName): GlyphSurface {
  return isTypeSelected(type) ? 'accent' : 'typechip'
}

/** The sort control's text: the name of the order in force, not a choice between names. */
const sortLabel = computed<string>(() => (
  t(sortOrder.value === 'stats' ? 'sortBst' : 'sortDex', lang.value)
))

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
      <!-- The sort order is stated, not chosen from: one control carrying the name of the
           order in force. Two buttons would be a second row, and a row is worth more to the
           card grid than a two-member choice laid out flat. -->
      <view
        class="Chip ChipOn"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="cycleSort"
      >
        <text class="ChipText ChipTextOn">{{ sortLabel }}</text>
      </view>
      <!-- No label introduces this field. Its placeholder names the four things the search
           reaches, and at 13px that string needs the width a label would have taken — the
           placeholder is the higher-value occupant, and a lone field with a placeholder does
           not need a second thing saying what it is. -->
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

    <!-- The label sits outside the wrapping container, not inside it as a first child. Inside,
         it would consume part of the first line and the eighteen marks would break 8 + 10
         instead of 9 + 9 — the break position has to be a property of the container alone. -->
    <view class="QueryRow">
      <text class="Label">{{ t('type', lang) }}</text>
      <view class="TypeChips">
        <!-- Two views per mark, for the same reason `.DexCell` wraps `.Card`: the cell owns
             the proportional width and the gutter, the chip owns the border and the fill.
             One view cannot do both — the gutter has to be padding so that it counts inside
             the proportion, and padding on the chip would put its border at the outer edge
             and leave the marks touching. -->
        <view
          v-for="type in TYPE_ORDER"
          :key="type"
          class="TypeCell"
          :main-thread-bindtouchstart="onPressStart"
          :main-thread-bindtouchend="onPressEnd"
          :main-thread-bindtouchcancel="onPressEnd"
          @tap="toggleType(type)"
        >
          <view
            class="TypeChip"
            :class="isTypeSelected(type) ? 'TypeChipOn' : undefined"
            :style="chipBackground(type)"
          >
            <TypeGlyph :type="type" :surface="chipSurface(type)" />
          </view>
        </view>
      </view>
    </view>

    <!-- A row of its own rather than a tail on the row above. The eighteen type buttons break
         nine and nine as a property of their container alone — the reason the label that
         introduces them sits outside it — and anything appended to that row puts the break
         position back in question.

         A row costs the card grid vertical space, which is why the generation filter was
         removed and why the sort order is one cycling control rather than one button per
         member. That reasoning was weighed again for these two and the row was accepted; see
         the change's proposal. -->
    <view class="QueryRow">
      <view
        class="Chip"
        :class="megaOnly ? 'ChipOn' : undefined"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="toggleMegaOnly"
      >
        <text class="ChipText" :class="megaOnly ? 'ChipTextOn' : undefined">
          {{ t('megaOnly', lang) }}
        </text>
      </view>
      <view
        class="Chip"
        :class="multiOnly ? 'ChipOn' : undefined"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="toggleMultiOnly"
      >
        <text class="ChipText" :class="multiOnly ? 'ChipTextOn' : undefined">
          {{ t('multiOnly', lang) }}
        </text>
      </view>
    </view>
  </view>
</template>
