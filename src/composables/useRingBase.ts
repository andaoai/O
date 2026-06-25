import { computed } from 'vue'
import type { RingItem, PointItem } from '@/data/rings/types'

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
  /** 归一化角度到 [0, 360) */
  const normalizeAngle = (angle: number): number =>
    ((angle % 360) + 360) % 360

  /** 均分角度：n 个项目均分 360° */
  const angleStep = (count: number): number => 360 / count

  return {
    normalizeAngle,
    angleStep
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
  const { normalizeAngle, angleStep } = useRingAngles()

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
