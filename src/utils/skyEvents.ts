/**
 * 天象事件 → 落宿 映射
 *
 * 把「合 / 冲」两类天象事件，按发生位置归类到二十八宿，供二十八宿环高亮与事件名标注。
 *
 * 级别约定：
 *   1 微亮：仅单曜路过（在 view 里判定，本模块不产出）
 *   2 中亮：合 / 冲
 *
 * 口径：宿用当前历元赤经（与 getMansionSpans 同口径），故事件落宿一律转赤经后判定。
 */

import {
  detectAspects,
  formatAspect,
  sunEquatorial,
  moonEquatorial,
  planetEquatorial,
  normalizeDegree,
  type LuminaryKey,
  type PlanetKey
} from './celestial'
import { getMansionSpans, findMansion } from './planetMansion'

/** 某宿当前的事件高亮信息 */
export interface MansionEvent {
  /** 高亮级别：2 中亮（合/冲） */
  level: 2
  /** 该宿的事件名文案（可能多个） */
  events: string[]
}

/** 七曜当前历元赤经（落宿用，与 getMansionSpans 同口径） */
const luminaryRa = (time: Date, key: LuminaryKey): number => {
  if (key === 'sun') return sunEquatorial(time).ra
  if (key === 'moon') return moonEquatorial(time).ra
  return planetEquatorial(time, key as PlanetKey).ra
}

/** 两赤经的圆周中点（处理 360° 环绕） */
const raMidpoint = (raA: number, raB: number): number => {
  const a = normalizeDegree(raA)
  let b = normalizeDegree(raB)
  if (Math.abs(a - b) > 180) b += b < a ? 360 : -360
  return normalizeDegree((a + b) / 2)
}

/**
 * 计算当前时刻各宿的事件高亮表
 *
 * @param time 观测时刻
 * @param aspectTol 合/冲容差（度，传给 detectAspects）
 */
export const getMansionEvents = (
  time: Date,
  aspectTol = 6
): Map<string, MansionEvent> => {
  const spans = getMansionSpans(time)
  const result = new Map<string, MansionEvent>()

  /** 把一个事件登记到某宿，合并文案 */
  const register = (label: string | undefined, text: string) => {
    if (!label) return
    const cur = result.get(label)
    if (!cur) {
      result.set(label, { level: 2, events: [text] })
    } else {
      if (!cur.events.includes(text)) cur.events.push(text)
    }
  }

  // 合 / 冲：合取两曜赤经中点落宿；冲绑定非太阳端落宿
  for (const e of detectAspects(time, aspectTol)) {
    let ra: number
    if (e.kind === 'conjunction') {
      ra = raMidpoint(luminaryRa(time, e.a), luminaryRa(time, e.b))
    } else {
      // 冲：另一端恒为太阳，绑定非太阳那一端（望→月、行星冲日→行星）
      const anchor: LuminaryKey = e.a === 'sun' ? e.b : e.a
      ra = luminaryRa(time, anchor)
    }
    register(findMansion(ra, spans)?.label, formatAspect(e))
  }

  return result
}
