/**
 * 二十四节气纯函数工具
 *
 * ═══════════════════════════════════════════════════════════════
 *  从 constants/solarTerms.ts 分离而来。
 *
 *  constants/ 只保留纯数据（数组、集合），零依赖。
 *  依赖 geometry.normalizeAngle 的函数归入本文件。
 *
 *  纯函数，无副作用，独立可测试。
 * ═══════════════════════════════════════════════════════════════
 */

import { normalizeAngle } from './geometry'

/**
 * 由太阳黄经取当前节气索引（立春起序，0-23）。
 *
 * 立春位于黄经 315°，`(sunLon - 315) mod 360` 归一化到 [0, 360)
 * 后每 15° 一格。
 *
 * @example
 *   currentLichunIndex(315)  // 0 → 立春
 *   currentLichunIndex(0)    // 3 → 春分（黄经 0°）
 *   currentLichunIndex(90)   // 9 → 夏至（黄经 90°）
 */
export function currentLichunIndex(sunLon: number): number {
  return Math.floor(normalizeAngle(sunLon - 315) / 15)
}

/** 由立春起序索引判定：偶数索引 = 节 (立春/惊蛰/清明…) */
export function isJieqi(lichunIndex: number): boolean {
  return lichunIndex % 2 === 0
}

/** 由立春起序索引判定：奇数索引 = 中气 (雨水/春分/谷雨…) */
export function isZhongqi(lichunIndex: number): boolean {
  return lichunIndex % 2 === 1
}
