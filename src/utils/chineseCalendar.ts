/**
 * Chinese Calendar Utilities using tyme4ts
 *
 * This module provides accurate Chinese lunar calendar calculations,
 * solar terms, and ganzhi (stem-branch) information using the tyme4ts library.
 *
 * Key features:
 * - Accurate lunar calendar with leap months
 * - Precise solar term calculations (astronomical)
 * - Correct ganzhi (year, month, day, hour)
 * - Based on traditional Chinese calendar algorithms
 */

import {
  SolarDay,
  SolarTime,
  LunarDay,
  SolarTerm,
  SixtyCycle,
  HeavenStem,
  EarthBranch
} from 'tyme4ts'

/**
 * 节气信息接口
 */
export interface SolarTermInfo {
  name: string // 节气名称
  index: number // 节气索引 (0-23)
  isStart: boolean // 是否是节气开始
  nextTermName: string // 下一个节气名称
  daysToNext: number // 距离下一个节气的天数
}

/**
 * 干支历信息接口
 */
export interface GanzhiInfo {
  year: {
    // 年干支
    stem: string // 天干
    branch: string // 地支
    full: string // 完整干支
    element: string // 五行
    animal: string // 生肖
  }
  month: {
    // 月干支
    stem: string
    branch: string
    full: string
  }
  day: {
    // 日干支
    stem: string
    branch: string
    full: string
    element: string
  }
  hour: {
    // 时干支
    stem: string
    branch: string
    full: string
  }
}

/**
 * 中国历法信息
 */
export interface ChineseCalendarInfo {
  solarDate: string // 公历日期
  lunarDate: string // 农历日期
  solarTerm?: SolarTermInfo // 节气信息
  ganzhi: GanzhiInfo // 干支信息
}

// 五行映射
const ELEMENTS = ['木', '火', '土', '金', '水']

/**
 * 从天干获取五行属性
 */
function getElementFromStem(stem: string): string {
  const stemIndex = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].indexOf(stem)
  if (stemIndex === -1 || stemIndex >= 10) return '木'
  const elementIndex = Math.floor(stemIndex / 2)
  return ELEMENTS[elementIndex] || '木'
}

/**
 * 获取当前时间的节气信息
 *
 * Uses tyme4ts SolarTerm for precise astronomical calculation.
 * Solar terms vary annually (e.g., 立春 can be Feb 3-5)
 *
 * @param date 日期
 * @returns 节气信息
 */
export function getSolarTermInfo(date: Date): SolarTermInfo | undefined {
  try {
    const solarDay = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())

    // Get current solar term (precise astronomical calculation)
    const currentTerm = solarDay.getTerm()
    const termIndex = currentTerm.getIndex()
    const termName = currentTerm.getName()

    // Get next term
    const nextTerm = currentTerm.next(1)
    if (!nextTerm) {
      return undefined
    }
    const nextTermName = nextTerm.getName()

    // Calculate days to next term
    let daysToNext = 0
    let testDay = solarDay

    // Count days until we reach the next term
    while (testDay.getTerm().getIndex() !== nextTerm.getIndex() && daysToNext < 30) {
      testDay = testDay.next(1)
      daysToNext++
    }

    // Check if today is the start of a term
    const tomorrowTerm = solarDay.next(1).getTerm()
    const isStart = currentTerm.getIndex() !== tomorrowTerm.getIndex()

    return {
      name: termName,
      index: termIndex,
      isStart: isStart,
      nextTermName: nextTermName,
      daysToNext: daysToNext
    }
  } catch (error) {
    console.error('获取节气信息失败:', error)
    return undefined
  }
}

/**
 * 获取当前时间的干支信息
 *
 * Uses tyme4ts SixtyCycle for accurate ganzhi calculations.
 * Month ganzhi is based on solar terms (not calendar months).
 * Hour ganzhi uses traditional 2-hour periods.
 *
 * @param date 日期
 * @returns 干支信息
 */
export function getGanzhiInfo(date: Date): GanzhiInfo {
  try {
    // Create SolarDay from date
    const solarDay = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())

    // Create SolarTime for hour ganzhi
    const solarTime = SolarTime.fromYmdHms(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    )

    // Convert to LunarDay for year/month ganzhi
    const lunarDay = solarDay.getLunarDay()

    // YEAR GANZHI (年干支)
    const yearSixtyCycle = lunarDay.getYearSixtyCycle()
    const yearStem = yearSixtyCycle.getHeavenStem().getName()
    const yearBranch = yearSixtyCycle.getEarthBranch().getName()
    const yearGanzhi = yearSixtyCycle.getName()

    // Get zodiac animal from earthly branch
    const yearBranchObj = EarthBranch.fromName(yearBranch)
    const zodiac = yearBranchObj.getZodiac().getName()

    // MONTH GANZHI (月干支)
    // Note: Month ganzhi changes at 立春, not Jan 1
    const monthSixtyCycle = lunarDay.getMonthSixtyCycle()
    const monthStem = monthSixtyCycle.getHeavenStem().getName()
    const monthBranch = monthSixtyCycle.getEarthBranch().getName()
    const monthGanzhi = monthSixtyCycle.getName()

    // DAY GANZHI (日干支)
    const daySixtyCycle = solarDay.getSixtyCycleDay().getSixtyCycle()
    const dayStem = daySixtyCycle.getHeavenStem().getName()
    const dayBranch = daySixtyCycle.getEarthBranch().getName()
    const dayGanzhi = daySixtyCycle.getName()

    // HOUR GANZHI (时干支)
    // Traditional Chinese hours: 23:00-01:00 = 子时, 01:00-03:00 = 丑时, etc.
    const hourSixtyCycle = solarTime.getSixtyCycleHour().getSixtyCycle()
    const hourStem = hourSixtyCycle.getHeavenStem().getName()
    const hourBranch = hourSixtyCycle.getEarthBranch().getName()
    const hourGanzhi = hourSixtyCycle.getName()

    return {
      year: {
        stem: yearStem,
        branch: yearBranch,
        full: yearGanzhi,
        element: getElementFromStem(yearStem),
        animal: zodiac
      },
      month: {
        stem: monthStem,
        branch: monthBranch,
        full: monthGanzhi
      },
      day: {
        stem: dayStem,
        branch: dayBranch,
        full: dayGanzhi,
        element: getElementFromStem(dayStem)
      },
      hour: {
        stem: hourStem,
        branch: hourBranch,
        full: hourGanzhi
      }
    }
  } catch (error) {
    console.error('获取干支信息失败:', error)
    // Return default values on error
    return {
      year: { stem: '甲', branch: '子', full: '甲子', element: '木', animal: '鼠' },
      month: { stem: '甲', branch: '子', full: '甲子' },
      day: { stem: '甲', branch: '子', full: '甲子', element: '木' },
      hour: { stem: '甲', branch: '子', full: '甲子' }
    }
  }
}

/**
 * 获取完整的中国历法信息
 *
 * Main entry point that combines all calendar information.
 *
 * @param date 日期
 * @returns 中国历法信息
 */
export function getChineseCalendarInfo(date: Date): ChineseCalendarInfo {
  try {
    // Format solar date
    const solarDate = date.toLocaleDateString('zh-CN')

    // Get accurate lunar date using tyme4ts
    const lunarDate = getLunarDate(date)

    // Get solar term info (precise astronomical calculation)
    const solarTerm = getSolarTermInfo(date)

    // Get ganzhi info (traditional algorithms)
    const ganzhi = getGanzhiInfo(date)

    return {
      solarDate,
      lunarDate,
      solarTerm,
      ganzhi
    }
  } catch (error) {
    console.error('获取中国历法信息失败:', error)
    return {
      solarDate: date.toLocaleDateString('zh-CN'),
      lunarDate: '农历信息获取失败',
      ganzhi: getGanzhiInfo(date)
    }
  }
}

/**
 * 农历日期计算（使用 tyme4ts）
 *
 * Converts solar (Gregorian) date to lunar date.
 * Automatically handles:
 * - Leap months (闰月) - e.g., "闰四月"
 * - Month lengths (29 or 30 days)
 * - Traditional month names (正月, 二月, ..., 腊月)
 * - Traditional day names (初一, 初二, ..., 三十)
 *
 * @param date 公历日期
 * @returns 农历日期字符串 (e.g., "农历正月初一", "农历闰四月十五")
 */
function getLunarDate(date: Date): string {
  try {
    // Create SolarDay from Date object
    const solarDay = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())

    // Convert to LunarDay (handles leap months automatically)
    const lunarDay = solarDay.getLunarDay()

    // Return formatted string
    // Examples:
    // - "农历正月初一" (Lunar New Year)
    // - "农历闰四月十五" (leap month)
    // - "农历腊月三十" (New Year's Eve)
    return lunarDay.toString()
  } catch (error) {
    console.error('计算农历日期失败:', error)
    return '农历日期计算失败'
  }
}

/**
 * 获取节气的简单描述
 *
 * @param term 节气信息
 * @returns 节气描述
 */
export function getSolarTermDescription(term: SolarTermInfo): string {
  if (term.isStart) {
    return `今日${term.name}`
  } else {
    return `距离${term.nextTermName}还有${term.daysToNext}天`
  }
}
