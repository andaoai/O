import type { RingData } from './types'

/** 八门：每个 45 度，从开门 0 度起顺时针 */
export const eightGates: RingData = {
  startDegree: 0,
  radius: 220,
  innerRadius: 190,
  circleColor: '#888888',
  tickColor: '#666666',
  tickWidth: 0.8,
  fontSize: 14,
  items: [
    { label: '开', color: '#FF6B6B', startAngle: 0, endAngle: 45 },     // 开门，红色
    { label: '休', color: '#4ECDC4', startAngle: 45, endAngle: 90 },    // 休门，青色
    { label: '生', color: '#45B7D1', startAngle: 90, endAngle: 135 },   // 生门，蓝色
    { label: '伤', color: '#96CEB4', startAngle: 135, endAngle: 180 },  // 伤门，绿色
    { label: '杜', color: '#FFEAA7', startAngle: 180, endAngle: 225 },  // 杜门，黄色
    { label: '景', color: '#DDA0DD', startAngle: 225, endAngle: 270 },  // 景门，紫色
    { label: '死', color: '#708090', startAngle: 270, endAngle: 315 },  // 死门，灰色
    { label: '惊', color: '#FFB6C1', startAngle: 315, endAngle: 360 }   // 惊门，粉色
  ]
}
