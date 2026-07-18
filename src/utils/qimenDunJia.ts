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

  // 按 dayInRing 相对冬至（本岁网格起点）的偏移排序
  const sorted = [...yearTerms].sort((a, b) => a.date.getTime() - b.date.getTime())
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

export function computeChaoshenState(today: Date): ChaoshenState {
  const terms = computeQiMenSolarTerms(today)
  const upperYuan = findUpperYuanJiaziDay(today)
  const todayInRing = ((diffDays(today, upperYuan) % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
  const info = getYuanJuAt(todayInRing, terms)
  if (!info) return { label: '正授', days: 0 }

  // 找出所在节气的真实公历日期
  const yearTerms = terms.filter(t => !t.isNextWinter)
  const sorted = [...yearTerms].sort((a, b) => a.date.getTime() - b.date.getTime())
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

/**
 * 查询某节气段（网格 termIdx）的超神/接气/正授状态。
 *
 * ─────────────────────────────────────────────────────────────
 *  茅山道人奇门排局法概要：
 *    · 一进入节气交接时刻 → 立即启用该节气上元（60 时辰 = 5 天）
 *    · 上元满 → 中元 60 时辰 → 下元 60 时辰
 *    · 三种情况：
 *        - 下元未满而新节气至 → 舍下元 = **超神**
 *        - 下元已满而新节气未至 → 续用下元 = **接气**
 *        - 交接与符头（甲己日）刚好同一刻 = **正授**（罕见）
 *
 *  🔑 网格化实现映射：
 *    · 网格节气日 = winter + termIdx × 15 天
 *    · 真实节气日 = term.date（天文时刻）
 *    · diff = 真实 - 网格
 *        - diff > 0 → 网格早于真实 → 上节气下元被延用 → **接气**（days = diff）
 *        - diff < 0 → 网格晚于真实 → 本节气舍下元早启 → **超神**（days = |diff|）
 *        - diff = 0 → **正授**
 * ─────────────────────────────────────────────────────────────
 */
export function getChaoshenAtTerm(
  termIdx: number,
  terms: QiMenSolarTerm[]
): { label: '超神' | '接气' | '正授', days: number } | null {
  const yearTerms = terms.filter(t => !t.isNextWinter)
  const sorted = [...yearTerms].sort((a, b) => a.date.getTime() - b.date.getTime())
  if (termIdx < 0 || termIdx >= sorted.length) return null
  const term = sorted[termIdx]!
  const gridDate = new Date(sorted[0]!.date.getTime() + termIdx * TERM_DAYS * 86400000)
  const diff = diffDays(term.date, gridDate)
  if (diff > 0) return { label: '接气', days: diff }
  if (diff < 0) return { label: '超神', days: -diff }
  return { label: '正授', days: 0 }
}

/** 阴阳遁归属：冬至→芒种 12 节气为阳遁，夏至→大雪 12 节气为阴遁 */
export function isYangDun(termName: string): boolean {
  return YANG_YUAN_JU[termName] !== undefined
}

/**
 * 超神/接气/正授配色 —— 与 QiMenChaoShenRing / QiMenInfoCenter 共享。
 *   · 超神 · 朱红（提前, 阳气激越）
 *   · 接气 · 靛蓝（延后, 阴气凝滞）
 *   · 正授 · 明金（罕遇, 天时对位）
 */
export const CHAOSHEN_COLORS: Readonly<Record<'超神' | '接气' | '正授', string>> = {
  '超神': '#C0392B',
  '接气': '#1F4E79',
  '正授': '#F1C40F'
} as const

/** 阴阳两遁配色 —— 阳遁朱、阴遁玄 */
export const YIN_YANG_COLORS = {
  yang: '#C0392B',   // 阳遁 · 朱
  yin: '#1F2A44'     // 阴遁 · 玄
} as const
