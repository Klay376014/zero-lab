<script setup lang="ts">
/**
 * The species that learn one move, as a two-column list over the detail panel.
 *
 * A layer of its own rather than a section inside the panel. One move reaches up to 207 of the
 * 208 species, so the list has to scroll, and the panel is already allowed exactly two
 * scrolling containers — see the `species-detail` capability, which limits them and says the
 * learnset table's exemption is not a precedent. Nothing in `pnpm run check` can see a third
 * one: that check reads the stylesheet, not the element tree.
 *
 * Deliberately not built from `SpeciesCard`. Drawing 207 cards would pay a second time the
 * first-paint cost design/HANDOFF.md §12.14 measured on the full card sequence.
 */
import { computed } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import type { Species } from '../data/dex.js'
import { formIndexForMove, learnersOf, moveOf } from '../data/dex.js'
import { learnerCountLabel, moveName, speciesName, t } from '../data/i18n.js'
import { typeAbbr } from '../data/types.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang } from '../state/display.js'
import { closeMoveLearners } from '../state/moveLearners.js'
import { openDetail } from '../state/selection.js'

const props = defineProps<{
  /** The move being asked about, as an index into the shared move table. */
  moveIndex: number
}>()

/** One species in the list, paired with the form a tap would open. */
interface Entry {
  readonly species: Species
  /** The form that actually knows this move — see {@link formIndexForMove}. */
  readonly formIndex: number
  readonly name: string
  readonly dexNo: string
  /** The opened form's types, so the entry shows what the tap will produce. */
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

/** How many entries share a row. Structural rather than a width, so it cannot reflow to one. */
const PER_ROW = 2

/**
 * The entries in rows of {@link PER_ROW}.
 *
 * Chunked here rather than left to a wrapping row of half-width cells: a proportional width
 * reflows to one column when an entry's content will not fit, which turns "two per row" into
 * something the device decides. The last row is short when the count is odd.
 */
const rows = computed<Entry[][]>(() => {
  const out: Entry[][] = []
  for (let at = 0; at < entries.value.length; at += PER_ROW) {
    out.push(entries.value.slice(at, at + PER_ROW))
  }
  return out
})

/** A row's reconciliation identity: the first entry's species, never the row's position. */
function rowKey(row: Entry[]): string {
  return String(row[0]?.species.d ?? 'empty')
}

/** Replace the selection with this entry, on the form that knows the move, and dismiss. */
function choose(entry: Entry): void {
  openDetail(entry.species, entry.formIndex)
  closeMoveLearners()
}
</script>

<template>
  <view class="LearnersOverlay">
    <!-- No press feedback, for the same reason as the detail panel's veil: a pressed
         appearance would present it as a control, and its only behaviour is to dismiss. -->
    <view class="LearnersVeil" @tap="closeMoveLearners" />

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
          @tap="closeMoveLearners"
        >
          <text class="LearnersCloseMark">✕</text>
        </view>
      </view>

      <scroll-view class="LearnersBody" scroll-orientation="vertical">
        <view class="LearnersRows">
          <view v-for="row in rows" :key="rowKey(row)" class="LearnersRow">
            <!-- Tap bound on the cell, not on a component: a binding placed on a component
                 reaches an element only by attribute fall-through. §12.14.

                 No press mark here, on the same measure as the species cards: one move reaches
                 up to 207 entries, and an entry already answers a press by replacing the
                 panel. See the `press-feedback` capability. -->
            <view
              v-for="entry in row"
              :key="entry.species.d"
              class="LearnerCell"
              @tap="choose(entry)"
            >
              <text class="LearnerNo">{{ entry.dexNo }}</text>
              <!-- text-maxline is an element attribute, not a style property: declared in the
                   stylesheet it is silently inert and a long name wraps on device. -->
              <text class="LearnerName" text-maxline="1">{{ entry.name }}</text>
              <view class="LearnerTypes">
                <view v-for="type in entry.types" :key="type" class="LearnerType">
                  <TypeGlyph :type="type" surface="panel" />
                  <text class="LearnerTypeAbbr">{{ typeAbbr(type) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>
