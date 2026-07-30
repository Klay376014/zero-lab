<script setup lang="ts">
/**
 * The detail panel: everything about one form that the card has no room for.
 *
 * Mounted when a species is selected and unmounted when the selection is cleared, rather
 * than kept in the tree and hidden. Three things follow from that, all of them wanted: the
 * panel's deeper tree costs nothing while closed; the content starts at the top of its
 * scrolling container on every open without any code reading a scroll position; and the
 * reveal animation plays each time it opens.
 *
 * The overlay is positioned against the application's outermost view rather than the
 * viewport. That view already fills the screen, so the result is the same, and it does not
 * lean on a positioning mode this platform makes no documented promise about.
 */
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

/**
 * The move indices this form can learn.
 *
 * Resolved here because a section is held on the species and the form carries only an index
 * into them, so the table cannot reach it from the form it describes. Resolving it is all the
 * panel does with the learnset — the bonus, the order and the filter belong to the table.
 */
const learnset = computed(() => learnsetOf(props.species, form.value))

/**
 * Whether the artwork has arrived.
 *
 * Driven by success rather than by failure, exactly as the card is: measured on native, the
 * image element's error event never fires — a 404 leaves the box silently empty — while its
 * load event does. So the placeholder covers the box from the start and is removed once the
 * artwork actually lands, which additionally means a slow image shows the type mark instead
 * of a gap.
 *
 * That last part matters more here than on the card. The design document warmed the species'
 * other forms with an image constructor this platform does not have, so switching forms now
 * waits on a fresh request — and what fills the wait is this placeholder.
 */
const spriteLoaded = ref(false)

watch(spriteSrc, () => { spriteLoaded.value = false })

function onSpriteLoad(): void {
  spriteLoaded.value = true
}

/**
 * A type pill's text.
 *
 * Chinese carries both names, because the English name is the type's key everywhere else in
 * the interface — in the abbreviation on the card, in the filter, and in the dataset. English
 * therefore has nothing to add and shows one name.
 *
 * The design document put the Chinese name in a hover title. There is no hover on a touch
 * screen, so it moves into the pill itself rather than being replaced by a tap affordance
 * for two words.
 */
function typeLabel(type: string): string {
  return lang.value === 'zh' ? `${typeName(type, lang.value)} ${type}` : type
}

/**
 * The pill's fill and text, in the mode that is allowed to spend type colour.
 *
 * The four-tone mode gets nothing here and keeps the stylesheet's bordered pill: filling it
 * with a type colour would put a colour outside that mode's ramp on screen, which the theme's
 * colour-count invariant forbids. The ink is measured against the fill rather than chosen, so
 * a pale type reads as dark text and a saturated one as light.
 */
function pillStyle(type: string): Record<string, string> | undefined {
  if (!mode.value.typeColor) return undefined
  const fill = typeColor(type)
  if (fill === undefined) return undefined
  return { backgroundColor: fill, borderColor: fill }
}

/**
 * The pill text's colour in the filled mode, and nothing in the four-tone one.
 *
 * Separate from the pill's own style because a colour set on the pill view does not reach the
 * text node inside it — and because the text needs only the ink, not the fill.
 */
function pillTextStyle(type: string): Record<string, string> | undefined {
  if (!mode.value.typeColor) return undefined
  const fill = typeColor(type)
  if (fill === undefined) return undefined
  return { color: inkOn(fill) }
}

/**
 * Which surface the pill's mark will sit on.
 *
 * Not a style question but a drawing one: a mark is a shape with its fill written into it, so
 * it cannot inherit anything and has to be drawn for the surface beneath it. Filled pill in
 * one mode, bordered pill on the panel surface in the other.
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

/**
 * Whether this form is obtainable in the current roster.
 *
 * A form marked as outside the roster is out regardless of its species. Otherwise only a base
 * form inherits the species' standing: an alternate form of an out-of-roster species is
 * reached through that species, so marking it out twice would say the same thing twice.
 */
const inRoster = computed(() => {
  if (form.value.x) return false
  return form.value.k === 'base' ? !props.species.x : true
})

/**
 * The dataset's note about this species, prefixed, and shown on the base form only.
 *
 * A note says how the species is obtained, so it belongs to the form that is the species —
 * an alternate form is reached through its own route and would be claiming something the note
 * does not say.
 *
 * The design document also consulted a per-form note. The dataset carries none: the field is
 * absent from the form type and no form in the 360 has one, so reading it would be defending
 * against a shape this pipeline does not produce.
 */
const note = computed(() => {
  const text = form.value.k === 'base' ? props.species.n : ''
  return text ? t('notePrefix', lang.value) + text : ''
})

/** Four digits, as the era's status screens numbered them. */
const dexNo = computed(() => `No.${String(props.species.d).padStart(4, '0')}`)

/**
 * The line under the names: number, generation, form count, category.
 *
 * Assembled from the parts that apply rather than a fixed sentence — the form count is only
 * worth stating for a species that has more than one, and the category exists only in the
 * dataset's Chinese, so both drop out silently when they have nothing to say.
 */
const identity = computed(() => {
  const parts = [dexNo.value, genOfLabel(props.species.g, lang.value)]
  if (props.species.f.length > 1) parts.push(formsOfLabel(props.species.f.length, lang.value))
  if (lang.value === 'zh' && props.species.gz) parts.push(props.species.gz)
  return parts.join('　・　')
})
</script>

<template>
  <view class="DetailOverlay">
    <view class="DetailVeil" @tap="closeDetail" />

    <view class="DetailPanel">
      <!--
        Outside the scrolling container below, which is what keeps it in place while the
        content scrolls. The design document used sticky positioning for this; a header that
        is simply not inside the scrolling region needs no such support.
      -->
      <view class="DetailHead">
        <view class="DetailHeadText">
          <text class="DetailName">{{ names.lead }}</text>
          <text v-if="names.alt" class="DetailNameAlt">{{ names.alt }}</text>
          <text class="DetailIdentity">{{ identity }}</text>
        </view>
        <view class="DetailClose" @tap="closeDetail">
          <text class="DetailCloseMark">✕</text>
        </view>
      </view>

      <scroll-view class="DetailBody" scroll-orientation="vertical">
        <view class="DetailSections">
          <!--
            Both the image and its placeholder are mounted at once: the image has to stay in
            the tree to be fetched at all, so the placeholder sits on top and is removed on
            load rather than swapped in on error.
          -->
          <view class="DetailStage">
            <view class="DetailSpriteBox">
              <image class="DetailSprite" :src="spriteSrc" @load="onSpriteLoad" />
              <view v-if="!spriteLoaded" class="DetailSpriteFallback">
                <TypeGlyph :type="form.t[0] ?? 'Normal'" surface="surface" :size="96" />
              </view>
            </view>
            <text class="DetailStageCaption">{{ label.lead }}</text>
          </view>

          <!--
            Absent for a single-form species rather than present and inert: a control that can
            never do anything is noise. The switcher reports the chosen index and this component
            applies it, so the selection module stays the only writer.
          -->
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
                  <!--
                    The ink is bound on this node rather than left to fall through from the
                    pill: a colour set on a parent view does not reach a text node here, so
                    the filled mode would otherwise keep the panel's ink on a saturated fill.
                  -->
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

          <!--
            Stated conditions, not decorations: each says something the attribute rows above
            cannot, and an ordinary form renders none of them.
          -->
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
