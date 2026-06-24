/**
 * 七曜入宿计算（赤经口径，天极投影星图）
 *
 * 二十八宿是赤道坐标体系：每宿由距星界定，宿区间 = [本宿距星赤经, 下一宿距星赤经)。
 * 七曜（日月五星）取当前历元赤经，落入哪个区间即入哪个宿。
 * 赤经均含岁差（ofdate），与距星同口径，故木星(赤经120.9°)正确落在井(96.1°)~鬼(124.5°)间。
 */

import { LUNAR_MANSIONS } from '@/data/lunarMansions'
import {
  PLANETS_CONFIG,
  planetEquatorial,
  moonEquatorial,
  fixedStarEquatorial,
  normalizeDegree,
  type PlanetKey
} from './celestial'

/** 命中的宿信息 */
export interface MansionHit {
  /** 宿名（角/亢/氐……） */
  label: string
  /** 宿的颜色 */
  color: string
  /** 在该宿内的度数（赤经 - 本宿距星赤经） */
  degreeInMansion: number
}

/** 单颗天体的落宿结果（五星或月亮） */
export interface PlanetMansion {
  /** 键名（五星键名或 'moon'） */
  key: PlanetKey | 'moon'
  /** 中文名 */
  name: string
  /** 符号 */
  symbol: string
  /** 颜色 */
  color: string
  /** 赤经（0-360 度，当前历元） */
  ra: number
  /** 命中的宿（区间覆盖整圈，正常不会返回 null） */
  mansion: MansionHit | null
}

/** 宿的赤经区间（当前历元） */
export interface MansionSpan {
  label: string
  color: string
  /** 本宿距星赤经（区间起点） */
  startRa: number
  /** 下一宿距星赤经（区间终点，可能跨 360°） */
  endRa: number
}

/**
 * 计算当前历元下二十八宿的赤经区间
 *
 * 每宿区间 = [本宿距星赤经, 下一宿距星赤经)，末宿环绕回首宿。
 *
 * @param time 观测时刻
 */
export const getMansionSpans = (time: Date): MansionSpan[] => {
  // 先算出全部距星当前赤经
  const ras = LUNAR_MANSIONS.map((m, i) =>
    fixedStarEquatorial(time, m.raJ2000, m.decJ2000, m.distanceLy, i).ra
  )
  return LUNAR_MANSIONS.map((m, i) => ({
    label: m.label,
    color: m.color,
    startRa: ras[i] ?? 0,
    endRa: ras[(i + 1) % LUNAR_MANSIONS.length] ?? 0
  }))
}

/**
 * 判断某赤经落在哪个宿
 *
 * @param ra 赤经（度）
 * @param spans 宿区间（getMansionSpans 的结果）
 */
export const findMansion = (ra: number, spans: MansionSpan[]): MansionHit | null => {
  const r = normalizeDegree(ra)
  for (const span of spans) {
    // 区间长度（处理跨 360°）
    const len = normalizeDegree(span.endRa - span.startRa)
    const off = normalizeDegree(r - span.startRa)
    if (off < len) {
      return { label: span.label, color: span.color, degreeInMansion: off }
    }
  }
  return null
}

/**
 * 计算五星 + 月亮当前各自落在哪个宿（赤经口径）
 *
 * @param time 观测时刻
 */
export const getPlanetMansions = (time: Date): PlanetMansion[] => {
  const spans = getMansionSpans(time)

  const result: PlanetMansion[] = (Object.keys(PLANETS_CONFIG) as PlanetKey[]).map((key) => {
    const config = PLANETS_CONFIG[key]
    const { ra } = planetEquatorial(time, key)
    return {
      key,
      name: config.name,
      symbol: config.symbol,
      color: config.color,
      ra,
      mansion: findMansion(ra, spans)
    }
  })

  // 追加月亮
  const { ra: moonRa } = moonEquatorial(time)
  result.push({
    key: 'moon',
    name: '月亮',
    symbol: '月',
    color: '#c0c0c0',
    ra: moonRa,
    mansion: findMansion(moonRa, spans)
  })

  return result
}
