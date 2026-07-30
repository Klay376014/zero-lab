<script setup lang="ts">
/**
 * The grid's controls: search, type filter, generation filter, sort order, reset.
 *
 * Sits outside the card area's scrolling container so it stays put while cards scroll. It
 * holds no state of its own — everything is read from and written to the shared query state,
 * so the grid and this bar can never disagree about what is being asked for.
 */
import { computed } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import { t } from '../data/i18n.js'
import { TYPE_ORDER, typeColor } from '../data/types.js'
import type { TypeName } from '../data/types.js'
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

/**
 * The search field's three colours, written onto the element rather than left to `var()`.
 *
 * The native text field does not repaint when a colour it is already showing changes. Every
 * other element in the tree picks its colours up from the root view's custom properties and
 * follows the mode immediately; this one keeps what it had when it was created. Two things
 * were measured on a device, in this order:
 *
 *   1. Colours in the stylesheet as `var(--ink)` etc. — field stays a mode behind.
 *   2. The same colours bound here as inline style — field still stays a mode behind.
 *
 * So the update reaching the element is not enough; what the field was showing at creation is
 * what it keeps. The one thing that did repaint it was toggling language, which rewrites the
 * `placeholder` **attribute** — a different update path from style. Rather than lean on that
 * side effect, the element is keyed on the mode (see the template) so a mode change builds a
 * fresh field, and these colours are written directly so the new one needs no cascade to
 * resolve them. Nothing here picks a different colour from the stylesheet it replaced — the
 * tokens are the same ones `var(--ink)`, `var(--surface)` and `var(--line)` resolve to.
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
      <!--
        Keyed on the mode so a mode change discards this field and builds a new one. A native
        text field keeps the colours it was created with and neither a stylesheet nor an inline
        style update repaints it — see the note on `inputStyle` for what was measured. Creation
        is the only point that reliably applies them, so the mode has to be part of the
        element's identity.

        What it costs: switching mode mid-typing drops focus and closes the keyboard. The text
        itself survives — `search` lives in the shared query state, and the new field is bound
        to it, so the results do not flinch. Focus is not worth a second mechanism for; mode is
        a display control nobody reaches for with a half-typed query.
      -->
      <input
        :key="mode.id"
        class="QueryInput"
        :style="inputStyle"
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
