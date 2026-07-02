/**
 * 京房八宫六十四卦数据
 *
 * 与「先天伏羲圆图」同用 64 卦，但排序原理完全不同：
 *   先天序按二进制位反转（乾南坤北），本文件按京房八宫世应体系。
 *
 * ═══════════════════════════════════════════════════════════════
 *  京房八宫结构（每宫 8 卦，共 8×8 = 64 卦）
 * ═══════════════════════════════════════════════════════════════
 *
 * 【八宫本宫卦】皆为八纯卦（上下卦相同，六爻同性）：
 *   乾宫 = 乾 (☰☰, v=63)、坎宫 = 坎 (☵☵, v=18)、艮宫 = 艮 (☶☶, v=36)、震宫 = 震 (☳☳, v=9)、
 *   巽宫 = 巽 (☴☴, v=54)、离宫 = 离 (☲☲, v=45)、坤宫 = 坤 (☷☷, v=0)、兑宫 = 兑 (☱☱, v=27)。
 *
 * 【本宫 → 一世 → 二世 → 三世 → 四世 → 五世 → 游魂 → 归魂】变爻规则（8 卦一循环）：
 *   记 v0 = 本宫卦 value；六爻自下而上对应 bit0..bit5。
 *
 *   本宫  : v0                                (世爻 = 上爻/6, 应爻 = 三爻/3)
 *   一世  : v1 = v0 ^ (1<<0)      变初爻       (世 = 初/1, 应 = 四/4)
 *   二世  : v2 = v1 ^ (1<<1)      再变二爻     (世 = 二/2, 应 = 五/5)
 *   三世  : v3 = v2 ^ (1<<2)      再变三爻     (世 = 三/3, 应 = 上/6)
 *   四世  : v4 = v3 ^ (1<<3)      再变四爻     (世 = 四/4, 应 = 初/1)
 *   五世  : v5 = v4 ^ (1<<4)      再变五爻     (世 = 五/5, 应 = 二/2)
 *   游魂  : v6 = v5 ^ (1<<3)      五世后再回变四爻  (世 = 四/4, 应 = 初/1)
 *   归魂  : v7 = v6 ^ 0b000111    游魂后内三爻全变  (世 = 三/3, 应 = 上/6)
 *
 *   应爻位固定规律：应爻 = ((世爻 - 1 + 3) mod 6) + 1，即"世应相隔三爻"。
 *
 * 【验证抽样】
 *   乾宫 v0=63: 乾→姤(62)→遁(60)→否(56)→观(48)→剥(32)→晋(40)→大有(47) ✓
 *   坤宫 v0= 0: 坤→复( 1)→临( 3)→泰( 7)→大壮(15)→夬(31)→需(23)→比(16) ✓
 *
 * ═══════════════════════════════════════════════════════════════
 *  与外层 XIANTIAN_64_GUA 的对齐
 * ═══════════════════════════════════════════════════════════════
 * 通过 `value` 字段与先天圆图数据 join，可反查同一卦的 unicode 卦符 / 卦名 / 六爻数组。
 * 京房环与先天环的每格角度基准相同（GUA_STEP = 360/64），但排列顺序不同：
 *   京房序 = 乾宫8卦 → 坎宫8卦 → 艮宫8卦 → 震宫8卦 → 巽宫8卦 → 离宫8卦 → 坤宫8卦 → 兑宫8卦
 */

import { WENWANG_GUA_BY_VALUE } from '@/data/sixtyFourGua'

/** 京房八宫宫名（按传统顺序：乾坎艮震巽离坤兑） */
export type Palace = '乾' | '坎' | '艮' | '震' | '巽' | '离' | '坤' | '兑'

/** 世位类型（本宫→归魂 8 种） */
export type ShiyingType = '本宫' | '一世' | '二世' | '三世' | '四世' | '五世' | '游魂' | '归魂'

/** 世位在宫内的顺序索引 0..7（本宫=0, 一世=1, ..., 归魂=7） */
export const SHIYING_ORDER: readonly ShiyingType[] = [
  '本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'
]

/** 各世位对应的世爻位（1=初爻,6=上爻） */
const SHI_YAO_BY_ORDER: readonly (1 | 2 | 3 | 4 | 5 | 6)[] = [
  6,  // 本宫：世在上爻
  1,  // 一世：世在初爻
  2,  // 二世
  3,  // 三世
  4,  // 四世
  5,  // 五世
  4,  // 游魂：世在四爻
  3   // 归魂：世在三爻
]

/**
 * 八宫定义：宫名 + 宫索引（0-7）+ 五行属色 + 本宫卦 value（八纯卦）
 *
 * 配色沿用五行主色调，兑/乾同金但用不同明度、艮/坤同土用不同色相，
 * 让相邻宫在圆盘上仍可区分（不再另做 8 个不同宫的分区宽段环）。
 */
export interface PalaceMeta {
  palace: Palace
  palaceIndex: number
  element: '金' | '木' | '水' | '火' | '土'
  color: string
  baseValue: number
}

export const PALACES: readonly PalaceMeta[] = [
  { palace: '乾', palaceIndex: 0, element: '金', color: '#F1C40F', baseValue: 63 },
  { palace: '坎', palaceIndex: 1, element: '水', color: '#3498DB', baseValue: 18 },
  { palace: '艮', palaceIndex: 2, element: '土', color: '#A0522D', baseValue: 36 },
  { palace: '震', palaceIndex: 3, element: '木', color: '#2ECC71', baseValue: 9  },
  { palace: '巽', palaceIndex: 4, element: '木', color: '#16A085', baseValue: 54 },
  { palace: '离', palaceIndex: 5, element: '火', color: '#E74C3C', baseValue: 45 },
  { palace: '坤', palaceIndex: 6, element: '土', color: '#D35400', baseValue: 0  },
  { palace: '兑', palaceIndex: 7, element: '金', color: '#D4A017', baseValue: 27 }
]

/**
 * 由本宫卦 value 按变爻规则生成宫内 8 卦的 value 序列（本宫→归魂）
 */
function generatePalaceValues(baseValue: number): number[] {
  const values: number[] = new Array(8)
  values[0] = baseValue                             // 本宫
  values[1] = values[0]! ^ (1 << 0)                 // 一世：变初爻
  values[2] = values[1]! ^ (1 << 1)                 // 二世：变二爻
  values[3] = values[2]! ^ (1 << 2)                 // 三世：变三爻
  values[4] = values[3]! ^ (1 << 3)                 // 四世：变四爻
  values[5] = values[4]! ^ (1 << 4)                 // 五世：变五爻
  values[6] = values[5]! ^ (1 << 3)                 // 游魂：回变四爻
  values[7] = values[6]! ^ 0b000111                 // 归魂：内三爻全变
  return values
}

/** 京房八宫一卦的完整信息 */
export interface JingFangGuaItem {
  /** 京房序（0-63，乾宫本宫=0，兑宫归魂=63） */
  jingFangOrder: number
  /** 所属宫名 */
  palace: Palace
  /** 所属宫索引 0-7 */
  palaceIndex: number
  /** 宫的五行属性 */
  element: '金' | '木' | '水' | '火' | '土'
  /** 宫属色（本宫至归魂共享同一宫色） */
  color: string
  /** 世位类型 */
  shiyingType: ShiyingType
  /** 世爻位 1-6 */
  shiYao: 1 | 2 | 3 | 4 | 5 | 6
  /** 应爻位 1-6（= (世爻+3-1) mod 6 + 1） */
  yingYao: 1 | 2 | 3 | 4 | 5 | 6
  /** 卦名（同先天数据） */
  name: string
  /** 六爻二进制编码（同先天数据，用于与 XIANTIAN_64_GUA join） */
  value: number
}

/** 由世爻位算应爻位：世应相隔三爻 */
function computeYingYao(shiYao: number): 1 | 2 | 3 | 4 | 5 | 6 {
  return (((shiYao - 1 + 3) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * 京房八宫 64 卦（本宫→归魂，8 宫串联），jingFangOrder 0..63
 * 每卦 name 由 WENWANG_GUA_BY_VALUE[value].name 反查，保证与先天数据一致。
 */
export const JING_FANG_64_GUA: readonly JingFangGuaItem[] = PALACES.flatMap(meta => {
  const values = generatePalaceValues(meta.baseValue)
  return values.map((value, orderInPalace) => {
    const shiYao = SHI_YAO_BY_ORDER[orderInPalace]!
    const yingYao = computeYingYao(shiYao)
    return {
      jingFangOrder: meta.palaceIndex * 8 + orderInPalace,
      palace: meta.palace,
      palaceIndex: meta.palaceIndex,
      element: meta.element,
      color: meta.color,
      shiyingType: SHIYING_ORDER[orderInPalace]!,
      shiYao,
      yingYao,
      name: WENWANG_GUA_BY_VALUE[value]!.name,
      value
    }
  })
})

/** 每卦切向宽度：360 / 64 = 5.625° */
export const JING_FANG_EIGHT_PALACE_STEP = 360 / 64
