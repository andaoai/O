/**
 * 奇门遁甲 · 六轮甲子（六运）核心算法
 *
 * ═══════════════════════════════════════════════════════════════
 *  奇门排局的传统起点是「冬至上元甲子」——冬至节气前后最近的甲子日。
 *  从这个甲子日起，60 甲子 × 6 轮 = 360 天完整循环。
 *
 *  六轮甲子在环上恰好平分为 6 段 60 天 = 60° 每段，
 *  我们称这 6 段为「一运 / 二运 / 三运 / 四运 / 五运 / 六运」。
 *
 *  由于上元甲子日相对冬至的偏移每年不同（超神最多提前 9 天、
 *  接气最多滞后 15 天、正授差 1 天以内），所以「今天所在的运」
 *  在不同年份可能落在不同数值上——这正是奇门置闰的天文根源。
 * ═══════════════════════════════════════════════════════════════
 */
import { SolarDay } from 'tyme4ts'
import { getJiaziIndices } from './liushiJiazi'
import { getSolarTermPositions, dateFromDayOfYear } from './chineseCalendar'
import { ganzhiName } from './constants/ganzhi'

/** 一运 / 二运 / … / 六运 */
export type YunIndex = 1 | 2 | 3 | 4 | 5 | 6

/** 六运汇总信息 */
export interface SixYunInfo {
  /** 上元甲子日（环 0° 对应的日期，00:00 时刻） */
  upperYuanDate: Date
  /** today 所在运的甲子日（= 上元甲子日 + (currentYunIndex - 1) × 60 天） */
  currentJiaziDate: Date
  /** 当前运号：1-6 */
  currentYunIndex: YunIndex
  /** today 在 360 环上的格 index（0-359） */
  dayInRing: number
  /** today 距离所在运甲子日的天数（0-59） */
  daysSinceCurrentJiazi: number
  /** today 距离上元甲子日的天数（0-359） */
  daysSinceUpperYuan: number
  /** 上元甲子日的六十甲子干支名（永远是「甲子」，此字段用于对称展示） */
  upperYuanGanzhi: string
  /** 当前运甲子日的六十甲子干支名（永远是「甲子」） */
  currentJiaziGanzhi: string
}

/** 将日期归一到当日 00:00:00.000 */
function startOfDay(d: Date): Date {
  const r = new Date(d.getTime())
  r.setHours(0, 0, 0, 0)
  return r
}

/**
 * 两个日期的整日差（正值 = later - earlier）
 *
 * ⚠️ 用 tyme4ts SolarDay.subtract 而不是 (later.ms - earlier.ms) / 86400000。
 *    直接毫秒相除在跨 1900~1928 中国时区标准化（LMT → CST，跳 344 秒）
 *    的场景下有 1 天误差风险。SolarDay.subtract 走的是儒略日整数运算，
 *    永远精确。
 */
function diffDays(later: Date, earlier: Date): number {
  const a = SolarDay.fromYmd(later.getFullYear(), later.getMonth() + 1, later.getDate())
  const b = SolarDay.fromYmd(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate())
  return a.subtract(b)
}

/**
 * 查找 anchor 当天或之前最近的一个甲子日（干支序号 = 0）。
 *
 * ⚠️ 用 tyme4ts SolarDay.next(-1) 逐日回溯（而非 Date - 86400000）。
 *    这一点至关重要：JS Date 累加会在 1900~1928 年间中国时区标准化
 *    （LMT UTC+8:05:43 → CST UTC+8）时吞掉约 5 分 43 秒，
 *    导致跨阈值的那一天被 tyme4ts 判到前一日 → 干支跳格丢失。
 *
 * 60 甲子每 60 天循环 → 60 天窗口内必然含一个甲子日，返回值必然是甲子。
 */
export function findLastJiaziOnOrBefore(anchor: Date): Date {
  let sd = SolarDay.fromYmd(anchor.getFullYear(), anchor.getMonth() + 1, anchor.getDate())
  for (let offset = 0; offset > -60; offset--) {
    const y = sd.getYear(), m = sd.getMonth(), d = sd.getDay()
    const jsDate = new Date(y, m - 1, d)
    if (getJiaziIndices(jsDate).day === 0) return jsDate
    sd = sd.next(-1)
  }
  // 理论不可达
  return startOfDay(anchor)
}

/**
 * 历元锚点：**1900 年冬至** 前最近的一个甲子日（≤ 冬至）。
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 为什么要用「固定历元」而不是「每年重新锚定」
 *  ─────────────────────────────────────────────────────────────
 *  旧版每年冬至处强制重设 上元甲子 → 冬至永远停在一运附近，
 *  违反奇门时空的真实运转规律。
 *
 *  ✅ 新模型：从一个历元甲子（1900 年冬至前甲子）开始，
 *     360 天为一个完整循环，冬至相对于环上位置每年自然
 *     漂移 +5.25 天（一年 365.25 天 - 一个循环 360 天）：
 *       · 累积 ~12 年 ≈ 63 天 ≈ 跨过一个「运」
 *       · 累积 ~68 年 ≈ 360 天 ≈ 冬至穿越 一→二→…→六 一整轮
 *
 *  由于 360 % 60 == 0，EPOCH + N × 360 天永远是甲子日，
 *  确保上元甲子始终有效、环体永不旋转。
 * ═══════════════════════════════════════════════════════════════
 */
const HISTORICAL_ANCHOR_DATE = new Date(1900, 11, 22) // 1900-12-22 前后的冬至
const EPOCH_UPPER_YUAN = findLastJiaziOnOrBefore(HISTORICAL_ANCHOR_DATE)

/** 每一循环的天数（60 甲子 × 6 轮） */
const CYCLE_DAYS = 360

/**
 * 找出「上元甲子日」：以固定历元 1900 冬至前甲子日为基准，
 * 向前推 N 个 360 天循环，使 today 落在 [0, 360) 天区间内。
 *
 * ⚠️ 使用 tyme4ts SolarDay.next(n) 而不是 Date + n*86400000：
 *    避开 1900~1928 中国时区标准化的时刻偏移，保证任何跨年、
 *    跨时区历史点都不会丢失一日。
 */
export function findUpperYuanJiaziDay(today: Date): Date {
  const daysSinceEpoch = diffDays(today, EPOCH_UPPER_YUAN)
  const cycleN = Math.floor(daysSinceEpoch / CYCLE_DAYS)
  const epochSD = SolarDay.fromYmd(
    EPOCH_UPPER_YUAN.getFullYear(),
    EPOCH_UPPER_YUAN.getMonth() + 1,
    EPOCH_UPPER_YUAN.getDate()
  )
  const target = epochSD.next(cycleN * CYCLE_DAYS)
  return new Date(target.getYear(), target.getMonth() - 1, target.getDay())
}

/** 由 upperYuan 派生环上第 i 天（i ∈ [0, 360)）的 Date，走 SolarDay.next(i) 抗时区。 */
export function dateOfRingIndex(upperYuan: Date, i: number): Date {
  const sd = SolarDay
    .fromYmd(upperYuan.getFullYear(), upperYuan.getMonth() + 1, upperYuan.getDate())
    .next(i)
  return new Date(sd.getYear(), sd.getMonth() - 1, sd.getDay())
}

/**
 * 已知 upperYuanDate 是甲子日（index = 0）→ 环上第 i 天的干支序号恒等于
 * `i % 60`。这是**纯数学恒等**，不再逐日反查 tyme4ts——
 * 从根源消除"癸亥被跳过"这类 Date 累加丢日 bug。
 */
export function jiaziIndexAt(i: number): number {
  return ((i % 60) + 60) % 60
}

/**
 * @deprecated 保留以兼容旧引用，内部一律走 findLastJiaziOnOrBefore。
 *             ±30 天窗口的近搜索已知会遗漏 32±5 天偏移的甲子日，勿用于新代码。
 */
export function findNearestJiaziDay(center: Date): Date {
  return findLastJiaziOnOrBefore(center)
}

/** 计算 today 的六运汇总信息 */
export function computeSixYun(date: Date): SixYunInfo {
  const upperYuanDate = findUpperYuanJiaziDay(date)
  const daysSinceUpperYuan = diffDays(date, upperYuanDate)
  const clamped = Math.max(0, Math.min(359, daysSinceUpperYuan))
  const yunIdx = (Math.floor(clamped / 60) + 1) as YunIndex
  const daysSinceCurrentJiazi = clamped % 60
  const currentJiaziDate = new Date(
    upperYuanDate.getTime() + (yunIdx - 1) * 60 * 86400000
  )
  return {
    upperYuanDate,
    currentJiaziDate,
    currentYunIndex: yunIdx,
    dayInRing: clamped,
    daysSinceCurrentJiazi,
    daysSinceUpperYuan: clamped,
    upperYuanGanzhi: ganzhiName(0),
    currentJiaziGanzhi: ganzhiName(0)
  }
}

/**
 * 六运色板（一运深 → 六运浅），暗示「一阳来复」的时间流。
 * 与 QiMenLiuJiaziRing 的 ROUND_COLORS 一一对应。
 */
export const YUN_COLORS: readonly string[] = [
  '#3498DB', // 一运 · 冬（水青）
  '#2ECC71', // 二运 · 春（木绿）
  '#F1C40F', // 三运 · 夏（土黄）
  '#E67E22', // 四运 · 夏末（火橙）
  '#E74C3C', // 五运 · 秋（金红）
  '#8E44AD'  // 六运 · 冬前（水紫）
] as const

/** 六运名称 */
export const YUN_NAMES: readonly string[] = [
  '一运', '二运', '三运', '四运', '五运', '六运'
] as const

/* ═══════════════════════════════════════════════════════════════
   节气在 360 天环上的定位
   ─────────────────────────────────────────────────────────────
   环 0° = 上元甲子日（每年不同）
   环上格 i (0-359) = upperYuanDate + i 天

   一个 360 天窗口横跨 2 个公历年。要覆盖窗口内的所有节气，
   需扫描 [upperYuan.year - 1, upperYuan.year, upperYuan.year + 1]
   3 个公历年的节气表，把每一个落在 [upperYuan, upperYuan+360) 内的
   节气日期换算为环上的整数位置。

   ⚠️ 幂等保证：由于 upperYuan 是甲子日、循环 360 天，环上格 i 与
   公历日期一一对应；节气日期归一到 00:00 后取整日差 = 环上位置。
   ═══════════════════════════════════════════════════════════════ */

/** 节气在六运环上的定位（相对 upperYuanDate 的整日偏移） */
export interface QiMenSolarTerm {
  /** 节气名称（立春/雨水/…） */
  name: string
  /** tyme4ts 节气索引（冬至=0） */
  tymeIndex: number
  /** 是否为中气（偶数索引） */
  isMidTerm: boolean
  /** 在 360 环上的位置（0-359 整数） */
  dayInRing: number
  /** 节气所在的公历日期（当日 00:00） */
  date: Date
}

/**
 * 计算当前 360-天窗口内所有节气在环上的位置。
 *
 * @param today 当前时间；实际以 findUpperYuanJiaziDay(today) 派生的
 *              360 天窗口为准
 * @returns 落在 [upperYuan, upperYuan+360) 内的节气列表，
 *          按 dayInRing 升序排序（typically 24 个，跨年可能 25 个，
 *          在此裁剪到严格落在窗口内的）
 */
export function computeQiMenSolarTerms(today: Date): QiMenSolarTerm[] {
  const upperYuan = findUpperYuanJiaziDay(today)
  const upperYear = upperYuan.getFullYear()
  const results: QiMenSolarTerm[] = []
  const seen = new Set<number>() // dayInRing 去重（跨年时同一节气可能被两年扫到）

  for (const y of [upperYear - 1, upperYear, upperYear + 1]) {
    const positions = getSolarTermPositions(y)
    for (const pos of positions) {
      const date = dateFromDayOfYear(y, pos.dayOfYear)
      const dayInRing = diffDays(date, upperYuan)
      if (dayInRing < 0 || dayInRing >= CYCLE_DAYS) continue
      if (seen.has(dayInRing)) continue
      seen.add(dayInRing)
      results.push({
        name: pos.name,
        tymeIndex: pos.tymeIndex,
        isMidTerm: pos.isMidTerm,
        dayInRing,
        date
      })
    }
  }
  results.sort((a, b) => a.dayInRing - b.dayInRing)
  return results
}
