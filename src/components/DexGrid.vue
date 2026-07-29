<script setup lang="ts">
/**
 * The species grid: every result of the active query, as cards.
 *
 * The card area carries its own scrolling container because the platform does not scroll a
 * page the way a browser does — content past the first screen is not clipped, it is simply
 * unreachable. The masthead and query bar deliberately stay outside this component so they
 * do not scroll away with the cards.
 *
 * A plain scrolling container rather than the platform's recycling list element, which is
 * the opposite of what the element's own guidance advises. The reason is measured, not
 * stylistic: vue-lynx's list binding implements only append-at-end — insertion ignores the
 * requested position, and the remove and update actions it reports to the native list are
 * hardcoded empty. So a sequence that shrinks under a filter keeps its stale items, and one
 * reordered by a sort pairs cells with the wrong species. Filtering and sorting are the
 * whole point of this grid, so the list element cannot hold it. See design/HANDOFF.md
 * §12.13 for the evidence and the trigger for revisiting this.
 */
import { ref, watch } from 'vue-lynx'

import SpeciesCard from './SpeciesCard.vue'
import { t } from '../data/i18n.js'
import { lang } from '../state/display.js'
import type { Result } from '../state/query.js'

const props = defineProps<{
  /** The active query's results, each already paired with the form its card draws. */
  results: readonly Result[]
}>()

/** Milliseconds of delay added per card, carried over from the design document. */
const REVEAL_STEP_MS = 14

/**
 * The index past which every card carries the same delay.
 *
 * Without a cap the delay grows with the result count and the last of 208 cards waits about
 * three seconds. Capped, the whole reveal finishes in well under a second no matter how many
 * results there are.
 */
const REVEAL_CAP_INDEX = 26

/**
 * Whether the staggered reveal is armed.
 *
 * Armed at launch, disarmed the first time the query changes — deliberately not on a timer.
 * The design document cleared its equivalent flag a fixed number of milliseconds after boot,
 * and that assumption does not survive here: laying out 208 cells and issuing 208 artwork
 * requests can take longer than any such window, so the class was being taken off again
 * before the platform had painted anything and the reveal never appeared at all.
 *
 * A query change is the honest signal instead. The reveal belongs to launch, and launch is
 * over once the user touches a control — which does not depend on how long a first paint
 * takes. Cards arriving later, from a widened filter or a cleared search, therefore never
 * replay it, which is the behaviour the flag exists for.
 */
const booting = ref(true)

watch(() => props.results, () => {
  booting.value = false
})

/**
 * The reveal delay for the card at `index`, in milliseconds.
 *
 * Computed here rather than as a CSS custom property multiplied in `calc()` — which is how
 * the design document did it — because that would lean on two platform behaviours at once
 * (`calc()` over a custom property, and custom-property naming through the style binding).
 * A resolved number needs neither.
 */
function revealDelayMs(index: number): number {
  return Math.min(index, REVEAL_CAP_INDEX) * REVEAL_STEP_MS
}

/**
 * A card's reconciliation identity.
 *
 * Composed from the species number and the displayed form, never the position in the
 * sequence: filtering and sorting change both the length and the order, and a
 * position-derived key makes the framework reuse a card component for a different species.
 *
 * The form index has to be part of it. One species shows a different form under different
 * type filters, and a card holds its own sprite load state — a key carrying only the number
 * would let that state survive a form change, leaving the previous form's placeholder over
 * the new artwork.
 */
function cardKey(result: Result): string {
  return `${result.species.d}-${result.formIndex}`
}
</script>

<template>
  <scroll-view class="DexGrid" scroll-orientation="vertical">
    <!--
      An empty result is a normal outcome of filtering, not a fault: it says so in words
      rather than leaving a blank region, and nothing is reported to the console.
    -->
    <text v-if="results.length === 0" class="DexGridEmpty">{{ t('empty', lang) }}</text>

    <view v-else class="Cards">
      <view
        v-for="(result, index) in results"
        :key="cardKey(result)"
        :class="booting ? 'DexCell CardReveal' : 'DexCell'"
        :style="booting ? { animationDelay: `${revealDelayMs(index)}ms` } : undefined"
      >
        <SpeciesCard :species="result.species" :form-index="result.formIndex" />
      </view>
    </view>
  </scroll-view>
</template>
