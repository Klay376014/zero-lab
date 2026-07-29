/**
 * Every user-facing string of this slice's screen, plus the bilingual name resolution.
 *
 * The strings live in one table so the language toggle can never leave half the screen in
 * the other language. Scope is this slice only: the grid, detail panel and learnset
 * strings stay in design/pipeline/template.html until the slice that ports them.
 */
import type { Form, Species } from './dex.js'

export type Lang = 'zh' | 'en'

/** The keys this slice's screen renders. */
export interface Strings {
  /** Label on the language toggle — the language it switches to reading as. */
  readonly lang: string
  readonly mode: string
  readonly type: string
  /** Form label shown for a species' base form, which carries no upstream label. */
  readonly baseForm: string
  // Verification-harness section headings. This screen is the acceptance interface for
  // the slice, so its own labels belong in the table too.
  readonly hCards: string
  readonly hGlyphs: string
  readonly hSprite: string
  readonly surfaceCard: string
  readonly surfaceAccent: string
  readonly spriteNative: string
  readonly spriteDouble: string
}

export const I18N: Record<Lang, Strings> = {
  zh: {
    lang: '中文',
    mode: '模式',
    type: '型別',
    baseForm: '基本形態',
    hCards: '卡片',
    hGlyphs: '型別字符',
    hSprite: '放大檢查',
    surfaceCard: '卡片表面',
    surfaceAccent: '選中表面',
    spriteNative: '原生 96px',
    spriteDouble: '放大 192px',
  },
  en: {
    lang: 'EN',
    mode: 'Mode',
    type: 'Type',
    baseForm: 'Base Form',
    hCards: 'CARDS',
    hGlyphs: 'TYPE GLYPHS',
    hSprite: 'UPSCALE CHECK',
    surfaceCard: 'Card surface',
    surfaceAccent: 'Accent surface',
    spriteNative: 'Native 96px',
    spriteDouble: 'Upscaled 192px',
  },
}

/** The string for `key` in `lang`. */
export function t(key: keyof Strings, lang: Lang): string {
  return I18N[lang][key]
}

/**
 * A name and the same name in the other language. Both are always present: the toggle
 * changes which one leads, it does not hide the other.
 */
export interface NamePair {
  /** The name in the active language. */
  readonly lead: string
  /** The same name in the other language. Empty when there is none. */
  readonly alt: string
}

/** The species' name pair for `lang`. */
export function speciesName(species: Species, lang: Lang): NamePair {
  return lang === 'zh'
    ? { lead: species.mz, alt: species.m }
    : { lead: species.m, alt: species.mz }
}

/**
 * The form's label pair for `lang`. A base form carries no upstream label, so its lead
 * falls back to the localised base-form string and its alt is empty.
 */
export function formLabel(form: Form, lang: Lang): NamePair {
  const pair = lang === 'zh'
    ? { lead: form.lz, alt: form.l }
    : { lead: form.l, alt: form.lz }
  if (pair.lead) return pair
  return { lead: t('baseForm', lang), alt: '' }
}
