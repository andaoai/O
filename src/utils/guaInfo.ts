/**
 * 六亲派生：由六爻纳甲 + 卦本宫五行 → 每爻的五行 / 六亲。
 *
 * ═══════════════════════════════════════════════════════════════
 *  京房占卦体系里，一卦六爻各自有干支五行，配合「本宫五行」判定六亲：
 *    - 生我者为父母
 *    - 我生者为子孙（福德）
 *    - 克我者为官鬼
 *    - 我克者为妻财
 *    - 比和者为兄弟
 *
 *  数据源：
 *    - 纳甲：[[najia.ts#najiaLines]]
 *    - 卦所属宫及宫五行：[[jingFangEightPalaces.ts#JING_FANG_64_GUA]]
 *
 *  Layer 5 纯函数：相同 value 输入始终产生相同 6 项输出，无副作用。
 * ═══════════════════════════════════════════════════════════════
 */

import { najiaLines } from './najia'
import { JING_FANG_64_GUA } from '@/data/rings/jingFangEightPalaces'
import { WENWANG_GUA_BY_VALUE, getInnerGuaName, getOuterGuaName, getUnicodeHexagram } from '@/data/sixtyFourGua'
import { BRANCHES } from './constants/ganzhi'
import { WUXING_COLORS, BRANCH_ELEMENTS } from './wuxing'

export type WuXing = '木' | '火' | '土' | '金' | '水'
export type LiuQin = '父母' | '子孙' | '官鬼' | '妻财' | '兄弟'

/**
 * 十二地支 → 五行（派生自 utils/wuxing.ts::BRANCH_ELEMENTS，
 * 只是 Record 形态便于按地支字面量查询；单点漂移风险已消除）。
 */
const BRANCH_TO_ELEMENT: Readonly<Record<string, WuXing>> = Object.freeze(
  BRANCHES.reduce((acc, name, i) => {
    acc[name] = BRANCH_ELEMENTS[i]!
    return acc
  }, {} as Record<string, WuXing>)
)

/** 五行相生环：木→火→土→金→水→木 */
const SHENG_NEXT: Readonly<Record<WuXing, WuXing>> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木'
}

/** 五行相克环：木→土→水→火→金→木 */
const KE_NEXT: Readonly<Record<WuXing, WuXing>> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木'
}

/**
 * 五行主色（re-export from utils/wuxing.ts，历史名字 ELEMENT_COLORS
 * 保留以兼容 NajiaRing 等现有 import；新代码请直接消费 WUXING_COLORS）。
 */
export const ELEMENT_COLORS = WUXING_COLORS

/**
 * 八经卦五行属性（索引 = 经卦 bit 值，与 najia.ts 编码一致）
 *
 *  乾☰=金  兑☱=金  离☲=火  震☳=木  巽☴=木  坎☵=水  艮☶=土  坤☷=土
 *
 * 用于内卦 / 外卦五行标注。
 */
export const BAGUA_ELEMENT: readonly WuXing[] = [
  '土', // 坤 0
  '木', // 震 1
  '水', // 坎 2
  '金', // 兑 3
  '土', // 艮 4
  '火', // 离 5
  '木', // 巽 6
  '金'  // 乾 7
]

/**
 * 八经卦阴阳属性（索引 = 经卦 bit 值）
 *
 *  阳卦：乾☰(3阳)、震☳(1阳2阴)、坎☵(1阳2阴)、艮☶(1阳2阴) — 阳爻数为奇数
 *  阴卦：坤☷(0阳)、巽☴(2阳1阴)、离☲(2阳1阴)、兑☱(2阳1阴) — 阳爻数为偶数
 *
 *  true = 阳卦，false = 阴卦
 */
export const BAGUA_YANG: readonly boolean[] = [
  false, // 坤 0 — 0 阳爻 → 偶 → 阴卦
  true,  // 震 1 — 1 阳爻 → 奇 → 阳卦
  true,  // 坎 2 — 1 阳爻 → 奇 → 阳卦
  false, // 兑 3 — 2 阳爻 → 偶 → 阴卦
  true,  // 艮 4 — 1 阳爻 → 奇 → 阳卦
  false, // 离 5 — 2 阳爻 → 偶 → 阴卦
  false, // 巽 6 — 2 阳爻 → 偶 → 阴卦
  true   // 乾 7 — 3 阳爻 → 奇 → 阳卦
]

/** 六十四卦整体阴阳体性（由上下卦阴阳组合 + 卦气偏性判定） */
export type HexagramYinYang =
  | '纯阳卦'   // 上下皆阳卦
  | '纯阴卦'   // 上下皆阴卦
  | '阳长卦'   // 内阳外阴 → 阳气上升（如泰卦䷊）
  | '阴长卦'   // 内阴外阳 → 阴气上升（如否卦䷋）

/**
 * 由内卦 / 外卦阳属性推导六十四卦整体阴阳体性。
 *
 *  纯阳卦：内外皆阳（如乾䷀）
 *  纯阴卦：内外皆阴（如坤䷁）
 *  阳长卦：内阳外阴 → 阳气自内上升、阴阳交泰（如泰䷊、复䷗）
 *  阴长卦：内阴外阳 → 阴气自内上升、天地不交（如否䷋、姤䷫）
 */
export function classifyHexagramYinYang(innerYang: boolean, outerYang: boolean): HexagramYinYang {
  if (innerYang && outerYang) return '纯阳卦'
  if (!innerYang && !outerYang) return '纯阴卦'
  if (innerYang && !outerYang) return '阳长卦'
  return '阴长卦' // !innerYang && outerYang
}

/**
 * 依「爻五行 vs 本宫五行」判定六亲。
 *
 * @example
 *   computeLiuqin('水', '金')  // '子孙'  （金生水，我生者为子孙）
 *   computeLiuqin('木', '金')  // '妻财'  （金克木，我克者为妻财）
 */
export function computeLiuqin(yao: WuXing, self: WuXing): LiuQin {
  if (yao === self) return '兄弟'
  if (SHENG_NEXT[yao] === self) return '父母'   // 爻生我
  if (SHENG_NEXT[self] === yao) return '子孙'   // 我生爻
  if (KE_NEXT[yao] === self) return '官鬼'      // 爻克我
  if (KE_NEXT[self] === yao) return '妻财'      // 我克爻
  // 不应到达 —— 五行之间只有生 / 克 / 比和三态
  throw new Error(`[guaInfo] unreachable: yao=${yao} vs self=${self}`)
}

/** 从纳甲字符串（如 '甲子'、'壬戌'）提取地支五行 */
export function najiaToElement(najia: string): WuXing {
  const branch = najia[najia.length - 1]!
  const element = BRANCH_TO_ELEMENT[branch]
  if (!element) {
    throw new Error(`[guaInfo] 未知地支 '${branch}' in '${najia}'`)
  }
  return element
}

/** 单爻派生信息 */
export interface YaoInfo {
  /** 爻位 0..5，0=初爻 */
  index: number
  /** 阳爻=true */
  yang: boolean
  /** 纳甲两字，如 '甲子' */
  najia: string
  /** 爻的五行（由纳甲地支派生） */
  element: WuXing
  /** 相对本宫五行的六亲 */
  liuqin: LiuQin
  /** 是否当位（阳爻居阳位 / 阴爻居阴位） */
  dangWei: boolean
  /** 是否世爻 */
  isShi: boolean
  /** 是否应爻 */
  isYing: boolean
}

/** 单卦派生信息 */
export interface GuaInfo {
  value: number
  /** 卦名（文王序） */
  name: string
  /** Unicode 卦符 */
  unicode: string
  /** 所属八宫 */
  palace: string
  /** 世位类型（本宫/一世/…/归魂） */
  shiyingType: string
  /** 本宫五行 */
  palaceElement: WuXing
  /** 世爻位 1..6 */
  shiYao: number
  /** 应爻位 1..6 */
  yingYao: number
  /** 内卦八经卦名 */
  innerGua: string
  /** 外卦八经卦名 */
  outerGua: string
  /** 内卦五行（由八卦→五行映射派生） */
  innerElement: WuXing
  /** 外卦五行（由八卦→五行映射派生） */
  outerElement: WuXing
  /** 内卦是否阳卦（阳爻数为奇数） */
  innerYang: boolean
  /** 外卦是否阳卦（阳爻数为奇数） */
  outerYang: boolean
  /** 六十四卦整体阴阳体性（纯阳/纯阴/阳长/阴长） */
  hexagramYinYang: HexagramYinYang
  /** 六爻自下而上（初→上） */
  yaos: readonly YaoInfo[]
}

/**
 * 由 value（六爻二进制编码 0-63）派生单卦完整占卦信息。
 * 组件层直接消费本函数结果渲染，不再重复纳甲/六亲逻辑。
 */
export function deriveGuaInfo(value: number): GuaInfo {
  const guaMeta = JING_FANG_64_GUA.find(g => g.value === value)
  if (!guaMeta) {
    throw new Error(`[guaInfo] value ${value} 未在 JING_FANG_64_GUA 中，检查是否 0..63`)
  }

  const najia = najiaLines(value)
  const palaceElement = guaMeta.element as WuXing

  const yaos: YaoInfo[] = najia.map((n, i) => {
    const element = najiaToElement(n)
    return {
      index: i,
      yang: Boolean(value & (1 << i)),
      najia: n,
      element,
      liuqin: computeLiuqin(element, palaceElement),
      dangWei: Boolean(value & (1 << i)) === (i % 2 === 0),
      isShi: guaMeta.shiYao === i + 1,
      isYing: guaMeta.yingYao === i + 1
    }
  })

  // Unicode 卦符：由文王序派生
  const wenwang = WENWANG_GUA_BY_VALUE[value]!.wenwangOrder
  const unicode = getUnicodeHexagram(wenwang)

  return {
    value,
    name: guaMeta.name,
    unicode,
    palace: guaMeta.palace,
    shiyingType: guaMeta.shiyingType,
    palaceElement,
    shiYao: guaMeta.shiYao,
    yingYao: guaMeta.yingYao,
    innerGua: getInnerGuaName(value),
    outerGua: getOuterGuaName(value),
    innerElement: BAGUA_ELEMENT[value & 0b111]!,
    outerElement: BAGUA_ELEMENT[(value >> 3) & 0b111]!,
    innerYang: BAGUA_YANG[value & 0b111]!,
    outerYang: BAGUA_YANG[(value >> 3) & 0b111]!,
    hexagramYinYang: classifyHexagramYinYang(
      BAGUA_YANG[value & 0b111]!,
      BAGUA_YANG[(value >> 3) & 0b111]!
    ),
    yaos: Object.freeze(yaos)
  }
}
