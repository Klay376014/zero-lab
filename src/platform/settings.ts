import type { Lang } from '../data/i18n.js'
import { MODES } from '../theme/modes.js'
import type { ModeId } from '../theme/modes.js'

/** Behaviour is specified in `openspec/specs/display-persistence/`. */

type SettingKey = 'display.mode' | 'display.lang'

interface DisplaySettingsStore {
  getSetting(key: string): string
  setSetting(key: string, value: string): void
}

/**
 * `NativeModules` is read as a bare identifier because it is not a property of the global object:
 * on device `globalThis.NativeModules` is `undefined` while the bare identifier is an object
 * (§12.30). `typeof` rather than optional chaining, because the identifier genuinely does not
 * exist in the web preview and `NativeModules?.x` would throw there.
 */
function store(): DisplaySettingsStore | null {
  if (typeof NativeModules === 'undefined' || !NativeModules) return null
  return NativeModules.DisplaySettingsModule ?? null
}

function readSetting(key: SettingKey): string | null {
  try {
    return store()?.getSetting(key) || null
  } catch {
    return null
  }
}

function writeSetting(key: SettingKey, value: string): void {
  try {
    store()?.setSetting(key, value)
  } catch {
    // A failed write costs the next launch its restored setting; raising would take down the
    // mode change that caused it.
  }
}

export function coerceModeId(raw: string | null | undefined): ModeId {
  return MODES.some((mode) => mode.id === raw) ? (raw as ModeId) : MODES[0]!.id
}

export function coerceLang(raw: string | null | undefined): Lang {
  return raw === 'zh' || raw === 'en' ? raw : 'zh'
}

export function restoreModeId(): ModeId {
  return coerceModeId(readSetting('display.mode'))
}

export function restoreLang(): Lang {
  return coerceLang(readSetting('display.lang'))
}

export function persistModeId(id: ModeId): void {
  writeSetting('display.mode', id)
}

export function persistLang(value: Lang): void {
  writeSetting('display.lang', value)
}
