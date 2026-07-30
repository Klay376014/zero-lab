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
 * Bind to `main-thread-bindtouchstart`.
 *
 * The distance is a literal here, and this line is its only occurrence in the project. It was
 * a `var(--press-shift)` reading the stylesheet until a device said otherwise: the main thread
 * writes inline styles through `__AddInlineStyle`, and the value it passes is **not** run
 * through custom-property substitution. Measured both ways — with the property declared in
 * the stylesheet and declared inline on the root view — and neither resolves, while the same
 * function with a literal length moves the control. See design/HANDOFF.md §12.22.
 *
 * So to change how far a control moves, change the length on the next line. That is the whole
 * procedure; nothing else in the project carries this distance.
 */
export function onPressStart(event: PressEvent): void {
  'main thread'
  event.currentTarget.setStyleProperty('transform', 'translateY(1px)')
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
