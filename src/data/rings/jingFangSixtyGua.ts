/**
 * 京房卦气 60 卦序（六日七分法）
 *
 * 【体系】
 *   64 卦剔除四正卦（坎、震、离、兑，主二分二至）后剩 60 卦，按京房卦气次序
 *   从冬至起顺时针铺满一回归年：
 *     60 卦 × 6 爻 = 360 爻位；365.25 天 / 360 = 1.0146 天/爻。
 *   出处：《易纬·稽览图》/《汉书·京房传》。
 *
 * 【锚点】
 *   index=0 中孚，其初九爻恰对齐冬至日。
 *   ≈ index=15 解 对齐春分；≈ index=30 咸 对齐夏至；≈ index=45 贲 对齐秋分。
 *
 * 【复用】
 *   value 到六爻数组的映射走 [[sixtyFourGua]] 的 getGuaLines()。
 *   不重复编码六爻二进制。
 */
import { WENWANG_GUA_BY_VALUE, getGuaLines, getInnerGuaName, getOuterGuaName } from '@/data/sixtyFourGua'

/** 京房卦气 60 卦的一卦元信息 */
export interface JingFangGua {
  /** 京房卦气序 0-59（0=中孚，冬至起卦） */
  index: number
  /** 卦名 */
  name: string
  /** 六爻二进制编码 0-63（bit0=初爻,bit5=上爻；阳=1阴=0） */
  value: number
  /** 六爻数组，自下而上，下标 0 = 初爻，true = 阳爻 */
  lines: readonly boolean[]
  /** 内卦（下卦）八经卦名，取自初/二/三爻 */
  innerGua: string
  /** 外卦（上卦）八经卦名，取自四/五/上爻 */
  outerGua: string
}

/**
 * 京房卦气 60 卦标准次序（冬至起）
 * 引用《易纬·稽览图》标准 60 卦序（不含坎/震/离/兑四正卦）。
 */
const JING_FANG_ORDER: readonly string[] = [
  '中孚', '复',   '屯',   '谦',   '睽',   '升',   '临',   '小过', '蒙',   '益',   // 0-9
  '渐',   '泰',   '需',   '随',   '晋',   '解',   '大壮', '豫',   '讼',   '蛊',   // 10-19
  '革',   '夬',   '旅',   '师',   '比',   '小畜', '乾',   '大有', '家人', '井',   // 20-29
  '咸',   '姤',   '鼎',   '丰',   '涣',   '履',   '遁',   '恒',   '节',   '同人', // 30-39
  '损',   '否',   '巽',   '萃',   '大畜', '贲',   '观',   '归妹', '无妄', '明夷', // 40-49
  '困',   '剥',   '艮',   '既济', '噬嗑', '大过', '坤',   '未济', '蹇',   '颐'    // 50-59
]

/** 名字 → value 的反向索引，从 sixtyFourGua 单点事实源派生 */
const NAME_TO_VALUE = new Map<string, number>(
  WENWANG_GUA_BY_VALUE.map(m => [m.name, m.value])
)

/**
 * 京房卦气 60 卦渲染就绪数据
 * 组件直接消费本数组：index / name / value / lines 一步到位，无需再查表。
 */
export const JING_FANG_SIXTY_GUA: readonly JingFangGua[] = JING_FANG_ORDER.map((name, index) => {
  const value = NAME_TO_VALUE.get(name)
  if (value === undefined) {
    throw new Error(`[jingFangSixtyGua] 未找到卦「${name}」的二进制 value —— 数据源不一致`)
  }
  return {
    index,
    name,
    value,
    lines: Object.freeze(getGuaLines(value)),
    innerGua: getInnerGuaName(value),
    outerGua: getOuterGuaName(value)
  }
})

/** 每卦切向宽度：360° / 60 = 6° */
export const JING_FANG_GUA_STEP = 6
