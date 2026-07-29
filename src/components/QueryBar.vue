<script setup lang="ts">
/**
 * The grid's controls: search, type filter, generation filter, sort order, reset.
 *
 * Sits outside the card area's scrolling container so it stays put while cards scroll. It
 * holds no state of its own — everything is read from and written to the shared query state,
 * so the grid and this bar can never disagree about what is being asked for.
 */
import TypeGlyph from './TypeGlyph.vue'
import { t } from '../data/i18n.js'
import { TYPE_ORDER, typeColor } from '../data/types.js'
import type { TypeName } from '../data/types.js'
import { lang, mode } from '../state/display.js'
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
 * What a type chip is painted, which decides what surface its mark is drawn for.
 *
 * Selection has to be carried by the background rather than the border, because POCKET
 * resolves its accent and line tokens to the same tone — a border could not tell the two
 * states apart without spending a fifth colour the four-tone contract does not have.
 *
 * Unselected, MODERN spends the type's own colour here; this is the surface the theme layer
 * calls a type chip, and the mark inverts to whichever ink measures higher against it.
 * POCKET keeps the plain surface token and the mark stays dark on it.
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
 * The platform documents the input event's value at the top level rather than under a detail
 * object, which is where a web habit would look for it. Both are read because this project
 * has already found two places where the platform's prose and its shipped behaviour disagree
 * (see design/HANDOFF.md §12.6 and §12.13); whichever arrives, the search string is set.
 */
function onSearchInput(event: { value?: string, detail?: { value?: string } }): void {
  search.value = event.value ?? event.detail?.value ?? ''
}
</script>

<template>
  <view class="QueryBar">
    <view class="QueryRow">
      <text class="Label">{{ t('search', lang) }}</text>
      <input
        class="QueryInput"
        :value="search"
        :placeholder="t('searchPlaceholder', lang)"
        @input="onSearchInput"
      />
      <view class="Chip" @tap="resetQuery">
        <text class="ChipText">{{ t('reset', lang) }}</text>
      </view>
    </view>

    <!--
      The type row carries the mark as well as the name: the eighteen marks are how this
      interface names a type everywhere else, so the filter that selects one should look like
      the thing it selects.
    -->
    <view class="QueryRow QueryRowWrap">
      <text class="Label">{{ t('type', lang) }}</text>
      <view
        v-for="type in TYPE_ORDER"
        :key="type"
        class="TypeChip"
        :class="typeFilter === type ? 'TypeChipOn' : undefined"
        :style="chipBackground(type)"
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
        @tap="pickGen(gen)"
      >
        <text class="ChipText" :class="genFilter === gen ? 'ChipTextOn' : undefined">{{ gen }}</text>
      </view>
    </view>

    <view class="QueryRow">
      <text class="Label">{{ t('sort', lang) }}</text>
      <view class="Chip" :class="sortOrder === 'number' ? 'ChipOn' : undefined" @tap="pickSort('number')">
        <text class="ChipText" :class="sortOrder === 'number' ? 'ChipTextOn' : undefined">{{ t('sortDex', lang) }}</text>
      </view>
      <view class="Chip" :class="sortOrder === 'stats' ? 'ChipOn' : undefined" @tap="pickSort('stats')">
        <text class="ChipText" :class="sortOrder === 'stats' ? 'ChipTextOn' : undefined">{{ t('sortBst', lang) }}</text>
      </view>
    </view>
  </view>
</template>
