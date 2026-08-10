<script setup lang="ts">
import { computed } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import { moveOf } from '../data/dex.js'
import type { Move } from '../data/dex.js'
import { damageClassAbbr, moveHeads, moveName, t } from '../data/i18n.js'
import { TYPE_ORDER } from '../data/types.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang } from '../state/display.js'
import { bonusOnly, moveSort } from '../state/learnset.js'
import type { MoveSort } from '../state/learnset.js'
import { openMoveLearners } from '../state/moveLearners.js'

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

const heads = computed(() => moveHeads(lang.value))

const BOUND_ABOVE_ROWS = 12

const bounded = computed(() => rows.value.length > BOUND_ABOVE_ROWS)

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

function openLearners(row: Row): void {
  openMoveLearners(row.index)
}

const countLabel = computed(() => (
  bonusOnly.value ? `${all.value.length} → ${rows.value.length}` : String(all.value.length)
))

function figure(value: number | null): string {
  return value === null ? '—' : String(value)
}

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
    >
      <view
        v-for="row in rows"
        :key="row.move.n"
        :class="row.stab ? 'MoveRow MoveRowStab' : 'MoveRow'"
        :main-thread-bindtouchstart="onPressStart"
        :main-thread-bindtouchend="onPressEnd"
        :main-thread-bindtouchcancel="onPressEnd"
        @tap="openLearners(row)"
      >
        <view class="MoveGlyphCell">
          <TypeGlyph :type="row.move.ty" :surface="row.stab ? 'surface2' : 'panel'" />
        </view>
        <!-- text-maxline is an attribute, not a style property. -->
        <text class="MoveName" text-maxline="1">{{ row.name }}</text>
        <!-- Real node: no generated-content property on this platform. -->
        <text v-if="row.stab" class="MoveStar">★</text>
        <text class="MoveClass">{{ row.abbr }}</text>
        <text :class="figureClass(row.move.pw)">{{ figure(row.move.pw) }}</text>
        <text :class="figureClass(row.move.ac)">{{ figure(row.move.ac) }}</text>
        <text class="MoveFigurePp">{{ row.move.pp }}</text>
      </view>

      <text v-if="rows.length === 0" class="MoveNone">{{ t('mvNone', lang) }}</text>
    </scroll-view>
  </view>
</template>
