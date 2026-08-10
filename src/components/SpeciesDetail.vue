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
  formIndex: number
}>()

const form = computed(() => props.species.f[props.formIndex] ?? props.species.f[0]!)

const names = computed(() => speciesName(props.species, lang.value))
const label = computed(() => formLabel(form.value, lang.value))
const spriteSrc = computed(() => spriteUrl(form.value))

const learnset = computed(() => learnsetOf(props.species, form.value))

const spriteLoaded = ref(false)

watch(spriteSrc, () => { spriteLoaded.value = false })

function onSpriteLoad(): void {
  spriteLoaded.value = true
}

function typeLabel(type: string): string {
  return lang.value === 'zh' ? `${typeName(type, lang.value)} ${type}` : type
}

function pillStyle(type: string): Record<string, string> | undefined {
  if (!mode.value.typeColor) return undefined
  const fill = typeColor(type)
  if (fill === undefined) return undefined
  return { backgroundColor: fill, borderColor: fill }
}

function pillTextStyle(type: string): Record<string, string> | undefined {
  if (!mode.value.typeColor) return undefined
  const fill = typeColor(type)
  if (fill === undefined) return undefined
  return { color: inkOn(fill) }
}

const pillGlyphSurface = computed<GlyphSurface>(() => (
  mode.value.typeColor ? 'typechip' : 'surface'
))

const formValue = computed(() => {
  const kind = kindLabel(form.value.k, lang.value)
  const alt = label.value.alt ? `　${label.value.alt}` : ''
  return `${label.value.lead}（${kind}）${alt}`
})

const version = computed(() => `v${form.value.v || props.species.v}`)

const inRoster = computed(() => {
  if (form.value.x) return false
  return form.value.k === 'base' ? !props.species.x : true
})

const note = computed(() => {
  const text = form.value.k === 'base' ? props.species.n : ''
  return text ? t('notePrefix', lang.value) + text : ''
})

const dexNo = computed(() => `No.${String(props.species.d).padStart(4, '0')}`)

const identity = computed(() => {
  const parts = [dexNo.value, genOfLabel(props.species.g, lang.value)]
  if (lang.value === 'zh' && props.species.gz) parts.push(props.species.gz)
  return parts.join('　・　')
})
</script>

<template>
  <view class="DetailOverlay">
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
