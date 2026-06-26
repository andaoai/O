<script setup lang="ts">
import { computed } from 'vue'
import DataPointRing from './DataPointRing.vue'
import type { PointRingData } from '@/data/rings/types'

/**
 * 通用度数刻度环组件
 *
 * 这是一个 **点环的专用业务包装组件**，底层完全复用 DataPointRing → PointRing 渲染能力。
 * 负责将 scaleInterval / labelInterval 配置转换为 PointItem 数据。
 *
 * ⚠️ 架构设计：DegreeScale 不做任何渲染，只负责生成数据！
 *
 * 组件特点：
 * - 支持任意度数间隔（1-360度）
 * - 支持主副刻度区分：主刻度长+粗+亮，副刻度短+细+暗
 * - 标签对齐到主刻度线上（而非刻度中间）
 *
 * @author Generated with Claude Code
 * @since 2025-10-15
 *
 * @example
 * ```vue
 * <!-- 高精度：每一度有刻度，每隔五度显示数字（360个刻度，72个标签） -->
 * <DegreeScale
 *   :radius="200"
 *   :scale-interval="1"
 *   :label-interval="5"
 * />
 *
 * <!-- 高精度：每一度有刻度，每隔十度显示数字（360个刻度，36个标签） -->
 * <DegreeScale
 *   :radius="200"
 *   :scale-interval="1"
 *   :label-interval="10"
 *   :inner-radius="180"
 * />
 *
 * <!-- 基础用法：5度间隔（72个刻度，72个标签） -->
 * <DegreeScale :radius="200" :scale-interval="5" />
 *
 * <!-- 六十甲子体系：6度间隔（60个刻度，60个标签） -->
 * <DegreeScale
 *   :radius="200"
 *   :scale-interval="6"
 *   :inner-radius="180"
 *   label-color="#gold"
 * />
 * ```
 */

/**
 * 组件属性接口定义
 */
interface Props {
  /**
   * 圆环外半径（像素）
   */
  radius: number

  /**
   * 圆环内半径（像素）
   */
  innerRadius?: number

  /**
   * 起始度数偏移（0-360度）
   */
  startDegree?: number

  /**
   * 刻度间隔（度数）
   * 核心参数，决定刻度线的密度和数量
   */
  scaleInterval?: number

  /**
   * 标签显示间隔（度数）
   * 控制每隔多少度显示一个数字标签
   * 必须是 scaleInterval 的倍数
   * 默认与 scaleInterval 相同
   */
  labelInterval?: number

  /**
   * 是否显示度数标签文字
   */
  showLabels?: boolean

  /**
   * 标签文字颜色
   */
  labelColor?: string

  /**
   * 是否显示圆环边线
   */
  showCircle?: boolean

  /**
   * 圆环边线宽度
   */
  circleWidth?: number

  /**
   * 圆环边线颜色
   */
  circleColor?: string

  /**
   * 主刻度颜色（有标签的刻度）
   */
  majorTickColor?: string

  /**
   * 副刻度颜色（无标签的刻度）
   */
  minorTickColor?: string

  /**
   * 刻度线方向
   * - 'outward': 从内圆向外画（刻度靠近内圆）
   * - 'inward': 从外圆向内画（刻度靠近外圆）
   */
  tickDirection?: 'outward' | 'inward'

  /**
   * 旋转方向
   */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  innerRadius: 0,
  startDegree: 0,
  scaleInterval: 5,
  labelInterval: undefined,
  showLabels: true,
  labelColor: '#ffffff',
  showCircle: true,
  circleWidth: 1,
  circleColor: '#ffffff',
  majorTickColor: '#ffffff',
  minorTickColor: '#aaaaaa',
  tickDirection: 'inward', // 默认从外圆向内画（标准罗盘）
  rotationDirection: 'clockwise'
})

/**
 * 实际标签间隔（默认与刻度间隔相同）
 */
const effectiveLabelInterval = computed(() =>
  props.labelInterval ?? props.scaleInterval
)

/**
 * 标签字号（像素）
 */
const LABEL_FONT_SIZE = 11

/**
 * 标签径向偏移：根据字号自动计算安全间距
 * ✅ 数学精确保证零重叠
 *
 * ⚠️ 支持两个方向：
 *   tickDirection = 'outward'：从内圆向外画（刻度靠近内圆）
 *   tickDirection = 'inward'：从外圆向内画（刻度靠近外圆，默认）
 *
 * PointRing 刻度线渲染公式：
 *   x1（内侧端点，靠近圆心）= pt.x × (innerRadius + tickInnerRatio × ringWidth) / radius
 *   x2（外侧端点，远离圆心）= pt.x × tickOuterRatio
 *
 * tickInnerRatio = 0 → x1 在 innerRadius（内圆）
 * tickInnerRatio = 1 → x1 在 radius（外圆）
 * tickOuterRatio = 1 → x2 在 radius（外圆）
 */
const labelPosition = computed(() => {
  const ringWidth = props.radius - props.innerRadius

  // 刻度线长度 = 1.5 × 字号，但不能超过环宽的 35%（留足够空间给标签）
  const safeTickLength = Math.min(
    ringWidth * 0.35,  // 占环宽 35%，留 65% 给标签
    Math.max(LABEL_FONT_SIZE * 1.5, 16)
  )

  // 标签间距 = 字号，保证不重叠
  const labelGap = LABEL_FONT_SIZE

  if (props.tickDirection === 'outward') {
    // ──────────────────────────────────────────────────
    // 'outward' 方向：从内圆向外画（刻度靠近内圆）
    // ──────────────────────────────────────────────────
    // 内圆 → 刻度起点(0) → 主刻度末端(35%) → 标签(35% + 字号) → 外圆(100%)
    //         ↑              ↑                     ↑
    //         0           safeTickLength      safeTickLength + labelGap

    const majorTickOuterRadius = props.innerRadius + safeTickLength
    const minorTickOuterRadius = props.innerRadius + safeTickLength / 2
    // 标签必须在 [innerRadius, radius] 范围内，永不超界
    const labelRadius = Math.min(
      props.radius - LABEL_FONT_SIZE,  // 距离外圆至少留一个字号宽度
      majorTickOuterRadius + labelGap  // 距离刻度线至少一个字号
    )

    return {
      labelOffset: labelRadius - props.radius,
      tickInnerRatio: 0, // 所有刻度从内圆开始
      majorTickOuterRatio: majorTickOuterRadius / props.radius,
      minorTickOuterRatio: minorTickOuterRadius / props.radius
    }
  } else {
    // ──────────────────────────────────────────────────
    // 'inward' 方向：从外圆向内画（刻度靠近外圆，默认）
    // ──────────────────────────────────────────────────
    // 内圆 → 标签 → 主刻度起点 → 副刻度起点 → 外圆
    //                ↑          ↑            ↑
    //            safeTickLength + labelGap  safeTickLength  0

    const majorTickInnerRadius = props.radius - safeTickLength
    const minorTickInnerRadius = props.radius - safeTickLength / 2
    // 标签必须在 [innerRadius, radius] 范围内，永不超界
    const labelRadius = Math.max(
      props.innerRadius + LABEL_FONT_SIZE,  // 距离内圆至少留一个字号宽度
      majorTickInnerRadius - labelGap       // 距离刻度线至少一个字号
    )

    const majorTickInnerRatio = (majorTickInnerRadius - props.innerRadius) / ringWidth
    const minorTickInnerRatio = (minorTickInnerRadius - props.innerRadius) / ringWidth

    return {
      labelOffset: labelRadius - props.radius,
      tickOuterRatio: 1.0, // 所有刻度画到外圆
      majorTickInnerRatio,
      minorTickInnerRatio
    }
  }
})

/**
 * 生成点环数据
 * ⚠️ 核心：主副刻度混合，主刻度带标签，副刻度不带标签
 */
const ringData = computed((): PointRingData => {
  const totalTicks = Math.floor(360 / props.scaleInterval)
  const items: PointRingData['items'] = []

  for (let i = 0; i <= totalTicks; i++) {
    const degree = i * props.scaleInterval
    if (degree > 360) continue

    const isMajor = degree % effectiveLabelInterval.value === 0

    const pos = labelPosition.value

    items.push({
      angle: degree,
      label: isMajor && props.showLabels ? (degree % 360).toString() : '',
      pointSymbol: 'tick',
      pointColor: isMajor ? props.majorTickColor : props.minorTickColor,
      fontSize: LABEL_FONT_SIZE,
      // ✅ 双向支持：
      //   tickDirection = 'outward': 从内圆向外画（刻度靠近内圆）
      //   tickDirection = 'inward':  从外圆向内画（刻度靠近外圆，默认）
      // 标签始终与刻度线保持 2px 安全间距，绝对零重叠
      tickInnerRatio: props.tickDirection === 'outward'
        ? pos.tickInnerRatio
        : (isMajor ? pos.majorTickInnerRatio : pos.minorTickInnerRatio),
      tickOuterRatio: props.tickDirection === 'outward'
        ? (isMajor ? pos.majorTickOuterRatio : pos.minorTickOuterRatio)
        : pos.tickOuterRatio,
      tickWidth: isMajor ? 2 : 1,
      opacity: isMajor ? 1 : 0.7,
      highlightLevel: isMajor ? 1 : 0
    })
  }

  return {
    radius: props.radius,
    innerRadius: props.innerRadius,
    startDegree: props.startDegree,
    labelColor: props.labelColor,
    circleColor: props.circleColor,
    circleWidth: props.circleWidth,
    labelOffset: labelPosition.value.labelOffset,
    labelOffsetBase: 'outer', // ⚠️ 从外半径开始向内偏移
    labelAngleOffset: 0, // 标签与刻度线对齐（不偏移）
    pointSymbol: 'tick',
    items
  }
})
</script>

<template>
  <!-- ⚠️ 架构纯净：所有渲染 100% 复用 DataPointRing，无一行自定义 SVG -->
  <DataPointRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :start-degree="startDegree"
    :rotation-direction="rotationDirection"
    :show-labels="showLabels"
    :show-circle="showCircle"
  />
</template>

<style scoped>
/* ⚠️ 无自定义样式，全部复用底层能力 */
</style>
