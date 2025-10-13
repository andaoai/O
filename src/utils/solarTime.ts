import * as Astronomy from 'astronomy-engine'
import { ref, readonly } from 'vue'

/**
 * 计算太阳时角，用于将实际时间映射到圆形轨道的角度
 * 简化版本：基于本地时间计算，0点00分对应0度
 *
 * @param date 日期时间，默认为当前时间
 * @returns 太阳角度 (0-360度)
 */
export function calculateSolarHourAngle(date: Date = new Date()): number {
  try {
    // 获取本地时间
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()

    // 计算总秒数
    const totalSeconds = hours * 3600 + minutes * 60 + seconds

    // 一天有86400秒，计算太阳在24小时周期中的角度
    // 0点00分 = 0度，12点00分 = 180度
    const angle = (totalSeconds / 86400) * 360

    return angle
  } catch (error) {
    console.error('计算太阳时角失败:', error)
    return 0
  }
}

/**
 * 根据当前时间计算太阳在圆形轨道上的角度
 * 实现太阳0点00分对应0度的需求
 *
 * @param baseAngle 基准角度，用于校准
 * @param date 日期时间
 * @returns 太阳在轨道上的角度 (0-360度)
 */
export function calculateSolarOrbitAngle(baseAngle: number = 0, date: Date = new Date()): number {
  // 获取太阳时角
  const hourAngle = calculateSolarHourAngle(date)

  // 将时角映射到轨道角度
  // 这里可以根据实际需求调整映射关系
  const orbitAngle = (baseAngle + hourAngle) % 360

  return orbitAngle
}

/**
 * 创建一个响应式的太阳角度计算器
 * 用于Vue组件中实时更新太阳位置
 *
 * @param baseAngle 基准角度
 * @param updateInterval 更新间隔（毫秒）
 */
export function createSolarAngleCalculator(baseAngle: number = 0, updateInterval: number = 1000) {
  let intervalId: ReturnType<typeof setInterval> | null = null
  const currentAngle = ref(baseAngle)

  const start = () => {
    if (intervalId) return

    intervalId = setInterval(() => {
      currentAngle.value = calculateSolarOrbitAngle(baseAngle)
    }, updateInterval)
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  // 立即计算一次
  currentAngle.value = calculateSolarOrbitAngle(baseAngle)

  return {
    currentAngle: readonly(currentAngle),
    start,
    stop
  }
}