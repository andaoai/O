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

/**
 * 计算月亮时角，用于将实际时间映射到圆形轨道的角度
 * 月亮的周期约为29.53天（朔望月），这里简化为基于时间的计算
 *
 * @param date 日期时间，默认为当前时间
 * @returns 月亮角度 (0-360度)
 */
export function calculateLunarHourAngle(date: Date = new Date()): number {
  try {
    // 获取本地时间
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()
    const dayOfMonth = date.getDate()

    // 计算总秒数
    const totalSeconds = hours * 3600 + minutes * 60 + seconds

    // 月亮每天大约东移13.2度（360度/27.32天）
    // 加上当天的时间推移
    const dailyMotion = ((dayOfMonth - 1) * 13.2) % 360
    const dailyProgress = (totalSeconds / 86400) * 13.2

    // 月亮的起始角度（可以调整以匹配实际月相）
    const baseLunarAngle = 180 // 月亮从东方升起，与太阳相对

    const angle = (baseLunarAngle + dailyMotion + dailyProgress) % 360

    return angle
  } catch (error) {
    console.error('计算月亮时角失败:', error)
    return 180 // 默认返回东方位置
  }
}

/**
 * 根据当前时间计算月亮在圆形轨道上的角度
 * 实现月亮基于日期和时间的动态定位
 *
 * @param baseAngle 基准角度，用于校准
 * @param date 日期时间
 * @returns 月亮在轨道上的角度 (0-360度)
 */
export function calculateLunarOrbitAngle(baseAngle: number = 0, date: Date = new Date()): number {
  // 获取月亮时角
  const hourAngle = calculateLunarHourAngle(date)

  // 将时角映射到轨道角度
  const orbitAngle = (baseAngle + hourAngle) % 360

  return orbitAngle
}

/**
 * 创建一个响应式的月亮角度计算器
 * 用于Vue组件中实时更新月亮位置
 *
 * @param baseAngle 基准角度
 * @param updateInterval 更新间隔（毫秒）
 */
export function createLunarAngleCalculator(baseAngle: number = 0, updateInterval: number = 1000) {
  let intervalId: ReturnType<typeof setInterval> | null = null
  const currentAngle = ref(baseAngle)

  const start = () => {
    if (intervalId) return

    intervalId = setInterval(() => {
      currentAngle.value = calculateLunarOrbitAngle(baseAngle)
    }, updateInterval)
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  // 立即计算一次
  currentAngle.value = calculateLunarOrbitAngle(baseAngle)

  return {
    currentAngle: readonly(currentAngle),
    start,
    stop
  }
}