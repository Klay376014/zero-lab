/**
 * Every user-facing string of this slice's screen, plus the bilingual name resolution.
 *
 * The strings live in one table so the language toggle can never leave half the screen in
 * the other language. Scope is the screens that exist: the grid and its query bar are here;
 * the detail panel and learnset strings stay in design/pipeline/template.html until the
 * slice that ports them.
 *
 * Values are carried over from that template's own I18N table rather than written fresh, so
 * the two do not drift into two different vocabularies for the same control.
 */
import type { Form, Species } from './dex.js'

export type Lang = 'zh' | 'en'

/** The keys this slice's screen renders. */
export interface Strings {
  /** Label on the language toggle — the language it switches to reading as. */
  readonly lang: string
  readonly type: string
  /** Form label shown for a species' base form, which carries no upstream label. */
  readonly baseForm: string
  // Query bar.
  readonly search: string
  /** Placeholder inside the search field. */
  readonly searchPlaceholder: string
  readonly gen: string
  readonly sort: string
  /** Sort by national number. */
  readonly sortDex: string
  /** Sort by the strongest form's base-stat total. */
  readonly sortBst: string
  /** Clears every filter and the search string. */
  readonly reset: string
  /** Shown in the card area when the query matches no species. */
  readonly empty: string
}

export const I18N: Record<Lang, Strings> = {
  zh: {
    lang: '中文',
    type: '型別',
    baseForm: '基本形態',
    search: '搜尋',
    searchPlaceholder: '名稱 / 編號 / 型別 / 形態',
    gen: '世代',
    sort: '排序',
    sortDex: '編號',
    sortBst: '種族值',
    reset: '清除篩選',
    empty: '沒有符合的寶可夢。',
  },
  en: {
    lang: 'EN',
    type: 'Type',
    baseForm: 'Base Form',
    search: 'Search',
    searchPlaceholder: 'Name / no. / type / form',
    gen: 'Gen',
    sort: 'Sort',
    sortDex: 'No.',
    sortBst: 'Stats',
    reset: 'Clear',
    empty: 'No Pokémon match.',
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
