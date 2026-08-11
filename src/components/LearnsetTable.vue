<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import { moveOf } from '../data/dex.js'
import type { Move } from '../data/dex.js'
import { damageClassAbbr, moveFigure, moveHeads, moveName, t } from '../data/i18n.js'
import { TYPE_ORDER } from '../data/types.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang } from '../state/display.js'
import { bonusOnly, moveSort } from '../state/learnset.js'
import type { MoveSort } from '../state/learnset.js'
import { openLayer } from '../state/layerStack.js'
import { BUFFER_SCREENS, MOVE_ROW } from '../state/rowMetrics.js'
import type { Range } from '../state/visibleRange.js'
import { sliceForRange, visibleRange } from '../state/visibleRange.js'

const props = defineProps<{
  moves: readonly number[]
  types: readonly string[]
}>()

interface Row {
  readonly index: number
  readonly move: Move
  readonly name: string
  readonly abbr: string
  readonly stab: boolean
}

const all = computed<Row[]>(() => {
  const own = new Set(props.types)
  return props.moves.map((index) => {
    const move = moveOf(index)
    return {
      index,
      move,
      name: moveName(move, lang.value),
      abbr: damageClassAbbr(move.dc, lang.value),
      stab: own.has(move.ty) && move.dc !== 'Status',
    }
  })
})

function byName(a: Row, b: Row): number {
  return a.name.localeCompare(b.name)
}

function typeRank(row: Row): number {
  return TYPE_ORDER.indexOf(row.move.ty as (typeof TYPE_ORDER)[number])
}

const rows = computed<Row[]>(() => {
  const source = bonusOnly.value ? all.value.filter((row) => row.stab) : all.value.slice()
  switch (moveSort.value) {
    case 'power':
      return source.sort((a, b) => (b.move.pw ?? -1) - (a.move.pw ?? -1) || byName(a, b))
    case 'type':
      return source.sort((a, b) => typeRank(a) - typeRank(b) || byName(a, b))
    default:
      return source.sort(byName)
  }
})

const BOUND_ABOVE_ROWS = 12

/** `.MoveTableBound` is 36vh; unbounded, the table is as tall as its rows. */
const BOUND_HEIGHT = 320

const bounded = computed(() => rows.value.length > BOUND_ABOVE_ROWS)

/**
 * Only the rows within reach are made. A hundred-and-five-move learnset is about nine hundred
 * elements at roughly 1.3 ms each, and every one of them is paid before the panel's artwork
 * appears (design/HANDOFF.md §12.24). The container this scrolls in is nested inside the panel's
 * own; §12.26 confirmed the inner one reports.
 */
let offset = 0

function rangeAt(scrollTop: number): Range {
  return visibleRange({
    offset: scrollTop,
    visible: bounded.value ? BOUND_HEIGHT : rows.value.length * MOVE_ROW.height,
    itemHeight: MOVE_ROW.height,
    perRow: MOVE_ROW.perRow,
    total: rows.value.length,
    bufferScreens: BUFFER_SCREENS,
  })
}

const range = ref<Range>(rangeAt(0))

function commit(next: Range): void {
  if (next.first === range.value.first && next.last === range.value.last) return
  range.value = next
}

// Sorting and the bonus filter both change this sequence; the derivation clamps to the new
// length, and nothing here tells the container to move.
watch(rows, () => { commit(rangeAt(offset)) })

const shown = computed(() => sliceForRange(rows.value, range.value))

function onScroll(event: unknown): void {
  const source = event as Record<string, unknown>
  const detail = { ...source, ...((source.detail ?? {}) as Record<string, unknown>) }
  const top = detail.scrollTop
  if (typeof top !== 'number') return
  offset = top
  commit(rangeAt(top))
}

const heads = computed(() => moveHeads(lang.value))

const SORTS = [
  { key: 'name', label: 'mvName' },
  { key: 'power', label: 'mvPower' },
  { key: 'type', label: 'mvType' },
] as const

function pickSort(key: MoveSort): void {
  moveSort.value = key
}

function toggleBonusOnly(): void {
  bonusOnly.value = !bonusOnly.value
}

/**
 * Opens move detail for this row's move — not the learner list, which this row reached directly
 * until move detail existed.
 *
 * The change is deliberate. A reader looking at a move row most often wants to know what the move
 * does, and this row could only answer a different question; routing it and the move index both
 * through move detail keeps one gesture reaching one screen. It costs an extra tap on the way to
 * the learners, which the layer stack's unwinding rule keeps from accumulating layers.
 *
 * The move carried is `row.index`, the reference the row was built from. Position is not usable:
 * the three sort orders reorder these rows and the bonus filter removes some, so a position
 * identifies a different move under each combination of the two.
 */
function openMoveDetail(row: Row): void {
  openLayer({ kind: 'move', moveIndex: row.index })
}

const countLabel = computed(() => (
  bonusOnly.value ? `${all.value.length} → ${rows.value.length}` : String(all.value.length)
))

function figureClass(value: number | null): string {
  return value === null ? 'MoveFigure MoveFigureDash' : 'MoveFigure'
}
</script>

<template>
  <view class="Learnset">
    <view class="LearnsetHead">
      <text class="LearnsetTitle">{{ t('secMoves', lang) }}</text>
      <text class="LearnsetCount">{{ countLabel }}</text>
    </view>

    <view class="LearnsetControls">
      <view
        v-for="option in SORTS"
        :key="option.key"
        class="MoveMini"
        :class="moveSort === option.key ? 'MoveMiniOn' : undefined"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="pickSort(option.key)"
      >
        <text
          class="MoveMiniText"
          :class="moveSort === option.key ? 'MoveMiniTextOn' : undefined"
        >{{ t(option.label, lang) }}</text>
      </view>
      <view
        class="MoveMini"
        :class="bonusOnly ? 'MoveMiniOn' : undefined"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="toggleBonusOnly"
      >
        <text class="MoveMiniText" :class="bonusOnly ? 'MoveMiniTextOn' : undefined">
          {{ t('mvStab', lang) }}
        </text>
      </view>
    </view>

    <view class="MoveRow MoveHead">
      <view class="MoveGlyphCell" />
      <text class="MoveName" text-maxline="1">{{ heads[1] }}</text>
      <text class="MoveClass">{{ heads[2] }}</text>
      <text class="MoveFigure">{{ heads[3] }}</text>
      <text class="MoveFigure">{{ heads[4] }}</text>
      <text class="MoveFigurePp">{{ heads[5] }}</text>
    </view>

    <scroll-view
      :class="bounded ? 'MoveTableBound' : undefined"
      scroll-orientation="vertical"
      @scroll="onScroll"
    >
      <view :style="{ height: `${range.leading}px` }" />
      <view
        v-for="row in shown"
        :key="row.move.n"
        :class="row.stab ? 'MoveRow MoveRowStab' : 'MoveRow'"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="openMoveDetail(row)"
      >
        <view class="MoveGlyphCell">
          <TypeGlyph :type="row.move.ty" :surface="row.stab ? 'surface2' : 'panel'" />
        </view>
        <!-- text-maxline is an attribute, not a style property. -->
        <text class="MoveName" text-maxline="1">{{ row.name }}</text>
        <!-- Real node: no generated-content property on this platform. -->
        <text v-if="row.stab" class="MoveStar">★</text>
        <text class="MoveClass">{{ row.abbr }}</text>
        <text :class="figureClass(row.move.pw)">{{ moveFigure(row.move.pw) }}</text>
        <text :class="figureClass(row.move.ac)">{{ moveFigure(row.move.ac) }}</text>
        <text class="MoveFigurePp">{{ row.move.pp }}</text>
      </view>

      <view :style="{ height: `${range.trailing}px` }" />

      <text v-if="rows.length === 0" class="MoveNone">{{ t('mvNone', lang) }}</text>
    </scroll-view>
  </view>
</template>
