<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx'

import AbilityList from './AbilityList.vue'
import FormSwitcher from './FormSwitcher.vue'
import LearnsetTable from './LearnsetTable.vue'
import StatBars from './StatBars.vue'
import TypeGlyph from './TypeGlyph.vue'
import type { Species } from '../data/dex.js'
import { learnsetOf, spriteUrl } from '../data/dex.js'
import { formLabel, formsOfLabel, genOfLabel, kindLabel, speciesName, t } from '../data/i18n.js'
import { typeColor, typeName } from '../data/types.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang, mode } from '../state/display.js'
import { closeDetail, selectForm } from '../state/selection.js'
import { inkOn } from '../theme/contrast.js'
import type { GlyphSurface } from '../theme/modes.js'

const props = defineProps<{
  species: Species
  /** Which of the species' forms the panel describes. Already clamped by the selection. */
  formIndex: number
}>()

/** The form being described. The selection clamps the index, so the fallback is unreachable. */
const form = computed(() => props.species.f[props.formIndex] ?? props.species.f[0]!)

const names = computed(() => speciesName(props.species, lang.value))
const label = computed(() => formLabel(form.value, lang.value))
const spriteSrc = computed(() => spriteUrl(form.value))

/** The move indices this form can learn. */
const learnset = computed(() => learnsetOf(props.species, form.value))

/**
 * Whether the artwork has arrived. Driven by load, not error: measured on native, the image
 * element's error event never fires — a 404 leaves the box silently empty.
 */
const spriteLoaded = ref(false)

watch(spriteSrc, () => { spriteLoaded.value = false })

function onSpriteLoad(): void {
  spriteLoaded.value = true
}

/** A type pill's text. Chinese carries both names; English is the type's key elsewhere. */
function typeLabel(type: string): string {
  return lang.value === 'zh' ? `${typeName(type, lang.value)} ${type}` : type
}

/** The pill's fill, in the mode that is allowed to spend type colour. */
function pillStyle(type: string): Record<string, string> | undefined {
  if (!mode.value.typeColor) return undefined
  const fill = typeColor(type)
  if (fill === undefined) return undefined
  return { backgroundColor: fill, borderColor: fill }
}

/**
 * The pill text's colour in the filled mode. Separate from {@link pillStyle} because a colour
 * set on a view does not reach the text node inside it.
 */
function pillTextStyle(type: string): Record<string, string> | undefined {
  if (!mode.value.typeColor) return undefined
  const fill = typeColor(type)
  if (fill === undefined) return undefined
  return { color: inkOn(fill) }
}

/**
 * Which surface the pill's mark will sit on. A mark has its fill written into it and cannot
 * inherit, so it must be drawn for the surface beneath it.
 */
const pillGlyphSurface = computed<GlyphSurface>(() => (
  mode.value.typeColor ? 'typechip' : 'surface'
))


/** The form label with its kind, and the other language's label when there is one. */
const formValue = computed(() => {
  const kind = kindLabel(form.value.k, lang.value)
  const alt = label.value.alt ? `　${label.value.alt}` : ''
  return `${label.value.lead}（${kind}）${alt}`
})

/** The game version that introduced this form, falling back to the species'. */
const version = computed(() => `v${form.value.v || props.species.v}`)

/** Whether this form is obtainable in the current roster. Only a base form inherits the species'. */
const inRoster = computed(() => {
  if (form.value.x) return false
  return form.value.k === 'base' ? !props.species.x : true
})

/** The dataset's note about this species, prefixed, and shown on the base form only. */
const note = computed(() => {
  const text = form.value.k === 'base' ? props.species.n : ''
  return text ? t('notePrefix', lang.value) + text : ''
})

/** Four digits, as the era's status screens numbered them. */
const dexNo = computed(() => `No.${String(props.species.d).padStart(4, '0')}`)

/** The line under the names: number, generation, form count, category — parts that apply. */
const identity = computed(() => {
  const parts = [dexNo.value, genOfLabel(props.species.g, lang.value)]
  if (lang.value === 'zh' && props.species.gz) parts.push(props.species.gz)
  return parts.join('　・　')
})
</script>

<template>
  <view class="DetailOverlay">
    <!-- No press feedback on the veil, deliberately: a pressed appearance would present it as a
         control, and its only behaviour is to dismiss the panel. -->
    <view class="DetailVeil" @tap="closeDetail" />

    <view class="DetailPanel">
      <view class="DetailHead">
        <view class="DetailHeadText">
          <text class="DetailName">{{ names.lead }}</text>
          <text v-if="names.alt" class="DetailNameAlt">{{ names.alt }}</text>
          <text class="DetailIdentity">{{ identity }}</text>
        </view>
        <view
          class="DetailClose"
          :main-thread-bindtouchstart="onPressStart"
          :main-thread-bindtouchend="onPressEnd"
          :main-thread-bindtouchcancel="onPressEnd"
          @tap="closeDetail"
        >
          <text class="DetailCloseMark">✕</text>
        </view>
      </view>

      <scroll-view class="DetailBody" scroll-orientation="vertical">
        <view class="DetailSections">
          <!-- Image and placeholder mount together: the image must stay in the tree to be fetched. -->
          <view class="DetailStage">
            <view class="DetailSpriteBox">
              <image class="DetailSprite" :src="spriteSrc" @load="onSpriteLoad" />
              <view v-if="!spriteLoaded" class="DetailSpriteFallback">
                <TypeGlyph :type="form.t[0] ?? 'Normal'" surface="surface" :size="96" />
              </view>
            </view>
            <text class="DetailStageCaption">{{ label.lead }}</text>
          </view>

          <FormSwitcher
            v-if="species.f.length > 1"
            :species="species"
            :form-index="formIndex"
            @select="selectForm"
          />

          <view class="DetailAttrs">
            <view class="DetailAttr">
              <text class="DetailAttrKey">{{ t('dTypes', lang) }}</text>
              <view class="DetailAttrTypes">
                <view
                  v-for="type in form.t"
                  :key="type"
                  class="TypePill"
                  :style="pillStyle(type)"
                >
                  <TypeGlyph :type="type" :surface="pillGlyphSurface" :size="16" />
                  <!-- Ink bound here: a colour on a parent view does not reach a text node. -->
                  <text class="TypePillText" :style="pillTextStyle(type)">
                    {{ typeLabel(type) }}
                  </text>
                </view>
              </view>
            </view>

            <view class="DetailAttr">
              <text class="DetailAttrKey">{{ t('dForm', lang) }}</text>
              <text class="DetailAttrValue">{{ formValue }}</text>
            </view>

            <view class="DetailAttr">
              <text class="DetailAttrKey">{{ t('dVer', lang) }}</text>
              <text class="DetailAttrValue">{{ version }}</text>
            </view>

            <view class="DetailAttr">
              <text class="DetailAttrKey">{{ t('dRoster', lang) }}</text>
              <text class="DetailAttrValue">
                {{ inRoster ? t('rosterIn', lang) : t('rosterOut', lang) }}
              </text>
            </view>
          </view>

          <text v-if="note" class="DetailWarn">{{ note }}</text>
          <text v-if="!inRoster" class="DetailWarn">{{ t('warnRoster', lang) }}</text>
          <text v-if="form.a" class="DetailWarn">{{ t('warnApprox', lang) }}</text>

          <StatBars :stats="form.st" />
          <AbilityList :abilities="form.ab" />
          <LearnsetTable :moves="learnset" :types="form.t" />
        </view>
      </scroll-view>
    </view>
  </view>
</template>
