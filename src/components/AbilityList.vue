<script setup lang="ts">
/**
 * One form's ability slots.
 *
 * Takes the slots and nothing else. Resolving a slot to an ability is the data layer's job —
 * 360 forms share 200 abilities, so the slots hold indices — and this component only asks for
 * the ability behind each one.
 */
import { computed } from 'vue-lynx'

import type { AbilityRef } from '../data/dex.js'
import { abilityOf, isHidden } from '../data/dex.js'
import { abilityDescription, abilityName, t } from '../data/i18n.js'
import { lang } from '../state/display.js'

const props = defineProps<{
  abilities: readonly AbilityRef[]
}>()

/**
 * The slots resolved for rendering.
 *
 * Assembled here rather than resolved three times in the template: the name pair, the
 * description and the hidden marker all come from the same slot, and looking it up once per
 * row keeps the template readable.
 *
 * An empty description is carried through as an empty string and the row omits that block
 * entirely — 19 of the 200 abilities have no Chinese description, and an empty area under a
 * name reads as a rendering fault rather than as missing data.
 */
const rows = computed(() => props.abilities.map((ref) => {
  const ability = abilityOf(ref)
  return {
    names: abilityName(ability, lang.value),
    description: abilityDescription(ability, lang.value),
    hidden: isHidden(ref),
  }
}))
</script>

<template>
  <view class="Abilities">
    <view class="AbilitiesHead">
      <text class="AbilitiesTitle">{{ t('secAbil', lang) }}</text>
      <text class="AbilitiesCount">{{ abilities.length }}</text>
    </view>

    <view v-for="(row, index) in rows" :key="index" class="Ability">
      <view class="AbilityHead">
        <text class="AbilityName">{{ row.names.lead }}</text>
        <text v-if="row.names.alt" class="AbilityNameAlt">{{ row.names.alt }}</text>
        <text v-if="row.hidden" class="AbilityHidden">{{ t('hidden', lang) }}</text>
      </view>
      <text v-if="row.description" class="AbilityDesc">{{ row.description }}</text>
    </view>
  </view>
</template>
