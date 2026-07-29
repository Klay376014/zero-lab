<script setup lang="ts">
/**
 * The buttons that switch which of a species' forms the panel describes.
 *
 * Grouped by kind rather than listed flat. Twenty Vivillon patterns in one undifferentiated
 * row cannot be read; the same twenty under a named group can. The group order is fixed so the
 * base form is always first and Megas always last, whatever order the dataset happens to use.
 *
 * Reports the chosen form to its caller instead of writing the selection itself, so the panel
 * stays the one place that knows how a form change is applied.
 */
import { computed } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import type { FormKind, Species } from '../data/dex.js'
import { formLabel, kindLabel } from '../data/i18n.js'
import { lang } from '../state/display.js'

const props = defineProps<{
  species: Species
  /** Which form is currently shown, and therefore which button is selected. */
  formIndex: number
}>()

const emit = defineEmits<{
  /** A form was chosen. Carries its index in the species' form list. */
  select: [index: number]
}>()

/** Base first, Megas last. Fixed here rather than taken from the dataset's own order. */
const KIND_ORDER: readonly FormKind[] = ['base', 'other', 'regional', 'mega']

/**
 * The species' first form's type combination, as the signature a form is compared against.
 *
 * A mark on a button means "this form retypes the Pokémon". Stamping all twenty Vivillon
 * patterns with the Bug/Flying pair the species already has would be pure noise, so a button
 * carries marks only when its signature differs from this one.
 */
const baseSignature = computed(() => (props.species.f[0]?.t ?? []).join('/'))

/** The groups that have at least one form, in the fixed kind order. */
const groups = computed(() => KIND_ORDER.flatMap((kind) => {
  const forms = props.species.f
    .map((form, index) => ({ form, index }))
    .filter((entry) => entry.form.k === kind)
  if (forms.length === 0) return []
  return [{
    kind,
    label: kindLabel(kind, lang.value),
    forms: forms.map(({ form, index }) => ({
      index,
      label: formLabel(form, lang.value).lead,
      isMega: form.k === 'mega',
      // Empty when the form does not retype the species, which is what the template tests.
      types: form.t.join('/') === baseSignature.value ? [] : form.t,
    })),
  }]
}))
</script>

<template>
  <view class="Forms">
    <view v-for="group in groups" :key="group.kind" class="FormGroup">
      <text class="FormGroupLabel">{{ group.label }}</text>
      <view class="FormChips">
        <view
          v-for="entry in group.forms"
          :key="entry.index"
          :class="entry.index === formIndex ? 'FormChip FormChipOn' : 'FormChip'"
          @tap="emit('select', entry.index)"
        >
          <text
            v-if="entry.isMega"
            :class="entry.index === formIndex ? 'FormChipStar FormChipStarOn' : 'FormChipStar'"
          >★</text>
          <text
            :class="entry.index === formIndex ? 'FormChipText FormChipTextOn' : 'FormChipText'"
          >
            {{ entry.label }}
          </text>
          <!--
            Drawn for the surface this button actually presents: a mark carries its fill inside
            itself, so a selected button's mark has to be drawn against the accent rather than
            against the surface, or it disappears into it.
          -->
          <TypeGlyph
            v-for="type in entry.types"
            :key="type"
            :type="type"
            :surface="entry.index === formIndex ? 'accent' : 'surface'"
            :size="16"
          />
        </view>
      </view>
    </view>
  </view>
</template>
