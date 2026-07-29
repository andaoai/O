/**
 * 日粒度共享年历上下文 —— 奇门盘 & 黄帝内经盘共用
 *
 * ════════════════════════════════════════════════════════════════════
 *  为什么需要这个 composable？
 *  ─────────────────────────────────────────────────────────────────
 *  奇门盘（QiMenDunJiaView）与黄帝内经·五运六气盘（HuangDiNeiJingView）
 *  都建立在同一套「以上元甲子日 0° 起序、360 天/环」的日粒度年历坐标上。
 *  历史上每个时间驱动环都各自独立地把同一份日粒度重量级计算
 *  （tyme4ts 儒略日 + 冬至扫描 + 24 节气排列 + 农历遍历 + 三元九局定位）
 *  跑一遍，加上 controlledTime 是 1Hz 实时时钟，秒级触发 → 全部重算：
 *    · findUpperYuanJiaziDay ≥N 次 / tick
 *    · computeQiMenSolarTerms ≥N 次 / tick
 *    · getYuanJuAt 720 次 / tick（SanYuan + JuShu）
 *    · findLastWinterSolstice ≥N 次 / tick（每次 366 天 SolarDay 扫描）
 *
 *  关键观察：这些结果 24 小时内是不变的。
 *
 *  本 composable 把所有共享结果合并到一个 computed，
 *  只在「跨天」时重算：
 *    timeRef ──► dayKey (integer YYYYMMDD)
 *              └─► ctx (computed，昂贵计算，一天一次)
 *
 *  Vue computed 的行为：若 dayKey 输出值不变（Object.is 相等），
 *  下游 ctx 不会被通知重算。秒级 tick 命中 dayKey 缓存 → 所有下游
 *  ringData 全部命中缓存 → 秒级 tick 成本 ≈ 0。
 *
 *  字段分组：
 *    · 基础年历字段（两盘都用）：upperYuan / W1 / W2 / D1 / yearLength /
 *      overflow / overlaySet / lunarEntries / terms / yearTerms /
 *      termDayFromWinter / termDayInRing / todayInRing / kToday /
 *      isInOverlayTail
 *    · 奇门专属：yuanJuAt / startIdxOf / realTermIdxOf / segAssignment /
 *      currentYunIndex
 *    · 五运六气专属：keQi / keQiYearBranchIndex / wuYunYearStemIndex /
 *      suiYun / mainYun / keYun
 *  两盘 View 都调用 provideDayGridContext(controlledTime)，各自的环
 *  按需 useDayGridContext() 取字段。
 * ════════════════════════════════════════════════════════════════════
 */
import {
  computed,
  inject,
  provide,
  type ComputedRef,
  type InjectionKey,
  type Ref
} from 'vue'
import { SolarDay } from 'tyme4ts'
import {
  findUpperYuanJiaziDay,
  findLastWinterSolstice,
  findNextWinterSolstice,
  computeQiMenSolarTerms,
  computeQiMenLunarRing,
  getWinterOverlayIndices,
  getYuanJuAt,
  computeSixYun,
  computeKeQiSequence,
  getKeQiYearBranchIndex,
  computeSuiYun,
  computeMainYun,
  computeKeYun,
  getWuYunYearStemIndex,
  type QiMenSolarTerm,
  type LunarRingEntry,
  type YuanJuInfo,
  type WuYunStep,
  type SuiYunInfo
} from '@/utils/qimenDunJia'

const CYCLE_DAYS = 360
const TERM_DAYS = 15

/** 走 tyme4ts 儒略日整数运算的整日差（抗时区标准化） */
function diffDays(later: Date, earlier: Date): number {
  const a = SolarDay.fromYmd(later.getFullYear(), later.getMonth() + 1, later.getDate())
  const b = SolarDay.fromYmd(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate())
  return a.subtract(b)
}

/** SolarTermsRing 段填色用的 slot */
export interface TermSlot {
  name: string
  isMidTerm: boolean
  isWinter: boolean
  isNextWinter: boolean
  /** 网格 vs 天文偏差判定：'zhengshou' 正授 / 'chaoshen' 超神 / 'jieqi' 接气 */
  chaoshenLabel: 'zhengshou' | 'chaoshen' | 'jieqi'
}

/** SolarTermsRing 真实节气日错位标记 */
export interface RealTermMark {
  name: string
  chaoshenLabel: 'chaoshen' | 'jieqi'
}

/** 两盘共用的时间锚点与节气基础数据 */
export interface DayGridAnchors {
  upperYuan: Date
  W1: Date                        // 本岁冬至
  W2: Date | null                 // 下一岁冬至
  D1: number                      // W1 在环上位置 [0, 360)
  yearLength: number              // 365 或 366（W2 − W1）
  overflow: number                // yearLength − 360，一般 5 或 6
  terms: QiMenSolarTerm[]
  yearTerms: QiMenSolarTerm[]     // 本岁 24 节气
  nextWinter: QiMenSolarTerm | null
  overlayIndices: number[]        // 长度 overflow+1
  overlaySet: Set<number>
  lunarEntries: LunarRingEntry[]  // 长度 360
}

/** 奇门盘专属：三元九局 + 节气分段索引 + 今日运序 */
export interface QiMenSpecific {
  yuanJuAt: Array<YuanJuInfo | null>  // 长度 360
  startIdxOf: Map<number, TermSlot>
  realTermIdxOf: Map<number, RealTermMark>
  segAssignment: Map<number, TermSlot>
  currentYunIndex: number         // 今日所在运 1-6
}

/** 五运六气专属：客气 / 主运 / 客运 / 岁运 */
export interface WuYunSpecific {
  termDayFromWinter: Map<string, number>
  termDayInRing: Map<string, number>
  keQi: string[]                  // 客气六步序列
  keQiYearBranchIndex: number     // 本岁年地支索引（子=0…亥=11）
  wuYunYearStemIndex: number      // 本岁年干索引（甲=0…癸=9）
  suiYun: SuiYunInfo              // 岁运（天干化运结果）
  mainYun: WuYunStep[]            // 主运五步
  keYun: WuYunStep[]              // 客运五步
}

/** 今日派生量（日粒度，两盘都用） */
export interface DayGridToday {
  todayInRing: number             // 今日环上 index [0, 360)
  kToday: number                  // 今日距 W1 天数 [0, yearLength)
  isInOverlayTail: boolean        // 今日是否落在岁末溢出天
}

/** 日粒度共享年历上下文 —— 奇门盘 & 黄帝内经·五运六气盘共用（扁平结构保持 provide/inject 简洁） */
export interface DayGridContext extends DayGridAnchors, QiMenSpecific, WuYunSpecific, DayGridToday {}

const DAY_GRID_KEY: InjectionKey<ComputedRef<DayGridContext>> = Symbol('DayGridContext')

/** 网格节气日 vs 真实天文节气日 → 符头状态 */
function computeChaoshenLabel(
  idx: number,
  real: Date,
  winterRealDate: Date | null
): 'zhengshou' | 'chaoshen' | 'jieqi' {
  if (!winterRealDate) return 'zhengshou'
  if (idx === 0) return 'zhengshou'  // 冬至锚点恒正授
  const gridDate = new Date(
    winterRealDate.getFullYear(),
    winterRealDate.getMonth(),
    winterRealDate.getDate() + idx * TERM_DAYS
  )
  const diff = diffDays(real, gridDate)
  if (diff > 0) return 'jieqi'
  if (diff < 0) return 'chaoshen'
  return 'zhengshou'
}

/** 完整构建一次 DayGridContext（日粒度：跨天才调用一次） */
function buildContext(now: Date): DayGridContext {
  const upperYuan = findUpperYuanJiaziDay(now)
  const W1 = findLastWinterSolstice(now)
  const W2 = findNextWinterSolstice(W1)
  const D1 = ((diffDays(W1, upperYuan) % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
  const yearLength = W2 ? diffDays(W2, W1) : 365
  const overflow = yearLength - CYCLE_DAYS

  const terms = computeQiMenSolarTerms(now)
  const yearTerms = terms.filter(t => !t.isNextWinter)
  const nextWinter = terms.find(t => t.isNextWinter) ?? null
  const winterRealDate = yearTerms[0]?.date ?? null

  const overlayIndices = getWinterOverlayIndices(now)
  const overlaySet = new Set(overlayIndices)

  const lunarEntries = computeQiMenLunarRing(now)

  // 三元九局：360 格预算，替代 SanYuan/JuShu 各 360 次 getYuanJuAt
  const yuanJuAt: Array<YuanJuInfo | null> = new Array(CYCLE_DAYS)
  for (let i = 0; i < CYCLE_DAYS; i++) {
    yuanJuAt[i] = getYuanJuAt(i, terms)
  }

  // SolarTermsRing：首日格索引
  const startIdxOf = new Map<number, TermSlot>()
  for (let n = 0; n < yearTerms.length; n++) {
    const t = yearTerms[n]!
    startIdxOf.set(t.dayInRing, {
      name: t.name,
      isMidTerm: t.isMidTerm,
      isWinter: t.name === '冬至',
      isNextWinter: false,
      chaoshenLabel: computeChaoshenLabel(n, t.date, winterRealDate)
    })
  }
  if (nextWinter) {
    startIdxOf.set(nextWinter.dayInRing, {
      name: '冬至·下岁',
      isMidTerm: true,
      isWinter: true,
      isNextWinter: true,
      chaoshenLabel: 'zhengshou'
    })
  }

  // SolarTermsRing：真实天文节气日索引（错位标记）
  const realTermIdxOf = new Map<number, RealTermMark>()
  for (let n = 0; n < yearTerms.length; n++) {
    const t = yearTerms[n]!
    if (t.name === '冬至') continue
    const label = computeChaoshenLabel(n, t.date, winterRealDate)
    if (label === 'zhengshou') continue
    const realDayInRing = ((diffDays(t.date, upperYuan) % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
    if (startIdxOf.has(realDayInRing)) continue
    if (!realTermIdxOf.has(realDayInRing)) {
      realTermIdxOf.set(realDayInRing, { name: t.name, chaoshenLabel: label })
    }
  }

  // SolarTermsRing：分段填色
  const segAssignment = new Map<number, TermSlot>()
  for (let k = 0; k < yearTerms.length; k++) {
    const t = yearTerms[k]!
    const nextT = yearTerms[k + 1]
    const segDays = nextT ? diffDays(nextT.date, t.date) : TERM_DAYS
    const slot: TermSlot = {
      name: t.name,
      isMidTerm: t.isMidTerm,
      isWinter: t.name === '冬至',
      isNextWinter: false,
      chaoshenLabel: computeChaoshenLabel(k, t.date, winterRealDate)
    }
    for (let d = 0; d < segDays; d++) {
      const idx = (t.dayInRing + d) % CYCLE_DAYS
      if (!segAssignment.has(idx)) segAssignment.set(idx, slot)
    }
  }

  // WuYunLiuQiRing 用的两张 map
  const termDayFromWinter = new Map<string, number>()
  const termDayInRing = new Map<string, number>()
  for (const t of yearTerms) {
    if (!termDayFromWinter.has(t.name)) {
      termDayFromWinter.set(t.name, diffDays(t.date, W1))
    }
    const realIdx = ((diffDays(t.date, upperYuan) % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
    if (!termDayInRing.has(t.name)) termDayInRing.set(t.name, realIdx)
  }

  // 今日
  const sixYun = computeSixYun(now)
  const todayInRing = sixYun.dayInRing
  const kToday = W2 ? diffDays(now, W1) : 0
  const isInOverlayTail = kToday >= CYCLE_DAYS
  const currentYunIndex = sixYun.currentYunIndex

  // 客气六步：以「本岁大寒」的年地支为准
  const keQiYearBranchIndex = getKeQiYearBranchIndex(yearTerms, W1)
  const keQi = computeKeQiSequence(keQiYearBranchIndex)

  // 五运：主运 / 客运 / 岁运（以本岁大寒的年干为准）
  const wuYunYearStemIndex = getWuYunYearStemIndex(yearTerms, W1)
  const suiYun = computeSuiYun(wuYunYearStemIndex)
  const mainYun = computeMainYun(wuYunYearStemIndex)
  const keYun = computeKeYun(wuYunYearStemIndex)

  return {
    upperYuan,
    W1,
    W2,
    D1,
    yearLength,
    overflow,
    terms,
    yearTerms,
    nextWinter,
    overlayIndices,
    overlaySet,
    lunarEntries,
    yuanJuAt,
    startIdxOf,
    realTermIdxOf,
    segAssignment,
    termDayFromWinter,
    termDayInRing,
    keQi,
    keQiYearBranchIndex,
    wuYunYearStemIndex,
    suiYun,
    mainYun,
    keYun,
    todayInRing,
    kToday,
    isInOverlayTail,
    currentYunIndex
  }
}

/**
 * View 侧调用：向下 provide 一份日粒度共享上下文。
 *
 * 关键：ctx 只依赖 dayKey（整数），秒级 time 变化时 dayKey 值不变
 *      → Vue computed 缓存命中 → ctx 不重算 → 下游环 ringData 全部命中缓存。
 */
export function provideDayGridContext(time: Ref<Date>): ComputedRef<DayGridContext> {
  // 整数化的日 key：YYYYMMDD，秒变化时值稳定
  const dayKey = computed(() => {
    const d = time.value
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  })

  const ctx = computed<DayGridContext>(() => {
    const key = dayKey.value
    // 从 key 还原到当日 00:00 Date —— 完全不读 time.value，避免秒级依赖
    const y = Math.floor(key / 10000)
    const m = Math.floor((key % 10000) / 100) - 1
    const d = key % 100
    return buildContext(new Date(y, m, d))
  })

  provide(DAY_GRID_KEY, ctx)
  return ctx
}

/**
 * Ring 侧调用：读取共享上下文。
 *
 * ⚠️ 必须在 provideDayGridContext 之下调用；上游未 provide 时抛错，
 *    以便早发现「忘挂 context」的低级错误（架构合规检查）。
 */
export function useDayGridContext(): ComputedRef<DayGridContext> {
  const ctx = inject(DAY_GRID_KEY, null)
  if (!ctx) {
    throw new Error(
      '[day-grid] useDayGridContext 必须在 provideDayGridContext 之下调用 —— 通常挂在 QiMenDunJiaView / HuangDiNeiJingView'
    )
  }
  return ctx
}
