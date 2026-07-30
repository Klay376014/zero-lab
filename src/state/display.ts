import { computed, ref } from 'vue-lynx'

import type { Lang } from '../data/i18n.js'
import { MODES, tokensOf } from '../theme/modes.js'
import type { Mode, Tokens } from '../theme/modes.js'

const modeIndex = ref(0)
const lang = ref<Lang>('zh')

/** The active mode. */
export const mode = computed<Mode>(() => MODES[modeIndex.value % MODES.length]!)

/** The active mode's ten semantic tokens. */
export const tokens = computed<Tokens>(() => tokensOf(mode.value))

/**
 * The tokens as inline CSS custom properties for the root view's style binding — Lynx has no
 * document element to write them onto.
 *
 * Hyphenated because the style layer hyphenates custom property names on the way out: a token
 * bound as `--accentInk` lands as `--accent-ink`, and `var(--accentInk)` then resolves to
 * nothing, silently.
 */
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

/** Advance to the next colour mode. */
export function cycleMode(): void {
  modeIndex.value = (modeIndex.value + 1) % MODES.length
}

/** Swap which language leads. The active mode is untouched. */
export function toggleLang(): void {
  lang.value = lang.value === 'zh' ? 'en' : 'zh'
}

export { lang, modeIndex }
