import type { RingData, RingItem } from './types'

/** 二十四节气，按立春起顺序 */
const names = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
]

/** 每个节气占 15 度（360/24） */
function buildTerms(): RingItem[] {
  return names.map((label, i) => ({
    label,
    startAngle: i * 15,
    endAngle: (i + 1) * 15,
    fontSize: 12
  }))
}

/** 二十四节气：24 格，每格 15 度 */
export const twentyFourSolarTerms: RingData = {
  startDegree: -45,
  radius: 460,
  innerRadius: 440,
  labelColor: 'white',
  circleColor: '#666666',
  circleWidth: 0.5,
  tickColor: '#888888',
  tickWidth: 0.5,
  items: buildTerms()
}
