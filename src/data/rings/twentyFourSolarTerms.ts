import type { PointRingData } from './types'

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

const names = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
]

/** 每个节气对应精确的黄经（每15°一个） */
function buildTerms(): PointRingData['items'] {
  return names.map((label, i) => {
    const angle = i * 15
    // 二分二至（春分、夏至、秋分、冬至）用特殊标记
    const isSpecial = label === '春分' || label === '夏至' || label === '秋分' || label === '冬至'
    return {
      label,
      angle,
      fontSize: isSpecial ? 13 : 11,
      pointSize: isSpecial ? 5 : 4,
      pointSymbol: isSpecial ? 'diamond' as const : 'circle' as const,
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
