<script setup lang="ts">
/** The buttons that switch which of a species' forms the panel describes, grouped by kind. */
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

/** The base form's type combination. A button carries marks only when its own differs. */
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
          <!-- A mark carries its fill inside itself, so a selected button's must be drawn
               against the accent or it disappears into it. -->
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
