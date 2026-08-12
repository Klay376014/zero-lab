<script setup lang="ts">
/**
 * The moves tab's filter row: name, type, damage class.
 *
 * Not the query bar. That bar sets the dex tab's query state, whose sort orders and Mega-only and
 * multi-form-only filters are statements about species and have no answer in the move table; this
 * one sets the move query state and carries three conditions.
 *
 * Every style rule here is the query bar's, reused rather than restated, and the type marks are
 * drawn on the two glyph surfaces its chips already use. Nothing new to teach the contrast check,
 * and no new selected-state rule that could be cancelled by its own base rule.
 */
import { computed } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import type { MoveClass } from '../data/dex.js'
import { damageClassName, t } from '../data/i18n.js'
import { TYPE_ORDER, typeColor } from '../data/types.js'
import type { TypeName } from '../data/types.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang, mode, tokens } from '../state/display.js'
import {
  DAMAGE_CLASSES,
  isDamageClassSelected,
  isMoveTypeSelected,
  moveSearch,
  resetMoveQuery,
  toggleDamageClass,
  toggleMoveType,
} from '../state/moveQuery.js'
import type { GlyphSurface } from '../theme/modes.js'

function chipBackground(type: TypeName): Record<string, string> {
  if (isMoveTypeSelected(type)) return {}
  if (!mode.value.typeColor) return {}
  return { backgroundColor: typeColor(type) ?? '' }
}

function chipSurface(type: TypeName): GlyphSurface {
  return isMoveTypeSelected(type) ? 'accent' : 'typechip'
}

const classLabels = computed<readonly (readonly [MoveClass, string])[]>(() => (
  DAMAGE_CLASSES.map((cls) => [cls, damageClassName(cls, lang.value)] as const)
))

function onSearchInput(event: { value?: string, detail?: { value?: string } }): void {
  moveSearch.value = event.value ?? event.detail?.value ?? ''
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
      <!-- Keyed on the mode so a mode change rebuilds the field; see `inputStyle`. -->
      <input
        :key="mode.id"
        class="QueryInput"
        :style="inputStyle"
        :value="moveSearch"
        :placeholder="t('miSearchPlaceholder', lang)"
        @input="onSearchInput"
      />
      <view
        class="Chip"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="resetMoveQuery"
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
          @tap="toggleMoveType(type)"
        >
          <view
            class="TypeChip"
            :class="isMoveTypeSelected(type) ? 'TypeChipOn' : undefined"
            :style="chipBackground(type)"
          >
            <TypeGlyph :type="type" :surface="chipSurface(type)" />
          </view>
        </view>
      </view>
    </view>

    <view class="QueryRow">
      <text class="Label">{{ t('miClass', lang) }}</text>
      <view
        v-for="[cls, label] in classLabels"
        :key="cls"
        class="Chip"
        :class="isDamageClassSelected(cls) ? 'ChipOn' : undefined"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="toggleDamageClass(cls)"
      >
        <text class="ChipText" :class="isDamageClassSelected(cls) ? 'ChipTextOn' : undefined">
          {{ label }}
        </text>
      </view>
    </view>
  </view>
</template>
