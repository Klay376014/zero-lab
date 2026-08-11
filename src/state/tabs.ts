/**
 * Which of the two tabs is active.
 *
 * A module of its own, holding nothing else. It does not own the species selection and it does
 * not own the layer stack, because the three change independently: a tab switch leaves the
 * stack intact, and opening a layer leaves the active tab intact. Folding any two together
 * would make one of those independent facts a side effect of the other.
 *
 * No router. The alternative was considered and rejected on a concrete ground rather than a
 * stylistic one: the unwinding rule the `layer-stack` capability defines needs "return to the
 * layer named X", while a history is a line of positions offering only relative motion — the
 * depth to travel would still have to be computed here, so the history contributes nothing.
 * Two mutually exclusive tabs that nothing outside the application addresses need even less.
 * Against that, a routing package is one more dependency unmeasured on this platform, and this
 * project's standing lesson is that a declaration being accepted is not evidence it has an
 * effect (design/HANDOFF.md §12).
 *
 * Revisit if a second screen ever needs addressing from outside the application.
 */
import { ref } from 'vue-lynx'

/**
 * The set is closed at two, not open-ended. A third tab is a new decision rather than an
 * addition: the control is sized for two and the shell surface it sits on is fixed.
 */
export type Tab = 'dex' | 'moves'

const activeTab = ref<Tab>('dex')

export function activateTab(tab: Tab): void {
  activeTab.value = tab
}

export { activeTab }
