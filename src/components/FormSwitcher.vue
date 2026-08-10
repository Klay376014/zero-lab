<script setup lang="ts">
import { computed } from 'vue-lynx'

import TypeGlyph from './TypeGlyph.vue'
import type { FormKind, Species } from '../data/dex.js'
import { formLabel, kindLabel } from '../data/i18n.js'
import { onPressEnd, onPressStart } from '../interaction/press.js'
import { lang } from '../state/display.js'

const props = defineProps<{
  species: Species
  formIndex: number
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

const KIND_ORDER: readonly FormKind[] = ['base', 'other', 'regional', 'mega']

const baseSignature = computed(() => (props.species.f[0]?.t ?? []).join('/'))

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
          :main-thread-bindtouchstart="onPressStart"
          :main-thread-bindtouchend="onPressEnd"
          :main-thread-bindtouchcancel="onPressEnd"
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
