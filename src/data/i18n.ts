import { dex, GEN_ROMAN } from './dex.js'
import type { Ability, Form, FormKind, Move, MoveClass, Species } from './dex.js'

export type Lang = 'zh' | 'en'

export interface Strings {
  readonly lang: string
  readonly type: string
  readonly baseForm: string
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
  readonly tabDex: string
  readonly tabMoves: string
  /**
   * Move detail's field labels.
   *
   * A separate set from the `mv*` keys even where the text coincides: those label the learnset
   * table's sort controls, and a control's wording is free to change without dragging a field
   * label along with it. The move index reuses `moveHeads` instead, because its columns are the
   * learnset table's columns.
   */
  readonly mdType: string
  readonly mdClass: string
  readonly mdPower: string
  readonly mdAcc: string
  readonly mdPp: string
  readonly mdDesc: string
  readonly mdLearners: string
  readonly mdFlags: string
}

export const I18N: Record<Lang, Strings> = {
  zh: {
    lang: '中文',
    type: '屬性',
    baseForm: '基本形態',
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
    mlTitle: '會這個招式的寶可夢',
    tabDex: '圖鑑',
    tabMoves: '招式',
    mdType: '屬性',
    mdClass: '傷害類別',
    mdPower: '威力',
    mdAcc: '命中',
    mdPp: 'PP',
    mdDesc: '說明',
    mdLearners: '哪些寶可夢會',
    mdFlags: '性質',
  },
  en: {
    lang: 'EN',
    type: 'Type',
    baseForm: 'Base Form',
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
    mlTitle: 'LEARNED BY',
    tabDex: 'DEX',
    tabMoves: 'MOVES',
    mdType: 'Type',
    mdClass: 'Damage',
    mdPower: 'Power',
    mdAcc: 'Accuracy',
    mdPp: 'PP',
    mdDesc: 'Description',
    mdLearners: 'LEARNED BY',
    // Measured, not chosen for looks: this label shares move detail's 88px key column, which was
    // sized for `ACCURACY` at 81.5px. `Flags` is 47.0px in Silkscreen-Regular at 12px with the
    // column's 1px of tracking. `Properties` is 91.0px and would wrap, taking the row's baseline
    // out of line with the five rows above — the failure `.MoveDetailAttrKey` already records.
    mdFlags: 'Flags',
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

/**
 * The damage class in full, for move detail.
 *
 * The abbreviations above exist because a table column is 22px wide. A detail panel has room for
 * the word, and the same split already holds for a form's kind: `kindLabel` states it in full
 * where the card states a badge.
 */
export function damageClassName(cls: MoveClass, lang: Lang): string {
  return DAMAGE_CLASS_NAME[lang][cls]
}

export function moveName(move: Move, lang: Lang): string {
  return lang === 'zh' ? (move.z || move.n) : move.n
}

/**
 * A move's description in the leading language.
 *
 * No fallback to the other language, unlike {@link abilityDescription}: the pipeline exits
 * non-zero rather than emit a move with either description empty, so a fallback here would be
 * unreachable code standing in for an invariant that is enforced upstream. See the `dex-data`
 * capability, "A move missing a description fails the pipeline".
 */
export function moveDescription(move: Move, lang: Lang): string {
  return lang === 'zh' ? move.d : move.de
}

export function moveCountLabel(count: number, lang: Lang): string {
  return lang === 'zh' ? `${count} 個招式` : `${count} moves`
}

/**
 * A move's power or accuracy as it is stated, with an em dash for an absent value.
 *
 * Absent means different things per column — no fixed damage for power, never misses for
 * accuracy — but both are rendered the same way, and the same way in all three places a move's
 * figures appear. Here rather than in each component so the three cannot drift, and because the
 * dash is a user-facing character like any other string in this table.
 */
export function moveFigure(value: number | null): string {
  return value === null ? '—' : String(value)
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

const DAMAGE_CLASS_NAME: Record<Lang, Record<MoveClass, string>> = {
  zh: { Physical: '物理', Special: '特殊', Status: '變化' },
  en: { Physical: 'Physical', Special: 'Special', Status: 'Status' },
}

/**
 * The short label for each move flag this interface draws, keyed by the flag's upstream
 * identifier rather than by its numeric id.
 *
 * Keyed by identifier so an upstream renumbering resolves to the same label, and an upstream
 * rename resolves to no label at all — a flag quietly disappearing, which the string table's
 * coverage test catches. Keying by the id would mislabel silently instead, and nothing outside
 * the tests reads these.
 *
 * Seventeen of the twenty-one, and the four absences are the whole of how the exclusion is
 * expressed — there is no second list of excluded flags to keep in step with this one. A flag is
 * here when its label names a property of the move itself, and absent when the label could only
 * name a relation to a mechanism this dataset does not contain: `mirror` and `snatch` would have
 * to say "can be copied by Mirror Move" and "can be taken by Snatch", and neither move is among
 * the 496; `non-sky-battle` and `distance` name battle formats this game does not have. Coverage
 * is not the criterion — `protect` applies to 340 of the 496 and is here.
 *
 * Nouns, never mechanism descriptions. 401 of the 496 moves carry figures Champions retuned, so a
 * sentence about what a flag does in the mainline games would assert rules this game has changed.
 * The consequence is that direction is not carried: `重力` means the move cannot be used under
 * Gravity, where its neighbours read as things the move can do. That was weighed and accepted.
 *
 * Two pairs are not literal renderings of each other. `authentic` is `穿透` / `Pierce` because
 * "Authentic" carries no meaning as an English interface label, and `reflectable` is `反彈` /
 * `Rebound` — "Reflectable" is an adjective where every other label is a noun, and `Reflect` is
 * the name of a move in these 496 that has nothing to do with this flag (the mechanism is Magic
 * Coat and Magic Bounce), so an English reader would have taken the label for a pointer at it.
 * The Chinese side keeps `反彈`, which collides with nothing.
 */
const MOVE_FLAG_LABEL: Record<Lang, Readonly<Record<string, string>>> = {
  zh: {
    contact: '接觸',
    charge: '蓄力',
    recharge: '力竭',
    protect: '守住',
    reflectable: '反彈',
    punch: '拳擊',
    sound: '聲音',
    gravity: '重力',
    defrost: '解凍',
    heal: '回復',
    authentic: '穿透',
    powder: '粉末',
    bite: '啃咬',
    pulse: '波動',
    ballistics: '球彈',
    mental: '心靈',
    dance: '舞蹈',
  },
  en: {
    contact: 'Contact',
    charge: 'Charge',
    recharge: 'Recharge',
    protect: 'Protect',
    reflectable: 'Rebound',
    punch: 'Punch',
    sound: 'Sound',
    gravity: 'Gravity',
    defrost: 'Defrost',
    heal: 'Heal',
    authentic: 'Pierce',
    powder: 'Powder',
    bite: 'Bite',
    pulse: 'Pulse',
    ballistics: 'Ballistic',
    mental: 'Mental',
    dance: 'Dance',
  },
}

/**
 * A move flag's short label, or an empty string when this interface does not draw that flag.
 *
 * Empty rather than thrown, and empty rather than the identifier: a flag nobody has written a
 * label for must not reach the screen wearing its upstream name. The caller skips it. That covers
 * both the four deliberate exclusions and a twenty-second flag appearing upstream — the dataset's
 * own invariant and the flag table's size test are what make the second case loud.
 */
export function moveFlagLabel(id: number, lang: Lang): string {
  const identifier = dex.moveFlags[String(id)]
  if (identifier === undefined) return ''
  return MOVE_FLAG_LABEL[lang][identifier] ?? ''
}
