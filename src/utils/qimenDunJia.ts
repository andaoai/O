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

/** 一节气固定 15 天（24 × 15 = 360，正好填满环） */
const TERM_DAYS = 15

/** 一元固定 5 天 = 60 时辰（3 元 × 5 = 15 天 = 1 节气） */
const YUAN_DAYS = 5

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
 * 与 LiuJiaziDayRing 的 ROUND_COLORS 一一对应。
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
   环 0° = 上元甲子日（跟六轮甲子环共享物理布局，冬至位置每年变）

   🔑 节气年份 = 冬至年（不是公历年、也不是甲子年）
   ─────────────────────────────────────────────────────────────
   奇门以冬至为一岁之始。节气环显示的 24 节气取自
   「≤ today 的最近冬至 W」 → 「下一冬至 W'」区间的一整年，
   过冬至那一刻自动切到下一岁的 24 节气。

   由于 upperYuanDate（甲子）由固定历元派生、冬至相对甲子每年
   漂移约 5.25 天，冬至在环上的位置每年不同——因此节气环的
   物理起点 0° 不动，但**节气整体每年绕环滑动**，冬至位置
   随年推移。一岁 ~365 天 > 环 360 天，末尾几个节气会绕环
   回到 0 附近，与下一岁冬至无缝相接。
   ═══════════════════════════════════════════════════════════════ */

/** 节气在六运环上的定位（相对 upperYuanDate 的整日偏移） */
export interface QiMenSolarTerm {
  /** 节气名称（立春/雨水/…） */
  name: string
  /** tyme4ts 节气索引（冬至=0） */
  tymeIndex: number
  /** 是否为中气（偶数索引） */
  isMidTerm: boolean
  /** 在 360 环上的位置（0-359 整数，已对 360 取模允许绕环） */
  dayInRing: number
  /** 节气所在的公历日期（当日 00:00） */
  date: Date
  /**
   * 是否为「下一岁冬至」的锚点标记
   * ─────────────────────────────────────────────
   * 一岁 ~365 天 > 环 360 天，下一冬至位置 = 当年冬至位置 + 5 mod 360，
   * 恰好落在当年冬至段的第 5 天上。此标记帮助环组件区分渲染。
   */
  isNextWinter?: boolean
}

/**
 * 查找 today 当天或之前最近的一个冬至日（首日）。
 *
 * ⚠️ 用 tyme4ts SolarDay 逐日回溯：
 *   - SolarDay.getTerm() 返回该日所在的节气段
 *   - 冬至段的 tyme4ts 索引 = 0
 *   - 冬至首日检测：today 属于冬至段，且 yesterday 不属于冬至段
 *   - 一岁 365 天内必含一个冬至，扫 366 天窗口足以命中
 */
export function findLastWinterSolstice(today: Date): Date {
  let sd = SolarDay.fromYmd(today.getFullYear(), today.getMonth() + 1, today.getDate())
  for (let offset = 0; offset > -366; offset--) {
    if (sd.getTerm().getIndex() === 0) {
      const prev = sd.next(-1)
      if (prev.getTerm().getIndex() !== 0) {
        return new Date(sd.getYear(), sd.getMonth() - 1, sd.getDay())
      }
    }
    sd = sd.next(-1)
  }
  // 理论不可达（1 年内必含冬至）
  return startOfDay(today)
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
/**
 * 计算「以最近冬至为岁首」的完整一岁 24 节气在环上的位置。
 *
 * ⚠️ 关键设计：**节气按 15 天固定网格排列**，而不是按实际公历日期。
 *
 *  ─────────────────────────────────────────────────────────────
 *  为什么用固定 15 天网格而不是天文日期？
 *
 *  节气是天文时刻（例如立春 15:00），相邻节气的日历日差在 14~16 天
 *  之间浮动（取决于日期跨过零点的方式）。如果按天文日期填格：
 *    · 14 天段 → 下元只有 4 天（❌）
 *    · 15 天段 → 下元 5 天（✓）
 *    · 16 天段 → 下元 6 天（❌）
 *
 *  改为"冬至锚 + n × 15"网格后：
 *    · 每节气段严格 15 天 = 上元 5 + 中元 5 + 下元 5（永远稳定）✓
 *    · 24 节气 × 15 = 360 恰好填满环 ✓
 *
 *  代价：Ring2 节气标签的角度与 Ring1 中该日期干支格可能偏 1-2°
 *  （因为天文日期不一定落在网格上），但 Rings 2/3/4 完美同轴对齐。
 *
 *  超神/接气的**数值**从「下元长度浮动」改由圆心卡里独立计算
 *  （见 computeChaoshenState），基于「真实节气日 − 网格节气日」偏差。
 *  ─────────────────────────────────────────────────────────────
 *
 * @param today 当前时间
 * @returns 从最近冬至开始的 24 个节气 + 下一岁冬至锚点。
 *          dayInRing 严格为 winter.dayInRing + n × 15（mod 360），n=0..23。
 */
export function computeQiMenSolarTerms(today: Date): QiMenSolarTerm[] {
  const upperYuan = findUpperYuanJiaziDay(today)
  const winter = findLastWinterSolstice(today)
  const startYear = winter.getFullYear()

  // 找到冬至在环上的物理起点
  const winterDayInRing =
    ((diffDays(winter, upperYuan) % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS

  // 收集本岁 24 节气的**真实日期**（供圆心卡计算超神接气用）
  const realDates: Array<{
    name: string
    tymeIndex: number
    isMidTerm: boolean
    date: Date
    daysFromWinter: number
  }> = []
  for (const y of [startYear, startYear + 1]) {
    const positions = getSolarTermPositions(y)
    for (const pos of positions) {
      const date = dateFromDayOfYear(y, pos.dayOfYear)
      const daysFromWinter = diffDays(date, winter)
      if (daysFromWinter < 0 || daysFromWinter >= 365) continue
      realDates.push({
        name: pos.name,
        tymeIndex: pos.tymeIndex,
        isMidTerm: pos.isMidTerm,
        date,
        daysFromWinter
      })
    }
    if (realDates.length >= 24) break
  }
  realDates.sort((a, b) => a.daysFromWinter - b.daysFromWinter)
  const yearTerms = realDates.slice(0, 24)

  // 🔑 把每个节气按 15 天固定网格放到环上：
  //    dayInRing[n] = (winterDayInRing + n * 15) mod 360
  //    date 字段保留真实公历日期，用于超神接气计算。
  const results: QiMenSolarTerm[] = []
  for (let n = 0; n < yearTerms.length; n++) {
    const t = yearTerms[n]!
    const gridDayInRing = (winterDayInRing + n * TERM_DAYS) % CYCLE_DAYS
    results.push({
      name: t.name,
      tymeIndex: t.tymeIndex,
      isMidTerm: t.isMidTerm,
      dayInRing: gridDayInRing,
      date: t.date
    })
  }

  // 下一岁冬至锚点：仍用真实日期换算，标记 isNextWinter
  const nextWinterDate = findNextWinterSolstice(winter)
  if (nextWinterDate) {
    const rawIdx = diffDays(nextWinterDate, upperYuan)
    const dayInRing = ((rawIdx % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
    results.push({
      name: '冬至',
      tymeIndex: 0,
      isMidTerm: true,
      dayInRing,
      date: nextWinterDate,
      isNextWinter: true
    })
  }

  return results
}

/**
 * 查找 fromWinter 之后最近的下一个冬至日（首日）。
 * 逻辑对称于 findLastWinterSolstice，方向反过来遍历 SolarDay.next(+1)。
 */
export function findNextWinterSolstice(fromWinter: Date): Date | null {
  // 从冬至次日开始向后扫，最多 366 天窗口
  let sd = SolarDay.fromYmd(fromWinter.getFullYear(), fromWinter.getMonth() + 1, fromWinter.getDate()).next(1)
  for (let offset = 0; offset < 366; offset++) {
    if (sd.getTerm().getIndex() === 0) {
      const prev = sd.next(-1)
      if (prev.getTerm().getIndex() !== 0) {
        return new Date(sd.getYear(), sd.getMonth() - 1, sd.getDay())
      }
    }
    sd = sd.next(1)
  }
  return null
}

/* ═══════════════════════════════════════════════════════════════
   三元九局（茅山道人排局法）
   ─────────────────────────────────────────────────────────────
   规则：
     · 节气交接一刻直接进入本节气 上元（不用符头）
     · 上元 5 天（60 时辰） → 中元 5 天 → 下元 5~7 天
     · 下元长度 = 15 - 上下元实占 = 节气实际长度 - 10
     · 阳遁：冬至 → 芒种 共 12 节气
     · 阴遁：夏至 → 大雪 共 12 节气

   死表口诀（用户口诀直接编码）：
     阳遁：冬至惊蛰 一七四 / 小寒 二八五 / 大寒春分 三九六 /
           雨水 九六三 / 清明立夏 四一七 / 立春 八五二 /
           谷雨小满 五二八 / 芒种 六三九
     阴遁：夏至白露 九三六 / 小暑 八二五 / 大暑秋分 七一四 /
           立秋 二五八 / 寒露立冬 六九三 / 处暑 一四七 /
           霜降小雪 五八二 / 大雪 四七一
   ═══════════════════════════════════════════════════════════════ */

/** 一节气对应的三元局数 [上元, 中元, 下元] */
type YuanJuTriple = readonly [number, number, number]

/** 阳遁 · 冬至→芒种 12 节气三元局数 */
export const YANG_YUAN_JU: Readonly<Record<string, YuanJuTriple>> = {
  '冬至': [1, 7, 4],
  '小寒': [2, 8, 5],
  '大寒': [3, 9, 6],
  '立春': [8, 5, 2],
  '雨水': [9, 6, 3],
  '惊蛰': [1, 7, 4],
  '春分': [3, 9, 6],
  '清明': [4, 1, 7],
  '谷雨': [5, 2, 8],
  '立夏': [4, 1, 7],
  '小满': [5, 2, 8],
  '芒种': [6, 3, 9]
}

/** 阴遁 · 夏至→大雪 12 节气三元局数 */
export const YIN_YUAN_JU: Readonly<Record<string, YuanJuTriple>> = {
  '夏至': [9, 3, 6],
  '小暑': [8, 2, 5],
  '大暑': [7, 1, 4],
  '立秋': [2, 5, 8],
  '处暑': [1, 4, 7],
  '白露': [9, 3, 6],
  '秋分': [7, 1, 4],
  '寒露': [6, 9, 3],
  '霜降': [5, 8, 2],
  '立冬': [6, 9, 3],
  '小雪': [5, 8, 2],
  '大雪': [4, 7, 1]
}

/** 三元位（上元/中元/下元） */
export type YuanPos = 0 | 1 | 2
export const YUAN_NAMES: readonly ['上元', '中元', '下元'] = ['上元', '中元', '下元'] as const

/**
 * 洛书方位色（九宫色板）
 *  1 坎水 · 2 坤土 · 3 震木 · 4 巽木 · 5 中土 ·
 *  6 乾金 · 7 兑金 · 8 艮土 · 9 离火
 */
export const JU_COLORS: readonly string[] = [
  '',        // 占位，让 index 从 1 开始
  '#1F4E79', // 1 坎 · 水青
  '#8B7500', // 2 坤 · 土黄
  '#1F5F3A', // 3 震 · 木绿
  '#2ECC71', // 4 巽 · 木青
  '#95856F', // 5 中 · 中土
  '#EAECEE', // 6 乾 · 金白
  '#D0D3D4', // 7 兑 · 金浅
  '#7B6E4F', // 8 艮 · 艮土
  '#C0392B'  // 9 离 · 火红
] as const

/** 三元三色（上/中/下） */
export const YUAN_COLORS: readonly string[] = [
  '#C0392B', // 上元 · 朱红（阳始生）
  '#B58900', // 中元 · 赭黄（土居中）
  '#1F4E79'  // 下元 · 靛蓝（水归藏）
] as const

/** 某节气三元 + 局数 + 阴阳遁 */
export interface YuanJuInfo {
  /** 节气名 */
  termName: string
  /** 该节气三元 [上, 中, 下] */
  triple: YuanJuTriple
  /** 当前所在元位（0 上/1 中/2 下） */
  yuanPos: YuanPos
  /** 当前局数（1-9） */
  ju: number
  /** 是否阳遁 */
  isYang: boolean
  /** 距离本节气网格起始日的偏移天数（0-14，严格 15 天段内） */
  daysFromTermStart: number
  /** 本节气段总天数（固定 15） */
  termLength: number
}

/**
 * 查询 dayInRing 位置的三元/九局/阴阳遁信息。
 *
 * ⚠️ 使用**固定 15 天网格**填格（每元恒 5 天）：
 *   · 网格起点 = winterDayInRing
 *   · 24 节气各占 [winter + n*15, winter + n*15 + 15) 一段
 *   · yuanPos = Math.floor(offsetInSeg / 5)
 *   · 24 × 15 = 360 完整覆盖环，无空隙、无浮动
 *
 * @param dayInRing 环上位置 0-359
 * @param terms QiMenSolarTerm 数组，dayInRing 已按 15 天网格排布
 * @returns 位置对应的三元九局信息
 */
export function getYuanJuAt(
  dayInRing: number,
  terms: QiMenSolarTerm[]
): YuanJuInfo | null {
  const yearTerms = terms.filter(t => !t.isNextWinter)
  if (yearTerms.length === 0) return null

  // computeQiMenSolarTerms 输出时已按 date 有序（内部先 realDates.sort），
  // 这里直接信赖调用方顺序，删除原先每次都做的 `[...yearTerms].sort(...)`。
  // 原 SanYuan+JuShu 逐格调用 → 720 次冗余排序 → 现在为 0。
  const sorted = yearTerms
  const winterDayInRing = sorted[0]!.dayInRing

  // 计算 dayInRing 距冬至锚点的偏移（绕环）
  const offsetFromWinter = ((dayInRing - winterDayInRing) % CYCLE_DAYS + CYCLE_DAYS) % CYCLE_DAYS
  const termIdx = Math.floor(offsetFromWinter / TERM_DAYS)
  if (termIdx < 0 || termIdx >= sorted.length) return null

  const term = sorted[termIdx]!
  const offsetInSeg = offsetFromWinter - termIdx * TERM_DAYS  // 0-14

  // 元位：0 上 / 1 中 / 2 下（每元固定 5 天）
  const yuanPos: YuanPos = Math.floor(offsetInSeg / YUAN_DAYS) as YuanPos

  const isYang = YANG_YUAN_JU[term.name] !== undefined
  const table = isYang ? YANG_YUAN_JU : YIN_YUAN_JU
  const triple = (table[term.name] ?? [1, 1, 1]) as YuanJuTriple

  return {
    termName: term.name,
    triple,
    yuanPos,
    ju: triple[yuanPos]!,
    isYang,
    daysFromTermStart: offsetInSeg,
    termLength: TERM_DAYS
  }
}

/**
 * 超神 / 接气 / 正授 状态
 *
 * ⚠️ 网格化后的定义：以「真实节气日」相对「网格节气日」的偏差描述。
 *   · 真实节气日 = today 所属节气的天文日
 *   · 网格节气日 = 冬至 + termIdx × 15 天
 *   · 偏差 > 0 → **接气**（网格已到该节气，天文节气尚未到 → 上一节气仍在延续）
 *   · 偏差 < 0 → **超神**（网格未到，天文节气已到 → 提前进入新节气）
 *   · 偏差 = 0 → **正授**
 *
 * 注：绝对值随年份自然浮动，符合"网格与天象错位"的可视化直觉。
 */
export interface ChaoshenState {
  label: '超神' | '接气' | '正授'
  days: number
}

/* ═══════════════════════════════════════════════════════════════
   农历环工具：环上第 i 天 → 农历标签
   ─────────────────────────────────────────────────────────────
   🔑 与 24 节气环同步：以「≤ today 的最近冬至 W1」为岁首起点。
     过冬至那一刻，整个环整体切换到下一岁的农历。

   环格 i ↔ 岁内偏移 k 的映射：
     · 环 0° = upperYuan 甲子日（物理坐标不动，跟六轮甲子环共享）
     · 冬至 W1 落在环上 D1 = (W1 − upperYuan) 天
     · 环第 i 格对应岁内第 k 天：k = (i − D1 + 360) mod 360
       日期 = W1.next(k)
     · 一岁 365 天 > 环 360 天，多出 5 天：本岁末尾 W1+360..W1+364
       在环上位置回卷到 D1..D1+4，与本岁头 5 天共格
       → 挂到 overlay 字段，供组件径向内层绘制
   ═══════════════════════════════════════════════════════════════ */
export interface LunarRingEntry {
  /** 环上索引 0-359 */
  index: number
  /** 对应的公历日期（本岁第 k 天，k = (index − D1 + 360) mod 360） */
  solarDate: Date
  /** 距本岁冬至 W1 的天数（0..359），用于「年头金色渐变」判定 */
  daysFromYearStart: number
  /** 该日农历日名（初一/初二/…/三十） */
  lunarDayName: string
  /** 是否为农历初一（月首日） */
  isMonthFirst: boolean
  /** 农历月名（isMonthFirst=true 时使用，如「正月/闰四月/腊月」） */
  lunarMonthName: string
  /** 是否为闰月的初一 */
  isLeapMonthFirst: boolean
  /**
   * 冬至叠加信息（仅本岁 [D1..D1+4] 5 格具有）：
   * 记录「本岁末尾 5 天」（W1+360..W1+364）的农历标签，供组件径向内层绘制。
   * 与外层「本岁头 5 天」共享同一环格。
   */
  overlay?: {
    solarDate: Date
    lunarDayName: string
    isMonthFirst: boolean
    lunarMonthName: string
    isLeapMonthFirst: boolean
    /**
     * 距下一冬至 W2 的天数（0 = W2 本身，1..overflow = 岁末倒数第几天）
     * 用于「年尾紫色渐变」判定 —— 越靠近 W2 紫色越深
     */
    daysBeforeYearEnd: number
  }
}

/** 内部：给定公历 Date → LunarDay 摘要（tyme4ts） */
function lunarSummary(date: Date): {
  dayName: string
  monthName: string
  isMonthFirst: boolean
  isLeapMonthFirst: boolean
} {
  const sd = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const ld = sd.getLunarDay()
  const lm = ld.getLunarMonth()
  const day = ld.getDay()
  return {
    dayName: ld.getName(),                  // "初一"…"三十"
    monthName: lm.getName(),                // "正月"/"闰四月"/"腊月"
    isMonthFirst: day === 1,
    isLeapMonthFirst: day === 1 && lm.isLeap()
  }
}

/**
 * 计算 360 环的农历标签数组。
 *
 * 🔑 与 24 节气环完全同步：使用 `computeQiMenSolarTerms(today)` 获取
 *   本岁冬至 W1（第一项）与下一岁冬至 W2（isNextWinter 标记项）。
 *   过冬至那一刻整个环切换到下一岁。
 *
 * 主返回：环第 i 格 → W1.next((i − D1 + 360) mod 360) 的农历
 * 副返回（overlay）：
 *   一岁实际长度 = diffDays(W2, W1)，约 365.2422 天；
 *   环仅 360 格，overflow = 年长 − 360 格＝5~6 天。
 *   这 overflow 天在环上与本岁首 overflow 天位置重叠，
 *   挂载到对应格的 overlay 内层显示。
 *   W2 冬至日本身也加入 overlay，与 24 节气环的下一冬至 marker 对齐。
 */
export function computeQiMenLunarRing(today: Date): LunarRingEntry[] {
  const upperYuan = findUpperYuanJiaziDay(today)
  const terms = computeQiMenSolarTerms(today)
  const yearTerms = terms.filter(t => !t.isNextWinter)
  const nextWinter = terms.find(t => t.isNextWinter)
  if (yearTerms.length === 0 || !nextWinter) return []

  const winter = yearTerms[0]!                      // 本岁冬至（W1）
  const D1 = winter.dayInRing                       // 环上位置（与 24 节气环完全一致）
  const W2 = nextWinter.date                        // 下一岁冬至实际日期

  const winterSD = SolarDay.fromYmd(
    winter.date.getFullYear(), winter.date.getMonth() + 1, winter.date.getDate()
  )
  const nextWinterSD = SolarDay.fromYmd(
    W2.getFullYear(), W2.getMonth() + 1, W2.getDate()
  )

  // 实际年长 = diffDays(W2, W1) —— 365 或 366 天
  const yearLength = diffDays(W2, winter.date)
  // 超出 360 格的天数 = 5 或 6
  const overflow = yearLength - CYCLE_DAYS

  // 主循环：环第 i 格 → 岁内第 k=(i−D1) mod 360 天
  const entries: LunarRingEntry[] = new Array(CYCLE_DAYS)
  for (let i = 0; i < CYCLE_DAYS; i++) {
    const k = ((i - D1) % CYCLE_DAYS + CYCLE_DAYS) % CYCLE_DAYS
    const sd = winterSD.next(k)
    const date = new Date(sd.getYear(), sd.getMonth() - 1, sd.getDay())
    const s = lunarSummary(date)
    entries[i] = {
      index: i,
      solarDate: date,
      daysFromYearStart: k,
      lunarDayName: s.dayName,
      isMonthFirst: s.isMonthFirst,
      lunarMonthName: s.monthName,
      isLeapMonthFirst: s.isLeapMonthFirst
    }
  }

  // 叠加：W2-overflow..W2-1（岁末溢出天数）+ W2 冬至日
  // 总格数 = overflow + 1 = 6 或 7
  for (let k = 0; k < overflow + 1; k++) {
    const tailSD = k < overflow ? nextWinterSD.next(-overflow + k) : nextWinterSD
    const tailDate = new Date(tailSD.getYear(), tailSD.getMonth() - 1, tailSD.getDay())
    const ringIdx = ((diffDays(tailDate, upperYuan) % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
    const s = lunarSummary(tailDate)
    // daysBeforeYearEnd: 距 W2 的天数
    //   k = 0..overflow-1 → 岁末天（W2-overflow..W2-1）→ overflow..1
    //   k = overflow      → W2 本身 → 0
    const daysBeforeYearEnd = k < overflow ? overflow - k : 0
    entries[ringIdx]!.overlay = {
      solarDate: tailDate,
      lunarDayName: s.dayName,
      isMonthFirst: s.isMonthFirst,
      lunarMonthName: s.monthName,
      isLeapMonthFirst: s.isLeapMonthFirst,
      daysBeforeYearEnd
    }
  }
  return entries
}

/**
 * 冬至叠加区在环上的位置区间（供组件识别哪些格需要径向切分）。
 * 返回 (overflow + 1) 个索引：W2-overflow..W2-1 + W2。
 */
export function getWinterOverlayIndices(today: Date): number[] {
  const upperYuan = findUpperYuanJiaziDay(today)
  const terms = computeQiMenSolarTerms(today)
  const yearTerms = terms.filter(t => !t.isNextWinter)
  const nextWinter = terms.find(t => t.isNextWinter)
  if (yearTerms.length === 0 || !nextWinter) return []

  const W1 = yearTerms[0]!.date
  const W2 = nextWinter.date
  const yearLength = diffDays(W2, W1)
  const overflow = yearLength - CYCLE_DAYS

  const nextWinterSD = SolarDay.fromYmd(
    W2.getFullYear(), W2.getMonth() + 1, W2.getDate()
  )
  const indices: number[] = []
  for (let k = 0; k < overflow + 1; k++) {
    const tailSD = k < overflow ? nextWinterSD.next(-overflow + k) : nextWinterSD
    const tailDate = new Date(tailSD.getYear(), tailSD.getMonth() - 1, tailSD.getDay())
    const ringIdx = ((diffDays(tailDate, upperYuan) % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
    indices.push(ringIdx)
  }
  return indices
}

export function computeChaoshenState(today: Date): ChaoshenState {
  const terms = computeQiMenSolarTerms(today)
  const upperYuan = findUpperYuanJiaziDay(today)
  const todayInRing = ((diffDays(today, upperYuan) % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
  const info = getYuanJuAt(todayInRing, terms)
  if (!info) return { label: '正授', days: 0 }

  // 找出所在节气的真实公历日期（yearTerms 已按 date 有序，无需再 sort）
  const yearTerms = terms.filter(t => !t.isNextWinter)
  const sorted = yearTerms
  const winterDayInRing = sorted[0]!.dayInRing
  const offsetFromWinter = ((todayInRing - winterDayInRing) % CYCLE_DAYS + CYCLE_DAYS) % CYCLE_DAYS
  const termIdx = Math.floor(offsetFromWinter / TERM_DAYS)
  const term = sorted[termIdx]
  if (!term) return { label: '正授', days: 0 }

  // 网格节气日 = winter + termIdx × 15 天
  const gridDate = new Date(sorted[0]!.date.getTime() + termIdx * TERM_DAYS * 86400000)
  const diff = diffDays(term.date, gridDate)  // 真实 - 网格
  if (diff > 0) return { label: '接气', days: diff }
  if (diff < 0) return { label: '超神', days: -diff }
  return { label: '正授', days: 0 }
}

/* ══════════════════════════════════════════════════════════════════
 *  五运六气 · 客气排布
 * ──────────────────────────────────────────────────────────────────
 *  客气排布规则（仅看「年地支」）：
 *
 *    年地支          司天之气(三之气)   在泉之气(终之气)
 *    ─────           ──────────       ──────────
 *    子/午           少阴君火          阳明燥金
 *    丑/未           太阴湿土          太阳寒水
 *    寅/申           少阳相火          厥阴风木
 *    卯/酉           阳明燥金          少阴君火
 *    辰/戌           太阳寒水          太阴湿土
 *    巳/亥           厥阴风木          少阳相火
 *
 *  客气六气固定循环顺序：
 *    厥阴风木 → 少阴君火 → 太阴湿土 → 少阳相火 → 阳明燥金 → 太阳寒水
 *
 *  排布方法：把「司天之气」放到第三步(三之气)，前后各推 2/3 步，
 *  即得初/二/三/四/五/终六步的客气序列。
 * ══════════════════════════════════════════════════════════════════
 */

/** 客气六气（固定循环顺序） */
export const KE_QI_CYCLE: readonly string[] = [
  '厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水'
] as const

/**
 * 年地支 → 司天之气(三之气)在 KE_QI_CYCLE 中的索引。
 *   子(0)/午(6) → 少阴君火 = index 1
 *   丑(1)/未(7) → 太阴湿土 = index 2
 *   寅(2)/申(8) → 少阳相火 = index 3
 *   卯(3)/酉(9) → 阳明燥金 = index 4
 *   辰(4)/戌(10)→ 太阳寒水 = index 5
 *   巳(5)/亥(11)→ 厥阴风木 = index 0
 */
const SITIAN_INDEX_BY_BRANCH: readonly number[] = [1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0]

/**
 * 计算某岁的客气六步序列（从初之气到终之气）。
 *
 * 惯例：五运六气的「年」以立春（或大寒）为界，早于立春按前一年干支。
 * 此处取「本岁大寒当日」的年地支作为客气排布依据 —— 大寒对应
 * 初之气起点，是运气学说中最自然的年界。
 *
 * @param yearBranchIndex 年地支索引（0=子,1=丑,…,11=亥）
 * @returns 长度 6 的客气名称数组：[初,二,三,四,五,终]
 */
export function computeKeQiSequence(yearBranchIndex: number): string[] {
  const branch = ((yearBranchIndex % 12) + 12) % 12
  const sitianIdx = SITIAN_INDEX_BY_BRANCH[branch]!
  // 司天(第三步) → 前推 2 步得初之气起点在 cycle 中的位置
  const startIdx = ((sitianIdx - 2) % 6 + 6) % 6
  const seq: string[] = []
  for (let i = 0; i < 6; i++) {
    seq.push(KE_QI_CYCLE[(startIdx + i) % 6]!)
  }
  return seq
}

/**
 * 从「大寒」真实日期反查其所在的年地支索引 —— 作为客气排布的年界基准。
 *
 * ⚠️ 关键约定：五运六气的年界是「大寒」本身，与农历年（立春起）不同。
 *   大寒 2026-01-20 → 开启 2026 丙午运气岁（此时立春尚未到）。
 *   因此按大寒所在公历年反查干支（公历年 ↔ 大寒起干支年 一一对应）。
 *
 * yearTerms[0] 是冬至，紧接是小寒、大寒；若本岁大寒缺失，退化到 W1+1 Jan 20。
 */
export function getKeQiYearBranchIndex(yearTerms: QiMenSolarTerm[], W1: Date): number {
  const daHan = yearTerms.find(t => t.name === '大寒')
  const ref = daHan?.date ?? new Date(W1.getFullYear() + 1, 0, 20)
  // 公历年 → 六十甲子索引（4 AD = 甲子 = 0）
  const cycleIdx = (((ref.getFullYear() - 4) % 60) + 60) % 60
  return cycleIdx % 12
}

/* ══════════════════════════════════════════════════════════════════
 *  五运六气 · 五运（主运 / 客运）排布
 * ──────────────────────────────────────────────────────────────────
 *  规律一：定「岁运」（看年干）
 *    甲己化土 / 乙庚化金 / 丙辛化水 / 丁壬化木 / 戊癸化火
 *    阳干（甲丙戊庚壬）= 太（过）；阴干（乙丁己辛癸）= 少（不及）
 *
 *  规律二：定「主运」（每年木火土金水 5 步固定顺序）
 *    初运极性由岁运反推 —— 保证太少相生链条经过岁运时太少匹配。
 *    等价的分组口诀：
 *      甲乙丙壬癸 起「太角」；丁戊己庚辛 起「少角」
 *    定初运后，按太少相生（太→少→太→少）交替。
 *
 *  规律三：定「客运」（初运=岁运，后按相生+太少交替）
 *    初运 = 岁运（照抄天干化运的太少结果）
 *    后 4 步按木→火→土→金→水相生顺序循环，
 *    极性同样太少相生交替（初运太→少→太→少→太）。
 *
 *  规律四：定「时段」
 *    一年分五段，以「大寒」为起点，每运约 73 天。
 *
 *  📊 十天干年份 · 主运与客运权威表（用户核对基准，逐字对齐）：
 *  ┌─────┬─────────┬──────┬────────────────────────────┬────────────────────────────┐
 *  │ 天干 │  阴阳属性  │ 岁运  │ 主运（每年不变）              │ 客运（当年变奏）              │
 *  ├─────┼─────────┼──────┼────────────────────────────┼────────────────────────────┤
 *  │ 甲   │ 阳土      │ 太宫  │ 太角→少徵→太宫→少商→太羽   │ 太宫→少商→太羽→少角→太徵   │
 *  │ 乙   │ 阴金      │ 少商  │ 太角→少徵→太宫→少商→太羽   │ 少商→太羽→少角→太徵→少宫   │
 *  │ 丙   │ 阳水      │ 太羽  │ 太角→少徵→太宫→少商→太羽   │ 太羽→少角→太徵→少宫→太商   │
 *  │ 丁   │ 阴木      │ 少角  │ 少角→太徵→少宫→太商→少羽   │ 少角→太徵→少宫→太商→少羽   │
 *  │ 戊   │ 阳火      │ 太徵  │ 少角→太徵→少宫→太商→少羽   │ 太徵→少宫→太商→少羽→太角   │
 *  │ 己   │ 阴土      │ 少宫  │ 少角→太徵→少宫→太商→少羽   │ 少宫→太商→少羽→太角→少徵   │
 *  │ 庚   │ 阳金      │ 太商  │ 少角→太徵→少宫→太商→少羽   │ 太商→少羽→太角→少徵→太宫   │
 *  │ 辛   │ 阴水      │ 少羽  │ 少角→太徵→少宫→太商→少羽   │ 少羽→太角→少徵→太宫→少商   │
 *  │ 壬   │ 阳木      │ 太角  │ 太角→少徵→太宫→少商→太羽   │ 太角→少徵→太宫→少商→太羽   │
 *  │ 癸   │ 阴火      │ 少徵  │ 太角→少徵→太宫→少商→太羽   │ 少徵→太宫→少商→太羽→少角   │
 *  └─────┴─────────┴──────┴────────────────────────────┴────────────────────────────┘
 * ══════════════════════════════════════════════════════════════════
 */

/** 五音 · 五行本色 */
export const WU_YIN_TO_XING: readonly ['木', '火', '土', '金', '水'] = ['木', '火', '土', '金', '水'] as const

/** 天干 → 化运五行索引（甲己土、乙庚金、丙辛水、丁壬木、戊癸火） */
const STEM_TO_YUN_ELEMENT_INDEX: readonly number[] = [
  /* 甲=0 */ 2, // 土
  /* 乙=1 */ 3, // 金
  /* 丙=2 */ 4, // 水
  /* 丁=3 */ 0, // 木
  /* 戊=4 */ 1, // 火
  /* 己=5 */ 2, // 土
  /* 庚=6 */ 3, // 金
  /* 辛=7 */ 4, // 水
  /* 壬=8 */ 0, // 木
  /* 癸=9 */ 1  // 火
] as const

/** 五音名（角=木、徵=火、宫=土、商=金、羽=水） */
export const WU_YIN_NAMES: readonly ['角', '徵', '宫', '商', '羽'] = ['角', '徵', '宫', '商', '羽'] as const

/** 太 / 少 极性 */
export type YunPolarity = '太' | '少'

/** 一步「运」的完整信息 */
export interface WuYunStep {
  /** 主/客运在 5 步中的序号：0..4 → 初/二/三/四/终 */
  order: number
  /** 序号中文名 */
  orderName: string
  /** 五音（角/徵/宫/商/羽） */
  yin: string
  /** 五行（木/火/土/金/水） */
  element: string
  /** 太或少 */
  polarity: YunPolarity
  /** 展示用完整名：'太角' / '少宫' 等 */
  fullName: string
}

const YUN_ORDER_NAMES: readonly string[] = ['初运', '二运', '三运', '四运', '终运'] as const

/** 阳干（太）：甲(0)/丙(2)/戊(4)/庚(6)/壬(8) */
function isYangStem(stemIdx: number): boolean {
  return stemIdx % 2 === 0
}

/**
 * 主运初运极性（起太角 or 少角）—— 从岁运反推自洽的分组：
 *
 *   起「太角」: 甲(0)、乙(1)、丙(2)、壬(8)、癸(9)
 *   起「少角」: 丁(3)、戊(4)、己(5)、庚(6)、辛(7)
 *
 *  等价推导：主运五音位置固定 [角0/徵1/宫2/商3/羽4]，太少交替。
 *  岁运的（位置, 极性）唯一确定 → 反推初运极性使链条自洽：
 *    · 岁运位置偶（角/宫/羽）→ 初运极性 = 岁运极性
 *    · 岁运位置奇（徵/商）  → 初运极性 = 岁运反极性
 *  两种方式等价，此处用显式分组表以匹配传统口诀。
 */
function mainYunFirstPolarity(stemIdx: number): YunPolarity {
  const s = ((stemIdx % 10) + 10) % 10
  // 甲(0) 乙(1) 丙(2) 壬(8) 癸(9) → 太角
  const isTaiJue = s === 0 || s === 1 || s === 2 || s === 8 || s === 9
  return isTaiJue ? '太' : '少'
}

/**
 * 太少相生：给定初运极性，5 步交替 (太→少→太→少→太 或 反之)
 */
function polaritySequence(first: YunPolarity): YunPolarity[] {
  const seq: YunPolarity[] = []
  let cur = first
  for (let i = 0; i < 5; i++) {
    seq.push(cur)
    cur = cur === '太' ? '少' : '太'
  }
  return seq
}

/** 计算「岁运」信息（天干化运 + 太少） */
export interface SuiYunInfo {
  element: string   // 化运五行（木/火/土/金/水）
  yin: string       // 五音名
  polarity: YunPolarity
  fullName: string  // 如「太羽」「少宫」
}

export function computeSuiYun(yearStemIndex: number): SuiYunInfo {
  const s = ((yearStemIndex % 10) + 10) % 10
  const elementIdx = STEM_TO_YUN_ELEMENT_INDEX[s]!
  const polarity: YunPolarity = isYangStem(s) ? '太' : '少'
  const yin = WU_YIN_NAMES[elementIdx]!
  const element = WU_YIN_TO_XING[elementIdx]!
  return { element, yin, polarity, fullName: `${polarity}${yin}` }
}

/**
 * 主运五步：初运恒定「角(木)」，极性由 mainYunFirstPolarity 决定，
 * 后 4 步按木→火→土→金→水固定顺序，太少交替。
 */
export function computeMainYun(yearStemIndex: number): WuYunStep[] {
  const first = mainYunFirstPolarity(yearStemIndex)
  const polarSeq = polaritySequence(first)
  const steps: WuYunStep[] = []
  for (let i = 0; i < 5; i++) {
    const yin = WU_YIN_NAMES[i]!
    const element = WU_YIN_TO_XING[i]!
    const polarity = polarSeq[i]!
    steps.push({
      order: i,
      orderName: YUN_ORDER_NAMES[i]!,
      yin,
      element,
      polarity,
      fullName: `${polarity}${yin}`
    })
  }
  return steps
}

/**
 * 客运五步：初运 = 岁运（天干化运结果），后 4 步按木→火→土→金→水
 * 相生顺序（即在 WU_YIN_NAMES 中从初运位置往后循环），
 * 极性同样按太少交替相生。
 */
export function computeKeYun(yearStemIndex: number): WuYunStep[] {
  const sui = computeSuiYun(yearStemIndex)
  const startYinIdx = WU_YIN_NAMES.indexOf(sui.yin as (typeof WU_YIN_NAMES)[number])
  const polarSeq = polaritySequence(sui.polarity)
  const steps: WuYunStep[] = []
  for (let i = 0; i < 5; i++) {
    const yinIdx = (startYinIdx + i) % 5
    const yin = WU_YIN_NAMES[yinIdx]!
    const element = WU_YIN_TO_XING[yinIdx]!
    const polarity = polarSeq[i]!
    steps.push({
      order: i,
      orderName: YUN_ORDER_NAMES[i]!,
      yin,
      element,
      polarity,
      fullName: `${polarity}${yin}`
    })
  }
  return steps
}

/**
 * 从本岁大寒真实日期反查其年干索引 —— 作为五运排布的年界基准。
 *
 * ⚠️ 与 getKeQiYearBranchIndex 同理：五运六气年界 = 大寒，早于立春
 *    的农历年干支会滞后一年，故按大寒所在公历年反查天干。
 */
export function getWuYunYearStemIndex(yearTerms: QiMenSolarTerm[], W1: Date): number {
  const daHan = yearTerms.find(t => t.name === '大寒')
  const ref = daHan?.date ?? new Date(W1.getFullYear() + 1, 0, 20)
  const cycleIdx = (((ref.getFullYear() - 4) % 60) + 60) % 60
  return cycleIdx % 10
}
