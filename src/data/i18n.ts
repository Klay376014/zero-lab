/**
 * Every user-facing string of this slice's screen, plus the bilingual name resolution.
 *
 * The strings live in one table so the language toggle can never leave half the screen in
 * the other language. Scope is every screen that exists: the grid, its query bar, the detail
 * panel and the learnset table.
 *
 * Values are carried over from design/pipeline/template.html's own I18N table rather than
 * written fresh, so the two do not drift into two different vocabularies for the same
 * control.
 *
 * `Strings` holds plain strings only, and `t()` therefore returns a plain string. The panel
 * and the learnset table also need list, per-kind and per-class lookups and two strings that
 * take a number; each of those has its own named accessor below. Widening `t()`'s return to
 * cover them would put a type assertion at every call site and give up what the interface is
 * for.
 */
import { GEN_ROMAN } from './dex.js'
import type { Ability, Form, FormKind, Move, MoveClass, Species } from './dex.js'

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
  // Detail panel.
  /** Label on the control that closes the detail. */
  readonly close: string
  /** Attribute row: the form's types. */
  readonly dTypes: string
  /** Attribute row: the form and its kind. */
  readonly dForm: string
  /** Attribute row: the game version that introduced the form. */
  readonly dVer: string
  /** Attribute row: whether the form is in the current roster. */
  readonly dRoster: string
  readonly rosterIn: string
  readonly rosterOut: string
  readonly secStats: string
  /** Label on the base-stat total. */
  readonly total: string
  readonly secAbil: string
  /** Marker on the slot holding a species' hidden ability. */
  readonly hidden: string
  /** Prefix on a roster note carried by the dataset. */
  readonly notePrefix: string
  /** Warning shown for a form outside the current roster. */
  readonly warnRoster: string
  /** Warning shown when the artwork is the species' shared sprite. */
  readonly warnApprox: string
  // Learnset table.
  readonly secMoves: string
  /** Sort the learnset by move name. */
  readonly mvName: string
  /** Sort the learnset by power, highest first. */
  readonly mvPower: string
  /** Sort the learnset by move type. */
  readonly mvType: string
  /**
   * Toggle that keeps only the moves receiving the same-type attack bonus.
   *
   * The Chinese label reads 屬修 — the type modifier — rather than the more literal 本系. The
   * artefacts and comments still name the concept 本系加成; only the control is labelled this
   * way, because a four-character concept name does not fit a chip beside three sort buttons.
   */
  readonly mvStab: string
  /** Shown in place of rows when the active sort and filter leave none. */
  readonly mvNone: string
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
    close: '關閉',
    dTypes: '型別',
    dForm: '形態',
    dVer: '加入版本',
    dRoster: '當前陣容',
    rosterIn: '可取得',
    rosterOut: '不在當前陣容',
    secStats: '種族值',
    total: '總和',
    secAbil: '特性',
    hidden: '隱藏',
    notePrefix: '※ ',
    warnRoster: '※ 此形態不在當前陣容，須透過活動或從其他遊戲經 Pokémon HOME 傳送。',
    warnApprox: '※ PokeAPI 未收錄此形態的獨立圖像，上方顯示的是該種類的共用圖。',
    secMoves: '可學會招式',
    mvName: '名稱',
    mvPower: '威力',
    mvType: '屬性',
    mvStab: '★ 屬修',
    mvNone: '沒有符合的招式。',
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
    close: 'Close',
    dTypes: 'Types',
    dForm: 'Form',
    dVer: 'Added',
    dRoster: 'Roster',
    rosterIn: 'Obtainable',
    rosterOut: 'Not in current roster',
    secStats: 'BASE STATS',
    total: 'TOTAL',
    secAbil: 'ABILITIES',
    hidden: 'HIDDEN',
    notePrefix: 'NB ',
    warnRoster: 'NB This form is not in the current roster; it must come from an event or be '
      + 'transferred via Pokémon HOME.',
    warnApprox: 'NB PokeAPI carries no distinct artwork for this form — the picture above is '
      + 'the species’ shared sprite.',
    secMoves: 'LEARNSET',
    mvName: 'Name',
    mvPower: 'Power',
    mvType: 'Type',
    mvStab: '★ STAB',
    mvNone: 'No moves match.',
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

/**
 * The ability's name pair for `lang`.
 *
 * Two of the 200 abilities carry no Chinese name, so the lead falls back to the name that
 * does exist rather than rendering an empty heading — and the alt is then empty, because
 * repeating the lead beside itself says nothing.
 */
export function abilityName(ability: Ability, lang: Lang): NamePair {
  const pair = lang === 'zh'
    ? { lead: ability.z, alt: ability.n }
    : { lead: ability.n, alt: ability.z }
  if (pair.lead) return pair
  return { lead: pair.alt, alt: '' }
}

/**
 * The ability's description in `lang`, falling back to the other language, and empty when
 * the dataset carries neither.
 *
 * The fallback lives here rather than in the component so that the rule for which language
 * leads is stated once. An empty return is the signal to omit the description entirely —
 * 19 abilities have no Chinese description, and an empty area reads as a rendering fault.
 */
export function abilityDescription(ability: Ability, lang: Lang): string {
  return lang === 'zh' ? (ability.d || ability.de) : (ability.de || ability.d)
}

/** The six base-stat labels for `lang`, in the dataset's stat order. */
export function statLabels(lang: Lang): readonly string[] {
  return STAT_LABELS[lang]
}

/** The label for a form kind in `lang`. */
export function kindLabel(kind: FormKind, lang: Lang): string {
  return KIND_LABELS[lang][kind]
}

/** "Generation IV" and its Chinese equivalent, from a generation number. */
export function genOfLabel(gen: number, lang: Lang): string {
  const numeral = GEN_ROMAN[gen] ?? String(gen)
  return lang === 'zh' ? `第 ${numeral} 世代` : `Gen ${numeral}`
}

/** "3 forms" and its Chinese equivalent. English pluralises; Chinese has no plural. */
export function formsOfLabel(count: number, lang: Lang): string {
  if (lang === 'zh') return `${count} 個形態`
  return count > 1 ? `${count} forms` : `${count} form`
}

/**
 * The learnset table's six column headings for `lang`, in column order.
 *
 * The first is empty: that column carries the type glyph, and a heading over an 8x8 mark
 * would be wider than the mark it labels.
 */
export function moveHeads(lang: Lang): readonly string[] {
  return MOVE_HEADS[lang]
}

/**
 * The one-token abbreviation for a damage class in `lang`.
 *
 * Abbreviated rather than spelled out because the column is 28px wide and the full names do
 * not fit at any type size the row uses. The design document put the full name in a hover
 * tooltip; touch devices have no hover, and the class is a closed set of three whose row
 * already carries the type as a glyph, so no substitute is offered.
 */
export function damageClassAbbr(cls: MoveClass, lang: Lang): string {
  return DAMAGE_CLASS_ABBR[lang][cls]
}

/**
 * The move's name in `lang`, falling back to English when Chinese leads and the dataset
 * carries no Chinese name.
 *
 * Returns a bare string rather than a {@link NamePair}: the table has one name column, and
 * the other language is reached by the language toggle, which swaps the whole table at once.
 * Two names per row across a hundred rows is the noise the single column exists to avoid.
 *
 * Two of the 496 moves have no Chinese name. An empty cell in a table reads as missing data
 * rather than as a missing translation, so the English name stands in.
 */
export function moveName(move: Move, lang: Lang): string {
  return lang === 'zh' ? (move.z || move.n) : move.n
}

const STAT_LABELS: Record<Lang, readonly [string, string, string, string, string, string]> = {
  zh: ['HP', '攻擊', '防禦', '特攻', '特防', '速度'],
  en: ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'],
}

const KIND_LABELS: Record<Lang, Record<FormKind, string>> = {
  zh: { base: '基本', other: '形態', regional: '地區形態', mega: 'MEGA' },
  en: { base: 'Base', other: 'Form', regional: 'Regional', mega: 'Mega' },
}

const MOVE_HEADS: Record<Lang, readonly [string, string, string, string, string, string]> = {
  zh: ['', '招式', '類', '威力', '命中', 'PP'],
  en: ['', 'MOVE', 'CL', 'PWR', 'ACC', 'PP'],
}

const DAMAGE_CLASS_ABBR: Record<Lang, Record<MoveClass, string>> = {
  zh: { Physical: '物', Special: '特', Status: '變' },
  en: { Physical: 'PH', Special: 'SP', Status: 'ST' },
}
