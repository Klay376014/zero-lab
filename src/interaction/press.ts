/**
 * The sliver of the main-thread element API these functions touch.
 *
 * Declared locally because the framework's typings expose main-thread event props as
 * `unknown` and ship no element interface. Keep it to what is actually called — a wider
 * guess would be fiction, not a type.
 */
export interface PressTarget {
  setStyleProperty: (name: string, value: string) => void
}

/** The one field of the main-thread touch event these functions read. */
export interface PressEvent {
  currentTarget: PressTarget
}

/**
 * Draw the pressed state.
 *
 * Bind to `main-thread-bindtouchstart`. Note the value references a custom property rather
 * than carrying a length: see the module comment.
 */
export function onPressStart(event: PressEvent): void {
  'main thread'
  event.currentTarget.setStyleProperty('transform', 'translateY(var(--press-shift))')
}

/**
 * Clear the pressed state.
 *
 * Bind to BOTH `main-thread-bindtouchend` and `main-thread-bindtouchcancel`. Release alone
 * leaves a reachable stuck state: the form buttons and the learnset table's controls sit
 * inside the detail panel's scrolling container, and a press that turns into a scroll ends as
 * a cancellation with no release. A control left displaced by that gesture does not recover
 * on its own unless the background thread happens to repaint it for an unrelated reason.
 */
export function onPressEnd(event: PressEvent): void {
  'main thread'
  event.currentTarget.setStyleProperty('transform', '')
}
