import type { RingData } from './types'

/** 十天干空亡：每个 30 度，甲从 345 度起，末两格为空亡 */
export const tianganKongwang: RingData = {
  startDegree: -30,
  radius: 310,
  innerRadius: 280,
  circleColor: '#888888',
  tickColor: '#666666',
  tickWidth: 0.8,
  items: [
    { label: '甲', color: '#2E7D32', startAngle: 345, endAngle: 15 },   // 阳木，深绿
    { label: '乙', color: '#66BB6A', startAngle: 15, endAngle: 45 },    // 阴木，浅绿
    { label: '丙', color: '#FF9800', startAngle: 45, endAngle: 75 },    // 阳火，橙色
    { label: '丁', color: '#FF5722', startAngle: 75, endAngle: 105 },   // 阴火，深橙
    { label: '戊', color: '#795548', startAngle: 105, endAngle: 135 },  // 阳土，棕色
    { label: '己', color: '#8D6E63', startAngle: 135, endAngle: 165 },  // 阴土，浅棕
    { label: '庚', color: '#FFEB3B', startAngle: 165, endAngle: 195 },  // 阳金，金色
    { label: '辛', color: '#FFC107', startAngle: 195, endAngle: 225 },  // 阴金，淡金
    { label: '壬', color: '#03A9F4', startAngle: 225, endAngle: 255 },  // 阳水，蓝色
    { label: '癸', color: '#00BCD4', startAngle: 255, endAngle: 285 },  // 阴水，青蓝
    { label: '空', color: '#9E9E9E', startAngle: 285, endAngle: 315 },  // 空亡，灰色
    { label: '亡', color: '#607D8B', startAngle: 315, endAngle: 345 }   // 空亡，蓝灰
  ]
}
