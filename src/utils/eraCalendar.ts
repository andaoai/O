/**
 * 跨全时间域历法工具
 *
 * 解决 tyme4ts 仅支持 year ≥ 4 的限制，覆盖：
 * - 公元前至清朝的朝代查询
 * - 全时间域公历格式化（公元前友好）
 * - 六十甲子纪年：年柱外推循环、日柱天数差法、时柱日干起时，
 *   月柱在 tyme4ts 不支持时标注"历不可考"
 */

import { SolarDay } from 'tyme4ts'
import { findDynasty, formatYearShort } from '@/data/dynasties'
import type { GanzhiInfo } from './chineseCalendar'
import { STEMS as HEAVENLY_STEMS, BRANCHES as EARTHLY_BRANCHES, HOUR_START_STEM } from './constants/ganzhi'

// ── 常量表 ──

const ELEMENT_BY_STEM: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土',
  庚: '金', 辛: '金', 壬: '水', 癸: '水'
}

const ZODIAC_BY_BRANCH: Record<string, string> = {
  子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇',
  午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪'
}

// ── 公历格式化 ──

/**
 * 改进的公历日期时间格式化（公元前友好）
 *
 * @example
 *   formatEraDate(new Date(2024, 5, 25, 12, 30, 15))
 *   // → "公元2024年 06月25日 12:30:15"
 *
 *   formatEraDate(new Date(-220, 6, 15, 0, 0, 0))  // jsYear=-220 = 公元前221年
 *   // → "公元前221年 07月15日 00:00:00"
 */
export function formatEraDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')

  if (y > 0) {
    return `公元${y}年 ${m}月${d}日 ${h}:${min}:${s}`
  }
  if (y === 0) {
    return `公元前1年 ${m}月${d}日 ${h}:${min}:${s}`
  }
  return `公元前${1 - y}年 ${m}月${d}日 ${h}:${min}:${s}`
}

/**
 * 简写版：仅日期
 */
export function formatEraDateShort(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const yearText = y > 0 ? `${y}` : y === 0 ? '前1' : `前${1 - y}`
  return `${yearText}年${m}月${d}日`
}

// ── 朝代查询 ──

export interface DynastyInfo {
  name: string
  /** 起止年文字，如 "前221年—前207年" */
  rangeText: string
  color: string
}

/**
 * 获取某时刻所属的朝代信息
 */
export function getDynastyInfo(date: Date): DynastyInfo | null {
  const y = date.getFullYear()
  const d = findDynasty(y)
  if (!d) return null

  const start = formatYearShort(d.startYear)
  const end = formatYearShort(d.endYear)
  return {
    name: d.name,
    rangeText: `${start}年—${end}年`,
    color: d.color
  }
}

// ── 干支推算 ──

/**
 * 六十甲子索引 → {stem, branch}
 */
function indexToGanZhi(index: number): { stem: string; branch: string; full: string } {
  const stem = HEAVENLY_STEMS[index % 10]!
  const branch = EARTHLY_BRANCHES[index % 12]!
  return { stem, branch, full: stem + branch }
}

/**
 * 年干支（数学循环外推）
 *
 * 锚点：tyme4ts 验证 1984年 = 甲子年（六十甲子索引 0）
 * 公式：delta = jsYear - 1984，index = delta mod 60
 */
function getYearGanZhi(jsYear: number): { stem: string; branch: string; full: string } {
  const delta = jsYear - 1984
  const index = ((delta % 60) + 60) % 60
  return indexToGanZhi(index)
}

/**
 * 日干支（天数差法）
 *
 * 锚点：tyme4ts 验证 2000-01-01 = 戊午日（六十甲子索引 54）
 */
function getDayGanZhi(date: Date): { stem: string; branch: string; full: string } {
  const anchor = new Date()
  anchor.setFullYear(2000, 0, 1)
  anchor.setHours(0, 0, 0, 0)

  const target = new Date(date.getTime())
  target.setHours(0, 0, 0, 0)

  const diffDays = Math.round((target.getTime() - anchor.getTime()) / 86400000)
  const index = ((54 + diffDays) % 60 + 60) % 60
  return indexToGanZhi(index)
}

/**
 * 时干支（日干起时法，任何年份均可算）
 */
function getHourGanZhi(date: Date, dayStem: (typeof HEAVENLY_STEMS)[number]): { stem: string; branch: string; full: string } {
  const hour = date.getHours()
  // 时辰地支：23-1=子(0), 1-3=丑(1), ...
  const branchIdx = Math.floor(((hour + 1) % 24) / 2)
  const branch = EARTHLY_BRANCHES[branchIdx]!

  // 时天干
  const dayStemIdx = HEAVENLY_STEMS.indexOf(dayStem)
  const startStem = HOUR_START_STEM[dayStemIdx] ?? 0
  const stemIdx = (startStem + branchIdx) % 10
  const stem = HEAVENLY_STEMS[stemIdx]!

  return { stem, branch, full: stem + branch }
}

/**
 * 全时间域干支信息
 *
 * 与 GanzhiInfo 结构兼容，增加 isApproximate 标记。
 */
export interface UniversalGanzhiInfo {
  year: {
    stem: string
    branch: string
    full: string
    element: string
    animal: string
  }
  month: {
    stem: string
    branch: string
    full: string
  }
  day: {
    stem: string
    branch: string
    full: string
    element: string
  }
  hour: {
    stem: string
    branch: string
    full: string
  }
  /** 是否有部分字段为外推或不可考 */
  isApproximate: boolean
}

/**
 * 获取全时间域干支（覆盖 tyme4ts 不支持的年份）
 *
 * 策略：
 * - 年干支：数学循环外推，全时间域精确
 * - 日干支：天数差法，全时间域精确
 * - 时干支：基于日天干，全时间域精确
 * - 月干支：tyme4ts 支持(year≥4) 时用 tyme4ts，否则"历不可考"
 */
export function getUniversalGanzhi(date: Date): UniversalGanzhiInfo {
  const jsYear = date.getFullYear()
  const canUseTyme = jsYear >= 4

  // 年干支（tyme4ts 支持范围内用它——自动处理立春分界；否则数学外推）
  let yearGz: { stem: string; branch: string; full: string }
  if (canUseTyme) {
    try {
      const solarDay = SolarDay.fromYmd(jsYear, date.getMonth() + 1, date.getDate())
      const ysc = solarDay.getLunarDay().getYearSixtyCycle()
      yearGz = {
        stem: ysc.getHeavenStem().getName(),
        branch: ysc.getEarthBranch().getName(),
        full: ysc.getName()
      }
    } catch {
      yearGz = getYearGanZhi(jsYear)
    }
  } else {
    yearGz = getYearGanZhi(jsYear)
  }

  // 日干支（天数差法）
  const dayGz = getDayGanZhi(date)

  // 时干支（23:00 起属次日，需用次日日干起时）
  const hourDayStem = (date.getHours() >= 23
    ? getDayGanZhi(new Date(date.getTime() + 86400000))
    : dayGz
  ).stem as (typeof HEAVENLY_STEMS)[number]
  const hourGz = getHourGanZhi(date, hourDayStem)

  // 月干支
  let monthGz: { stem: string; branch: string; full: string }
  if (canUseTyme) {
    try {
      const solarDay = SolarDay.fromYmd(jsYear, date.getMonth() + 1, date.getDate())
      const lunarDay = solarDay.getLunarDay()
      const msc = lunarDay.getMonthSixtyCycle()
      monthGz = {
        stem: msc.getHeavenStem().getName(),
        branch: msc.getEarthBranch().getName(),
        full: msc.getName()
      }
    } catch {
      monthGz = { stem: '', branch: '', full: '历不可考' }
    }
  } else {
    monthGz = { stem: '', branch: '', full: '历不可考' }
  }

  return {
    year: {
      stem: yearGz.stem,
      branch: yearGz.branch,
      full: yearGz.full,
      element: ELEMENT_BY_STEM[yearGz.stem] ?? '木',
      animal: ZODIAC_BY_BRANCH[yearGz.branch] ?? ''
    },
    month: monthGz,
    day: {
      stem: dayGz.stem,
      branch: dayGz.branch,
      full: dayGz.full,
      element: ELEMENT_BY_STEM[dayGz.stem] ?? '木'
    },
    hour: hourGz,
    isApproximate: !canUseTyme
  }
}

// ── 兼容层：保持与旧 GanzhiInfo 接口的转换 ──

/**
 * 将 UniversalGanzhiInfo 转为旧的 GanzhiInfo 结构（用于兼容已有代码）
 */
export function toLegacyGanzhiInfo(ugi: UniversalGanzhiInfo): GanzhiInfo {
  return {
    year: ugi.year,
    month: ugi.month,
    day: ugi.day,
    hour: ugi.hour
  }
}
