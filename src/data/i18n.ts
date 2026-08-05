// Values are carried over from design/pipeline/template.html's own I18N table, so the two do
// not drift into different vocabularies for the same control.
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
  // Masthead tally. Labels only — the figures come from the dataset's meta block.
  readonly tSpecies: string
  readonly tForms: string
  readonly tMega: string
  readonly tMoves: string
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
   * Toggle that keeps only the moves receiving the same-type attack bonus. The concept is
   * 本系加成 in the artefacts; only this control reads 屬修, which fits the chip.
   */
  readonly mvStab: string
  /** Shown in place of rows when the active sort and filter leave none. */
  readonly mvNone: string
  // Learner list.
  /** Heading of the list of species that learn the opened move. */
  readonly mlTitle: string
}

export const I18N: Record<Lang, Strings> = {
  zh: {
    lang: '中文',
    type: '屬性',
    baseForm: '基本形態',
    tSpecies: '種類',
    tForms: '形態',
    tMega: 'MEGA',
    tMoves: '招式',
    search: '搜尋',
    searchPlaceholder: '名稱 / 編號 / 屬性 / 形態',
    gen: '世代',
    sort: '排序',
    sortDex: '編號',
    sortBst: '種族值',
    reset: '清除篩選',
    empty: '沒有符合的寶可夢。',
    close: '關閉',
    dTypes: '屬性',
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
    mlTitle: '也會這個招式的寶可夢',
  },
  en: {
    lang: 'EN',
    type: 'Type',
    baseForm: 'Base Form',
    tSpecies: 'SPECIES',
    tForms: 'FORMS',
    tMega: 'MEGA',
    tMoves: 'MOVES',
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
    mlTitle: 'ALSO LEARNED BY',
  },
}

/** The string for `key` in `lang`. */
export function t(key: keyof Strings, lang: Lang): string {
  return I18N[lang][key]
}

/** A name and the same name in the other language. The toggle changes which one leads. */
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

/** The form's label pair for `lang`. A base form carries no upstream label. */
export function formLabel(form: Form, lang: Lang): NamePair {
  const pair = lang === 'zh'
    ? { lead: form.lz, alt: form.l }
    : { lead: form.l, alt: form.lz }
  if (pair.lead) return pair
  return { lead: t('baseForm', lang), alt: '' }
}

/** The ability's name pair for `lang`. Two of the 200 carry no Chinese name. */
export function abilityName(ability: Ability, lang: Lang): NamePair {
  const pair = lang === 'zh'
    ? { lead: ability.z, alt: ability.n }
    : { lead: ability.n, alt: ability.z }
  if (pair.lead) return pair
  return { lead: pair.alt, alt: '' }
}

/**
 * The ability's description in `lang`, falling back to the other language. Empty when the
 * dataset carries neither, which is the signal to omit the description entirely.
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
/**
 * How many species learn the opened move. A whole localised string rather than a count beside
 * a key, on the same grounds as {@link resultCountLabel}: the two languages put the measure
 * word and the noun in different places, and composing one from a fragment gets that wrong.
 */
export function learnerCountLabel(count: number, lang: Lang): string {
  // "species" is its own plural, so English needs no count-dependent branch here.
  return lang === 'zh' ? `${count} 隻` : `${count} species`
}

export function formsOfLabel(count: number, lang: Lang): string {
  if (lang === 'zh') return `${count} 個形態`
  return count > 1 ? `${count} forms` : `${count} form`
}

/**
 * "19 / 208 species" and its Chinese equivalent. Names the unit rather than leaving a bare
 * ratio, which reads identically in both languages while the rest of the screen changes.
 *
 * `total` is the dataset's own species count, passed in rather than read here, so that this
 * module keeps depending on the dataset only for the generation numerals.
 */
export function resultCountLabel(matched: number, total: number, lang: Lang): string {
  return lang === 'zh' ? `${matched} / ${total} 種類` : `${matched} / ${total} species`
}

/** One footer segment: what it is about, and what it says. */
export interface FooterSegment {
  readonly heading: string
  readonly body: string
}

/**
 * The footer's segments for `lang`.
 *
 * A sequence rather than one pair, although the footer currently states one thing: the shape
 * is what the component renders, and a segment added later needs no change on either side.
 */
export function footerSegments(lang: Lang): readonly FooterSegment[] {
  return FOOTER[lang].map(([heading, body]) => ({ heading, body }))
}

/** The learnset table's six column headings for `lang`. The first is empty: it is the glyph column. */
export function moveHeads(lang: Lang): readonly string[] {
  return MOVE_HEADS[lang]
}

/** The one-token abbreviation for a damage class in `lang`. The column is 28px wide. */
export function damageClassAbbr(cls: MoveClass, lang: Lang): string {
  return DAMAGE_CLASS_ABBR[lang][cls]
}

/**
 * The move's name in `lang`. Two of the 496 moves have no Chinese name and fall back to
 * English. A bare string, not a {@link NamePair}: the table has one name column.
 */
export function moveName(move: Move, lang: Lang): string {
  return lang === 'zh' ? (move.z || move.n) : move.n
}

/**
 * What the footer states, as heading/body pairs.
 *
 * The design study carried six segments here — the roster, moves, stats and abilities, Chinese
 * naming, artwork, and this one. Only the font and copyright segment is carried over; the five
 * provenance segments were dropped by decision, and design.md records what that costs.
 *
 * Two statements are rewritten from the study's wording because they are true there and not
 * here: this port embeds two font families rather than one, and it is a port rather than a
 * design study.
 */
const FOOTER: Record<Lang, readonly (readonly [string, string])[]> = {
  zh: [
    ['字型／版權', 'Silkscreen 與 Literata（皆 OFL）已內嵌。Pokémon © Nintendo / Creatures Inc. / GAME FREAK inc.　本作品為非商業用途。'],
  ],
  en: [
    ['Font / rights', 'Silkscreen and Literata (both OFL) are embedded. Pokémon © Nintendo / Creatures Inc. / GAME FREAK inc. This work is non-commercial.'],
  ],
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
