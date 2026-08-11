<script setup lang="ts">
/**
 * Move detail: what a move does, and the way through to the species that learn it.
 *
 * Reached from two places — a row in the move index, and a row in a species' learnset table — and
 * it is the only way to the learner list. Both entry points therefore reach the same screen for
 * the same gesture, which is what the second one bought by giving up its direct route to the
 * learners.
 *
 * Flags are stated as a row of short labels, the last row of the attribute list. 17 of the 21 get
 * one; the other four are omitted by carrying no label in the string table, which is the whole of
 * how that exclusion is expressed.
 *
 * The row is absent, rather than empty, when nothing can be stated. 71 of the 496 moves carry no
 * flags at all because the upstream source never recorded them, and saying "none" would assert
 * "this move does not have those properties" where the data supports only "nobody wrote it down".
 * Stating only what is present asserts nothing about what is not — which is why there is no count
 * and no empty-state text here.
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
  moveFlagLabel,
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

/**
 * The flags to state, in the ascending identifier order the dataset already guarantees — stable
 * rather than meaningful, and chosen for exactly that reason: no second ordering rule to keep.
 *
 * A flag with no label drops out here. That covers the four excluded identifiers and anything
 * upstream adds before someone writes a label for it; the dataset's own invariant and the flag
 * table's size test are what make the second case loud, so it can be quiet on screen.
 */
const flagLabels = computed(() => (move.value.fl ?? [])
  .map((id) => moveFlagLabel(id, lang.value))
  .filter((label) => label !== ''))

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

            <!-- Last row, and absent rather than empty when there is nothing to state. Its value
                 column is the species panel's wrapping mark container, so four labels wrap within
                 the row instead of raising a horizontal-scrolling question the layer's one
                 scrolling container would not answer.

                 `MoveFlagRow` centres this row instead of aligning it on baselines like the five
                 above — see the stylesheet for what the platform does with a container's baseline
                 and why the label sat low without it. -->
            <view v-if="flagLabels.length > 0" class="DetailAttr MoveFlagRow">
              <text class="DetailAttrKey MoveDetailAttrKey">{{ t('mdFlags', lang) }}</text>
              <view class="DetailAttrTypes">
                <view v-for="label in flagLabels" :key="label" class="MoveFlagMark">
                  <text class="MoveFlagMarkText">{{ label }}</text>
                </view>
              </view>
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
