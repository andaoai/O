import type { RingData } from './types'

/** 四象：每个 90 度，按传统方位（青龙东/朱雀南/白虎西/玄武北） */
export const siXiang: RingData = {
  startDegree: 0,
  radius: 230,
  innerRadius: 200,
  circleColor: '#888888',
  circleWidth: 2,
  tickColor: '#666666',
  tickWidth: 1,
  fontSize: 16,
  items: [
    { label: '青龙', color: '#00C853', startAngle: 315, endAngle: 45 },   // 东方·木·春
    { label: '朱雀', color: '#FF5722', startAngle: 45, endAngle: 135 },   // 南方·火·夏
    { label: '白虎', color: '#F5F5F5', startAngle: 135, endAngle: 225 },  // 西方·金·秋
    { label: '玄武', color: '#1565C0', startAngle: 225, endAngle: 315 }   // 北方·水·冬
  ]
}
