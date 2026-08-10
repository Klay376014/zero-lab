import { computed, ref } from 'vue-lynx'

import type { Lang } from '../data/i18n.js'
import { MODES, tokensOf } from '../theme/modes.js'
import type { Mode, Tokens } from '../theme/modes.js'

const modeIndex = ref(0)
const lang = ref<Lang>('zh')

export const mode = computed<Mode>(() => MODES[modeIndex.value % MODES.length]!)

export const tokens = computed<Tokens>(() => tokensOf(mode.value))

/** Hyphenated: the style layer hyphenates custom property names on the way out. */
export const tokenStyle = computed<Record<string, string>>(() => {
  const style: Record<string, string> = {}
  for (const [name, value] of Object.entries(tokens.value)) {
    style[`--${hyphenate(name)}`] = value
  }
  return style
})

function hyphenate(name: string): string {
  return name.replace(/[A-Z]/g, (upper) => `-${upper.toLowerCase()}`)
}

export function cycleMode(): void {
  modeIndex.value = (modeIndex.value + 1) % MODES.length
}

export function toggleLang(): void {
  lang.value = lang.value === 'zh' ? 'en' : 'zh'
}

export { lang, modeIndex }
