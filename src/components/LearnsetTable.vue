<script setup lang="ts">
/**
 * One form's learnset, as a six-column table.
 *
 * The rows' scrolling container is the panel's one permitted exemption; no other section inside
 * the panel may have one, because two nested scrolling layers compete for the same gesture and
 * this platform's scroll-view arbitrates between them with no attribute. Nothing in
 * `pnpm run check` can see this — it reads the stylesheet, not the template.
 */
import { computed } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import { moveOf } from '../data/dex.js'
import type { Move } from '../data/dex.js'
import { damageClassAbbr, moveHeads, moveName, t } from '../data/i18n.js'
import { TYPE_ORDER } from '../data/types.js'
import { lang } from '../state/display.js'
import { bonusOnly, moveSort } from '../state/learnset.js'
import type { MoveSort } from '../state/learnset.js'

const props = defineProps<{
  /** Indices into the shared move table, in the dataset's own order. */
  moves: readonly number[]
  /** The displayed form's types. The bonus is judged against these, not the species'. */
  types: readonly string[]
}>()

/** One rendered row: the move, its name in the leading language, and whether it is marked. */
interface Row {
  readonly move: Move
  readonly name: string
  readonly abbr: string
  readonly stab: boolean
}

/**
 * Every move in the learnset, marked for the same-type attack bonus: the move's type is one of
 * this form's **and** its damage class is not status.
 */
const all = computed<Row[]>(() => {
  const own = new Set(props.types)
  return props.moves.map((index) => {
    const move = moveOf(index)
    return {
      move,
      name: moveName(move, lang.value),
      abbr: damageClassAbbr(move.dc, lang.value),
      stab: own.has(move.ty) && move.dc !== 'Status',
    }
  })
})

/** Ascending by the name actually on screen, which is also every other order's tiebreaker. */
function byName(a: Row, b: Row): number {
  return a.name.localeCompare(b.name)
}

/** Position in the project's canonical type order; an unknown name sorts to the front. */
function typeRank(row: Row): number {
  return TYPE_ORDER.indexOf(row.move.ty as (typeof TYPE_ORDER)[number])
}

/**
 * The rows in the active order, filtered when the bonus filter is on. Power and type both
 * resolve ties by name — without it the order of equal rows is implementation-defined.
 */
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

/**
 * The displayed row count above which the table bounds its own height and scrolls. This and
 * `MoveTableBound`'s height in the stylesheet are one decision and must move together, or the
 * pair can produce a bounded table with nothing to scroll.
 */
const BOUND_ABOVE_ROWS = 12

/**
 * Whether the table carries its own height. Read from the rows on screen, not the species' move
 * total, so the filter drops the bound rather than leaving an empty box mid-panel.
 */
const bounded = computed(() => rows.value.length > BOUND_ABOVE_ROWS)

/** The three orders, paired with the string key that labels each. */
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

/** The learnset's size, and the filtered size beside it while the filter is on. */
const countLabel = computed(() => (
  bonusOnly.value ? `${all.value.length} → ${rows.value.length}` : String(all.value.length)
))

/** An absent power or accuracy is a property of the move, so it reads as a mark, not a gap. */
function figure(value: number | null): string {
  return value === null ? '—' : String(value)
}

/** The mark drops to the secondary ink so a column of figures still reads as figures. */
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
        @tap="pickSort(option.key)"
      >
        <text
          class="MoveMiniText"
          :class="moveSort === option.key ? 'MoveMiniTextOn' : undefined"
        >{{ t(option.label, lang) }}</text>
      </view>
      <view class="MoveMini" :class="bonusOnly ? 'MoveMiniOn' : undefined" @tap="toggleBonusOnly">
        <text class="MoveMiniText" :class="bonusOnly ? 'MoveMiniTextOn' : undefined">
          {{ t('mvStab', lang) }}
        </text>
      </view>
    </view>

    <!-- Outside the rows' scrolling container so it stays put; shares their column classes. -->
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
      >
        <view class="MoveGlyphCell">
          <TypeGlyph :type="row.move.ty" :surface="row.stab ? 'surface2' : 'panel'" />
        </view>
        <!-- text-maxline is an element attribute, not a style property: in the stylesheet it is
             silently inert and the name wraps on device. -->
        <text class="MoveName" text-maxline="1">{{ row.name }}</text>
        <!-- A real node: the platform has no generated-content property, so a pseudo-element
             star would never appear. -->
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
