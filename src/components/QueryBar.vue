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

function chipBackground(type: TypeName): Record<string, string> {
  if (isTypeSelected(type)) return {}
  if (!mode.value.typeColor) return {}
  return { backgroundColor: typeColor(type) ?? '' }
}

function chipSurface(type: TypeName): GlyphSurface {
  return isTypeSelected(type) ? 'accent' : 'typechip'
}

const sortLabel = computed<string>(() => (
  t(sortOrder.value === 'stats' ? 'sortBst' : 'sortDex', lang.value)
))

function onSearchInput(event: { value?: string, detail?: { value?: string } }): void {
  search.value = event.value ?? event.detail?.value ?? ''
}

/** Written onto the element, not `var()` — the native field ignores style updates after creation. */
const inputStyle = computed<Record<string, string>>(() => ({
  color: tokens.value.ink,
  backgroundColor: tokens.value.surface,
  borderColor: tokens.value.line,
}))
</script>

<template>
  <view class="QueryBar">
    <view class="QueryRow">
      <view
        class="Chip ChipOn"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="cycleSort"
      >
        <text class="ChipText ChipTextOn">{{ sortLabel }}</text>
      </view>
      <!-- Keyed on the mode so a mode change rebuilds the field; see `inputStyle`. -->
      <input
        :key="mode.id"
        class="QueryInput"
        :style="inputStyle"
        :value="search"
        :placeholder="t('searchPlaceholder', lang)"
        @input="onSearchInput"
      />
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

    <view class="QueryRow">
      <text class="Label">{{ t('type', lang) }}</text>
      <view class="TypeChips">
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
