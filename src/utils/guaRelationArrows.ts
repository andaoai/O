/**
 * 卦关系盘箭头计算
 *
 * 为卦关系图盘提供布局角度计算、飞伏（feifu）关系表生成、
 * 以及箭头笛卡尔坐标转换。
 *
 * 飞伏是京房八宫体系的核心概念：
 *   「飞」= 显现之卦，「伏」= 隐藏之卦，阴阳互藏其宅。
 *
 * 根据《京氏易传》乾卦章「与坤为飞伏」、姤卦章「与巽为飞伏」
 * 以及「一世卦的飞伏取本宫内卦」的记载，推导出统一规则：
 *
 *   本宫卦（八纯卦）：伏 = 对宫本宫（阴阳全反）
 *     乾→坤、震→巽、坎→离、艮→兑
 *     公式：伏 = 63 - 飞
 *
 *   一世/二世/三世：伏 = 「新内卦」的叠卦
 *     一世变初爻 → 内卦变为新三爻 → 伏卦 = 新内卦的叠卦
 *     公式：伏 = (飞 & 7) * 9
 *
 *   四世/五世：伏 = 「新外卦」的叠卦
 *     四世变四爻 → 外卦变为新三爻 → 伏卦 = 新外卦的叠卦
 *     公式：伏 = ((飞 >> 3) & 7) * 9
 *
 *   游魂：伏 = 「五世卦之外卦」的叠卦（⚠️ 非游魂自身外卦）
 *     五世回变四爻 → 外卦恢复为五世时的旧外卦 → 伏取此旧外卦
 *     公式：伏 = (((飞 ^ 8) >> 3) & 7) * 9   ← 逆推回五世卦取外卦
 *
 *   归魂：伏 = 「游魂卦之内卦」的叠卦（⚠️ 非归魂自身内卦）
 *     归魂内三爻全变 → 内卦恢复为游魂时的旧内卦 → 伏取此旧内卦
 *     公式：伏 = ((飞 ^ 0b111) & 7) * 9       ← 逆推回游魂卦取内卦
 *
 * 【验证 - 乾宫 8 卦（《京氏易传》原文比对）】
 *   乾→坤 ✓    (与坤为飞伏)
 *   姤→巽 ✓    (与巽为飞伏)
 *   遁→艮 ✓    (与艮为飞伏)
 *   否→坤 ✓    (与坤为飞伏)
 *   观→巽 ✓    (与巽为飞伏)
 *   剥→艮 ✓    (与艮为飞伏)
 *   晋→艮 ✓    (与艮为飞伏) ← 游魂：五世剥的外卦艮
 *   大有→坤 ✓  (与坤为飞伏) ← 归魂：游魂晋的内卦坤
 * 【验证 - 坎宫 8 卦（《京氏易传》原文比对）】
 *   坎→离 ✓    (与离为飞伏)
 *   节→兑 ✓    (与兑为飞伏)
 *   屯→震 ✓    (与震为飞伏)
 *   既济→离 ✓  (与离为飞伏)
 *   革→兑 ✓    (与兑为飞伏)
 *   丰→震 ✓    (与震为飞伏)
 *   明夷→震 ✓  (与震为飞伏) ← 游魂：五世丰的外卦震
 *   师→离 ✓    (与离为飞伏) ← 归魂：游魂明夷的内卦离
 *
 * 关键性质：所有 64 个飞卦的伏卦都必落在 8 个纯卦（本宫卦）上，
 * 即 {乾63, 兑27, 离45, 震9, 巽54, 坎18, 艮36, 坤0}。
 * 可视化上呈现「64→8」的放射状收敛图形。
 */
import { polarToCartesian, type RotationDirection } from '@/utils/geometry'
import { JING_FANG_64_GUA, JING_FANG_64_GUA_BY_VALUE } from '@/data/rings/jingFangEightPalaces'
import { WENWANG_GUA_BY_VALUE } from '@/data/sixtyFourGua'
import { getUnicodeHexagram } from '@/utils/guaUtils'
import type { ShiyingType } from '@/data/rings/jingFangEightPalaces'
import { type GuaLayout, FEIFU_PALACE_ORDER, getGuaAngle } from './guaLayoutConstants'

// ─── 布局类型 ───

/** GuaRelationLayout 是 GuaLayout 的别名，保持向后兼容 */
export type GuaRelationLayout = GuaLayout

/**
 * 由飞卦的 value 和世位类型计算伏卦的 value
 */
export function computeFuValue(feiValue: number, shiyingType: ShiyingType): number {
  switch (shiyingType) {
    case '本宫':
      // 对宫本宫：阴阳全反
      return 63 - feiValue
    case '一世':
    case '二世':
    case '三世':
      // 新内卦（下卦）的叠卦：变爻后内卦已变，取新内卦
      return (feiValue & 0b111) * 9
    case '四世':
    case '五世':
      // 新外卦（上卦）的叠卦：变爻后外卦已变，取新外卦
      return ((feiValue >> 3) & 0b111) * 9
    case '游魂':
      // 逆推五世卦的上卦叠卦：游魂回变四爻→上卦被改，伏取改之前的旧外卦
      // formula: 游魂 ^ (1<<3) = 五世卦，取其外卦 * 9
      return (((feiValue ^ 8) >> 3) & 0b111) * 9
    case '归魂':
      // 逆推游魂卦的下卦叠卦：归魂内三爻全变→下卦被改，伏取改之前的旧内卦
      // formula: 归魂 ^ 0b111 = 游魂卦，取其内卦 * 9
      return ((feiValue ^ 0b111) & 0b111) * 9
  }
}

/** 飞伏条目：一卦的飞伏完整信息 */
export interface FeifuEntry {
  /** 飞卦 value (0-63) */
  feiValue: number
  /** 伏卦 value (0-63) */
  fuValue: number
  /** 飞卦在京房环的序 (0-63) */
  feiJingFangOrder: number
  /** 伏卦在京房环的序 (0-63) */
  fuJingFangOrder: number
  /** 飞卦名 */
  feiName: string
  /** 伏卦名 */
  fuName: string
  /** 飞卦符 (Unicode) */
  feiUnicode: string
  /** 伏卦符 (Unicode) */
  fuUnicode: string
  /** 飞卦所属宫 */
  palace: string
  /** 飞卦世位类型 */
  shiyingType: ShiyingType
  /** 飞卦所属宫色 */
  color: string
}

/**
 * 生成全部 64 个飞伏条目
 * 由 JING_FANG_64_GUA（京房八宫 64 卦）遍历派生
 */
export const FEIFU_TABLE: readonly FeifuEntry[] = JING_FANG_64_GUA.map(gua => {
  const fuValue = computeFuValue(gua.value, gua.shiyingType)
  // 查伏卦的京房序
  const fuGua = JING_FANG_64_GUA_BY_VALUE.get(fuValue)!
  const fuMeta = WENWANG_GUA_BY_VALUE[fuValue]!
  return {
    feiValue: gua.value,
    fuValue,
    feiJingFangOrder: gua.jingFangOrder,
    fuJingFangOrder: fuGua.jingFangOrder,
    feiName: gua.name,
    fuName: fuMeta.name,
    feiUnicode: getUnicodeHexagram(WENWANG_GUA_BY_VALUE[gua.value]!.wenwangOrder),
    fuUnicode: getUnicodeHexagram(fuMeta.wenwangOrder),
    palace: gua.palace,
    shiyingType: gua.shiyingType,
    color: gua.color
  }
})

/** 箭头渲染数据：带笛卡尔坐标的飞伏箭头 */
export interface FeifuArrowData {
  entry: FeifuEntry
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * 计算所有飞伏箭头的笛卡尔坐标
 * @param nodeRadius   节点布局圆的半径
 * @param startDegree  起始角度偏移
 * @param direction    旋转方向
 * @param layout       卦象排列方式：'jingfang'（京房八宫序）| 'xiantian'（先天八卦/伏羲圆图序）
 */
export function computeFeifuArrows(
  nodeRadius: number,
  startDegree: number = 0,
  direction: RotationDirection = 'clockwise',
  layout: GuaRelationLayout = 'jingfang'
): FeifuArrowData[] {
  return FEIFU_TABLE.map(entry => {
    const feiAngle = getGuaAngle(entry.feiValue, layout, startDegree)
    const fuAngle = getGuaAngle(entry.fuValue, layout, startDegree)
    const from = polarToCartesian(feiAngle, nodeRadius, direction)
    const to = polarToCartesian(fuAngle, nodeRadius, direction)
    return { entry, x1: from.x, y1: from.y, x2: to.x, y2: to.y }
  })
}

/**
 * 获取某卦在指定布局下的节点坐标
 * @param value       卦的 value (0-63)
 * @param nodeRadius  节点布局圆的半径
 * @param layout      卦象排列方式
 */
export function getNodePosition(
  value: number,
  nodeRadius: number,
  startDegree: number = 0,
  direction: RotationDirection = 'clockwise',
  layout: GuaRelationLayout = 'jingfang'
): { x: number; y: number } {
  const angle = getGuaAngle(value, layout, startDegree)
  return polarToCartesian(angle, nodeRadius, direction)
}

/** 8 个纯卦的 value 集合（re-export from guaLayoutConstants.ts） */
export { PURE_GUA_VALUES } from './guaLayoutConstants'
