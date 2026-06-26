/**
 * 七曜天体环数据构造器
 *
 * ⚠️ 【唯一真相源】
 * 这是项目中七曜（日月五星）配置的唯一数据源。
 * 所有组件（SkyChart、HelioOrbits、SevenLuminariesRing 等）
 * 都应该从这里导入配置，而不是自行定义。
 *
 * 典型用法：
 *   - singlePlanetBody('jupiter') → 单行星研究盘
 *   - twoPlanetsBody('jupiter', 'saturn') → 双行星合冲对照
 *   - sevenLuminariesBody() → 七曜全图
 */

import type { BodyRingData, LuminaryKey } from './types'

/** 七曜 key 列表（顺序：日→月→水→金→火→木→土） */
export const LUMINARY_KEYS: LuminaryKey[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']

/**
 * 七曜视觉配置（唯一真相源）
 *
 * 所有组件共享同一套配置，确保：
 *   - 太阳/月亮/五星在任何场景下颜色、大小、符号一致
 *   - 修改一处，全局生效
 *   - 光晕层级统一：haloSizes[0] 为内圈光晕，haloSizes[1] 为外圈光晕
 */
export interface LuminaryVisualConfig {
  /** 中文名 */
  name: string
  /** 单字符号 */
  symbol: string
  /** 本体颜色 */
  color: string
  /** 标准本体半径（像素） */
  size: number
  /** 光晕尺寸配置 [内圈, 外圈]（相对于 size 的偏移量） */
  haloSizes: [number, number]
}

export const LUMINARY_CONFIG: Record<LuminaryKey, LuminaryVisualConfig> = {
  sun: { name: '太阳', symbol: '日', color: '#ffdd00', size: 13, haloSizes: [4, 7] },
  moon: { name: '月亮', symbol: '月', color: '#c0c0c0', size: 9, haloSizes: [4, 6] },
  mercury: { name: '水星', symbol: '水', color: '#8C8C8C', size: 8, haloSizes: [3, 5] },
  venus: { name: '金星', symbol: '金', color: '#FFC649', size: 10, haloSizes: [3, 5] },
  mars: { name: '火星', symbol: '火', color: '#CD5C5C', size: 9, haloSizes: [3, 5] },
  jupiter: { name: '木星', symbol: '木', color: '#DAA520', size: 12, haloSizes: [4, 6] },
  saturn: { name: '土星', symbol: '土', color: '#F4E7D7', size: 11, haloSizes: [4, 6] }
} as const

/**
 * 根据场景计算天体实际尺寸（带缩放系数）
 * @param key 七曜 key
 * @param scale 缩放系数（默认 1.0，日心盘可设 0.7）
 */
export function getLuminarySize(key: LuminaryKey, scale = 1.0): number {
  return Math.round(LUMINARY_CONFIG[key].size * scale)
}

/**
 * 根据场景计算天体光晕配置（带缩放系数）
 * @param key 七曜 key
 * @param scale 缩放系数
 * @param opacity 透明度系数
 */
export function getLuminaryHalos(key: LuminaryKey, scale = 1.0, opacity = 0.25) {
  const cfg = LUMINARY_CONFIG[key]
  return cfg.haloSizes.map((offset) => ({
    radius: Math.round((cfg.size + offset) * scale),
    opacity
  }))
}

/**
 * 构造单行星天体环（最常用：单独研究某一行星）
 *
 * @param key 行星键名
 * @param angle 角度（黄经或赤经）
 * @param options 额外选项
 */
export function singlePlanetBody(
  key: LuminaryKey,
  angle: number,
  options?: {
    retrograde?: boolean
    latitude?: number
    highlightLevel?: 0 | 1 | 2 | 3
    mansion?: { label: string; degree: number }
  }
): BodyRingData {
  const cfg = LUMINARY_CONFIG[key]
  return {
    items: [
      {
        label: cfg.name,
        symbol: cfg.symbol,
        color: cfg.color,
        kind: key,
        angle,
        size: cfg.size,
        highlightLevel: options?.highlightLevel || 2,
        state: {
          retrograde: options?.retrograde,
          latitude: options?.latitude,
          mansion: options?.mansion
        }
      }
    ],
    latScale: 40,
    showLatLine: true,
    showRetrogradeRing: true,
    circleColor: '#444444',
    circleWidth: 0.5
  }
}

/**
 * 构造双行星天体环（用于合冲对照研究）
 */
export function twoPlanetsBody(
  key1: LuminaryKey,
  angle1: number,
  key2: LuminaryKey,
  angle2: number,
  options?: { retrograde1?: boolean; retrograde2?: boolean }
): BodyRingData {
  const cfg1 = LUMINARY_CONFIG[key1]
  const cfg2 = LUMINARY_CONFIG[key2]
  return {
    items: [
      {
        label: cfg1.name,
        symbol: cfg1.symbol,
        color: cfg1.color,
        kind: key1,
        angle: angle1,
        size: cfg1.size,
        highlightLevel: 2,
        state: { retrograde: options?.retrograde1 }
      },
      {
        label: cfg2.name,
        symbol: cfg2.symbol,
        color: cfg2.color,
        kind: key2,
        angle: angle2,
        size: cfg2.size,
        highlightLevel: 2,
        state: { retrograde: options?.retrograde2 }
      }
    ],
    latScale: 40,
    showLatLine: true,
    showRetrogradeRing: true
  }
}

/**
 * 构造七曜全图天体环
 */
export function sevenLuminariesBody(
  angles: Record<LuminaryKey, number>,
  states?: Partial<Record<LuminaryKey, { retrograde?: boolean; latitude?: number }>>
): BodyRingData {
  return {
    items: LUMINARY_KEYS.map((key) => {
      const cfg = LUMINARY_CONFIG[key]
      const state = states?.[key]
      return {
        label: cfg.name,
        symbol: cfg.symbol,
        color: cfg.color,
        kind: key,
        angle: angles[key],
        size: cfg.size,
        highlightLevel: 2,
        state
      }
    }),
    latScale: 40,
    showLatLine: true,
    showRetrogradeRing: true
  }
}

/**
 * 构造空天体环（用于动态添加行星）
 */
export function emptyBodyRing(): BodyRingData {
  return {
    items: [],
    latScale: 40,
    showLatLine: false,
    showRetrogradeRing: false,
    circleColor: '#333333',
    circleWidth: 1
  }
}
