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
export type JiaziIndices = Record<PillarId, number> & { isApproximate?: boolean }

// ── fallback 外推工具（tyme4ts 不支持年份用）──

/** 年干支数学外推（锚点：1984年 = 甲子，索引 0） */
function fallbackYearIndex(jsYear: number): number {
  const delta = jsYear - 1984
  return ((delta % 60) + 60) % 60
}

/** 日干支天数差法（锚点：2000-01-01 = 戊午，索引 54） */
function fallbackDayIndex(date: Date): number {
  const anchor = new Date(2000, 0, 1, 0, 0, 0, 0)
  const target = new Date(date.getTime())
  target.setHours(0, 0, 0, 0)
  target.setMilliseconds(0)
  const diffDays = Math.round((target.getTime() - anchor.getTime()) / 86400000)
  return ((54 + diffDays) % 60 + 60) % 60
}

/** 日干 → 子时时干起始（甲己起甲、乙庚起丙、丙辛起戊、丁壬起庚、戊癸起壬） */
const HOUR_START_STEM = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]

/** 时干支：23:00 起属次日，按次日日干起时 */
function fallbackHourIndex(date: Date, dayIdx: number): number {
  const hour = date.getHours()
  const branchIdx = Math.floor(((hour + 1) % 24) / 2)
  const dayStemIdx = dayIdx % 10
  const startStem = HOUR_START_STEM[dayStemIdx] ?? 0
  const stemIdx = (startStem + branchIdx) % 10
  // 找唯一 n ∈ [0,59] 满足 n%10=stemIdx 且 n%12=branchIdx
  for (let n = 0; n < 60; n++) {
    if (n % 10 === stemIdx && n % 12 === branchIdx) return n
  }
  return 0
}

/**
 * 计算某时间点六柱各自的六十甲子序号（0-59，与圆环 items 顺序一致）
 *
 * tyme4ts 仅支持 year ≥ 1（部分功能需 year ≥ 4）。
 * 不支持的公历年份自动降级为数学外推：年/日/时柱用天文算法，
 * 月柱因无节气数据不可考，返回 0 并标记 isApproximate。
 */
export function getJiaziIndices(date: Date): JiaziIndices {
  try {
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
      year: lunarYear.getSixtyCycle().getIndex(),
      month: lunarMonth.getSixtyCycle().getIndex(),
      day: lunarDay.getSixtyCycle().getIndex(),
      hour: lunarHour.getSixtyCycle().getIndex(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      isApproximate: false
    }
  } catch {
    // tyme4ts 不支持：年/日/时柱数学外推，月柱不可考
    const jsYear = date.getFullYear()
    const dayIdx = fallbackDayIndex(date)
    const hourDayIdx = date.getHours() >= 23
      ? fallbackDayIndex(new Date(date.getTime() + 86400000))
      : dayIdx
    return {
      year: fallbackYearIndex(jsYear),
      month: 0,
      day: dayIdx,
      hour: fallbackHourIndex(date, hourDayIdx),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      isApproximate: true
    }
  }
}

/** 由六十甲子序号(0-59) 得干支名，如 0 → 甲子 */
export function ganzhiName(index: number): string {
  return STEMS[index % 10]! + BRANCHES[index % 12]!
}

/** 由六十甲子序号(0-59) 取地支序号（0-11，子=0）。日柱、时柱通用。 */
export function branchOf(jiaziIndex: number): number {
  return jiaziIndex % 12
}

/**
 * 由时柱六十甲子序号取十二时辰序号（0-11，子=0）。
 * 时辰只看地支，故为甲子序号对 12 取模；一天循环一圈 12 格。
 */
export function shichenIndex(hourJiaziIndex: number): number {
  return branchOf(hourJiaziIndex)
}

/** 由时辰序号(0-11) 得时辰名，如 0 → 子时 */
export function shichenName(index: number): string {
  return BRANCHES[index]! + '时'
}

/** 十二地支位的天干分布 + 两空亡位（旬空）。日柱、时柱通用。 */
export interface XunInfo {
  /** 下标=地支序号(子=0)，值=天干序号(0-9) 或 null(空亡) */
  stems: (number | null)[]
  /** 两空亡地支序号，按旬序 [空, 亡] */
  kongwang: [number, number]
}

/**
 * 由某柱六十甲子序号，推十二地支位各自的天干与旬空（旬空通用算法）。
 *
 * 该柱落在某旬（甲X 起的 10 个连号），把十天干依次贴到 10 个地支上：
 *   旬首甲所在地支起，甲乙丙…癸顺贴 10 位；剩下 2 位无干 = 空亡（旬空）。
 * 十干配十二支必空两位，故每旬空亡两支，随柱序推进而移位。
 *
 * 性质：当前柱(地支 = 序号%12)那一格的天干恰为该柱天干(序号%10)。
 * 时柱传入即得时干/时空亡；日柱传入即得日干/日空亡——同一算法。
 */
export function xunInfo(jiaziIndex: number): XunInfo {
  const xunHead = Math.floor(jiaziIndex / 10) * 10 // 旬首甲X 的六十甲子序号
  const headBranch = xunHead % 12 // 旬首(甲)所在地支
  const stems: (number | null)[] = new Array(12).fill(null)
  for (let k = 0; k < 10; k++) {
    stems[(headBranch + k) % 12] = k
  }
  return {
    stems,
    kongwang: [(headBranch + 10) % 12, (headBranch + 11) % 12]
  }
}
