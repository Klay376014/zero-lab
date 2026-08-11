<script setup lang="ts">
/**
 * Move detail: what a move does, and the way through to the species that learn it.
 *
 * Reached from two places — a row in the move index, and a row in a species' learnset table — and
 * it is the only way to the learner list. Both entry points therefore reach the same screen for
 * the same gesture, which is what the second one bought by giving up its direct route to the
 * learners.
 *
 * Flags are deliberately absent. The dataset carries them and this reads none: 71 of the 496
 * moves carry none at all because the upstream source never recorded them, and displaying the
 * field would assert "this move does not have those properties" where the data supports only
 * "nobody wrote it down". Which subset to show, and how to word it, is a decision this batch
 * does not make.
 *
 * The panel is the species panel's dialog family, reusing its overlay, frame, header and
 * attribute rows rather than restating them.
 */
import { computed } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import { learnersOf, moveOf } from '../data/dex.js'
import {
  damageClassName,
  learnerCountLabel,
  moveDescription,
  moveFigure,
  moveName,
  t,
} from '../data/i18n.js'
import { typeName } from '../data/types.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang } from '../state/display.js'
import { closeTopLayer, openLayer } from '../state/layerStack.js'

const props = defineProps<{
  moveIndex: number
}>()

const move = computed(() => moveOf(props.moveIndex))

/** Both languages, whichever is leading. The dataset carries a Chinese name for every move. */
const names = computed(() => (
  lang.value === 'zh'
    ? { lead: move.value.z, alt: move.value.n }
    : { lead: move.value.n, alt: move.value.z }
))

const typeLabel = computed(() => (
  lang.value === 'zh'
    ? `${typeName(move.value.ty, 'zh')}　${move.value.ty}`
    : move.value.ty
))

/**
 * The figures, absent ones as a dash — no fixed damage for power, never misses for accuracy.
 * Power points are always present, so that row needs no dash treatment.
 */
const figures = computed(() => [
  { key: 'mdPower', value: moveFigure(move.value.pw), dash: move.value.pw === null },
  { key: 'mdAcc', value: moveFigure(move.value.ac), dash: move.value.ac === null },
  { key: 'mdPp', value: String(move.value.pp), dash: false },
] as const)

const description = computed(() => moveDescription(move.value, lang.value))

/**
 * A count derived from a relation, not a figure about the dataset as a whole — so it is produced
 * by the derived accessor rather than read from the meta block, which the `dataset-statements`
 * capability permits explicitly.
 */
const learnerCount = computed(() => learnersOf(props.moveIndex).length)

function openLearners(): void {
  openLayer({ kind: 'learners', moveIndex: props.moveIndex })
}
</script>

<template>
  <view class="DetailOverlay">
    <view class="DetailVeil" @tap="closeTopLayer" />

    <view class="DetailPanel">
      <view class="DetailHead">
        <view class="DetailHeadText">
          <text class="DetailName">{{ names.lead }}</text>
          <text v-if="names.alt" class="DetailNameAlt">{{ names.alt }}</text>
        </view>
        <view
          class="DetailClose"
          :main-thread-bindtouchstart="onPressStart"
          :main-thread-bindtouchend="onPressEnd"
          :main-thread-bindtouchcancel="onPressEnd"
          @tap="closeTopLayer"
        >
          <text class="DetailCloseMark">✕</text>
        </view>
      </view>

      <!-- The layer's one scrolling container. Capped rather than fixed, so short content gets a
           short dialog and only an overflow scrolls — the longest description in the set is 46
           characters, which fits. If the cap turns out to be inert on device (a height that does
           not bound a scrolling container is the failure this stylesheet already records for
           `.DetailBody`), the fix is a fixed height here, not a second container inside. -->
      <scroll-view class="MoveDetailBody" scroll-orientation="vertical">
        <view class="DetailSections">
          <view class="DetailAttrs">
            <view class="DetailAttr">
              <text class="DetailAttrKey MoveDetailAttrKey">{{ t('mdType', lang) }}</text>
              <!-- The move table's glyph cell, reused: same 16px mark needing the same gutter
                   before the text beside it. -->
              <view class="MoveDetailType">
                <view class="MoveGlyphCell">
                  <TypeGlyph :type="move.ty" surface="panel" :size="16" />
                </view>
                <text class="DetailAttrValue">{{ typeLabel }}</text>
              </view>
            </view>

            <view class="DetailAttr">
              <text class="DetailAttrKey MoveDetailAttrKey">{{ t('mdClass', lang) }}</text>
              <text class="DetailAttrValue">{{ damageClassName(move.dc, lang) }}</text>
            </view>

            <view v-for="figure in figures" :key="figure.key" class="DetailAttr">
              <text class="DetailAttrKey MoveDetailAttrKey">{{ t(figure.key, lang) }}</text>
              <text
                :class="figure.dash ? 'DetailAttrValue MoveFigureDash' : 'DetailAttrValue'"
              >{{ figure.value }}</text>
            </view>
          </view>

          <text class="MoveDetailDescKey">{{ t('mdDesc', lang) }}</text>
          <text class="MoveDetailDesc">{{ description }}</text>

          <view
            class="MoveDetailLearners"
            :main-thread-bindtouchstart="onPressStart"
            :main-thread-bindtouchend="onPressEnd"
            :main-thread-bindtouchcancel="onPressEnd"
            @tap="openLearners"
          >
            <text class="MoveDetailLearnersKey">{{ t('mdLearners', lang) }}</text>
            <text class="MoveDetailLearnersCount">{{ learnerCountLabel(learnerCount, lang) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>
