/**
 * 二十四节气常量 · 单一真理源
 *
 * ═══════════════════════════════════════════════════════════════
 *  历史上 24 节气名字数组以不同起序散落多处：
 *    - 立春起序：JianJiangSolarTermsRing / SolarTermsSkyRing
 *    - 冬至起序：utils/chineseCalendar.ts（tyme4ts 索引约定）
 *  这里统一收敛并同时导出两套顺序 + 元数据（节/中气 判定、二分二至集合）。
 *
 *  纯常量 + 纯函数，无副作用。
 *
 *  ⚠️ 术语约定：
 *   - 节 (jié)：立春/惊蛰/清明…12 个「奇数序（立春起）」，标记月建切换
 *   - 中气：雨水/春分/谷雨…12 个「偶数序（立春起）」，标记月将切换
 *   - 二分二至：春分/夏至/秋分/冬至，四时天文基准
 *   - 冬至起序里，中气恰好是「偶数索引」（0,2,4,…）
 * ═══════════════════════════════════════════════════════════════
 */

import { normalizeAngle } from '../geometry'

/**
 * 立春起序（黄经 315° 起、每 15° 一气）
 *
 * 用途：三个环组件（JianJiang / SolarTermsSky / 建将节气）直接消费。
 * 索引 i ∈ [0, 23]：立春=0、雨水=1、惊蛰=2…大寒=23
 * 偶数 = 节；奇数 = 中气。
 */
export const SOLAR_TERMS_LICHUN_ORDER = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
] as const

/**
 * 冬至起序（tyme4ts 索引约定：冬至=0）
 *
 * 用途：chineseCalendar.ts 与 tyme4ts API 对接。
 * 偶数 = 中气；奇数 = 节。
 */
export const SOLAR_TERMS_DONGZHI_ORDER = [
  '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
  '春分', '清明', '谷雨', '立夏', '小满', '芒种',
  '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'
] as const

/** 二分二至：四时天文基准（春分/夏至/秋分/冬至） */
export const SOLAR_TERM_CARDINALS: ReadonlySet<string> = new Set([
  '春分', '夏至', '秋分', '冬至'
])

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
export const currentLichunIndex = (sunLon: number): number =>
  Math.floor(normalizeAngle(sunLon - 315) / 15)

/** 由立春起序索引判定：偶数索引 = 节 (立春/惊蛰/清明…) */
export const isJieqi = (lichunIndex: number): boolean => lichunIndex % 2 === 0

/** 由立春起序索引判定：奇数索引 = 中气 (雨水/春分/谷雨…) */
export const isZhongqi = (lichunIndex: number): boolean => lichunIndex % 2 === 1
