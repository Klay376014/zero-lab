export interface PressTarget {
  setStyleProperty: (name: string, value: string) => void
}

export interface PressEvent {
  currentTarget: PressTarget
}

/** Bind to `main-thread-bindtouchstart`. Literal length, not `var()` — see §12.22. */
export function onPressStart(event: PressEvent): void {
  'main thread'
  event.currentTarget.setStyleProperty('transform', 'translateY(1px)')
}

/** Bind to BOTH `main-thread-bindtouchend` and `main-thread-bindtouchcancel`. */
export function onPressEnd(event: PressEvent): void {
  'main thread'
  event.currentTarget.setStyleProperty('transform', '')
}
