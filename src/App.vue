<script setup lang="ts">
import { onMounted, ref } from 'vue-lynx'

import './App.css'
import SpeciesCard from './components/SpeciesCard.vue'
import TypeGlyph from './components/TypeGlyph.vue'
import { dex } from './data/dex.js'
import { t } from './data/i18n.js'
import { TYPE_ABBR, TYPE_ORDER } from './data/types.js'
import { cycleMode, lang, mode, toggleLang, tokenStyle } from './state/display.js'

/**
 * Boundary cases, chosen to exercise the card contract rather than to look good: a
 * dual-type species with several forms including Megas, the two longest names in either
 * language, a single-type species with no alternate form, and a species with two Megas so
 * the badge has to carry a count.
 */
const CARDS: readonly { dex: number, formIndex: number }[] = [
  { dex: 3, formIndex: 0 },     // Venusaur — dual type, one Mega
  { dex: 6, formIndex: 0 },     // Charizard — two Megas, so the badge counts
  { dex: 214, formIndex: 0 },   // Heracross — five-character Chinese name, generation II
  { dex: 740, formIndex: 0 },   // Crabominable — longest Latin name
  { dex: 132, formIndex: 0 },   // Ditto — single type, single form, no badges
  { dex: 1019, formIndex: 0 },  // Hydrapple — a species PokeAPI carries no category for
  { dex: 3, formIndex: 1 },     // Mega Venusaur — a non-base formIndex
]

const cards = CARDS.map((entry) => ({
  ...entry,
  species: dex.species.find((s) => s.d === entry.dex)!,
}))

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'

/** Charizard: enough flat colour and hard edges that interpolation is obvious at 2x. */
const probeSprite = `${SPRITE_BASE}6.png`

/** Deliberately absent, to find out whether the platform reports the failure at all. */
const brokenSprite = `${SPRITE_BASE}this-sprite-does-not-exist.png`

const probeErrorFired = ref(false)

function onProbeError(): void {
  probeErrorFired.value = true
}

// Printed once per mount. A mode or language switch must not print it again — that would
// mean the tree is being recreated rather than recoloured.
onMounted(() => {
  console.info('[harness] App mounted')
})
</script>

<template>
  <view class="Root" :style="tokenStyle">
    <view class="Shell">
      <view class="Screen">
        <view class="Masthead">
          <text class="Title">CHAMPIONS DEX</text>
          <text class="Sub">{{ mode.id }} / {{ lang }}</text>
        </view>

        <view class="Row">
          <text class="Label">{{ t('mode', lang) }}</text>
          <view class="Chip" @tap="cycleMode">
            <text class="ChipText">{{ mode.id }}</text>
          </view>
          <view class="Chip" @tap="toggleLang">
            <text class="ChipText">{{ t('lang', lang) }}</text>
          </view>
        </view>

        <view class="Swatches">
          <view class="Swatch SwatchBg"><text class="SwatchText">bg</text></view>
          <view class="Swatch SwatchShell"><text class="SwatchText">shell</text></view>
          <view class="Swatch SwatchSurface"><text class="SwatchText">surface</text></view>
          <view class="Swatch SwatchSurface2"><text class="SwatchText">surface2</text></view>
          <view class="Swatch SwatchAccent"><text class="SwatchTextAccent">accent</text></view>
        </view>

        <text class="Section">{{ t('hCards', lang) }}</text>
        <view class="Cards">
          <SpeciesCard
            v-for="(card, i) in cards"
            :key="`${card.dex}-${card.formIndex}-${i}`"
            :species="card.species"
            :form-index="card.formIndex"
          />
        </view>

        <!--
          Every glyph on both surfaces it actually renders on in this slice. A mark that
          vanishes against its own background is the failure this board exists to catch,
          so the two rows must be read side by side.
        -->
        <text class="Section">{{ t('hGlyphs', lang) }}</text>
        <text class="SectionNote">{{ t('surfaceCard', lang) }}</text>
        <view class="GlyphRow">
          <view v-for="type in TYPE_ORDER" :key="type" class="GlyphCell">
            <TypeGlyph :type="type" surface="surface" />
            <text class="GlyphAbbr">{{ TYPE_ABBR[type] }}</text>
          </view>
        </view>
        <text class="SectionNote">{{ t('surfaceAccent', lang) }}</text>
        <view class="GlyphRow">
          <view v-for="type in TYPE_ORDER" :key="type" class="GlyphCell GlyphCellAccent">
            <TypeGlyph :type="type" surface="accent" />
            <text class="GlyphAbbrAccent">{{ TYPE_ABBR[type] }}</text>
          </view>
        </view>

        <!--
          The card draws artwork 1:1, where nearest-neighbour and bilinear are
          indistinguishable. Only the 2x pair below can answer whether the platform honours
          the declaration — the third case is the control, with no declaration at all.
        -->
        <text class="Section">{{ t('hSprite', lang) }}</text>
        <view class="SpritePair">
          <view class="SpriteCase">
            <image class="SpriteNative" :src="probeSprite" />
            <text class="SpriteCaseLabel">{{ t('spriteNative', lang) }}</text>
          </view>
          <view class="SpriteCase">
            <image class="SpriteDouble" :src="probeSprite" />
            <text class="SpriteCaseLabel">{{ t('spriteDouble', lang) }}</text>
          </view>
          <view class="SpriteCase">
            <image class="SpriteDoubleSmooth" :src="probeSprite" />
            <text class="SpriteCaseLabel">192px / no declaration</text>
          </view>
          <view class="SpriteCase">
            <image class="SpriteNative" :src="brokenSprite" @error="onProbeError" />
            <text class="SpriteCaseLabel">error event: {{ probeErrorFired ? 'fired' : 'not fired' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
