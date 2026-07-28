import type { PointRingData } from './types'
import { SOLAR_TERMS_LICHUN_ORDER, SOLAR_TERM_CARDINALS } from '@/utils/constants/solarTerms'

/**
 * 二十四节气（点导向）
 *
 * 节气本质是太阳黄经的精确点，不是区间段：
 * - 立春 = 黄经 315°
 * - 雨水 = 黄经 330°
 * - ...以此类推，每 15°一个节气
 *
 * 因此使用 PointRing（点圆环）而非 CircleRing（段圆环）来渲染。
 */

/** 每个节气对应精确的黄经（每15°一个） */
function buildTerms(): PointRingData['items'] {
  return SOLAR_TERMS_LICHUN_ORDER.map((label, i) => {
    const angle = i * 15
    const isSpecial = SOLAR_TERM_CARDINALS.has(label)
    return {
      label,
      angle,
      fontSize: isSpecial ? 13 : 11,
      pointSize: isSpecial ? 5 : 4,
      pointSymbol: isSpecial ? 'tick' as const : 'circle' as const,
      pointColor: isSpecial ? '#ffdd00' : '#ffffff',
      color: isSpecial ? '#ffdd00' : '#ffffff'
    }
  })
}

/** 二十四节气：24 个精确黄经点（点导向，标准刻度样式）
 *
 * 推荐使用 tick 符号作为标准刻度样式：
 *   pointSymbol: 'tick'
 *   pointSize: 8        // stroke-width = 0.8px
 *   labelOffset: -16    // 标签向内偏移避开刻度
 */
export const twentyFourSolarTerms: PointRingData = {
  startDegree: -45,
  radius: 480,
  innerRadius: 456,
  labelColor: 'white',
  labelOffset: 12,
  circleColor: '#666666',
  circleWidth: 0.5,
  pointSize: 4,
  pointColor: '#ffffff',
  pointSymbol: 'circle',
  items: buildTerms()
}
