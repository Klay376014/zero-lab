<script setup lang="ts">
/**
 * One species card, showing one of that species' forms.
 *
 * Which form is shown is the caller's decision (`formIndex`) — the card has no form
 * switching of its own. That belongs with the form switcher, in a later slice.
 */
import { computed, ref, watch } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import type { Species } from '../data/dex.js'
import { genNumeral, megaForms } from '../data/dex.js'
import { formLabel, speciesName } from '../data/i18n.js'
import { typeAbbr } from '../data/types.js'
import { lang } from '../state/display.js'

const props = defineProps<{
  species: Species
  /** Which of the species' forms to render. */
  formIndex: number
}>()

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'

const form = computed(() => props.species.f[props.formIndex] ?? props.species.f[0]!)

/** Four digits, as the era's status screens numbered them. */
const dexNo = computed(() => `No.${String(props.species.d).padStart(4, '0')}`)

const generation = computed(() => genNumeral(props.species))

/**
 * The star alone when there is one Mega, the star plus a count when there are several —
 * a bare star would under-report Charizard's two.
 */
const megaBadge = computed(() => {
  const megas = megaForms(props.species)
  if (megas.length === 0) return ''
  return megas.length > 1 ? `★${megas.length}` : '★'
})

/** Shown only for species that have more than one form, where the number tells you something. */
const formCount = computed(() => (props.species.f.length > 1 ? String(props.species.f.length) : ''))

const names = computed(() => speciesName(props.species, lang.value))
const label = computed(() => formLabel(form.value, lang.value))
const spriteSrc = computed(() => SPRITE_BASE + form.value.s)

/**
 * Artwork is the card's one external dependency, so a failure has to leave something in the
 * box rather than a gap or a broken-image marker. The placeholder is the form's first type
 * mark on the secondary surface — the design document drew one on a canvas, which this
 * platform has no element for.
 *
 * Driven by success rather than by failure: measured on native, the image element's error
 * event never fires (a 404 leaves the box silently empty) while its load event does. So the
 * placeholder covers the box from the start and is removed once the artwork actually
 * arrives — which reaches the same observable state on both targets, and additionally means
 * a slow image shows the mark instead of a gap.
 */
const spriteLoaded = ref(false)

// A new form means a new request, so the box goes back to the placeholder until it lands.
watch(spriteSrc, () => { spriteLoaded.value = false })

function onSpriteLoad(): void {
  spriteLoaded.value = true
}
</script>

<template>
  <view class="Card">
    <!--
      The bevel lives on its own nested view: the platform does not support inset box
      shadows, so the light and shadow edges have to be real per-side borders, and the card
      already spends its own border on the outline.
    -->
    <view class="CardBevel">
      <view class="CardHead">
        <text class="CardNo">{{ dexNo }}</text>
        <view class="CardHeadRight">
          <text v-if="megaBadge" class="CardMega">{{ megaBadge }}</text>
          <text class="CardNo">{{ generation }}</text>
        </view>
      </view>

      <!--
        Both mounted at once: the image has to stay in the tree to be fetched at all, so the
        placeholder sits on top of it and is removed on load rather than swapped in on error.
      -->
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
        <text v-if="formCount" class="CardFormCount">{{ formCount }}</text>
      </view>
    </view>
  </view>
</template>
