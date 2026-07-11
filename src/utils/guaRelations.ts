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
 *  关系类型与排序布局（先天/后天）互相独立，可任意组合：
 *    后天八卦（京房八宫序）：乾坎艮震坤离兑巽
 *    先天八卦（伏羲圆图序）：按二进制位反转排列
 * ═══════════════════════════════════════════════════════════════
 */
import { WENWANG_GUA_BY_VALUE, getUnicodeHexagram, bitReverse6, GUA_STEP } from '@/data/sixtyFourGua'
import { JING_FANG_64_GUA, JING_FANG_EIGHT_PALACE_STEP } from '@/data/rings/jingFangEightPalaces'
import { FEIFU_TABLE } from './feifu'
import type { RotationDirection } from './geometry'

// ─── 关系类型定义 ───

/** 支持的卦关系类型 */
export type GuaRelationType = 'feifu' | 'hugua' | 'duigua' | 'zonggua' | 'jiaogua'

/** 关系类型元数据 */
export interface GuaRelationMeta {
  type: GuaRelationType
  label: string
  description: string
  /**
   * 是否支持八宫筛选。
   * 仅 feifu 关系源于京房八宫体系，其他关系不依赖宫概念。
   */
  supportsPalaceFilter: boolean
  /**
   * 是否支持世位筛选。
   * 仅 feifu 关系有世应体系，其他关系无世位概念。
   */
  supportsShiyingFilter: boolean
}

/**
 * 所有关系类型的元数据注册表
 */
export const RELATION_METAS: Record<GuaRelationType, GuaRelationMeta> = {
  feifu: {
    type: 'feifu',
    label: '飞伏',
    description: '飞为显、伏为隐，阴阳互藏其宅。依京房八宫世应体系，每卦有对应的伏卦，收敛至八纯卦。',
    supportsPalaceFilter: true,
    supportsShiyingFilter: true,
  },
  hugua: {
    type: 'hugua',
    label: '互卦',
    description: '取卦中二至四爻为下互卦、三至五爻为上互卦，揭示卦象内在交互关系。',
    supportsPalaceFilter: true,
    supportsShiyingFilter: true,
  },
  duigua: {
    type: 'duigua',
    label: '对卦',
    description: '六爻全变（阴阳翻转），亦称错卦。如乾䷀↔坤䷁、泰䷊↔否䷋，互为对卦。',
    supportsPalaceFilter: true,
    supportsShiyingFilter: true,
  },
  zonggua: {
    type: 'zonggua',
    label: '综卦',
    description: '上下颠倒（覆卦），初爻跟上爻、二爻跟五爻、三爻跟四爻交换位置。不变卦（如乾、坤、坎、离）自综。',
    supportsPalaceFilter: true,
    supportsShiyingFilter: true,
  },
  jiaogua: {
    type: 'jiaogua',
    label: '交卦',
    description: '内外卦交换位置，下卦移至上位、上卦移至下位，又称上下易位。',
    supportsPalaceFilter: true,
    supportsShiyingFilter: true,
  },
}

/** 供模板遍历的数组形态 */
export const RELATION_METAS_LIST: readonly GuaRelationMeta[] = [
  RELATION_METAS.feifu,
  RELATION_METAS.hugua,
  RELATION_METAS.duigua,
  RELATION_METAS.zonggua,
  RELATION_METAS.jiaogua,
]

/** 各类型在模板中的配色提示 */
export const RELATION_COLORS: Record<GuaRelationType, string> = {
  feifu: '#F1C40F',    // 金
  hugua: '#2ECC71',    // 木
  duigua: '#E74C3C',   // 火
  zonggua: '#3498DB',  // 水
  jiaogua: '#A0522D',  // 土
}

// ─── 排序布局 ───

/** 卦象排列方式 */
export type GuaLayout = 'houtian' | 'xiantian'

/** 后天八卦（京房八宫）序下重排宫位，使四对宫处于对径位置（180°） */
const FEIFU_PALACE_ORDER: readonly string[] = ['乾', '坎', '艮', '震', '坤', '离', '兑', '巽']

/**
 * 通用角度计算：获取某卦在指定布局下的圆心角（SVG 空间，度）
 *
 * 与 feifu.ts 和 FeifuTextRing 中的 getAngle / getGuaAngle 为同一逻辑，
 * 在此统一收敛，避免三处维护。
 *
 * @param value      六爻二进制编码 0-63
 * @param layout     排列方式：'houtian'（后天京房序）| 'xiantian'（先天圆图序）
 * @param startDegree 起始角度偏移
 * @returns 圆心角度数 (0-360)，SVG 坐标系（0°=正右，90°=正下，270°=正上）
 */
export function getGuaAngle(value: number, layout: GuaLayout, startDegree: number = 0): number {
  if (layout === 'houtian') {
    const gua = JING_FANG_64_GUA.find(g => g.value === value)
    if (!gua) return 0
    const orderInPalace = gua.jingFangOrder % 8
    const newPalacePos = FEIFU_PALACE_ORDER.indexOf(gua.palace)
    const order = newPalacePos * 8 + orderInPalace
    return (270 + order * JING_FANG_EIGHT_PALACE_STEP + startDegree) % 360
  } else {
    // 先天八卦：按二进制位反转（伏羲圆图）定位
    const pos = bitReverse6(value)
    const angle = pos >= 32
      ? 270 + (63 - pos) * GUA_STEP
      : 270 - (32 - pos) * GUA_STEP
    return (angle + startDegree) % 360
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
 * @returns 长度 64 的 GuaRelationEntry 数组
 *
 * feifu 类型：转写 FEIFU_TABLE 为通用格式（含宫/色/世位）
 * 其他类型：遍历 0-63 调用对应纯函数
 */
export function computeRelationTable(type: GuaRelationType): GuaRelationEntry[] {
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

/**
 * 8 个纯卦的 value 集合（仅 feifu 关系有意义）
 * 伏卦全落在此集合：{乾63, 兑27, 离45, 震9, 巽54, 坎18, 艮36, 坤0}
 */
export const PURE_GUA_VALUES: readonly number[] = [63, 27, 45, 9, 54, 18, 36, 0]
