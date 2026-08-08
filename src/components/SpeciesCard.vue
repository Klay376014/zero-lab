<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import type { Species } from '../data/dex.js'
import { bestBst, genNumeral, megaForms, spriteUrl } from '../data/dex.js'
import { formLabel, speciesName } from '../data/i18n.js'
import { typeAbbr } from '../data/types.js'
import { lang } from '../state/display.js'
import { sortOrder } from '../state/query.js'

const props = defineProps<{
  species: Species
  /** Which of the species' forms to render. */
  formIndex: number
}>()

const form = computed(() => props.species.f[props.formIndex] ?? props.species.f[0]!)

/** Four digits, as the era's status screens numbered them. */
const dexNo = computed(() => `No.${String(props.species.d).padStart(4, '0')}`)

const generation = computed(() => genNumeral(props.species))

/** The star alone for one Mega, the star plus a count for several. */
const megaBadge = computed(() => {
  const megas = megaForms(props.species)
  if (megas.length === 0) return ''
  return megas.length > 1 ? `★${megas.length}` : '★'
})

/** Shown only for species that have more than one form, where the number tells you something. */
const formCount = computed(() => (props.species.f.length > 1 ? String(props.species.f.length) : ''))

/**
 * The base-stat figure, shown only while the grid is ordered by it — so the number that decided
 * this card's position is on the card rather than left to be inferred from the order.
 *
 * `bestBst` takes the species, not the drawn form, because that is the value the sort compares.
 * Printing the drawn form's own total instead would put a number on the card that cannot explain
 * the position the card sits in: a base form ordered by its Mega's total would look misplaced.
 *
 * The sort order is read from application state rather than taken as a prop. It is ambient
 * display state, the same as the active language this component already reads directly — routing
 * it through the grid would make one component fetch two values of the same kind two ways.
 */
const bstFigure = computed(() => (
  sortOrder.value === 'stats' ? String(bestBst(props.species)) : ''
))

const names = computed(() => speciesName(props.species, lang.value))
const label = computed(() => formLabel(form.value, lang.value))
const spriteSrc = computed(() => spriteUrl(form.value))

/**
 * Whether the artwork has arrived. Driven by load, not error: measured on native, the image
 * element's error event never fires — a 404 leaves the box silently empty.
 */
const spriteLoaded = ref(false)

watch(spriteSrc, () => { spriteLoaded.value = false })

function onSpriteLoad(): void {
  spriteLoaded.value = true
}
</script>

<template>
  <view class="Card">
    <!-- The bevel needs its own view: the platform ignores inset box shadows, so the light and
         shadow edges must be real per-side borders. -->
    <view class="CardBevel">
      <view class="CardHead">
        <text class="CardNo">{{ dexNo }}</text>
        <view class="CardHeadRight">
          <text v-if="megaBadge" class="CardMega">{{ megaBadge }}</text>
          <text class="CardNo">{{ generation }}</text>
        </view>
      </view>

      <!-- Image and placeholder mount together: the image must stay in the tree to be fetched. -->
      <view class="CardSpriteBox">
        <image class="CardSprite" :src="spriteSrc" @load="onSpriteLoad" />
        <view v-if="!spriteLoaded" class="CardSpriteFallback">
          <TypeGlyph :type="form.t[0] ?? 'Normal'" surface="surface" :size="48" />
        </view>
      </view>

      <text class="CardName">{{ names.lead }}</text>
      <text class="CardNameAlt">{{ names.alt }}</text>
      <text class="CardForm">{{ label.lead }}</text>

      <view class="CardTypes">
        <view v-for="type in form.t" :key="type" class="CardType">
          <TypeGlyph :type="type" surface="surface" />
          <text class="CardTypeAbbr">{{ typeAbbr(type) }}</text>
        </view>
        <!-- One group rather than two independently right-aligned members: if each claimed
             the free space for itself, one would land at each end of it instead of the two
             sitting together at the trailing edge. -->
        <view class="CardTypesTrail">
          <text v-if="bstFigure" class="CardBst">{{ bstFigure }}</text>
          <text v-if="formCount" class="CardFormCount">{{ formCount }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
