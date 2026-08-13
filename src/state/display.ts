import { computed, ref } from 'vue-lynx'

import type { Lang } from '../data/i18n.js'
import { MODES, tokensOf } from '../theme/modes.js'
import type { Mode, ModeId, Tokens } from '../theme/modes.js'

const modeId = ref<ModeId>(MODES[0]!.id)
const lang = ref<Lang>('zh')

/** Falls back to the first mode, so a removed id cannot leave the screen with no tokens at all. */
export const mode = computed<Mode>(() => MODES.find((m) => m.id === modeId.value) ?? MODES[0]!)

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

/**
 * Naming a mode rather than advancing to the next one.
 *
 * Advancing was fine while there were two: one press was both "switch" and "switch back". It stops
 * being fine the moment a third exists — the control states neither how many modes there are nor
 * which one is in force, and getting back to the previous one takes as many presses as there are
 * modes. The theme menu names them instead, so this takes a name.
 */
export function setMode(id: ModeId): void {
  modeId.value = id
}

/**
 * Whether the theme menu is open.
 *
 * Held here beside the mode it selects rather than in the layer stack: the stack's rule is that a
 * layer owns what it is about, and this layer is about nothing — it is a control's open state, with
 * no content that could disagree with it.
 */
const themeMenuOpen = ref(false)

export function openThemeMenu(): void {
  themeMenuOpen.value = true
}

export function closeThemeMenu(): void {
  themeMenuOpen.value = false
}

export function toggleLang(): void {
  lang.value = lang.value === 'zh' ? 'en' : 'zh'
}

export { lang, modeId, themeMenuOpen }
