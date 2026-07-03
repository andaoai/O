import { computed } from 'vue'
import type { RingItem, PointItem } from '@/data/rings/types'
import {
  normalizeAngle,
  polarToCartesian as polarToCartesianRaw,
  type RotationDirection
} from '@/utils/geometry'

/**
 * useRingBase - 圆环基础逻辑 composable
 *
 * 提取 CircleRing / PointRing / DataRing / DataPointRing 的通用逻辑：
 * - 半径/角度的 props 解析
 * - 高亮层级计算
 * - fontSize 统一处理
 * - 极坐标辅助函数
 *
 * 作为所有圆环组件的基础能力，消除重复代码。
 */

/** re-export：utils/geometry 是几何函数的唯一真理源 */
export { normalizeAngle } from '@/utils/geometry'
export type { RotationDirection } from '@/utils/geometry'

/* ──────────────────────────────────────────────
   高亮层级计算（RingItem / PointItem 通用
   ────────────────────────────────────────────── */

export function useHighlight<T extends { highlight?: boolean; highlightLevel?: number }>() {
  /**
   * 获取项目的高亮层级
   *   0: 不亮
   *   1: 微亮（仅文字）
   *   2: 中亮（呼吸高亮）
   *   3: 强亮（强呼吸+大字）
   */
  const highlightLevelOf = (item: T): number =>
    item.highlightLevel ?? (item.highlight ? 2 : 0)

  /** 是否中亮及以上 */
  const isHighlighted = (item: T): boolean => highlightLevelOf(item) >= 2
  /** 是否强亮 */
  const isStrongHighlighted = (item: T): boolean => highlightLevelOf(item) >= 3

  return {
    highlightLevelOf,
    isHighlighted,
    isStrongHighlighted
  }
}

/* ──────────────────────────────────────────────
   半径/角度 解析（DataRing / DataPointRing 通用
   ────────────────────────────────────────────── */

interface RingDataBase {
  radius?: number
  innerRadius?: number
  startDegree?: number
  fontSize?: number
}

export function useRingProps<T extends RingDataBase>(
  props: {
    data: T
    radius?: number
    innerRadius?: number
    startDegree?: number
  },
  defaults: {
    radius: number
    innerRadius: number
    startDegree: number
  }
) {
  /** 解析后的半径：注入值优先，回退到 data 默认值，最后回退到全局默认 */
  const resolvedRadius = computed(() => props.radius ?? props.data.radius ?? defaults.radius)
  const resolvedInnerRadius = computed(() => props.innerRadius ?? props.data.innerRadius ?? defaults.innerRadius)
  const resolvedStartDegree = computed(() => props.startDegree ?? props.data.startDegree ?? defaults.startDegree)

  return {
    resolvedRadius,
    resolvedInnerRadius,
    resolvedStartDegree
  }
}

/* ──────────────────────────────────────────────
   fontSize 统一处理（DataRing / DataPointRing 通用
   ────────────────────────────────────────────── */

export function useRingItemsWithFontSize<
  T extends { fontSize?: number }
>(items: () => T[], dataFontSize: () => number | undefined) {
  return computed(() => {
    const fontSize = dataFontSize()
    if (fontSize === undefined) return items()
    return items().map(item =>
      item.fontSize === undefined ? { ...item, fontSize } : item
    )
  })
}

/* ──────────────────────────────────────────────
   角度计算辅助
   ────────────────────────────────────────────── */

export function useRingAngles() {
  /** 均分角度：n 个项目均分 360° */
  const angleStep = (count: number): number => 360 / count

  return {
    normalizeAngle,
    angleStep
  }
}

/* ──────────────────────────────────────────────
   极坐标 toXY 工厂（段环通用）
   ────────────────────────────────────────────── */

/**
 * 生成绑定了 startDegree 偏移与 rotationDirection 的 polarToCartesian。
 *
 * 消除以下重复模式（原分散在 GuaRing / JingFangGuaRing / JingFangEightPalaceRing /
 * NajiaRing 里各写一遍）：
 *
 *   const polarToCartesian = (angle, radius) =>
 *     polarUtil((angle + props.startDegree) % 360, radius, props.rotationDirection)
 *
 * 用法：
 *   const toXY = usePolar(() => props.startDegree, () => props.rotationDirection)
 *   const p = toXY(angle, radius)
 *
 * @param startDegreeRef  返回当前 startDegree 的 getter（未使用偏移传 0 或 () => 0）
 * @param directionRef    返回当前 rotationDirection 的 getter
 */
export function usePolar(
  startDegreeRef: () => number,
  directionRef: () => RotationDirection
) {
  return (angle: number, radius: number): { x: number; y: number } => {
    const shifted = normalizeAngle(angle + startDegreeRef())
    return polarToCartesianRaw(shifted, radius, directionRef())
  }
}

/* ──────────────────────────────────────────────
   完整的圆环基础能力组合
   ────────────────────────────────────────────── */

export function useRingBase<
  TData extends RingDataBase,
  TItem extends { highlight?: boolean; highlightLevel?: number; fontSize?: number }
>(
  props: {
    data: TData
    radius?: number
    innerRadius?: number
    startDegree?: number
  },
  defaults: {
    radius: number
    innerRadius: number
    startDegree: number
  }
) {
  const { resolvedRadius, resolvedInnerRadius, resolvedStartDegree } = useRingProps(props, defaults)
  const { highlightLevelOf, isHighlighted, isStrongHighlighted } = useHighlight<TItem>()
  const itemsWithFontSize = useRingItemsWithFontSize(
    () => (props.data as any).items as TItem[],
    () => props.data.fontSize
  )
  const { angleStep } = useRingAngles()

  return {
    // 半径/角度
    resolvedRadius,
    resolvedInnerRadius,
    resolvedStartDegree,
    // 高亮
    highlightLevelOf,
    isHighlighted,
    isStrongHighlighted,
    // items
    itemsWithFontSize,
    // 角度辅助
    normalizeAngle,
    angleStep
  }
}
