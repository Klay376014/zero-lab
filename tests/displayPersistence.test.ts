/**
 * The `display-persistence` spec's Example tables and restore/write-through contract, executed.
 *
 * Every table row is copied from `openspec/specs/display-persistence/spec.md` rather than derived.
 * The store is faked; the code under test is not.
 *
 * Restore runs while `src/state/display.ts` is evaluated, so tests install a store and then import
 * it dynamically — `vi.resetModules()` is what makes a second import re-run the restore.
 *
 * What this cannot reach: whether the native module answers synchronously on device, and so
 * whether the restored mode is in force for the *first painted frame*. That was device
 * acceptance — §12.30.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { coerceLang, coerceModeId } from '../src/platform/settings.js'
import type { Lang } from '../src/data/i18n.js'
import type { ModeId } from '../src/theme/modes.js'

/** A stand-in for `NSUserDefaults` that records its writes. */
function fakeStore(seed: Record<string, string> = {}) {
  const values = new Map(Object.entries(seed))
  const writes: { key: string; value: string }[] = []
  return {
    writes,
    getSetting(key: string): string {
      return values.get(key) ?? ''
    },
    setSetting(key: string, value: string): void {
      values.set(key, value)
      writes.push({ key, value })
    },
  }
}

type FakeStore = ReturnType<typeof fakeStore>

function install(store: FakeStore | null): void {
  if (store) globalThis.NativeModules = { DisplaySettingsModule: store }
  else delete (globalThis as { NativeModules?: unknown }).NativeModules
}

/** Seeded through the boundary's own writer, so no test spells a key name. */
async function seeded(mode?: ModeId, language?: Lang): Promise<FakeStore> {
  const store = fakeStore()
  install(store)
  const settings = await import('../src/platform/settings.js')
  if (mode) settings.persistModeId(mode)
  if (language) settings.persistLang(language)
  store.writes.length = 0
  return store
}

/** Re-imports `display.ts` so its module-level restore runs against whatever store is installed. */
async function freshDisplay() {
  vi.resetModules()
  return import('../src/state/display.js')
}

afterEach(() => {
  install(null)
  vi.resetModules()
})

describe('stored values are validated against their domain on restore', () => {
  // openspec/specs/display-persistence/spec.md — "mode identifier restore table"
  it.each([
    ['POCKET', 'POCKET', 'first member of the set'],
    ['MODERN', 'MODERN', 'recognised member'],
    ['EMERALD', 'EMERALD', 'recognised member'],
    ['RETRO', 'POCKET', 'not a member — never existed'],
    ['pocket', 'POCKET', 'identifiers are matched exactly'],
    ['', 'POCKET', 'empty value counts as absent'],
  ] as const)('coerces mode %s to %s (%s)', (stored, expected) => {
    expect(coerceModeId(stored)).toBe(expected)
  })

  it.each([null, undefined])('coerces an absent mode (%s) to POCKET', (stored) => {
    expect(coerceModeId(stored)).toBe('POCKET')
  })

  // openspec/specs/display-persistence/spec.md — "language code restore table"
  it.each([
    ['zh', 'zh', 'default, and a recognised value'],
    ['en', 'en', 'recognised value'],
    ['jp', 'zh', 'not one of the two'],
    ['', 'zh', 'empty value counts as absent'],
  ] as const)('coerces language %s to %s (%s)', (stored, expected) => {
    expect(coerceLang(stored)).toBe(expected)
  })

  it.each([null, undefined])('coerces an absent language (%s) to zh', (stored) => {
    expect(coerceLang(stored)).toBe('zh')
  })

  it('restores the default when the store holds an unrecognised value for either setting', async () => {
    install({
      getSetting: () => 'NOPE',
      setSetting: () => {},
    } as unknown as FakeStore)
    const display = await freshDisplay()
    expect(display.modeId.value).toBe('POCKET')
    expect(display.lang.value).toBe('zh')
  })
})

describe('the two display settings survive a relaunch', () => {
  it('restores a stored mode and a stored language', async () => {
    await seeded('EMERALD', 'en')
    const display = await freshDisplay()
    expect(display.modeId.value).toBe('EMERALD')
    expect(display.lang.value).toBe('en')
    expect(display.mode.value.id).toBe('EMERALD')
  })

  it('restores the two settings independently', async () => {
    await seeded('MODERN')
    const display = await freshDisplay()
    expect(display.modeId.value).toBe('MODERN')
    expect(display.lang.value).toBe('zh')
  })

  it('starts at the defaults when nothing is stored', async () => {
    await seeded()
    const display = await freshDisplay()
    expect(display.modeId.value).toBe('POCKET')
    expect(display.lang.value).toBe('zh')
  })
})

describe('an absent store degrades silently to the defaults', () => {
  beforeEach(() => {
    install(null)
  })

  it('imports and starts at the defaults with no store at all', async () => {
    const display = await freshDisplay()
    expect(display.modeId.value).toBe('POCKET')
    expect(display.lang.value).toBe('zh')
  })

  it('lets both settings still switch for the session', async () => {
    const display = await freshDisplay()
    display.setMode('MODERN')
    display.toggleLang()
    expect(display.modeId.value).toBe('MODERN')
    expect(display.lang.value).toBe('en')
  })

  it('treats a store that throws as an absent one', async () => {
    install({
      getSetting: () => {
        throw new Error('native boundary')
      },
      setSetting: () => {
        throw new Error('native boundary')
      },
    } as unknown as FakeStore)
    const display = await freshDisplay()
    expect(display.modeId.value).toBe('POCKET')
    expect(() => display.setMode('MODERN')).not.toThrow()
  })
})

describe('a change writes through, and an inert change writes nothing', () => {
  it('writes the new mode when the mode changes', async () => {
    const store = await seeded('POCKET')
    const display = await freshDisplay()
    display.setMode('EMERALD')
    // Values, not keys — the round-trip case below is what proves the key is right.
    expect(store.writes.map((write) => write.value)).toEqual(['EMERALD'])
  })

  it('writes nothing when the mode already in force is set again', async () => {
    const store = await seeded('MODERN')
    const display = await freshDisplay()
    display.setMode('MODERN')
    expect(store.writes).toEqual([])
  })

  it('writes only the language when the language switches', async () => {
    const store = await seeded('MODERN', 'zh')
    const display = await freshDisplay()
    display.toggleLang()
    expect(store.writes.map((write) => write.value)).toEqual(['en'])
  })

  it('round-trips a change into the next launch', async () => {
    await seeded()
    const first = await freshDisplay()
    first.setMode('EMERALD')
    first.toggleLang()

    const second = await freshDisplay()
    expect(second.modeId.value).toBe('EMERALD')
    expect(second.lang.value).toBe('en')
  })
})
