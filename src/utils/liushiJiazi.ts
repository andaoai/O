/**
 * 六十甲子六柱（年/月/日/时/分/秒）计算
 *
 * 把「某个时间点 → 六柱各自落在六十甲子的哪一格」这一计算从视图层抽离，
 * 便于复用与单元测试。视图层只消费 JiaziIndices / 干支名，不关心算法。
 *
 * 【年月日时】四柱：完全交给 tyme4ts，严格遵循传统节气历法
 *   - 年柱以立春分界；月柱以节气（建寅起）分界；
 *   - 日柱为连续干支链；时柱子时从 23:00 起算，时干由五鼠遁推定。
 *
 * 【分柱 / 秒柱】六十甲子恰好 60 格，而钟表一分钟 60 秒、一小时 60 分钟，
 *   天然一一对应：秒数(0-59) 即秒柱甲子序号，分钟数(0-59) 即分柱甲子序号。
 *   于是秒柱每 1 秒前进一格、60 秒走完整圈；分柱每 1 分钟前进一格、60 分钟一圈。
 */
import { SolarTime } from 'tyme4ts'

/** 十天干 */
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
/** 十二地支 */
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

/** 六柱标识（由外到内的渲染顺序） */
export type PillarId = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'

/** 六柱各自的六十甲子序号（0-59） */
export type JiaziIndices = Record<PillarId, number>

/**
 * 计算某时间点六柱各自的六十甲子序号（0-59，与圆环 items 顺序一致）
 */
export function getJiaziIndices(date: Date): JiaziIndices {
  const st = SolarTime.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  )
  const lunarHour = st.getLunarHour()
  const lunarDay = lunarHour.getLunarDay()
  const lunarMonth = lunarDay.getLunarMonth()
  const lunarYear = lunarMonth.getLunarYear()

  return {
    // 四柱：直接取 tyme4ts 的 60 甲子序号
    year: lunarYear.getSixtyCycle().getIndex(),
    month: lunarMonth.getSixtyCycle().getIndex(),
    day: lunarDay.getSixtyCycle().getIndex(),
    hour: lunarHour.getSixtyCycle().getIndex(),
    // 分柱：当前分钟数(0-59) 直接映射六十甲子，每分钟前进一格
    minute: date.getMinutes(),
    // 秒柱：当前秒数(0-59) 直接映射六十甲子，每秒前进一格
    second: date.getSeconds()
  }
}

/** 由六十甲子序号(0-59) 得干支名，如 0 → 甲子 */
export function ganzhiName(index: number): string {
  return STEMS[index % 10]! + BRANCHES[index % 12]!
}
