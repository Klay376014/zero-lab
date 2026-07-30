<script setup lang="ts">
/**
 * One form's learnset, as a six-column table.
 *
 * Takes the move indices and the types the bonus is judged against, not the species: a
 * section is held on the species while a form holds only an index into those sections, so
 * neither input can be reached from a form alone, and the species would be an input this
 * component has no other use for. The panel resolves the section — the same arrangement as
 * the ability list, which receives the slots.
 *
 * Every row is rendered into the panel's own scrolling container. There is deliberately no
 * scrolling container and no maximum height here: two nested scrolling layers compete for one
 * gesture, and the panel's spec allows exactly one. The platform's list binding is likewise
 * unused — it appends only at the tail and reports neither removals nor reorders, so a
 * sequence that both sorts and filters would keep stale rows and pair cells with the wrong
 * content.
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
 * Every move in the learnset, marked for the same-type attack bonus.
 *
 * A move is marked when its type is one of this form's types **and** its damage class is not
 * status. A status move deals no damage and so receives no damage bonus — marking a same-type
 * status move is a quiet error, because the row looks entirely ordinary with an extra star.
 *
 * Judged against the form's types rather than the species', which is what makes a Mega differ
 * from the base form it borrows the section from: Charizard's 72 moves yield 19 marks as
 * Fire/Flying and 20 as Fire/Dragon.
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
 * The rows in the active order, filtered when the bonus filter is on.
 *
 * Both the power and the type order resolve equal values by name. Without that tiebreaker the
 * order of equal rows is implementation-defined, and both keys produce large equal groups —
 * one learnset holds three moves at 150 and three more at 80, and the type key collapses
 * 496 moves into 18 buckets. The symptom of leaving it out is an order that occasionally
 * differs between two identical operations, which is close to impossible to reproduce.
 *
 * A move with no power sorts last rather than as zero: absent power means the move deals no
 * fixed damage, which is not the same claim as dealing none.
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

/**
 * The learnset's size, and the filtered size beside it while the filter is on.
 *
 * Both, not one: a single number leaves a reader unable to tell a species with twelve moves
 * from a filter that left twelve.
 */
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

    <!--
      The column header shares the row's own column classes, which is what keeps it aligned
      with the figures below it. It sits in the flow rather than stuck to the top of a
      scrolling region: this table has no scrolling region of its own to stick to.
    -->
    <view class="MoveRow MoveHead">
      <view class="MoveGlyphCell" />
      <text class="MoveName" text-maxline="1">{{ heads[1] }}</text>
      <text class="MoveClass">{{ heads[2] }}</text>
      <text class="MoveFigure">{{ heads[3] }}</text>
      <text class="MoveFigure">{{ heads[4] }}</text>
      <text class="MoveFigurePp">{{ heads[5] }}</text>
    </view>

    <view
      v-for="row in rows"
      :key="row.move.n"
      :class="row.stab ? 'MoveRow MoveRowStab' : 'MoveRow'"
    >
      <view class="MoveGlyphCell">
        <TypeGlyph :type="row.move.ty" :surface="row.stab ? 'surface2' : 'panel'" />
      </view>
      <!--
        The line limit is an attribute on the element, not a style property. Declaring
        text-maxline in the stylesheet is silently inert — the name wraps on device and the
        stylesheet looks as though it handled it.
      -->
      <text class="MoveName" text-maxline="1">{{ row.name }}</text>
      <!--
        A real node, because the platform has no generated-content property: the design
        document's pseudo-element star would never appear. The name column absorbs its width,
        so a starred row's figure columns stay aligned with an unstarred one's.
      -->
      <text v-if="row.stab" class="MoveStar">★</text>
      <text class="MoveClass">{{ row.abbr }}</text>
      <text :class="figureClass(row.move.pw)">{{ figure(row.move.pw) }}</text>
      <text :class="figureClass(row.move.ac)">{{ figure(row.move.ac) }}</text>
      <text class="MoveFigurePp">{{ row.move.pp }}</text>
    </view>

    <!--
      An empty result is what the bonus filter does to a species whose only move is a same-type
      status move. It says so in words rather than leaving a gap, and reports nothing.
    -->
    <text v-if="rows.length === 0" class="MoveNone">{{ t('mvNone', lang) }}</text>
  </view>
</template>
