/**
 * 奇门遁甲阴阳遁九局 —— 纯函数工具层（Layer 5）
 *
 * ═══════════════════════════════════════════════════════════════
 *  茅山道人排局规则（阴阳遁 + 三元 + 超神接气）：
 *   - 冬至→夏至前 12 节气 = 阳遁（局数顺行 1→9）
 *   - 夏至→冬至前 12 节气 = 阴遁（局数逆行 9→1）
 *   - 每节气三元：上元→中元→下元，各 5 天（60 时辰）
 *   - 符头 = 甲/己日；符头正对节气首日 → 正授
 *   - 符头早于节气首日 (0-8 天) → 超神；晚于 → 接气
 *   - 累积超神 ≥ 9 天 → 该芒种/大雪后置「闰奇门」15° 段
 *
 *  一年 360 天（60 甲子 × 6 元 × 5 天/元 × 3 元/节气 × 24 节气）
 *  与回归年 365.2422 天差 5.24 天/年，即「奇门置闰」的天文根源。
 *
 *  角度基准：**冬至 = 0°**（与京房卦气盘 LiuRiQiFenScaleRing 同步）
 *
 *  与 chineseCalendar.ts 差异：本模块用「冬至起序」（tyme4ts 原生），
 *  而 chineseCalendar 用「立春起序」（相差索引 3）。
 * ═══════════════════════════════════════════════════════════════
 */

import { SolarDay } from 'tyme4ts'
import { getSolarTermPositions, getDayOfYear, isGregorianLeapYear } from './chineseCalendar'
import { getJiaziIndices, ganzhiName } from './liushiJiazi'

// ══════════════════════════════════════════════════════════════
//  常量
// ══════════════════════════════════════════════════════════════

/** 24 节气，冬至=0 起序（tyme4ts 原生顺序） */
export const SOLAR_TERMS_FROM_DONGZHI: readonly string[] = [
  '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
  '春分', '清明', '谷雨', '立夏', '小满', '芒种',
  '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'
] as const

/** 阳遁 12 节气三元局数 [上元, 中元, 下元] */
export const YANG_DUN_MAP: Record<string, readonly [number, number, number]> = {
  冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6],
  立春: [8, 5, 2], 雨水: [9, 6, 3], 惊蛰: [1, 7, 4],
  春分: [3, 9, 6], 清明: [4, 1, 7], 谷雨: [5, 2, 8],
  立夏: [4, 1, 7], 小满: [5, 2, 8], 芒种: [6, 3, 9]
}

/** 阴遁 12 节气三元局数 [上元, 中元, 下元] */
export const YIN_DUN_MAP: Record<string, readonly [number, number, number]> = {
  夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4],
  立秋: [2, 5, 8], 处暑: [1, 4, 7], 白露: [9, 3, 6],
  秋分: [7, 1, 4], 寒露: [6, 9, 3], 霜降: [5, 8, 2],
  立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1]
}

/** 九星紫白配色（1白/2黑/3碧/4绿/5黄/6白/7赤/8白/9紫） */
export const JIU_XING_COLORS: Record<number, string> = {
  1: '#F5F5F5', 2: '#2C3E50', 3: '#16A085',
  4: '#27AE60', 5: '#F1C40F', 6: '#ECF0F1',
  7: '#C0392B', 8: '#FFFFFF', 9: '#8E44AD'
}

/** 九星名 */
export const JIU_XING_NAMES: readonly string[] = [
  '', '一白', '二黑', '三碧', '四绿', '五黄', '六白', '七赤', '八白', '九紫'
] as const

/** 局数汉字（一~九） */
export const JU_HANZI: readonly string[] = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const

/** 后天八卦方位（冬至=坎北=0° 起，顺时针） */
export const HOU_TIAN_BAGUA: readonly { name: string; symbol: string; startAngle: number }[] = [
  { name: '坎', symbol: '☵', startAngle: 0 },     // 北，冬 → 冬至/小寒/大寒
  { name: '艮', symbol: '☶', startAngle: 45 },    // 东北，冬春过渡 → 立春/雨水/惊蛰
  { name: '震', symbol: '☳', startAngle: 90 },    // 东，春 → 春分/清明/谷雨
  { name: '巽', symbol: '☴', startAngle: 135 },   // 东南 → 立夏/小满/芒种
  { name: '离', symbol: '☲', startAngle: 180 },   // 南，夏 → 夏至/小暑/大暑
  { name: '坤', symbol: '☷', startAngle: 225 },   // 西南 → 立秋/处暑/白露
  { name: '兑', symbol: '☱', startAngle: 270 },   // 西，秋 → 秋分/寒露/霜降
  { name: '乾', symbol: '☰', startAngle: 315 }    // 西北 → 立冬/小雪/大雪
] as const

/** 四象（冬=坎/艮，春=震/巽，夏=离/坤，秋=兑/乾） */
export const FOUR_SYMBOLS: readonly { name: string; label: string; color: string; startAngle: number }[] = [
  { name: 'winter', label: '冬', color: '#3498DB', startAngle: 0 },
  { name: 'spring', label: '春', color: '#2ECC71', startAngle: 90 },
  { name: 'summer', label: '夏', color: '#E74C3C', startAngle: 180 },
  { name: 'autumn', label: '秋', color: '#F1C40F', startAngle: 270 }
] as const

/** 阴阳两遁 */
export const YIN_YANG_DUN: readonly { name: string; label: string; color: string; startAngle: number }[] = [
  { name: 'yang', label: '阳遁', color: '#E74C3C', startAngle: 0 },   // 冬至→夏至前 0-180°
  { name: 'yin', label: '阴遁', color: '#3498DB', startAngle: 180 }   // 夏至→冬至前 180-360°
] as const

// ══════════════════════════════════════════════════════════════
//  节气 / 遁 / 局 派生函数
// ══════════════════════════════════════════════════════════════

/**
 * 当前节气索引（冬至=0 起序）。tyme4ts 原生返回冬至=0。
 * 失败兜底：按 dayOfYear 粗估（每 15.22 天一个节气）。
 */
export function getSolarTermIndex(date: Date): number {
  try {
    const sd = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
    return sd.getTerm().getIndex()
  } catch {
    // fallback: 冬至约在 12/22，dayOfYear≈356；用相对冬至的偏移粗估
    const doy = getDayOfYear(date)
    const yearLen = isGregorianLeapYear(date.getFullYear()) ? 366 : 365
    const winterDoy = 356
    const offset = ((doy - winterDoy) % yearLen + yearLen) % yearLen
    return Math.floor(offset / (yearLen / 24)) % 24
  }
}

/** 当前节气名 */
export function getSolarTermName(date: Date): string {
  return SOLAR_TERMS_FROM_DONGZHI[getSolarTermIndex(date)] ?? '冬至'
}

/** 是否阳遁（冬至→芒种，即 termIndex 0-11） */
export function isYangDun(termIndex: number): boolean {
  return termIndex >= 0 && termIndex < 12
}

/** 阴阳遁标签 */
export function getYinYangDunLabel(date: Date): '阳遁' | '阴遁' {
  return isYangDun(getSolarTermIndex(date)) ? '阳遁' : '阴遁'
}

/** 四象索引（0=冬 1=春 2=夏 3=秋，与 FOUR_SYMBOLS 一致） */
export function getFourSymbolIndex(termIndex: number): number {
  // termIndex 0-5 = 冬(坎艮), 6-11 = 春夏交 → 需按 90° 划：
  //   冬(坎/艮)  = 0-5   → 0
  //   春(震/巽)  = 6-11  → 1
  //   夏(离/坤)  = 12-17 → 2
  //   秋(兑/乾)  = 18-23 → 3
  return Math.floor(termIndex / 6)
}

/** 八卦索引（0-7，与 HOU_TIAN_BAGUA 一致） */
export function getBaguaIndex(termIndex: number): number {
  return Math.floor(termIndex / 3)
}

// ══════════════════════════════════════════════════════════════
//  三元 / 局数 / 超神接气
// ══════════════════════════════════════════════════════════════

/** 从某天前后向前搜索最近的甲/己日（日干支索引 %10 === 0 或 5），返回搜到的 SolarDay */
function findNearestSymbolDayBefore(date: Date): Date {
  // 甲/己日的日干序号：甲=0, 己=5
  for (let offset = 0; offset < 15; offset++) {
    const d = new Date(date.getTime() - offset * 86400000)
    const dayIdx = getJiaziIndices(d).day
    if (dayIdx % 10 === 0 || dayIdx % 10 === 5) return d
  }
  return date  // 兜底：15 天内必命中，理论不会到这
}

/** 在 [center-30, center+30] 天内找最近的甲子日（干支索引=0） */
function findNearestJiaziDay(center: Date): Date {
  let best = center
  let minAbs = Infinity
  for (let offset = -30; offset <= 30; offset++) {
    const d = new Date(center.getTime() + offset * 86400000)
    if (getJiaziIndices(d).day === 0) {
      const abs = Math.abs(offset)
      if (abs < minAbs) {
        minAbs = abs
        best = d
      }
    }
  }
  return best
}

/**
 * 上元甲子日：冬至前后最近的甲子日，且 today 落在该日起 [0, 360) 天内。
 * 与 QiMenLiuJiaziRing 的环起点是同一个日期，保证「元」严格对齐甲子日。
 */
export function getUpperYuanJiaziDay(today: Date): Date {
  const year = today.getFullYear()
  for (const y of [year, year - 1]) {
    const positions = getSolarTermPositions(y)
    const winter = positions.find(p => p.name === '冬至')
    if (!winter) continue
    const winterDate = new Date(y, 0, 1)
    winterDate.setDate(winter.dayOfYear)
    const upperYuan = findNearestJiaziDay(winterDate)
    const daysSince = Math.floor((today.getTime() - upperYuan.getTime()) / 86400000)
    if (daysSince >= 0 && daysSince < 360) return upperYuan
  }
  return findNearestJiaziDay(today)
}

/** 计算两 Date 之间的整数天数差（正数=b 晚于 a） */
function daysBetween(a: Date, b: Date): number {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return Math.round((b0 - a0) / 86400000)
}

/** 从上元甲子日起的天数（0-359） */
export function getDaysSinceUpperYuan(today: Date): number {
  const upperYuan = getUpperYuanJiaziDay(today)
  const d = daysBetween(upperYuan, today)
  return Math.max(0, Math.min(359, d))
}

/** 当前元序号（0-71）：从上元甲子日起每 5 天为一元 */
export function getElementIndex(today: Date): number {
  return Math.floor(getDaysSinceUpperYuan(today) / 5)
}

/**
 * 阴阳遁 24 节气 × 3 元的局数总表（72 元，按元序循环）
 * 起点：冬至上元 → 冬至中元 → 冬至下元 → 小寒上元 → ... → 芒种下元 → 夏至上元 → ... → 大雪下元
 * 每元 5 天，与 Ring 1 甲子日环的 5 格严格对齐。
 */
export const BUREAU_BY_ELEMENT: readonly number[] = (() => {
  const arr: number[] = []
  for (let t = 0; t < 24; t++) {
    const termName = SOLAR_TERMS_FROM_DONGZHI[t]!
    const map = isYangDun(t) ? YANG_DUN_MAP : YIN_DUN_MAP
    const triple = map[termName]
    if (triple) {
      arr.push(triple[0], triple[1], triple[2])
    } else {
      arr.push(1, 1, 1)
    }
  }
  return arr
})()

/** 元索引 → 局数（1-9） */
export function getBureauFromElement(elementIdx: number): number {
  return BUREAU_BY_ELEMENT[elementIdx % 72] ?? 1
}

/** 元索引 → 所属节气索引（冬至=0） */
export function getTermIndexFromElement(elementIdx: number): number {
  return Math.floor((elementIdx % 72) / 3)
}

/** 元索引 → 三元位置（0=上 1=中 2=下） */
export function getYuanFromElement(elementIdx: number): 0 | 1 | 2 {
  return ((elementIdx % 72) % 3) as 0 | 1 | 2
}

/**
 * 24 节气在「上元甲子日 = 0°」坐标系下的角度位置。
 *
 * 每个节气交节日 → 距上元甲子日的天数 → 对应角度（1° = 1 天）
 * 用于让节气环、三元环、局数环、超神接气环全部与 Ring 1 甲子日环
 * 精确对齐到同一坐标系。
 *
 * 节气段边界与"元 5° 段边界"存在的偏差 = 超神/接气天数（可视化天文错位）。
 *
 * @returns 24 个节气的角度（度），冬至可能不在 0°（在冬至最近的甲子日为 0°）
 */
export function getSolarTermAnglesFromUpperYuan(today: Date): {
  name: string
  termIndex: number
  angle: number  // 0-360
}[] {
  const upperYuan = getUpperYuanJiaziDay(today)
  const results: { name: string; termIndex: number; angle: number }[] = []

  // 从上元甲子日起，扫描 24 个节气
  const year = upperYuan.getFullYear()
  for (const y of [year, year + 1]) {
    const positions = getSolarTermPositions(y)
    for (const pos of positions) {
      const termDate = new Date(y, 0, 1)
      termDate.setDate(pos.dayOfYear)
      const daysDiff = Math.floor((termDate.getTime() - upperYuan.getTime()) / 86400000)
      if (daysDiff >= 0 && daysDiff < 360) {
        const termIdx = SOLAR_TERMS_FROM_DONGZHI.indexOf(pos.name)
        if (termIdx >= 0) {
          results.push({
            name: pos.name,
            termIndex: termIdx,
            angle: daysDiff  // 1 天 = 1°
          })
        }
      }
    }
  }
  // 去重（跨年可能重复取），按 angle 排序
  const seen = new Set<string>()
  const deduped = results.filter(r => {
    if (seen.has(r.name)) return false
    seen.add(r.name)
    return true
  })
  return deduped.sort((a, b) => a.angle - b.angle)
}


/** 获取当前节气的起始公历日（首日 dayOfYear → Date） */
function getCurrentTermStartDate(date: Date): Date {
  const year = date.getFullYear()
  const termIdx = getSolarTermIndex(date)
  const termName = SOLAR_TERMS_FROM_DONGZHI[termIdx]!
  const positions = getSolarTermPositions(year)
  const pos = positions.find(p => p.name === termName)
  if (pos) {
    const d = new Date(year, 0, 1)
    d.setDate(pos.dayOfYear)
    return d
  }
  // fallback: 往前找到节气变更点
  for (let i = 0; i < 20; i++) {
    const prev = new Date(date.getTime() - i * 86400000)
    if (getSolarTermIndex(prev) !== termIdx) {
      return new Date(prev.getTime() + 86400000)
    }
  }
  return date
}

/** 当前三元（上/中/下元）—— 严格按 5 天一元切换（对齐甲子日周期） */
export function getCurrentYuan(date: Date): '上元' | '中元' | '下元' {
  const yuanIdx = getYuanFromElement(getElementIndex(date))
  const list = ['上元', '中元', '下元'] as const
  return list[yuanIdx] ?? '上元'
}

/** 当前元索引（0=上 1=中 2=下） */
export function getYuanIndex(date: Date): 0 | 1 | 2 {
  return getYuanFromElement(getElementIndex(date))
}

/** 当前局数（1-9）—— 严格按元序表派生 */
export function getBureauNumber(date: Date): number {
  return getBureauFromElement(getElementIndex(date))
}

/** 超神/接气/正授判定（当前节气） */
export function getChaoShenJieQi(date: Date): '超神' | '接气' | '正授' {
  const termName = getSolarTermName(date)
  return getChaoShenJieQiForTerm(termName, date.getFullYear()).status
}

/**
 * 判定某个具体节气的超神/接气/正授状态。
 *
 * 规则（按传统奇门排局 + 用户明确的三分判定）：
 *   1. 找到该节气日**前后** 15 天内最近的甲/己日（符头日）
 *   2. diff = 符头日相对节气日的天数
 *      - diff = 0  → 正授（节气日 = 符头日，完美对齐）
 *      - diff > 0  → 超神（符头在节气**之前**，即甲子日先来节气后到）
 *      - diff < 0  → 接气（符头在节气**之后**，即节气先到甲子日后来）
 */
export function getChaoShenJieQiForTerm(termName: string, year: number): {
  status: '超神' | '接气' | '正授'
  diffDays: number         // 符头日相对节气日的天数（正=超神，负=接气，0=正授）
  termDate: Date
  symbolDate: Date
} {
  const positions = getSolarTermPositions(year)
  const pos = positions.find(p => p.name === termName)
  const termDate = new Date(year, 0, 1)
  if (pos) termDate.setDate(pos.dayOfYear)

  // 前后各扫 15 天找最近的甲/己日
  let bestSymbol = termDate
  let bestDiff = Infinity
  for (let offset = -15; offset <= 15; offset++) {
    const d = new Date(termDate.getTime() + offset * 86400000)
    const dayIdx = getJiaziIndices(d).day
    if (dayIdx % 10 === 0 || dayIdx % 10 === 5) {
      if (Math.abs(offset) < Math.abs(bestDiff)) {
        bestDiff = offset
        bestSymbol = d
      }
    }
  }

  // diffDays = termDate - symbolDate 的天数
  //   符头在节气之前（offset < 0）→ diffDays > 0 → 超神
  //   符头在节气之后（offset > 0）→ diffDays < 0 → 接气
  const diffDays = -bestDiff
  let status: '超神' | '接气' | '正授'
  if (diffDays === 0) status = '正授'
  else if (diffDays > 0) status = '超神'
  else status = '接气'

  return { status, diffDays, termDate, symbolDate: bestSymbol }
}

/** 距下一节气天数 */
export function getDaysToNextTerm(date: Date): number {
  const year = date.getFullYear()
  const termIdx = getSolarTermIndex(date)
  const positions = getSolarTermPositions(year)
  const nextTermIdx = (termIdx + 1) % 24
  const nextName = SOLAR_TERMS_FROM_DONGZHI[nextTermIdx]!

  // 当年查
  let nextPos = positions.find(p => p.name === nextName)
  if (nextPos) {
    const nextDate = new Date(year, 0, 1)
    nextDate.setDate(nextPos.dayOfYear)
    const diff = daysBetween(date, nextDate)
    if (diff >= 0) return diff
  }
  // 跨年查（次年冬至/小寒等）
  const nextYearPositions = getSolarTermPositions(year + 1)
  nextPos = nextYearPositions.find(p => p.name === nextName)
  if (nextPos) {
    const nextDate = new Date(year + 1, 0, 1)
    nextDate.setDate(nextPos.dayOfYear)
    return daysBetween(date, nextDate)
  }
  return 15  // 兜底
}

/** 距当前节气起点天数 */
export function getDaysSinceTermStart(date: Date): number {
  const termStart = getCurrentTermStartDate(date)
  return daysBetween(termStart, date)
}

// ══════════════════════════════════════════════════════════════
//  日干支 / 甲子日 / 冬至锚点
// ══════════════════════════════════════════════════════════════

/** 日干支两字 */
export function getDayGanzhi(date: Date): string {
  return ganzhiName(getJiaziIndices(date).day)
}

/** 日干支在 60 甲子中的索引 (0-59) */
export function getJiaziDayIndex(date: Date): number {
  return getJiaziIndices(date).day
}

/** 相对当年冬至的天数偏移 (0-364/365) */
export function getDayOfYearFromDongzhi(date: Date): number {
  const year = date.getFullYear()
  const positions = getSolarTermPositions(year)
  const winterPos = positions.find(p => p.name === '冬至')
  const winterDoy = winterPos?.dayOfYear ?? 356
  const curDoy = getDayOfYear(date)
  const yearLen = isGregorianLeapYear(year) ? 366 : 365
  return ((curDoy - winterDoy) % yearLen + yearLen) % yearLen
}

// ══════════════════════════════════════════════════════════════
//  奇门置闰（Qimen leap）
// ══════════════════════════════════════════════════════════════

/**
 * 奇门置闰状态：累积超神天数 ≥ 9 天时，在芒种下元后（阳遁末）或大雪下元后（阴遁末）
 * 插入 15° 的「闰奇门」段。
 *
 * 简化算法：以当年冬至为起点，扫描 24 节气各自的超神天数总和；
 * 阳遁段（0-11）累积用于「闰芒种」，阴遁段（12-23）累积用于「闰大雪」。
 */
export function getQimenLeapStatus(year: number): {
  hasLeap: boolean
  leapName?: '闰芒种' | '闰大雪'
  leapStartAngle?: number
  leapEndAngle?: number
} {
  const positions = getSolarTermPositions(year)
  let yangCumulative = 0  // 阳遁段累积超神天数
  let yinCumulative = 0

  for (const pos of positions) {
    const termStart = new Date(year, 0, 1)
    termStart.setDate(pos.dayOfYear)
    const symbol = findNearestSymbolDayBefore(termStart)
    const diff = daysBetween(symbol, termStart)
    if (diff > 0 && diff < 9) {
      // 超神：累积
      const termIdx = SOLAR_TERMS_FROM_DONGZHI.indexOf(pos.name)
      if (isYangDun(termIdx)) yangCumulative += diff
      else yinCumulative += diff
    }
  }

  // 阳遁末（芒种）位置：termIdx 11 → 起始角 165°，宽 15°
  if (yangCumulative >= 9) {
    return {
      hasLeap: true,
      leapName: '闰芒种',
      leapStartAngle: 165,
      leapEndAngle: 180
    }
  }
  // 阴遁末（大雪）位置：termIdx 23 → 起始角 345°，宽 15°
  if (yinCumulative >= 9) {
    return {
      hasLeap: true,
      leapName: '闰大雪',
      leapStartAngle: 345,
      leapEndAngle: 360
    }
  }
  return { hasLeap: false }
}

// ══════════════════════════════════════════════════════════════
//  6 个甲子日锚点（60° 大刻度）
// ══════════════════════════════════════════════════════════════

/** 甲子系列 6 个锚点名（甲子/甲戌/甲申/甲午/甲辰/甲寅） */
export const JIAZI_ANCHORS: readonly string[] = ['甲子', '甲戌', '甲申', '甲午', '甲辰', '甲寅'] as const
