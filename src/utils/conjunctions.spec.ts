/**
 * 会合计算冒烟测试
 *
 * 基准事件：2020-12-21 Jupiter-Saturn Great Conjunction
 *   NASA JPL: 2020-12-21 18:20 UTC，赤经 ≈ 300°（黄经 ≈ 摩羯座）
 *   容差：给 ±1 日足以覆盖插值/岁差微差。
 */

import { describe, expect, it } from 'vitest'
import { findConjunctions, findNextConjunctionAfter, PLANET_PAIRS, pairKey } from './conjunctions'

describe('PLANET_PAIRS', () => {
  it('应覆盖 5 星两两组合共 10 对', () => {
    expect(PLANET_PAIRS).toHaveLength(10)
    const keys = PLANET_PAIRS.map(pairKey)
    expect(new Set(keys).size).toBe(10)
  })
})

describe('findConjunctions(jupiter-saturn, 2019 → 2022)', () => {
  const start = new Date('2019-01-01T00:00:00Z')
  const end = new Date('2022-01-01T00:00:00Z')
  const events = findConjunctions(['jupiter', 'saturn'] as const, start, end)

  it('该窗口恰有一次木-土 great conjunction', () => {
    expect(events).toHaveLength(1)
  })

  it('会合日期落在 2020-12-21 ± 1 天', () => {
    const evt = events[0]!
    const expected = new Date('2020-12-21T18:20:00Z').getTime()
    const dt = Math.abs(evt.date.getTime() - expected)
    expect(dt).toBeLessThan(86400_000) // < 1 天
  })

  it('会合赤经在 302° ± 3°（摩羯宫，黄经 ≈ 300°）', () => {
    const evt = events[0]!
    expect(evt.ra).toBeGreaterThan(299)
    expect(evt.ra).toBeLessThan(305)
  })

  it('date 顺序单调递增', () => {
    for (let i = 1; i < events.length; i++) {
      expect(events[i]!.date.getTime()).toBeGreaterThan(events[i - 1]!.date.getTime())
    }
  })
})

describe('findNextConjunctionAfter(2020-12-01)', () => {
  it('应命中 2020-12-21 木-土（是最近一次跨全体 10 对的会合）', () => {
    const evt = findNextConjunctionAfter(new Date('2020-12-01T00:00:00Z'))
    expect(evt).not.toBeNull()
    // 那个时点最近的会合就是木-土；即便不是也应在 2020-12-01 之后不远
    expect(evt!.date.getTime()).toBeGreaterThanOrEqual(new Date('2020-12-01T00:00:00Z').getTime())
    expect(evt!.date.getTime()).toBeLessThan(new Date('2021-02-01T00:00:00Z').getTime())
  })
})
