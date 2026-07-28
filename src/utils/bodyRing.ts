/**
 * 天体圆环 (BodyRing) 纯函数工具
 *
 * 从 DataBodyRing.vue 提取的领域逻辑，满足 Layer 5 纯函数要求：
 *   相同输入 → 相同输出，无副作用，不依赖外部状态
 *
 * 包含：
 *   - 默认光晕配置（按 haloLevel 映射）
 *   - 天体数据标准化（合并默认值）
 *   - 运动状态标记环配置
 *   - 运动方向箭头参数
 *   - 天体实际坐标（含黄纬偏移）
 */
import { polarToCartesian, normalizeAngle } from './geometry'
import { MOTION_VISUAL_CONFIG, type PlanetMotion, type MotionState } from './celestial'
import type { Halo, BodyState } from '@/data/rings/types'

// ─── 常量 ──────────────────────────────────────────────────────

/** 箭头尺寸按运动状态映射：越快箭头越大 */
export const ARROW_SIZE_MAP: Record<MotionState, number> = {
  fast: 8,
  normal: 7,
  slow: 5,
  stationary: 7,
  retrograde: 7
}

/** 虚线标记环的半径偏移 */
export const MOTION_RING_RADIUS_OFFSET = 5

/** 箭头与虚线环的额外间距（确保在虚线环外侧） */
export const ARROW_EXTRA_SPACING = 8

/** 角度转弧度常量 */
export const DEG_TO_RAD = Math.PI / 180

// ─── 光晕配置 ──────────────────────────────────────────────────

/** 默认光晕配置（按 haloLevel 映射） */
export function getDefaultHalos(level: number): Halo[] {
  switch (level) {
    case 1: return [{ radius: 8, opacity: 0.2 }]
    case 2: return [{ radius: 12, opacity: 0.2 }, { radius: 8, opacity: 0.4 }]
    case 3: return [{ radius: 16, opacity: 0.3 }, { radius: 12, opacity: 0.5 }, { radius: 8, opacity: 0.7 }]
    default: return []
  }
}

// ─── 数据标准化 ────────────────────────────────────────────────

interface ProcessableItem {
  angle?: number
  highlight?: boolean
  highlightLevel?: number
  haloLevel?: number
  size?: number
  symbolColor?: string
}

interface ProcessedItem extends ProcessableItem {
  angle: number
  size: number
  halos: Halo[]
  symbolColor: string
}

/**
 * 标准化天体数据项，合并默认值
 *
 * @param items 原始天体数据项数组
 * @param defaultHalos 可选的默认光晕配置（优先于 haloLevel 生成）
 * @returns 标准化后的天体数据项数组
 */
export function processBodyItems<T extends ProcessableItem>(
  items: T[],
  defaultHalos?: Halo[]
): (T & ProcessedItem)[] {
  return items.map((item) => {
    const hl = item.haloLevel ?? (item.highlightLevel || (item.highlight ? 2 : 0))
    const size = item.size ?? 14
    const halos = defaultHalos ?? getDefaultHalos(hl)

    return {
      ...item,
      angle: normalizeAngle(item.angle ?? 0),
      size,
      halos,
      symbolColor: item.symbolColor ?? '#fff'
    }
  })
}

// ─── 运动状态标记环 ────────────────────────────────────────────

/**
 * 运动状态标记环配置
 */
export interface MotionRingConfig {
  radiusOffset: number
  strokeWidth: number
  color: string
  dashArray: string
  animationDur: string
  direction: number
}

/**
 * 生成运动状态标记环的渲染配置
 *
 * 通过虚线旋转速度和方向直观表示行星运动状态，
 * 使用统一的 MOTION_VISUAL_CONFIG 确保全项目颜色一致。
 *
 * @param motion 行星运动状态对象
 * @param mansionEvent 守宿事件信息（预留）
 * @returns 标记环配置对象，normal 状态返回 null 不渲染
 */
export function getMotionRingConfig(
  motion: PlanetMotion | undefined,
  mansionEvent: BodyState['mansionEvent']
): MotionRingConfig | null {
  if (!motion || motion.state === 'normal') {
    return null
  }

  if (mansionEvent?.type === 'stationing') {
    return {
      radiusOffset: 7,
      strokeWidth: 3,
      color: '#AA44FF',
      dashArray: 'none',
      animationDur: 'none',
      direction: 0
    }
  }

  const baseConfig = {
    radiusOffset: MOTION_RING_RADIUS_OFFSET,
    strokeWidth: 2,
    color: MOTION_VISUAL_CONFIG[motion.state].color,
    dashArray: '4,2'
  }

  switch (motion.state) {
    case 'fast':
      return { ...baseConfig, animationDur: '0.5s', direction: -1 }
    case 'slow':
      return { ...baseConfig, animationDur: '2s', direction: -1 }
    case 'retrograde':
      return { ...baseConfig, animationDur: '1s', direction: 1 }
    case 'stationary':
      return { ...baseConfig, animationDur: 'none', direction: 0 }
    default:
      return null
  }
}

// ─── 运动方向箭头 ──────────────────────────────────────────────

/**
 * 箭头位置与旋转参数
 */
export interface ArrowPosition {
  pos: { x: number; y: number }
  rotation: number
  path: string
  color: string
}

/**
 * 运动状态箭头完整配置
 */
export interface ArrowParams {
  front: ArrowPosition
  back: ArrowPosition | null
  isStationary: boolean
  size: number
}

/**
 * 计算运动状态箭头的渲染参数
 *
 * 设计原则：箭头放置于【运动方向前方】，尖端沿切线指向运动方向。
 *
 * @param angle 天体在环上的角度（度）
 * @param size 天体尺寸（px）
 * @param baseCoord 天体的绝对坐标（x, y）
 * @param motion 行星运动状态对象
 * @param rotationDirection 环旋转方向
 * @returns 箭头渲染参数对象，normal 状态返回 null
 */
export function getArrowParams(
  angle: number,
  size: number,
  baseCoord: { x: number; y: number },
  motion: PlanetMotion | undefined,
  rotationDirection: 'clockwise' | 'counterclockwise'
): ArrowParams | null {
  if (!motion || motion.state === 'normal' || motion.arrowDirection === 'none') {
    return null
  }

  const config = MOTION_VISUAL_CONFIG[motion.state]
  const arrowSize = ARROW_SIZE_MAP[motion.state]
  const isStationary = motion.state === 'stationary'

  const arrowPath = `M 0,0 L ${-arrowSize},${-arrowSize * 0.6} L ${-arrowSize * 0.4},0 L ${-arrowSize},${arrowSize * 0.6} Z`

  const arrowSpacing = size + MOTION_RING_RADIUS_OFFSET + ARROW_EXTRA_SPACING

  const isCCW = rotationDirection === 'counterclockwise'

  const forwardDirection = motion.state === 'retrograde' ? angle + 90 : angle - 90
  const tangentAngle = isCCW ? -forwardDirection : forwardDirection

  const tangentRad = tangentAngle * DEG_TO_RAD
  const tangentX = Math.cos(tangentRad)
  const tangentY = Math.sin(tangentRad)

  const arrowRotation = isCCW ? -forwardDirection : forwardDirection

  const frontOffset = { x: tangentX * arrowSpacing, y: tangentY * arrowSpacing }

  const front: ArrowPosition = {
    pos: { x: baseCoord.x + frontOffset.x, y: baseCoord.y + frontOffset.y },
    rotation: arrowRotation,
    path: arrowPath,
    color: config.color
  }

  const back = isStationary
    ? {
        pos: { x: baseCoord.x - frontOffset.x, y: baseCoord.y - frontOffset.y },
        rotation: arrowRotation + 180,
        path: arrowPath,
        color: config.color
      }
    : null

  return { front, back, isStationary, size: arrowSize }
}

// ─── 天体坐标（含黄纬偏移） ────────────────────────────────────

/**
 * 天体坐标计算结果
 */
export interface BodyCoordResult {
  base: { x: number; y: number }
  actual: { x: number; y: number }
  hasOffset: boolean
}

/**
 * 计算天体实际坐标（含黄纬偏移）
 *
 * @param longitude 天体经度（度）
 * @param latitude 天体纬度（度），可选
 * @param latScale 纬度缩放系数，可选
 * @param bandMidRadius 环带中线半径
 * @param innerRadius 环内半径
 * @param radius 环外半径
 * @param rotationDirection 旋转方向
 * @returns 坐标计算结果
 */
export function getBodyCoordinates(
  longitude: number,
  latitude: number | undefined,
  latScale: number | undefined,
  bandMidRadius: number,
  innerRadius: number,
  radius: number,
  rotationDirection: 'clockwise' | 'counterclockwise'
): BodyCoordResult {
  const base = polarToCartesian(longitude, bandMidRadius, rotationDirection)
  if (!latScale || !latitude || Math.abs(latitude) < 0.5) {
    return { base, actual: base, hasOffset: false }
  }

  const perpX = base.x / bandMidRadius
  const perpY = base.y / bandMidRadius
  const offset = Math.sin((latitude * Math.PI) / 180) * latScale

  const haloMargin = 16
  const minR = innerRadius + haloMargin
  const maxR = radius - haloMargin
  const targetR = Math.min(Math.max(bandMidRadius + offset, minR), maxR)
  const actualOffset = targetR - bandMidRadius

  return {
    base,
    actual: {
      x: base.x + perpX * actualOffset,
      y: base.y + perpY * actualOffset
    },
    hasOffset: true
  }
}
