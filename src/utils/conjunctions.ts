/**
 * 五星两两会合计算
 *
 * 会合 (Conjunction) 定义：两颗行星的地心赤经在瞬时相等（Δα = 0）。
 * 本模块用赤经而非黄经，与 MansionDegreeRing / SevenLuminariesRing / SuzhouSkyMap
 * 等外环组件保持同一坐标口径——会合发生时刻，两星在 MansionDegreeRing 上的
 * 径向刻线恰好重叠。
 *
 * 算法概览：
 *   1. 粗筛：以行星对会合周期的 ~1/6 为步长扫描 [tStart, tEnd]，逐点计算
 *      Δα = normalizeSigned(ra_A − ra_B) ∈ (−180, 180]。
 *   2. 零点检测：相邻步 Δα 变号且跨越幅度 < 180° → 该区间存在一次会合。
 *   3. 精求：astronomy-engine 的 `Search` 通用二分求根，秒级精度。
 *
 * 缓存：模块级 Map，key 依赖 pair + tStart 日粒度 + tEnd 日粒度。
 */

import { AstroTime, Search } from 'astronomy-engine'
import { planetEquatorial, type PlanetKey } from './celestial'

export type { PlanetKey }

/** 一对行星（有序：按 PLANET_ORDER 排列） */
export type PlanetPair = readonly [PlanetKey, PlanetKey]

/**
 * 行星常规排序（由内向外），保证 pair 元组元素顺序稳定，
 * 也保证配色 / cache key 唯一。
 */
const PLANET_ORDER: readonly PlanetKey[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn']

/**
 * 五星 10 对：C(5,2) = 10
 * 顺序：水金/水火/水木/水土/金火/金木/金土/火木/火土/木土
 */
export const PLANET_PAIRS: readonly PlanetPair[] = (() => {
  const pairs: PlanetPair[] = []
  for (let i = 0; i < PLANET_ORDER.length; i++) {
    for (let j = i + 1; j < PLANET_ORDER.length; j++) {
      pairs.push([PLANET_ORDER[i]!, PLANET_ORDER[j]!] as const)
    }
  }
  return pairs
})()

/** 会合事件 */
export interface ConjunctionEvent {
  /** 精确会合时刻（UT） */
  date: Date
  /** 行星对（元素顺序与 PLANET_PAIRS 一致） */
  pair: PlanetPair
  /** 会合时刻两星共同赤经（度，0..360） */
  ra: number
}

/**
 * 会合周期（年）—— 用于设定粗筛步长
 * 来源：1 / |1/T_A − 1/T_B|，T 为行星恒星周期
 */
const SYNODIC_YEARS: Record<string, number> = {
  'mercury-venus': 0.395,
  'mercury-mars': 0.276,
  'mercury-jupiter': 0.245,
  'mercury-saturn': 0.242,
  'venus-mars': 0.914,
  'venus-jupiter': 0.649,
  'venus-saturn': 0.628,
  'mars-jupiter': 2.235,
  'mars-saturn': 2.009,
  'jupiter-saturn': 19.86
}

/** 平均一年天数（儒略年） */
const DAYS_PER_YEAR = 365.25

/** 把 pair 稳定序列化为 cache key */
export const pairKey = (pair: PlanetPair): string => `${pair[0]}-${pair[1]}`

/**
 * 把 (−180, 180] 内的差值归一化，处理 ±180° 边界。
 * 输入是任意 (−720, 720) 内的角度差。
 */
const normalizeSigned = (delta: number): number => {
  let d = delta % 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return d
}

/** 单点 Δα，返回归一化后的有符号度数 */
const deltaRaAt = (t: Date, a: PlanetKey, b: PlanetKey): number => {
  const raA = planetEquatorial(t, a).ra
  const raB = planetEquatorial(t, b).ra
  return normalizeSigned(raA - raB)
}

/**
 * 精确迭代求 [tStart, tEnd] 内 pair 的所有会合。
 * 结果按 date 升序返回。
 */
export function findConjunctions(
  pair: PlanetPair,
  tStart: Date,
  tEnd: Date
): ConjunctionEvent[] {
  if (tEnd.getTime() <= tStart.getTime()) return []

  const cached = readCache(pair, tStart, tEnd)
  if (cached) return cached

  const key = pairKey(pair)
  const synodicYr = SYNODIC_YEARS[key] ?? 1
  // 粗筛步长：会合周期的 1/6，最少 5 天
  const coarseStepDays = Math.max(5, (synodicYr * DAYS_PER_YEAR) / 6)
  const coarseStepMs = coarseStepDays * 86400 * 1000

  const events: ConjunctionEvent[] = []
  let tPrev = new Date(tStart.getTime())
  let dPrev = deltaRaAt(tPrev, pair[0], pair[1])

  while (tPrev.getTime() < tEnd.getTime()) {
    const nextMs = Math.min(tPrev.getTime() + coarseStepMs, tEnd.getTime())
    const tNext = new Date(nextMs)
    const dNext = deltaRaAt(tNext, pair[0], pair[1])

    // 变号且非 ±180° 跨越（真会合时 Δα 从 −ε → +ε 或反之，跨越幅度 < 180°）
    if (dPrev * dNext < 0 && Math.abs(dPrev - dNext) < 180) {
      const evt = refineConjunction(pair, tPrev, tNext)
      if (evt) events.push(evt)
    }

    tPrev = tNext
    dPrev = dNext
  }

  writeCache(pair, tStart, tEnd, events)
  return events
}

/**
 * 二分精求：在 [t1, t2] 内找 Δα = 0 的时刻。
 *
 * Search 要求函数从负穿越到非负（升序过零）。会合分两种方向：
 *   A 越过 B（Δα: − → +）—— f = Δα
 *   B 越过 A（Δα: + → −）—— f = −Δα
 * 用 dPrev 符号自动选择方向。
 */
function refineConjunction(
  pair: PlanetPair,
  t1: Date,
  t2: Date
): ConjunctionEvent | null {
  const at1 = new AstroTime(t1)
  const at2 = new AstroTime(t2)
  const d1 = deltaRaAt(t1, pair[0], pair[1])
  const sign = d1 < 0 ? 1 : -1  // sign * Δα 从负升到正
  const f = (t: AstroTime): number => sign * deltaRaAt(t.date, pair[0], pair[1])

  const found = Search(f, at1, at2, { dt_tolerance_seconds: 1 })
  if (!found) return null

  const raA = planetEquatorial(found.date, pair[0]).ra
  return {
    date: new Date(found.date.getTime()),
    pair,
    ra: raA
  }
}

/**
 * 找到 t 之后（含）最近一次会合，跨 10 对全体。
 *
 * 策略：以最长会合周期（木-土 ≈ 20 年）为向前扫描窗口的上限；
 * 对每对行星并列扫描 [t, t + 25 年]，取最小 date 作为起点。
 */
export function findNextConjunctionAfter(t: Date): ConjunctionEvent | null {
  const tEnd = new Date(t.getTime() + 25 * DAYS_PER_YEAR * 86400 * 1000)
  let best: ConjunctionEvent | null = null

  for (const pair of PLANET_PAIRS) {
    const evts = findConjunctions(pair, t, tEnd)
    if (!evts.length) continue
    const first = evts[0]!
    if (!best || first.date.getTime() < best.date.getTime()) {
      best = first
    }
  }
  return best
}

// ────────────────────────────────────────────────────────────
// 缓存：模块级 Map。key = pairKey + tStart 日粒度 + tEnd 日粒度。
// ────────────────────────────────────────────────────────────

/** 到「日」粒度对齐（UTC 天） */
const toDayKey = (d: Date): string => {
  const t = d.getTime()
  return String(Math.floor(t / 86400000))
}

const cache = new Map<string, ConjunctionEvent[]>()
const MAX_CACHE = 100

function readCache(pair: PlanetPair, tStart: Date, tEnd: Date): ConjunctionEvent[] | null {
  const k = `${pairKey(pair)}|${toDayKey(tStart)}|${toDayKey(tEnd)}`
  return cache.get(k) ?? null
}

function writeCache(
  pair: PlanetPair,
  tStart: Date,
  tEnd: Date,
  events: ConjunctionEvent[]
): void {
  const k = `${pairKey(pair)}|${toDayKey(tStart)}|${toDayKey(tEnd)}`
  if (cache.size >= MAX_CACHE) {
    // FIFO 淘汰最老一条
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(k, events)
}
