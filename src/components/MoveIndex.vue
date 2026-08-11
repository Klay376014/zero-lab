<script setup lang="ts">
/**
 * The moves tab: every move in the shared table, one row each.
 *
 * The order is the dataset's own — first-encounter order across the roster's learnsets — and not
 * a computed one. Re-ordering here would produce a second ordering that no invariant covers, and
 * the tab's purpose in this batch is reaching a move rather than surveying them.
 *
 * No query controls: no search field, no type filter, no sort. Each of those brings its own
 * state, its own result-count statement and its own interaction with the window below, which is
 * a separate decision. The query bar belongs to the dex tab and is not rendered here.
 *
 * The columns are the learnset table's columns, so the cell rules and the column headings are
 * that table's, reused rather than restated. The row is this component's own: it is a primary
 * navigation target on a full-width surface, and it is the row whose pitch the window derives
 * from.
 */
import { computed, ref, watch } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import type { Move } from '../data/dex.js'
import { dex } from '../data/dex.js'
import { damageClassAbbr, moveFigure, moveHeads, moveName } from '../data/i18n.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang } from '../state/display.js'
import { openLayer } from '../state/layerStack.js'
import { BUFFER_SCREENS, MOVE_INDEX_ROW, MOVE_INDEX_VIEWPORT } from '../state/rowMetrics.js'
import type { Range } from '../state/visibleRange.js'
import { sliceForRange, visibleRange } from '../state/visibleRange.js'

interface Row {
  /** Index into `dex.moves` — the move's identity in this dataset, and what a tap carries. */
  readonly index: number
  readonly move: Move
  readonly name: string
  readonly abbr: string
}

const rows = computed<Row[]>(() => dex.moves.map((move, index) => ({
  index,
  move,
  name: moveName(move, lang.value),
  abbr: damageClassAbbr(move.dc, lang.value),
})))

const heads = computed(() => moveHeads(lang.value))

/**
 * Only the rows within reach are made.
 *
 * 496 rows against the grid's 208 cards, on a tab one tap away. The platform charges roughly
 * 1.3ms per element created regardless of what it is (design/HANDOFF.md §12.24), and a fully
 * materialised index would pay that 496 times before anything appeared. The container reports an
 * absolute `scrollTop` (§12.25), so nothing here accumulates deltas.
 */
let offset = 0

function rangeAt(scrollTop: number): Range {
  return visibleRange({
    offset: scrollTop,
    visible: MOVE_INDEX_VIEWPORT,
    itemHeight: MOVE_INDEX_ROW.height,
    perRow: MOVE_INDEX_ROW.perRow,
    total: rows.value.length,
    bufferScreens: BUFFER_SCREENS,
  })
}

const range = ref<Range>(rangeAt(0))

function commit(next: Range): void {
  if (next.first === range.value.first && next.last === range.value.last) return
  range.value = next
}

// The sequence is fixed at 496, but switching language rebuilds it; the derivation clamps to the
// same length and nothing here tells the container to move.
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

function figureClass(value: number | null): string {
  return value === null ? 'MoveFigure MoveFigureDash' : 'MoveFigure'
}

/**
 * Opens move detail for the move this row was built from.
 *
 * The row's position is not used: the window renders a row at a position that changes with the
 * scroll offset, so a position identifies a different move at every offset.
 */
function open(row: Row): void {
  openLayer({ kind: 'move', moveIndex: row.index })
}
</script>

<template>
  <view class="MoveIndex">
    <!-- The column header states the columns and has no behaviour: no press mark, no binding. -->
    <view class="MoveRow MoveHead">
      <view class="MoveGlyphCell" />
      <text class="MoveName" text-maxline="1">{{ heads[1] }}</text>
      <text class="MoveClass">{{ heads[2] }}</text>
      <text class="MoveFigure">{{ heads[3] }}</text>
      <text class="MoveFigure">{{ heads[4] }}</text>
      <text class="MoveFigurePp">{{ heads[5] }}</text>
    </view>

    <scroll-view
      class="MoveIndexBody"
      scroll-orientation="vertical"
      @scroll="onScroll"
    >
      <view :style="{ height: `${range.leading}px` }" />

      <!-- The three bindings are on the row element itself, not on a component boundary: a
           binding placed on a component reaches an element only by attribute fall-through. The
           cancel binding is load-bearing rather than defensive — these rows sit inside a
           scrolling container, so a press that becomes a scroll produces a cancellation and
           never a release. -->
      <view
        v-for="row in shown"
        :key="row.move.n"
        class="MoveIndexRow"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="open(row)"
      >
        <view class="MoveGlyphCell">
          <TypeGlyph :type="row.move.ty" surface="panel" />
        </view>
        <!-- text-maxline is an attribute, not a style property. -->
        <text class="MoveName" text-maxline="1">{{ row.name }}</text>
        <text class="MoveClass">{{ row.abbr }}</text>
        <text :class="figureClass(row.move.pw)">{{ moveFigure(row.move.pw) }}</text>
        <text :class="figureClass(row.move.ac)">{{ moveFigure(row.move.ac) }}</text>
        <text class="MoveFigurePp">{{ row.move.pp }}</text>
      </view>

      <view :style="{ height: `${range.trailing}px` }" />
    </scroll-view>
  </view>
</template>
