<script setup lang="ts">
/**
 * The moves tab: the moves the active conditions admit, one row each.
 *
 * The order is the dataset's own — first-encounter order across the roster's learnsets — and not
 * a computed one, under every condition: filtering removes rows without reordering the rows it
 * keeps. Re-ordering here would produce a second ordering that no invariant covers.
 *
 * The three conditions live in `moveQuery.ts`, and the filter row that sets them is a sibling
 * component rather than part of this one — this component renders a sequence and knows nothing
 * about how it was narrowed. **Sort order is still absent**, and deliberately: a third sort order
 * needs the sort control reworked from a single cycling chip into something that shows how many
 * members the set has, which is ROADMAP A6 and a decision of its own.
 *
 * The query bar is still not rendered here. It sets the dex tab's query state, whose sort orders
 * and Mega-only and multi-form-only filters are statements about species that the move table has
 * no answer for.
 *
 * The columns are the learnset table's columns, so the cell rules and the column headings are
 * that table's, reused rather than restated. The row is this component's own: it is a primary
 * navigation target on a full-width surface, and it is the row whose pitch the window derives
 * from.
 */
import { computed, ref, watch } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import type { Move } from '../data/dex.js'
import { damageClassAbbr, moveFigure, moveHeads, moveName, t } from '../data/i18n.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang } from '../state/display.js'
import { openLayer } from '../state/layerStack.js'
import { moveResults } from '../state/moveQuery.js'
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

/**
 * The index carried here is the one the result already holds, not this list's position.
 *
 * `moveResults` takes it from the shared move table before applying any condition, so a filtered
 * sequence still names its moves by their place in that table. Re-deriving it from this map's
 * callback would renumber the moves the moment a condition removed an earlier one.
 */
const rows = computed<Row[]>(() => moveResults.value.map((result) => ({
  index: result.index,
  move: result.move,
  name: moveName(result.move, lang.value),
  abbr: damageClassAbbr(result.move.dc, lang.value),
})))

const heads = computed(() => moveHeads(lang.value))

/**
 * Only the rows within reach are made.
 *
 * 496 rows unfiltered against the grid's 208 cards, on a tab one tap away. The platform charges
 * roughly 1.3ms per element created regardless of what it is (design/HANDOFF.md §12.24), and a
 * fully materialised index would pay that 496 times before anything appeared. The container
 * reports an absolute `scrollTop` (§12.25), so nothing here accumulates deltas.
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

// A condition changes the sequence's length and switching language rebuilds it at the same
// length. The derivation takes the total as an input, so clamping is already part of it: no index
// beyond the last row is rendered. Nothing here tells the container to move — the reactive update
// leaves the scroll position alone, and code that stores or restores one is rejected for this
// project (`visible-range-window`).
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

      <!-- Filtering to nothing is a normal outcome, so it is stated in words rather than left as
           a blank region, and nothing is written to the console. `.MoveNone` is the learnset
           table's rule, reused: both are prose and both lead with the reading face. The string is
           this tab's own key — the two read alike today, and either surface has to be free to be
           reworded without silently rewording the other. -->
      <text v-if="rows.length === 0" class="MoveNone">{{ t('miNone', lang) }}</text>
    </scroll-view>
  </view>
</template>
