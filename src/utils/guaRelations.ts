/**
 * 六十四卦关系计算
 *
 * ═══════════════════════════════════════════════════════════════
 *  卦与卦之间存在多种关系，本模块提供纯函数计算各类关系：
 *
 *   飞伏（feifu）：   京房八宫体系，每卦有对应的"伏卦"
 *   互卦（hugua）：   取二至四爻为下卦、三至五爻为上卦，揭示内在交互
 *   对卦（duigua）：  六爻全变（阴阳翻转），亦称错卦
 *   综卦（zonggua）： 上下颠倒（覆卦），位反转 6 位
 *   交卦（jiaogua）： 内外卦交换位置（上下易位）
 *
 *  所有函数满足 Layer 5 纯函数要求：
 *    相同输入 → 相同输出，无副作用，不依赖外部状态
 *
 *  关系类型与排序布局（京房/先天）互相独立，可任意组合：
 *    京房八宫序：乾坎艮震坤离兑巽
 *    先天八卦（伏羲圆图序）：按二进制位反转排列
 * ═══════════════════════════════════════════════════════════════
 */
import { WENWANG_GUA_BY_VALUE, getUnicodeHexagram, bitReverse6, GUA_STEP, ZAGUAZHUAN_POS_BY_VALUE } from '@/data/sixtyFourGua'
import { JING_FANG_64_GUA, JING_FANG_EIGHT_PALACE_STEP } from '@/data/rings/jingFangEightPalaces'
import { FEIFU_TABLE } from './guaRelationArrows'
import type { RotationDirection } from './geometry'

// ─── 关系类型定义 ───

/** 支持的卦关系类型 */
export type GuaRelationType = 'feifu' | 'hugua' | 'duigua' | 'zonggua' | 'jiaogua' | 'biangua'

/**
 * 可视化方向约束
 *
 * 明确标注每种关系在盘面上的呈现方式：
 *   unidirectional — 单向 A→B，一条有向箭头，不可逆（飞伏/互卦）
 *   bidirectional — 双向对称 A↔B，互为关系，重复渲染可去重（对卦/综卦/交卦）
 */
export type RelationDirection = 'unidirectional' | 'bidirectional'

/** 关系类型元数据 */
export interface GuaRelationMeta {
  type: GuaRelationType
  label: string
  description: string
  /**
   * 可视化方向需求。
   *   unidirectional — 单向箭头，A→B
   *   bidirectional — 双向对称，A↔B
   */
  direction: RelationDirection
  /**
   * 筛选作用域。
   *   true  — 仅检查源卦的宫/世位（非 feifu 关系：互卦/对卦/综卦/交卦）
   *   false — 同时检查源卦和目标卦的宫/世位（feifu 收敛关系）
   *
   * ⚠️ 互卦（hugua）：多对一映射（丢失初/上爻），若同时检查目标卦的宫，
   *    会导致大量无关卦通过筛选而高亮。必须 source-only。
   *    对卦/综卦/交卦：双向对称，筛选源卦即为查看「X 宫各卦的对/综/交」。
   */
  filterSourceOnly: boolean
}

/**
 * 所有关系类型的元数据注册表
 *
 * 五种关系可视化方向与筛选行为互不相同，在此集中声明：
 *
 * ┌────────┬──────────────┬───────────────┬─────────────────────────────┐
 * │ 类型   │ direction    │ filterScope   │ 原因                        │
 * ├────────┼──────────────┼───────────────┼─────────────────────────────┤
 * │ 飞伏   │ unidirectional │ source+target │ 64→8 收敛，伏卦必在八纯卦   │
 * │ 互卦   │ unidirectional │ source-only   │ 多对一映射，目标卦不应反向匹配 │
 * │ 对卦   │ bidirectional  │ source-only   │ 六爻全反，双向对称           │
 * │ 综卦   │ bidirectional  │ source-only   │ 位反转，双向对称             │
 * │ 交卦   │ bidirectional  │ source-only   │ 内外易位，双向对称           │
 * └────────┴──────────────┴───────────────┴─────────────────────────────┘
 */
export const RELATION_METAS: Record<GuaRelationType, GuaRelationMeta> = {
  feifu: {
    type: 'feifu',
    label: '飞伏',
    description: '飞为显、伏为隐，阴阳互藏其宅。依京房八宫世应体系，每卦有对应的伏卦，收敛至八纯卦。',
    direction: 'unidirectional',
    filterSourceOnly: false,
  },
  hugua: {
    type: 'hugua',
    label: '互卦',
    description: '取卦中二至四爻为下互卦、三至五爻为上互卦，揭示卦象内在交互关系。',
    direction: 'unidirectional',
    filterSourceOnly: true,
  },
  duigua: {
    type: 'duigua',
    label: '对卦',
    description: '六爻全变（阴阳翻转），亦称错卦。如乾䷀↔坤䷁、泰䷊↔否䷋，互为对卦。',
    direction: 'bidirectional',
    filterSourceOnly: true,
  },
  zonggua: {
    type: 'zonggua',
    label: '综卦',
    description: '上下颠倒（覆卦），初爻跟上爻、二爻跟五爻、三爻跟四爻交换位置。不变卦（如乾、坤、坎、离）自综。',
    direction: 'bidirectional',
    filterSourceOnly: true,
  },
  jiaogua: {
    type: 'jiaogua',
    label: '交卦',
    description: '内外卦交换位置，下卦移至上位、上卦移至下位，又称上下易位。',
    direction: 'bidirectional',
    filterSourceOnly: true,
  },
  biangua: {
    type: 'biangua',
    label: '变卦',
    description: '按指定动爻位将该爻阴阳反转（支持二爻/三爻皆变），代表事物发展变化之趋势。',
    direction: 'unidirectional',
    filterSourceOnly: true,
  },
}

/** 供模板遍历的数组形态 */
export const RELATION_METAS_LIST: readonly GuaRelationMeta[] = [
  RELATION_METAS.feifu,
  RELATION_METAS.hugua,
  RELATION_METAS.duigua,
  RELATION_METAS.zonggua,
  RELATION_METAS.jiaogua,
  RELATION_METAS.biangua,
]

/** 各类型在模板中的配色提示 */
export const RELATION_COLORS: Record<GuaRelationType, string> = {
  feifu: '#F1C40F',    // 金
  hugua: '#2ECC71',    // 木
  duigua: '#E74C3C',   // 火
  zonggua: '#3498DB',  // 水
  jiaogua: '#A0522D',  // 土
  biangua: '#9B59B6',  // 紫（动爻之变）
}

// ─── 排序布局 ───

/**
 * 卦象排列方式
 *
 *   jingfang    — 京房八宫序（汉·京房《京氏易传》）：八宫成扇区
 *   xiantian    — 先天圆图（宋·邵雍《皇极经世·观物外篇》，本自伏羲）：位反转序
 *   binary      — 自然二进制序：value 0→63 顶乾底坤逆时针
 *   wenwang     — 文王卦序（通行本《周易·序卦传》）：乾坤屯蒙需讼师比…
 *   zaguazhuan  — 杂卦传序（《周易·杂卦传》）：乾坤比师临观屯蒙…
 */
export type GuaLayout = 'jingfang' | 'xiantian' | 'binary' | 'wenwang' | 'zaguazhuan'

/** 京房八宫序下重排宫位，使四对宫处于对径位置（180°） */
const FEIFU_PALACE_ORDER: readonly string[] = ['乾', '坎', '艮', '震', '坤', '离', '兑', '巽']

/** 由 pos (0-63) 换算成 SVG 圆心角（乾/首卦居顶，逆时针展开 => 顺时针视觉需通过 rotationDirection 调转） */
function posToAngle(pos: number, startDegree: number): number {
  return (270 + pos * GUA_STEP + startDegree) % 360
}

/**
 * 通用角度计算：获取某卦在指定布局下的圆心角（SVG 空间，度）
 *
 * 与 feifu.ts 和 FeifuTextRing 中的 getAngle / getGuaAngle 为同一逻辑，
 * 在此统一收敛，避免三处维护。
 *
 * 各布局的 pos → angle 映射约定：
 *   - jingfang：宫位重排 (乾坎艮震坤离兑巽)，每宫 8 卦占 45°
 *   - xiantian：乾顶坤底、两仪对径 (阳仪右半、阴仪左半)
 *   - binary：value 直接映射为 pos，坤顶乾底
 *   - wenwang：wenwangOrder-1 映射为 pos，乾坤起、既未济终
 *   - zaguazhuan：《杂卦传》文本次序
 *
 * @param value      六爻二进制编码 0-63
 * @param layout     排列方式
 * @param startDegree 起始角度偏移
 * @returns 圆心角度数 (0-360)，SVG 坐标系（0°=正右，90°=正下，270°=正上）
 */
export function getGuaAngle(value: number, layout: GuaLayout, startDegree: number = 0): number {
  switch (layout) {
    case 'jingfang': {
      const gua = JING_FANG_64_GUA.find(g => g.value === value)
      if (!gua) return 0
      const orderInPalace = gua.jingFangOrder % 8
      const newPalacePos = FEIFU_PALACE_ORDER.indexOf(gua.palace)
      const order = newPalacePos * 8 + orderInPalace
      return (270 + order * JING_FANG_EIGHT_PALACE_STEP + startDegree) % 360
    }
    case 'xiantian': {
      // 先天八卦：按二进制位反转（伏羲圆图）定位
      const pos = bitReverse6(value)
      const angle = pos >= 32
        ? 270 + (63 - pos) * GUA_STEP
        : 270 - (32 - pos) * GUA_STEP
      return (angle + startDegree) % 360
    }
    case 'binary': {
      // 自然二进制序：pos = value（0=坤居顶，63=乾居首圈末）
      return posToAngle(value, startDegree)
    }
    case 'wenwang': {
      // 文王卦序：pos = 文王序 - 1（0=乾，63=未济）
      const meta = WENWANG_GUA_BY_VALUE[value]
      const pos = meta ? meta.wenwangOrder - 1 : 0
      return posToAngle(pos, startDegree)
    }
    case 'zaguazhuan': {
      // 《杂卦传》文本序
      const pos = ZAGUAZHUAN_POS_BY_VALUE[value] ?? 0
      return posToAngle(pos, startDegree)
    }
  }
}

// ─── 关系计算纯函数 ───

/** 互卦：取二至四爻为下互卦（bits 1-3），三至五爻为上互卦（bits 2-4） */
export function computeHugua(value: number): number {
  const lower = (value >> 1) & 0b111
  const upper = (value >> 2) & 0b111
  return lower | (upper << 3)
}

/** 对卦（错卦）：六爻全变（bitwise NOT within 6 bits） */
export function computeDuigua(value: number): number {
  return (~value) & 0b111111
}

/** 综卦：上下颠倒（6 位 bit 反转）
 *  复用 sixtyFourGua.ts 的 bitReverse6，与先天圆图位置计算相同算法 */
export function computeZonggua(value: number): number {
  return bitReverse6(value)
}

/** 交卦：交换上下卦（内外易位）
 *  下卦 → 上卦，上卦 → 下卦 */
export function computeJiaogua(value: number): number {
  const lower = value & 0b111
  const upper = (value >> 3) & 0b111
  return upper | (lower << 3)
}

/**
 * 变卦：按指定动爻位翻转爻线
 *
 *  周易六爻自初爻至上爻，位置 0..5，对应二进制第 0..5 位（低位为初爻）。
 *  支持多爻同时变（如二爻五爻皆变），无动爻时原卦不变。
 *
 *  @param value        原卦 value (0..63)
 *  @param movingLines  动爻位数组，元素范围 0..5（0=初爻，5=上爻）；越界值忽略
 *  @returns            变卦 value
 */
export function computeBiangua(value: number, movingLines: readonly number[]): number {
  let mask = 0
  for (const line of movingLines) {
    if (line >= 0 && line <= 5) mask |= (1 << line)
  }
  return (value ^ mask) & 0b111111
}

// ─── 通用关系条目 ───

/**
 * 单条关系记录
 *
 * 所有关系类型均携带有宫/世位信息，但来源不同：
 *   feifu 关系：palace/shiyingType 为源卦（飞卦）所属宫/世位（与目标卦同宫同世位）
 *   非 feifu 关系：palace/shiyingType 为源卦所属宫/世位，
 *                 targetPalace/targetShiyingType 为目标卦所属宫/世位
 */
export interface GuaRelationEntry {
  /** 源卦 value (0-63) */
  sourceValue: number
  /** 目标卦 value (0-63) */
  targetValue: number
  /** 源卦名 */
  sourceName: string
  /** 目标卦名 */
  targetName: string
  /** 源卦符 (Unicode) */
  sourceUnicode: string
  /** 目标卦符 (Unicode) */
  targetUnicode: string
  /** 所属宫（源卦所属京房八宫） */
  palace?: string
  /** 宫色（源卦所属宫色） */
  color?: string
  /** 世位类型（源卦世位） */
  shiyingType?: string
  /** 目标卦所属宫（非 feifu 关系筛选用，feifu 与 palace 相同） */
  targetPalace?: string
  /** 目标卦世位类型（非 feifu 关系筛选用，feifu 与 shiyingType 相同） */
  targetShiyingType?: string
}

/** 计算非 feifu 关系的通用表 */
function computeGenericRelationTable(
  computeTarget: (value: number) => number,
): GuaRelationEntry[] {
  return Array.from({ length: 64 }, (_, value) => {
    const targetValue = computeTarget(value)
    const sourceMeta = WENWANG_GUA_BY_VALUE[value]!
    const targetMeta = WENWANG_GUA_BY_VALUE[targetValue]!
    const sourceJf = JING_FANG_64_GUA.find(g => g.value === value)
    const targetJf = JING_FANG_64_GUA.find(g => g.value === targetValue)
    return {
      sourceValue: value,
      targetValue,
      sourceName: sourceMeta.name,
      targetName: targetMeta.name,
      sourceUnicode: getUnicodeHexagram(sourceMeta.wenwangOrder),
      targetUnicode: getUnicodeHexagram(targetMeta.wenwangOrder),
      palace: sourceJf?.palace,
      color: sourceJf?.color,
      shiyingType: sourceJf?.shiyingType,
      targetPalace: targetJf?.palace,
      targetShiyingType: targetJf?.shiyingType,
    }
  })
}

/**
 * 按关系类型计算完整的 64 卦关系表
 *
 * @param type 关系类型
 * @param movingLines 动爻位（仅 biangua 使用；未提供或空数组则变卦等于原卦）
 * @returns 长度 64 的 GuaRelationEntry 数组
 *
 * feifu 类型：转写 FEIFU_TABLE 为通用格式（含宫/色/世位）
 * 其他类型：遍历 0-63 调用对应纯函数
 */
export function computeRelationTable(
  type: GuaRelationType,
  movingLines: readonly number[] = [],
): GuaRelationEntry[] {
  switch (type) {
    case 'feifu':
      return FEIFU_TABLE.map(e => ({
        sourceValue: e.feiValue,
        targetValue: e.fuValue,
        sourceName: e.feiName,
        targetName: e.fuName,
        sourceUnicode: e.feiUnicode,
        targetUnicode: e.fuUnicode,
        palace: e.palace,
        color: e.color,
        shiyingType: e.shiyingType,
        targetPalace: e.palace,
        targetShiyingType: e.shiyingType,
      }))
    case 'hugua':
      return computeGenericRelationTable(computeHugua)
    case 'duigua':
      return computeGenericRelationTable(computeDuigua)
    case 'zonggua':
      return computeGenericRelationTable(computeZonggua)
    case 'jiaogua':
      return computeGenericRelationTable(computeJiaogua)
    case 'biangua':
      return computeGenericRelationTable(v => computeBiangua(v, movingLines))
  }
}

/**
 * 从任意 GuaRelationEntry 中提取箭头颜色
 *
 * - feifu 类型：使用 entry.color（宫色）
 * - 非 feifu 类型：查找 JING_FANG_64_GUA 获取源卦的宫色
 */
export function getArrowColor(entry: GuaRelationEntry): string {
  if (entry.color) return entry.color
  const gua = JING_FANG_64_GUA.find(g => g.value === entry.sourceValue)
  return gua?.color ?? '#FFD700'
}

// ─── 聚焦模式 ───

/** 带关系类型标记的 entry（聚焦模式下按 type 上色） */
export interface FocusRelationEntry extends GuaRelationEntry {
  type: GuaRelationType
}

/**
 * 计算某个源卦对应的多种关系条目（聚焦模式核心）
 *
 *  以 sourceValue 为焦点，对 types 中的每种关系类型分别计算目标卦，产出多条 entry。
 *  每条 entry 附带 type 字段，供渲染层按 RELATION_COLORS 上色。
 *
 *  变卦（biangua）在 movingLines 为空时目标卦 == 源卦（自环），
 *  由渲染层决定是否显示（一般不显示"未指定动爻的变卦"）。
 *
 *  @param sourceValue  焦点卦 value (0..63)
 *  @param types        要计算的关系类型集合
 *  @param movingLines  动爻位（仅 biangua 使用）
 */
export function computeFocusRelations(
  sourceValue: number,
  types: readonly GuaRelationType[],
  movingLines: readonly number[] = [],
): FocusRelationEntry[] {
  if (sourceValue < 0 || sourceValue > 63) return []

  const out: FocusRelationEntry[] = []
  const sourceMeta = WENWANG_GUA_BY_VALUE[sourceValue]!
  const sourceJf = JING_FANG_64_GUA.find(g => g.value === sourceValue)
  const sourceUnicode = getUnicodeHexagram(sourceMeta.wenwangOrder)

  for (const type of types) {
    let targetValue: number
    if (type === 'feifu') {
      const feifuEntry = FEIFU_TABLE.find(e => e.feiValue === sourceValue)
      if (!feifuEntry) continue
      targetValue = feifuEntry.fuValue
    } else if (type === 'hugua') {
      targetValue = computeHugua(sourceValue)
    } else if (type === 'duigua') {
      targetValue = computeDuigua(sourceValue)
    } else if (type === 'zonggua') {
      targetValue = computeZonggua(sourceValue)
    } else if (type === 'jiaogua') {
      targetValue = computeJiaogua(sourceValue)
    } else {
      // biangua
      targetValue = computeBiangua(sourceValue, movingLines)
    }

    const targetMeta = WENWANG_GUA_BY_VALUE[targetValue]!
    const targetJf = JING_FANG_64_GUA.find(g => g.value === targetValue)

    out.push({
      type,
      sourceValue,
      targetValue,
      sourceName: sourceMeta.name,
      targetName: targetMeta.name,
      sourceUnicode,
      targetUnicode: getUnicodeHexagram(targetMeta.wenwangOrder),
      palace: sourceJf?.palace,
      color: sourceJf?.color,
      shiyingType: sourceJf?.shiyingType,
      targetPalace: targetJf?.palace,
      targetShiyingType: targetJf?.shiyingType,
    })
  }

  return out
}

/**
 * 8 个纯卦的 value 集合（仅 feifu 关系有意义）
 * 伏卦全落在此集合：{乾63, 兑27, 离45, 震9, 巽54, 坎18, 艮36, 坤0}
 */
export const PURE_GUA_VALUES: readonly number[] = [63, 27, 45, 9, 54, 18, 36, 0]
