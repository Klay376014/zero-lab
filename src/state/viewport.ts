/**
 * How tall a scrolling container's visible area is, for the range derivation to work from.
 *
 * The scroll report carries `scrollTop` and `scrollHeight` but not the viewport (§12.25), and the
 * two containers that declare a height do it in `vh`, which resolves against a viewport this side
 * cannot read either. So the height comes from the platform's own system info when that is
 * reachable, and from a deliberately generous constant when it is not.
 *
 * Generous, not accurate, is the safe direction: the height only decides how many rows are kept
 * rendered. Too large renders rows nobody sees — slower than it needs to be, but correct. Too
 * small blanks the edge the scroll is heading towards, which is a visible fault.
 *
 * Whether `SystemInfo` exists on this thread is unverified — nothing in design/HANDOFF.md
 * mentions it, and §12.23 found `Intl` simply absent, so a global existing in the engine is not
 * evidence it is reachable here. `viewportSource()` reports which path was taken so a device can
 * settle it rather than this file assuming.
 */

/** Tall enough to cover any handheld this targets; used when the platform will not say. */
const FALLBACK_HEIGHT = 900

interface SystemInfoShape {
  readonly pixelHeight?: number
  readonly pixelRatio?: number
}

function systemInfo(): SystemInfoShape | null {
  const candidate = (globalThis as Record<string, unknown>).SystemInfo
  if (candidate === null || typeof candidate !== 'object') return null
  return candidate as SystemInfoShape
}

function measured(): number | null {
  const info = systemInfo()
  if (!info) return null
  const { pixelHeight, pixelRatio } = info
  if (typeof pixelHeight !== 'number' || pixelHeight <= 0) return null
  // pixelHeight is in device pixels; every length this app declares is in the density-independent
  // unit the stylesheet uses, so it has to come back through the ratio.
  const ratio = typeof pixelRatio === 'number' && pixelRatio > 0 ? pixelRatio : 1
  return pixelHeight / ratio
}

/** The viewport height in the same unit the stylesheet's lengths are written in. */
export function viewportHeight(): number {
  return measured() ?? FALLBACK_HEIGHT
}

/**
 * Which path this resolved through. `SystemInfo` was measured absent on this thread (§12.27), so
 * today this always reports the fallback; it stays because that is the one line a device needs to
 * show to re-check, and the answer is a platform fact that can change under us.
 */
export function viewportSource(): string {
  const info = systemInfo()
  if (!info) return 'fallback (no SystemInfo)'
  const value = measured()
  if (value === null) return `fallback (SystemInfo without usable pixelHeight)`
  return `SystemInfo ${info.pixelHeight}/${info.pixelRatio ?? 1} = ${value.toFixed(1)}`
}
