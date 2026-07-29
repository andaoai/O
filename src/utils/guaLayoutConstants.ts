/**
 * 卦布局共享常量与类型
 *
 * ═══════════════════════════════════════════════════════════════
 *  抽取 guaRelations.ts 和 guaRelationArrows.ts 共享的：
 *    - GuaLayout 排列方式类型
 *    - FEIFU_PALACE_ORDER 京房八宫重排序
 *    - getGuaAngle 通用角度计算
 *    - PURE_GUA_VALUES 八纯卦 value 集合
 *
 *  设计目的：避免 guaRelations ↔ guaRelationArrows 循环导入，
 *  同时消除两文件间的常量/类型/函数重复。
 * ═══════════════════════════════════════════════════════════════
 */

import { bitReverse6 } from '@/utils/guaUtils'
import { GUA_STEP, WENWANG_GUA_BY_VALUE, ZAGUAZHUAN_POS_BY_VALUE } from '@/data/sixtyFourGua'
import { JING_FANG_64_GUA_BY_VALUE, JING_FANG_EIGHT_PALACE_STEP } from '@/data/rings/jingFangEightPalaces'

// ─── 排序布局类型 ───

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

// ─── 京房八宫重排序 ───

/**
 * 京房八宫序下重排宫位，使四对宫处于对径位置（180°）：
 *   乾↔坤、坎↔离、艮↔兑、震↔巽
 *
 * 原始京房序：乾(0) 坎(1) 艮(2) 震(3) 巽(4) 离(5) 坤(6) 兑(7)
 * 重排后序：   乾(0) 坎(1) 艮(2) 震(3) 坤(4) 离(5) 兑(6) 巽(7)
 *                          ↕ 对径 ↕           ↕ 对径 ↕
 *             每宫占 45°（8 卦 × 5.625°），4 宫刚好 180°
 */
export const FEIFU_PALACE_ORDER: readonly string[] = ['乾', '坎', '艮', '震', '坤', '离', '兑', '巽']

// ─── 通用角度计算 ───

/** 由 pos (0-63) 换算成 SVG 圆心角 */
function posToAngle(pos: number, startDegree: number): number {
  return (270 + pos * GUA_STEP + startDegree) % 360
}

/**
 * 通用角度计算：获取某卦在指定布局下的圆心角（SVG 空间，度）
 *
 * 各布局的 pos → angle 映射约定：
 *   - jingfang：宫位重排 (乾坎艮震坤离兑巽)，每宫 8 卦占 45°
 *   - xiantian：乾顶坤底、两仪对径 (阳仪右半、阴仪左半)
 *   - binary：value 直接映射为 pos，坤顶乾底
 *   - wenwang：wenwangOrder-1 映射为 pos，乾坤起、既未济终
 *   - zaguazhuan：《杂卦传》文本次序
 *
 * @param value       六爻二进制编码 0-63
 * @param layout      排列方式
 * @param startDegree 起始角度偏移
 * @returns 圆心角度数 (0-360)，SVG 坐标系（0°=正右，90°=正下，270°=正上）
 */
export function getGuaAngle(value: number, layout: GuaLayout, startDegree: number = 0): number {
  switch (layout) {
    case 'jingfang': {
      const gua = JING_FANG_64_GUA_BY_VALUE.get(value)
      if (!gua) return 0
      const orderInPalace = gua.jingFangOrder % 8
      const newPalacePos = FEIFU_PALACE_ORDER.indexOf(gua.palace)
      const order = newPalacePos * 8 + orderInPalace
      return (270 + order * JING_FANG_EIGHT_PALACE_STEP + startDegree) % 360
    }
    case 'xiantian': {
      const pos = bitReverse6(value)
      const angle = pos >= 32
        ? 270 + (63 - pos) * GUA_STEP
        : 270 - (32 - pos) * GUA_STEP
      return (angle + startDegree) % 360
    }
    case 'binary':
      return posToAngle(value, startDegree)
    case 'wenwang': {
      const meta = WENWANG_GUA_BY_VALUE[value]
      const pos = meta ? meta.wenwangOrder - 1 : 0
      return posToAngle(pos, startDegree)
    }
    case 'zaguazhuan': {
      const pos = ZAGUAZHUAN_POS_BY_VALUE[value] ?? 0
      return posToAngle(pos, startDegree)
    }
  }
}

// ─── 八纯卦常量 ───

/** 8 个纯卦的 value 集合（伏卦全落在此集合） */
export const PURE_GUA_VALUES: readonly number[] = [63, 27, 45, 9, 54, 18, 36, 0]
