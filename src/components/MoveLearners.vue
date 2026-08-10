<script setup lang="ts">
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

function choose(entry: Entry): void {
  openDetail(entry.species, entry.formIndex)
  closeMoveLearners()
}
</script>

<template>
  <view class="LearnersOverlay">
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
        </view>
      </scroll-view>
    </view>
  </view>
</template>
