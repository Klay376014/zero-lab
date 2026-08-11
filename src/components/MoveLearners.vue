<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import type { Species } from '../data/dex.js'
import { formIndexForMove, learnersOf, moveOf } from '../data/dex.js'
import { learnerCountLabel, moveName, speciesName, t } from '../data/i18n.js'
import { typeAbbr } from '../data/types.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang } from '../state/display.js'
import { BUFFER_SCREENS, LEARNER_ROW } from '../state/rowMetrics.js'
import type { Range } from '../state/visibleRange.js'
import { sliceForRange, visibleRange } from '../state/visibleRange.js'
import { closeTopLayer } from '../state/layerStack.js'
import { openDetail } from '../state/selection.js'

/**
 * The move comes from the learner-list layer's own content, handed down by the root.
 *
 * There is no module holding "the open move" any more. While this list had one entry point and
 * one relationship to the selection, a module of its own was the simpler arrangement; with the
 * layer stack owning which layers are open and what each carries, a second holder of the same
 * fact could disagree with it — a layer in the stack while the module reported none, or the
 * reverse — and nothing would detect it.
 */
const props = defineProps<{
  moveIndex: number
}>()

interface Entry {
  readonly species: Species
  readonly formIndex: number
  readonly name: string
  readonly dexNo: string
  readonly types: readonly string[]
}

const move = computed(() => moveOf(props.moveIndex))

const title = computed(() => moveName(move.value, lang.value))

const entries = computed<Entry[]>(() => (
  learnersOf(props.moveIndex).map((species) => {
    const formIndex = formIndexForMove(species, props.moveIndex)
    return {
      species,
      formIndex,
      name: speciesName(species, lang.value).lead,
      dexNo: `No.${String(species.d).padStart(4, '0')}`,
      types: species.f[formIndex]?.t ?? [],
    }
  })
))

const countLabel = computed(() => learnerCountLabel(entries.value.length, lang.value))

const PER_ROW = 2

const rows = computed<Entry[][]>(() => {
  const out: Entry[][] = []
  for (let at = 0; at < entries.value.length; at += PER_ROW) {
    out.push(entries.value.slice(at, at + PER_ROW))
  }
  return out
})

function rowKey(row: Entry[]): string {
  return String(row[0]?.species.d ?? 'empty')
}

/**
 * Opens species detail for the chosen learner, on the form the accessor returns.
 *
 * No explicit close: the stack's own rule does the right thing either way. Reached from a species
 * — species detail is already in the stack — it unwinds to that layer and replaces its content,
 * so this list and the move detail above it are discarded. Reached from the moves tab, species
 * detail is pushed on top and this list stays beneath it, covered. Both are what the
 * `layer-stack` capability's examples state, and neither keeps a history of visited species.
 */
function choose(entry: Entry): void {
  openDetail(entry.species, entry.formIndex)
}

/** `.LearnersBody` is 52vh. */
const BODY_HEIGHT = 460

/**
 * Only the rows within reach are made. This is the longest sequence in the application — the most
 * widely learned move reaches 225 species, more than the roster the grid draws — and it opens on a
 * single tap. `.LearnersBody` is 52vh; §12.26 measured the row pitch and confirmed this container,
 * nested inside the panel's own, reports its scroll.
 */
let offset = 0

function rangeAt(scrollTop: number): Range {
  return visibleRange({
    offset: scrollTop,
    visible: BODY_HEIGHT,
    itemHeight: LEARNER_ROW.height,
    perRow: LEARNER_ROW.perRow,
    total: rows.value.length,
    bufferScreens: BUFFER_SCREENS,
  })
}

const range = ref<Range>(rangeAt(0))

function commit(next: Range): void {
  if (next.first === range.value.first && next.last === range.value.last) return
  range.value = next
}

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
</script>

<template>
  <view class="LearnersOverlay">
    <view class="LearnersVeil" @tap="closeTopLayer" />

    <view class="LearnersPanel">
      <view class="LearnersHead">
        <view class="LearnersHeadText">
          <text class="LearnersTitle">{{ title }}</text>
          <text class="LearnersSub">{{ t('mlTitle', lang) }}　・　{{ countLabel }}</text>
        </view>
        <view
          class="LearnersClose"
          :main-thread-bindtouchstart="onPressStart"
          :main-thread-bindtouchend="onPressEnd"
          :main-thread-bindtouchcancel="onPressEnd"
          @tap="closeTopLayer"
        >
          <text class="LearnersCloseMark">✕</text>
        </view>
      </view>

      <scroll-view
        class="LearnersBody"
        scroll-orientation="vertical"
        @scroll="onScroll"
      >
        <view class="LearnersRows">
          <view :style="{ height: `${range.leading}px` }" />
          <view v-for="row in shown" :key="rowKey(row)" class="LearnersRow">
            <view
              v-for="entry in row"
              :key="entry.species.d"
              class="LearnerCell"
              @tap="choose(entry)"
            >
              <text class="LearnerNo">{{ entry.dexNo }}</text>
              <!-- text-maxline is an attribute, not a style property. -->
              <text class="LearnerName" text-maxline="1">{{ entry.name }}</text>
              <view class="LearnerTypes">
                <view v-for="type in entry.types" :key="type" class="LearnerType">
                  <TypeGlyph :type="type" surface="panel" />
                  <text class="LearnerTypeAbbr">{{ typeAbbr(type) }}</text>
                </view>
              </view>
            </view>
          </view>
          <view :style="{ height: `${range.trailing}px` }" />
        </view>
      </scroll-view>
    </view>
  </view>
</template>
