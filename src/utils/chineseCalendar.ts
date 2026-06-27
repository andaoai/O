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
  LunarYear,
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

/**
 * 节气 / 候的「立春起序号」结果
 */
export interface TermHouInfo {
  /** 当前节气：立春起序号(0-23，立春=0) */
  termIndex: number
  /** 当前节气名 */
  termName: string
  /** 节气内第几候(0 初候 / 1 次候 / 2 末候) */
  houInTerm: number
  /** 当前候：立春起序号(0-71，立春初候=0) */
  houIndex: number
  /** 当前候名 */
  houName: string
}

// tyme4ts 节气索引以冬至=0 起算，立春在 tyme4ts 中为 3；
// 本项目环数据以立春=0 起序，故需平移 3 位。
const LICHUN_TYME_INDEX = 3

/**
 * 获取当前节气与候的「立春起序号」，用于与节气环/候环对齐高亮。
 *
 * - 节气：tyme4ts(冬至=0) → 立春起序号 = (tymeIdx - 3 + 24) % 24
 * - 候：每节气均分三候，约 5 天一候；候序 = termIndex*3 + floor(进入节气天数/5)
 *
 * @param houNames 七十二候名数组（立春起，长度 72），用于回填候名
 */
export function getTermHouInfo(date: Date, houNames: string[]): TermHouInfo {
  const solarDay = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const term = solarDay.getTerm()
  const termIndex = (term.getIndex() - LICHUN_TYME_INDEX + 24) % 24
  // getTermDay().getDayIndex()：进入当前节气后的第几天(0 起)
  const dayInTerm = solarDay.getTermDay().getDayIndex()
  const houInTerm = Math.min(2, Math.floor(dayInTerm / 5)) // 防节气偏长溢出
  const houIndex = termIndex * 3 + houInTerm
  return {
    termIndex,
    termName: term.getName(),
    houInTerm,
    houIndex,
    houName: houNames[houIndex] ?? ''
  }
}

/* ═══════════════════════════════════════════════════════════════
 * 农历月份遍历工具（用于回归年×农历闰月可视化）
 * ═══════════════════════════════════════════════════════════════ */

/**
 * 农历月份信息
 */
export interface LunarMonthInfo {
  /** 在年内 LunarYear.getMonths() 数组中的索引 */
  index: number
  /** 农历月名："正月""二月"…"闰六月" */
  name: string
  /** 是否闰月 */
  isLeap: boolean
  /** 该月天数（29 或 30） */
  dayCount: number
  /** 该月首日对应的公历日序数（1-365/366） */
  startDayOfYear: number
  /** 该月末日对应的公历日序数（1-365/366） */
  endDayOfYear: number
  /** 该月首日对应的公历年份 */
  startYear: number
  /** 该月末日对应的公历年份 */
  endYear: number
  /** 是否有中气（偶数索引节气） */
  hasMidTerm: boolean
  /** 该月内开始的节气名列表 */
  termsInMonth: string[]
  /** 该农历年的干支名称，如"丙午年" */
  lunarYearName: string
  /** tyme4ts LunarYear 的年份序号，用于跨环比对 */
  lunarYearNumber: number
}

/**
 * 判断公历闰年
 */
export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

/**
 * 计算日期在该年的序数（1-based）
 *
 * @param date 日期
 * @returns 日序数（1-366）
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

/**
 * 从序数回推日期
 *
 * @param year 年份
 * @param dayOfYear 日序数（1-366）
 */
export function dateFromDayOfYear(year: number, dayOfYear: number): Date {
  const start = new Date(year, 0, 1)
  start.setDate(start.getDate() + dayOfYear - 1)
  return start
}

/**
 * 节气名列表（tyme4ts 索引序：冬至=0）
 */
const SOLAR_TERM_NAMES = [
  '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
  '春分', '清明', '谷雨', '立夏', '小满', '芒种',
  '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'
]

/**
 * 检查节气索引是否为中气
 *
 * tyme4ts 索引约定：冬至=0
 * 偶数索引（0,2,4,6,8,10,12,14,16,18,20,22）为中气
 * 奇数索引（1,3,5,7,9,11,13,15,17,19,21,23）为节
 */
export function isMidTerm(termIndex: number): boolean {
  return termIndex % 2 === 0
}

/**
 * 获取指定年份所有农历月份（含闰月信息）
 *
 * 核心依赖 tyme4ts 的 LunarYear.getMonths()，
 * 自动处理平年12月/闰年13月，以及跨公历年的农历月。
 *
 * @param year 公历年份（用于查找该年大部分时间所在的农历年）
 * @returns 农历月份信息数组，按从正月开始的顺序排列
 */
export function getLunarMonthsOfYear(year: number): LunarMonthInfo[] {
  const daysInSolarYear = isGregorianLeapYear(year) ? 366 : 365

  // 逐日扫描整年，按农历月分组
  // 使用 Map<monthKey, { name, isLeap, days[] }>
  const monthMap = new Map<string, {
    name: string
    isLeap: boolean
    daySet: Set<number>
  }>()

  for (let day = 1; day <= daysInSolarYear; day++) {
    const date = dateFromDayOfYear(year, day)
    const solarDay = SolarDay.fromYmd(year, date.getMonth() + 1, date.getDate())
    const lunarDay = solarDay.getLunarDay()
    const lunarMonth = lunarDay.getLunarMonth()

    const lyKey = lunarMonth.getLunarYear().getYear()
    const key = lunarMonth.isLeap()
      ? `L${lunarMonth.getMonth()}-Y${lyKey}`
      : `M${lunarMonth.getMonth()}-Y${lyKey}`

    if (!monthMap.has(key)) {
      monthMap.set(key, {
        name: lunarMonth.getName(),
        isLeap: lunarMonth.isLeap(),
        daySet: new Set()
      })
    }
    monthMap.get(key)!.daySet.add(day)
  }

  // 按公历日期排序，将 daySet 合并为连续的 day 区间
  const entries = Array.from(monthMap.entries())
  // 按 daySet 的最小值排序
  entries.sort((a, b) => Math.min(...a[1].daySet) - Math.min(...b[1].daySet))

  const result: LunarMonthInfo[] = []

  for (const [_key, entry] of entries) {
    const sortedDays = Array.from(entry.daySet).sort((a, b) => a - b)

    // 合并连续的天数区间
    const ranges: { start: number; end: number }[] = []
    const firstDay = sortedDays[0]!
    let rangeStart = firstDay
    let prev = firstDay

    for (let i = 1; i < sortedDays.length; i++) {
      if (sortedDays[i]! !== prev + 1) {
        ranges.push({ start: rangeStart, end: prev })
        rangeStart = sortedDays[i]!
      }
      prev = sortedDays[i]!
    }
    ranges.push({ start: rangeStart, end: prev })

    // 保留所有连续区间，每段独立计算 lunarYear / index / 中气
    for (const range of ranges) {
      // 从该区间首日获取农历月/年元数据
      const rangeStartDate = dateFromDayOfYear(year, range.start)
      const rangeSolarDay = SolarDay.fromYmd(
        year, rangeStartDate.getMonth() + 1, rangeStartDate.getDate()
      )
      const rangeLunarMonth = rangeSolarDay.getLunarDay().getLunarMonth()
      const rangeLunarYear = rangeLunarMonth.getLunarYear()

      // 检测中气
      let hasMidTerm = false
      const termsInMonth: string[] = []
      const checkedDates = new Set<string>()
      const daySpan = range.end - range.start + 1

      for (let d = 0; d < daySpan + 2; d++) {
        const sd = rangeSolarDay.next(d)
        const dateKey = sd.getYear() + '-' + sd.getMonth() + '-' + sd.getDay()
        if (checkedDates.has(dateKey)) continue
        checkedDates.add(dateKey)

        const term = sd.getTerm()
        const nextSd = sd.next(1)
        const nextTerm = nextSd.getTerm()

        if (term.getIndex() !== nextTerm.getIndex()) {
          const termName = term.getName()
          if (!termsInMonth.includes(termName)) {
            termsInMonth.push(termName)
          }
          if (isMidTerm(term.getIndex())) {
            hasMidTerm = true
          }
        }
      }

      result.push({
        index: rangeLunarMonth.getIndexInYear(),
        name: entry.name,
        isLeap: entry.isLeap,
        dayCount: daySpan,
        startDayOfYear: range.start,
        endDayOfYear: range.end,
        startYear: year,
        endYear: year,
        hasMidTerm,
        termsInMonth,
        lunarYearName: rangeLunarYear.getName(),
        lunarYearNumber: rangeLunarYear.getYear()
      })
    }
  }

  return result
}

/**
 * 🌕 获取完整农历年的所有月份（基于 LunarYear API）
 *
 * 与 getLunarMonthsOfYear（逐日扫描公历年）不同：
 * - 本函数使用 tyme4ts 的 LunarYear API，返回完整的 12/13 个月
 * - 每个月都是完整的（29 或 30 天），无截断
 * - 从正月初一开始连续排列，startDayOfYear 可能 > 365（跨年溢出）
 * - 适用于需要完整农历月可视化的场景
 *
 * @param solarYear 公历年份，用于定位该年内开始的农历年
 * @returns 完整农历年所有月份，按正月→腊月顺序
 */
export function getCompleteLunarYearMonths(solarYear: number): LunarMonthInfo[] {
  // 1. 在公历年份内找到正月初一（农历年第一天）
  let firstMonthDayOfYear = -1

  for (let day = 1; day <= 62; day++) {
    const date = dateFromDayOfYear(solarYear, day)
    const sd = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
    const ld = sd.getLunarDay()
    const lm = ld.getLunarMonth()

    if (lm.getMonth() === 1 && !lm.isLeap() && ld.getDay() === 1) {
      firstMonthDayOfYear = day
      break
    }
  }

  if (firstMonthDayOfYear < 0) {
    return []
  }

  // 2. 获取完整的农历年
  const springDate = dateFromDayOfYear(solarYear, firstMonthDayOfYear)
  const springSolarDay = SolarDay.fromYmd(
    springDate.getFullYear(), springDate.getMonth() + 1, springDate.getDate()
  )
  const lunarYear = springSolarDay.getLunarDay().getLunarMonth().getLunarYear()
  const lunarYearName = lunarYear.getName()
  const lunarYearNumber = lunarYear.getYear()
  const months = lunarYear.getMonths()

  // 3. 按顺序计算每个月的公历日序位置
  const result: LunarMonthInfo[] = []
  let cursorDay = firstMonthDayOfYear  // 当前月首日在公历年的日序
  // 处理跨年：cursorDay 可能超过当年天数
  // 使用一个虚拟"日序号轴"，以 solarYear 年 1 月 1 日为 1，持续延伸到次年

  // 计算当年总天数
  const daysInSolarYear = isGregorianLeapYear(solarYear) ? 366 : 365

  for (let i = 0; i < months.length; i++) {
    const month = months[i]!
    const dayCount = month.getDayCount()
    const startDay = cursorDay
    const endDay = cursorDay + dayCount - 1

    // 确定首尾所在的公历年
    const startYear = startDay <= daysInSolarYear ? solarYear : solarYear + 1
    const endYear = endDay <= daysInSolarYear ? solarYear : solarYear + 1

    // 中气检测：遍历该月所有公历日
    let hasMidTerm = false
    const termsInMonth: string[] = []
    const checkedDates = new Set<string>()

    for (let d = 0; d < dayCount + 2; d++) {
      // 将虚拟日序号映射回实际日期
      let actualYear: number
      let actualDay: number
      if (startDay + d <= daysInSolarYear) {
        actualYear = solarYear
        actualDay = startDay + d
      } else {
        actualYear = solarYear + 1
        actualDay = startDay + d - daysInSolarYear
      }
      // 如果超出次年范围则跳过
      const nextDays = isGregorianLeapYear(actualYear) ? 366 : 365
      if (actualDay > nextDays) break

      const date = dateFromDayOfYear(actualYear, actualDay)
      const sd = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
      const key = sd.getYear() + '-' + sd.getMonth() + '-' + sd.getDay()
      if (checkedDates.has(key)) continue
      checkedDates.add(key)

      const term = sd.getTerm()
      const nextSd = sd.next(1)
      const nextTerm = nextSd.getTerm()
      if (term.getIndex() !== nextTerm.getIndex()) {
        const termName = term.getName()
        if (!termsInMonth.includes(termName)) {
          termsInMonth.push(termName)
        }
        if (isMidTerm(term.getIndex())) {
          hasMidTerm = true
        }
      }
    }

    result.push({
      index: i,
      name: month.getName(),
      isLeap: month.isLeap(),
      dayCount,
      startDayOfYear: startDay,
      endDayOfYear: endDay,
      startYear,
      endYear,
      hasMidTerm,
      termsInMonth,
      lunarYearName,
      lunarYearNumber
    })

    cursorDay = endDay + 1
  }

  return result
}

/**
 * 获取指定日期所属的农历月/年定位信息
 *
 * 核心用途：无论日期在正月前还是正月后，
 * 都能正确识别所属农历年和月在 LunarYear.getMonths() 中的序号。
 *
 * 使用 tyme4ts 的 LunarMonth / LunarYear API 直接获取，
 * 无需扫描或比对，天然处理跨年归属问题。
 *
 * @param date 公历日期
 * @returns 当前农历月/年定位信息
 */
export function getCurrentLunarInfo(date: Date): {
  monthIndex: number
  lunarYearNumber: number
  lunarYearName: string
  isLeap: boolean
} {
  const sd = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const ld = sd.getLunarDay()
  const lm = ld.getLunarMonth()
  const ly = lm.getLunarYear()

  return {
    monthIndex: lm.getIndexInYear(),
    lunarYearNumber: ly.getYear(),
    lunarYearName: ly.getName(),
    isLeap: lm.isLeap()
  }
}

/**
 * 获取60甲子序列名称
 *
 * @param index 0-59 的索引
 * @returns 甲子名称
 */
export function getJiaziName(index: number): string {
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const i = ((index % 60) + 60) % 60
  return stems[i % 10]! + branches[i % 12]!
}
