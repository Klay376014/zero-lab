import { GEN_ROMAN } from './dex.js'
import type { Ability, Form, FormKind, Move, MoveClass, Species } from './dex.js'

export type Lang = 'zh' | 'en'

export interface Strings {
  readonly lang: string
  readonly type: string
  readonly baseForm: string
  readonly tSpecies: string
  readonly tForms: string
  readonly tMega: string
  readonly tMoves: string
  readonly searchPlaceholder: string
  readonly sortDex: string
  readonly sortBst: string
  readonly megaOnly: string
  readonly multiOnly: string
  readonly reset: string
  readonly empty: string
  readonly close: string
  readonly dTypes: string
  readonly dForm: string
  readonly dVer: string
  readonly dRoster: string
  readonly rosterIn: string
  readonly rosterOut: string
  readonly secStats: string
  readonly total: string
  readonly secAbil: string
  readonly hidden: string
  readonly notePrefix: string
  readonly warnRoster: string
  readonly warnApprox: string
  readonly secMoves: string
  readonly mvName: string
  readonly mvPower: string
  readonly mvType: string
  readonly mvStab: string
  readonly mvNone: string
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
    searchPlaceholder: '名稱 / 編號 / 屬性 / 形態',
    sortDex: '編號',
    sortBst: '種族值',
    megaOnly: '★ 僅 MEGA',
    multiOnly: '僅多形態',
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
    searchPlaceholder: 'Name / no. / type / form',
    sortDex: 'No.',
    sortBst: 'Stats',
    megaOnly: '★ Mega only',
    multiOnly: 'Multi-form',
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

export function t(key: keyof Strings, lang: Lang): string {
  return I18N[lang][key]
}

export interface NamePair {
  readonly lead: string
  readonly alt: string
}

export function speciesName(species: Species, lang: Lang): NamePair {
  return lang === 'zh'
    ? { lead: species.mz, alt: species.m }
    : { lead: species.m, alt: species.mz }
}

export function formLabel(form: Form, lang: Lang): NamePair {
  const pair = lang === 'zh'
    ? { lead: form.lz, alt: form.l }
    : { lead: form.l, alt: form.lz }
  if (pair.lead) return pair
  return { lead: t('baseForm', lang), alt: '' }
}

export function abilityName(ability: Ability, lang: Lang): NamePair {
  const pair = lang === 'zh'
    ? { lead: ability.z, alt: ability.n }
    : { lead: ability.n, alt: ability.z }
  if (pair.lead) return pair
  return { lead: pair.alt, alt: '' }
}

export function abilityDescription(ability: Ability, lang: Lang): string {
  return lang === 'zh' ? (ability.d || ability.de) : (ability.de || ability.d)
}

export function statLabels(lang: Lang): readonly string[] {
  return STAT_LABELS[lang]
}

export function kindLabel(kind: FormKind, lang: Lang): string {
  return KIND_LABELS[lang][kind]
}

export function genOfLabel(gen: number, lang: Lang): string {
  const numeral = GEN_ROMAN[gen] ?? String(gen)
  return lang === 'zh' ? `第 ${numeral} 世代` : `Gen ${numeral}`
}

export function learnerCountLabel(count: number, lang: Lang): string {
  return lang === 'zh' ? `${count} 隻` : `${count} species`
}

export function formsOfLabel(count: number, lang: Lang): string {
  if (lang === 'zh') return `${count} 個形態`
  return count > 1 ? `${count} forms` : `${count} form`
}

export function resultCountLabel(matched: number, total: number, lang: Lang): string {
  return lang === 'zh' ? `${matched} / ${total} 種類` : `${matched} / ${total} species`
}

export interface FooterSegment {
  readonly heading: string
  readonly body: string
}

export function footerSegments(lang: Lang): readonly FooterSegment[] {
  return FOOTER[lang].map(([heading, body]) => ({ heading, body }))
}

export function moveHeads(lang: Lang): readonly string[] {
  return MOVE_HEADS[lang]
}

export function damageClassAbbr(cls: MoveClass, lang: Lang): string {
  return DAMAGE_CLASS_ABBR[lang][cls]
}

export function moveName(move: Move, lang: Lang): string {
  return lang === 'zh' ? (move.z || move.n) : move.n
}

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
