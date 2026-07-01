/**
 * 月相计算工具函数
 *
 * 基于日月黄经差（elongation）推导月相角、亮面比例、月龄和相位名称。
 * 所有函数均为纯函数，可独立单元测试。
 *
 * 关键概念：
 * - 月相角 D = 月球黄经 − 太阳黄经，归一化到 [0, 360)
 *   D = 0°   → 朔（新月）
 *   D = 90°  → 上弦
 *   D = 180° → 望（满月）
 *   D = 270° → 下弦
 * - 亮面比例 k = (1 − cos D) / 2
 * - 月龄 ≈ D / 360 × 平均朔望月长度（29.530588 天）
 */

import { moonPosition, normalizeDegree, sunLongitude } from './celestial'

/** 平均朔望月长度，单位：天 */
export const SYNODIC_MONTH_DAYS = 29.530588

/** 中文月相名 */
export type MoonPhaseName =
  | '朔'
  | '蛾眉'
  | '上弦'
  | '盈凸'
  | '望'
  | '亏凸'
  | '下弦'
  | '残月'

/**
 * 计算月相角（日月黄经差）。
 *
 * @param time 时间
 * @returns 月相角 [0, 360)，0=朔，90=上弦，180=望，270=下弦
 */
export function moonPhaseAngle(time: Date): number {
  return normalizeDegree(moonPosition(time).longitude - sunLongitude(time))
}

/**
 * 计算月面亮度比例。
 *
 * 公式：k = (1 − cos D) / 2
 * D = 0°   → k = 0，新月
 * D = 180° → k = 1，满月
 *
 * @param time 时间
 * @returns 亮面比例 [0, 1]
 */
export function moonIllumination(time: Date): number {
  const angle = moonPhaseAngle(time)
  const rad = (angle * Math.PI) / 180
  return (1 - Math.cos(rad)) / 2
}

/**
 * 计算近似月龄。
 *
 * 注：基于月相角线性映射到平均朔望月，并非搜索真实朔时刻。
 * 接近朔/望时可能与天文历书相差数小时到十数小时。
 *
 * @param time 时间
 * @returns 月龄，单位：天，[0, 29.530588)
 */
export function moonAge(time: Date): number {
  return (moonPhaseAngle(time) / 360) * SYNODIC_MONTH_DAYS
}

/**
 * 根据月相角返回中文相位名称。
 *
 * 采用 8 相位居中划分：
 *   337.5°~22.5°  朔
 *   22.5°~67.5°   蛾眉
 *   67.5°~112.5°  上弦
 *   112.5°~157.5° 盈凸
 *   157.5°~202.5° 望
 *   202.5°~247.5° 亏凸
 *   247.5°~292.5° 下弦
 *   292.5°~337.5° 残月
 *
 * @param phaseAngle 月相角
 * @returns 中文相位名
 */
export function moonPhaseName(phaseAngle: number): MoonPhaseName {
  const a = normalizeDegree(phaseAngle)

  if (a >= 337.5 || a < 22.5) return '朔'
  if (a < 67.5) return '蛾眉'
  if (a < 112.5) return '上弦'
  if (a < 157.5) return '盈凸'
  if (a < 202.5) return '望'
  if (a < 247.5) return '亏凸'
  if (a < 292.5) return '下弦'
  return '残月'
}

/**
 * 判断当前是否处于盈月阶段。
 *
 * 0° ~ 180°  为盈：朔 → 上弦 → 望，亮面朝右
 * 180° ~ 360° 为亏：望 → 下弦 → 朔，亮面朝左
 *
 * @param phaseAngle 月相角
 * @returns true = 盈月，false = 亏月
 */
export function isWaxing(phaseAngle: number): boolean {
  const a = normalizeDegree(phaseAngle)
  return a >= 0 && a < 180
}
