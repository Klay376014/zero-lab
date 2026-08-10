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
  formIndex: number
}>()

const form = computed(() => props.species.f[props.formIndex] ?? props.species.f[0]!)

const dexNo = computed(() => `No.${String(props.species.d).padStart(4, '0')}`)

const generation = computed(() => genNumeral(props.species))

const megaBadge = computed(() => {
  const megas = megaForms(props.species)
  if (megas.length === 0) return ''
  return megas.length > 1 ? `★${megas.length}` : '★'
})

const formCount = computed(() => (props.species.f.length > 1 ? String(props.species.f.length) : ''))

/** Shown only while the grid is sorted by it, so the sort key is visible on the card. */
const bstFigure = computed(() => (
  sortOrder.value === 'stats' ? String(bestBst(props.species)) : ''
))

const names = computed(() => speciesName(props.species, lang.value))
const label = computed(() => formLabel(form.value, lang.value))
const spriteSrc = computed(() => spriteUrl(form.value))

const spriteLoaded = ref(false)

watch(spriteSrc, () => { spriteLoaded.value = false })

function onSpriteLoad(): void {
  spriteLoaded.value = true
}
</script>

<template>
  <view class="Card">
    <view class="CardBevel">
      <view class="CardHead">
        <text class="CardNo">{{ dexNo }}</text>
        <view class="CardHeadRight">
          <text v-if="megaBadge" class="CardMega">{{ megaBadge }}</text>
          <text class="CardNo">{{ generation }}</text>
        </view>
      </view>

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
        <view class="CardTypesTrail">
          <text v-if="bstFigure" class="CardBst">{{ bstFigure }}</text>
          <text v-if="formCount" class="CardFormCount">{{ formCount }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
