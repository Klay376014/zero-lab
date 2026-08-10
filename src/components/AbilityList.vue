<script setup lang="ts">
import { computed } from 'vue-lynx'

import type { AbilityRef } from '../data/dex.js'
import { abilityOf, isHidden } from '../data/dex.js'
import { abilityDescription, abilityName, t } from '../data/i18n.js'
import { lang } from '../state/display.js'

const props = defineProps<{
  abilities: readonly AbilityRef[]
}>()

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
