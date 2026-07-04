/**
 * 京房六日七分「爻位」工具
 *
 * ═══════════════════════════════════════════════════════════════
 *  京房卦气体系：60 卦 × 6 爻 = 360 爻位，装载一回归年 365.25 天，
 *  每爻 ≈ 1.0145833 天，起点为冬至日。
 *
 *  历史上 `JingFangGuaRing / NajiaRing / LiuRiQiFenScaleRing` 三处
 *  各抄一份「取冬至日序 → 计算当日爻位索引」的逻辑（作者注释亦承认
 *  "与另两个算法完全一致"），本模块收敛为单一真理源。
 *
 *  Layer 5 纯函数：相同 Date 输入始终产生相同索引。
 * ═══════════════════════════════════════════════════════════════
 */

import { getDayOfYear, getSolarTermPositions } from './chineseCalendar'

/** 回归年长度（固定用于跨年爻位调整，与真实闰年天数无关） */
const TROPICAL_YEAR = 365.25

/**
 * 取指定公历年冬至日的年内日序（1-based）。
 *
 * 若 tyme4ts 出于任何原因（超出支持年份等）找不到冬至，
 * 返回一个稳定的近似值 355，避免上层 NaN。
 */
export function getWinterSolsticeDayOfYear(year: number): number {
  const winterSolstice = getSolarTermPositions(year).find(p => p.name === '冬至')
  return winterSolstice?.dayOfYear ?? 355
}

/**
 * 当日在京房六日七分 360 爻位中的位置（0-359）。
 *
 * 公式：`(当日日序 - 当年冬至日日序) / 365.25 × 360`，
 * 若日差为负则加 365.25 做跨年调整（今年 1-11 月落在去年冬至后的爻位）。
 *
 * @example
 *   getYaoIndexInJingFangYear(new Date('2024-12-22'))  // ≈ 0（冬至当日）
 *   getYaoIndexInJingFangYear(new Date('2024-06-21'))  // ≈ 180（夏至当日）
 */
export function getYaoIndexInJingFangYear(time: Date): number {
  const year = time.getFullYear()
  const currentDayOfYear = getDayOfYear(time)
  const winterSolsticeDay = getWinterSolsticeDayOfYear(year)

  let daysSinceWinterSolstice = currentDayOfYear - winterSolsticeDay
  if (daysSinceWinterSolstice < 0) {
    daysSinceWinterSolstice += TROPICAL_YEAR
  }
  const yaoPosition = (daysSinceWinterSolstice * 360) / TROPICAL_YEAR
  return Math.floor(yaoPosition) % 360
}
