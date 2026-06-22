import type { RingData, RingItem } from './types'

/** 十二长生名 */
const longevityNames = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']

/** 五组配色，每组三档深浅 */
const elementColors = [
  ['#FF6B6B', '#FF8A8A', '#FFA9A9'], // 第一组 - 红
  ['#4ECDC4', '#6FE0DC', '#90E2DE'], // 第二组 - 青
  ['#45B7D1', '#66C6DD', '#87D5E9'], // 第三组 - 蓝
  ['#96CEB4', '#A7D9C5', '#B8E4D6'], // 第四组 - 绿
  ['#FFEAA7', '#FFEDBB', '#FFF0CF']  // 第五组 - 黄
]

/** 5 组 × 12 格，每组 72 度，每格 6 度 */
function buildLongevity(): RingItem[] {
  const items: RingItem[] = []
  for (let group = 0; group < 5; group++) {
    for (let i = 0; i < 12; i++) {
      const startAngle = group * 72 + i * 6
      items.push({
        label: longevityNames[i]!,
        color: elementColors[group]![i % 3]!,
        startAngle,
        endAngle: startAngle + 6
      })
    }
  }
  return items
}

/** 十二长生：5 组 × 12 格，双字竖排 */
export const twelveLongevity: RingData = {
  startDegree: 0,
  radius: 310,
  innerRadius: 280,
  circleColor: '#888888',
  tickColor: '#666666',
  tickWidth: 0.6,
  fontSize: 13,
  verticalTwoChar: true,
  items: buildLongevity()
}
