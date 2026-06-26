<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from './PolarCanvas.vue'
import { polarToCartesian as polar, radialTextRotation } from '@/utils/geometry'
import { useHighlight } from '@/composables/useRingBase'
import type { PointItem } from '@/data/rings/types'

/**
 * PointRing - 点导向圆环
 *
 * 用于在极坐标圆环上渲染离散的点（而非连续的扇形段）。
 * 适用于：二十四节气（精确黄经点）、二十八宿距星（精确赤经点）、
 * 七十二候等本质是点而非区间的数据。
 *
 * 与 CircleRing（段导向）的区别：
 * - CircleRing：每个项目占一个角度区间 [startAngle, endAngle)
 * - PointRing：每个项目落在一个精确角度值 angle 上
 */

interface Props {
  /** 圆环半径（点所在位置的半径） */
  radius: number
  /** 圆环内半径（用于画边界圆，0=不画） */
  innerRadius?: number
  /** 点数据数组 */
  items: PointItem[]
  /** 是否显示标签文字 */
  showLabels?: boolean
  /** 标签默认颜色 */
  labelColor?: string
  /** 标签径向偏移：正数向外，负数向内（相对于点的位置） */
  labelOffset?: number
  /** 标签半径计算基准：
   *  - 'outer'：相对于外半径 radius（默认，适合点符号）
   *  - 'inner'：相对于内半径 innerRadius（适合 tick 刻度，标签放在刻度内侧）
   */
  labelOffsetBase?: 'outer' | 'inner'
  /** 标签角度偏移（度）：相对于点偏移一定角度，避免与刻度线重叠 */
  labelAngleOffset?: number
  /** 是否显示点标记 */
  showPoints?: boolean
  /** 默认点大小 */
  pointSize?: number
  /** 默认点颜色 */
  pointColor?: string
  /** 点的符号形状 */
  pointSymbol?: 'circle' | 'diamond' | 'tick'
  /** tick 刻度线内侧起始比例（0=从内圆开始，1=从外圆开始）
   *  支持主副刻度区分：主刻度 0, 副刻度 0.3
   */
  tickInnerRatio?: number
  /** tick 刻度线外侧结束比例（0=从内圆开始，1=从外圆开始）
   *  默认 1.0 = 画到外圆。标准罗盘刻度：从外圆向内画
   */
  tickOuterRatio?: number
  /** tick 刻度线宽度 */
  tickWidth?: number
  /** 是否显示圆环边线 */
  showCircle?: boolean
  /** 圆环边线宽度 */
  circleWidth?: number
  /** 圆环边线颜色 */
  circleColor?: string
  /** 整体旋转角度 */
  rotation?: number
  /** 是否启用自动旋转动画 */
  enableAnimation?: boolean
  /** 动画旋转速度 */
  animationSpeed?: number
  /** 起始度数偏移 */
  startDegree?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  innerRadius: 0,
  showLabels: true,
  labelColor: 'white',
  labelOffset: 15,
  labelOffsetBase: 'outer', // 默认：标签相对于外半径（适合点符号）
  labelAngleOffset: 0,
  showPoints: true,
  pointSize: 4,
  pointColor: '#ffffff',
  pointSymbol: 'circle',
  tickInnerRatio: 0.75,  // 默认从 75% 位置开始画刻度
  tickOuterRatio: 1.0,   // 默认画到外圆
  tickWidth: 1,
  showCircle: true,
  circleWidth: 1,
  circleColor: '#888888',
  rotation: 0,
  enableAnimation: false,
  animationSpeed: 0.5,
  startDegree: 0,
  rotationDirection: 'clockwise'
})

/** 极坐标转笛卡尔坐标 */
const polarToCartesian = (angle: number, r: number) =>
  polar(angle, r, props.rotationDirection)

/**
 * 点位置计算
 * - 刻度线/点：使用原始角度
 * - 标签：使用 angle + labelAngleOffset（避免与刻度线重叠）
 *
 * 标签半径基准：
 * - labelOffsetBase = 'outer'：labelRadius = radius + labelOffset（点符号默认）
 * - labelOffsetBase = 'inner'：labelRadius = innerRadius + labelOffset（刻度线专用，标签放在内侧）
 */
const points = computed(() =>
  props.items.map((item, index) => {
    const baseAngle = item.angle !== undefined ? item.angle : index * (360 / props.items.length)
    const angle = (baseAngle + props.startDegree) % 360
    // 标签角度：在点角度基础上偏移（默认 +2.5 度，落在两个刻度线之间）
    const labelAngle = (angle + props.labelAngleOffset) % 360
    const position = polarToCartesian(angle, props.radius)
    // 标签位置：根据基准选择不同的计算方式
    const labelBaseRadius = props.labelOffsetBase === 'inner' ? props.innerRadius : props.radius
    const labelRadius = labelBaseRadius + props.labelOffset
    const labelPosition = polarToCartesian(labelAngle, labelRadius)
    // 文字旋转：使用标签自己的角度
    const textRotation = radialTextRotation(labelAngle, props.rotationDirection)
    return {
      angle,
      labelAngle,
      x: position.x,
      y: position.y,
      labelX: labelPosition.x,
      labelY: labelPosition.y,
      textRotation,
      item
    }
  })
)

/** 高亮逻辑（复用 useRingBase 中的通用实现） */
const { highlightLevelOf } = useHighlight<PointItem>()
</script>

<template>
  <PolarCanvas
    :enable-animation="enableAnimation"
    :animation-speed="animationSpeed"
    :rotation="rotation"
    :rotation-direction="rotationDirection"
    :center-x="0"
    :center-y="0"
  >
    <template #default>
      <g class="point-ring">

        <!-- 外圆边线 -->
        <circle
          v-if="showCircle"
          :cx="0"
          :cy="0"
          :r="radius"
          fill="none"
          :stroke="circleColor"
          :stroke-width="circleWidth"
        />

        <!-- 内圆边线（仅当 innerRadius > 0 时显示） -->
        <circle
          v-if="innerRadius > 0"
          :cx="0"
          :cy="0"
          :r="innerRadius"
          fill="none"
          :stroke="circleColor"
          :stroke-width="circleWidth"
        />

        <!-- 点标记 -->
        <g v-if="showPoints">
          <g v-for="pt in points" :key="pt.angle">
            <!-- 圆形点（默认） -->
            <circle
              v-if="(pt.item.pointSymbol || pointSymbol) === 'circle'"
              :cx="pt.x"
              :cy="pt.y"
              :r="pt.item.pointSize || pointSize"
              :fill="pt.item.pointColor || pointColor"
              :class="{
                'highlight-point': highlightLevelOf(pt.item) >= 2,
                'highlight-point-strong': highlightLevelOf(pt.item) >= 3
              }"
            />
            <!-- 菱形点 -->
            <g
              v-else-if="(pt.item.pointSymbol || pointSymbol) === 'diamond'"
              :transform="`translate(${pt.x}, ${pt.y})`"
            >
              <path
                :d="`M 0 ${-(pt.item.pointSize || pointSize)} L ${(pt.item.pointSize || pointSize)} 0 L 0 ${pt.item.pointSize || pointSize} L ${-(pt.item.pointSize || pointSize)} 0 Z`"
                :fill="pt.item.pointColor || pointColor"
                :class="{
                  'highlight-point': highlightLevelOf(pt.item) >= 2,
                  'highlight-point-strong': highlightLevelOf(pt.item) >= 3
                }"
              />
            </g>
            <!-- 刻度线点（径向短线）：从外圆向内画刻度
                 支持自定义刻度内外端点：
                   tickInnerRatio: 内侧端点 (0=内圆, 1=外圆)
                   tickOuterRatio: 外侧端点 (0=内圆, 1=外圆)
                 默认: 从 tickInnerRatio 画到外圆 (1.0)
                 标准罗盘: 从外圆向内画，tickOuterRatio 控制外侧起点 -->
            <line
              v-else-if="(pt.item.pointSymbol || pointSymbol) === 'tick'"
              :x1="pt.x * (innerRadius > 0 ? (innerRadius + (radius - innerRadius) * (pt.item.tickInnerRatio ?? tickInnerRatio)) / radius : 0.98)"
              :y1="pt.y * (innerRadius > 0 ? (innerRadius + (radius - innerRadius) * (pt.item.tickInnerRatio ?? tickInnerRatio)) / radius : 0.98)"
              :x2="pt.x * (pt.item.tickOuterRatio ?? 1.0)"
              :y2="pt.y * (pt.item.tickOuterRatio ?? 1.0)"
              :stroke="pt.item.pointColor || pointColor"
              :stroke-width="pt.item.tickWidth ?? tickWidth"
              :opacity="pt.item.opacity ?? 1"
              stroke-linecap="butt"
              :class="{
                'highlight-point': highlightLevelOf(pt.item) >= 2,
                'highlight-point-strong': highlightLevelOf(pt.item) >= 3
              }"
            />
          </g>
        </g>

        <!-- 标签文字 -->
        <g v-if="showLabels">
          <text
            v-for="pt in points"
            :key="`label-${pt.angle}`"
            :x="pt.labelX"
            :y="pt.labelY"
            :fill="pt.item.color || pt.item.pointColor || labelColor"
            :font-size="pt.item.fontSize || 12"
            :font-weight="highlightLevelOf(pt.item) >= 2 ? 'bold' : 'normal'"
            text-anchor="middle"
            dominant-baseline="middle"
            :transform="`rotate(${pt.textRotation} ${pt.labelX} ${pt.labelY})`"
            :class="{
              'highlight-label': highlightLevelOf(pt.item) >= 2,
              'highlight-label-strong': highlightLevelOf(pt.item) >= 3
            }"
          >
            {{ pt.item.label }}
          </text>
        </g>

      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.point-ring {
  transform-origin: center;
  will-change: transform;
  backface-visibility: hidden;
}

/* 高亮点：呼吸效果 */
.highlight-point {
  animation: point-breathe 1.6s ease-in-out infinite;
}

@keyframes point-breathe {
  0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 2px currentColor); }
  50% { opacity: 1; filter: drop-shadow(0 0 6px currentColor); }
}

/* 强亮点 */
.highlight-point-strong {
  animation: point-breathe-strong 1.2s ease-in-out infinite;
}

@keyframes point-breathe-strong {
  0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 4px currentColor); }
  50% { opacity: 1; filter: drop-shadow(0 0 10px currentColor); }
}

/* 高亮标签 */
.highlight-label {
  animation: label-pulse 1.6s ease-in-out infinite;
}

@keyframes label-pulse {
  0%, 100% { opacity: 0.75; filter: drop-shadow(0 0 1px currentColor); }
  50% { opacity: 1; filter: drop-shadow(0 0 4px currentColor); }
}

.highlight-label-strong {
  animation: label-pulse-strong 1.2s ease-in-out infinite;
}

@keyframes label-pulse-strong {
  0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 2px currentColor); }
  50% { opacity: 1; filter: drop-shadow(0 0 7px currentColor); }
}
</style>
