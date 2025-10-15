<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from './base/PolarCanvas.vue'

/**
 * 通用度数刻度环组件
 *
 * 这是一个灵活的刻度环组件，可以显示不同间隔的度数刻度
 *
 * @example
 * <!-- 5度间隔刻度 -->
 * <DegreeScale :scale-interval="5" ... />
 *
 * <!-- 6度间隔刻度（60个刻度，对应六十甲子） -->
 * <DegreeScale :scale-interval="6" ... />
 *
 * <!-- 12度间隔刻度（对应十二地支） -->
 * <DegreeScale :scale-interval="12" ... />
 */

interface Props {
  /** 圆环半径 */
  radius: number
  /** 内半径，用于创建环形效果 */
  innerRadius?: number
  /** 起始度数（0-360），默认0度从正右方开始 */
  startDegree?: number
  /** 旋转角度（度数），用于整体旋转 */
  rotation?: number
  /** 是否启用自动旋转动画 */
  enableAnimation?: boolean
  /** 动画速度（度/帧），正数为顺时针，负数为逆时针 */
  animationSpeed?: number
  /** 是否显示度数标签 */
  showLabels?: boolean
  /** 标签颜色 */
  labelColor?: string
  /** 文字位置半径比例 (0-1, 0为内圆边缘，1为外圆边缘) */
  labelPosition?: number
  /** 是否显示圆环边线 */
  showCircle?: boolean
  /** 圆环边线宽度 */
  circleWidth?: number
  /** 圆环边线颜色 */
  circleColor?: string
  /** 是否显示扇形区域 */
  showSectors?: boolean
  /** 扇形颜色 */
  sectorColor?: string
  /** 扇形透明度 (0-1) */
  sectorOpacity?: number
  /**
   * 刻度间隔（度数）
   * 常用值：
   * - 5: 72个刻度
   * - 6: 60个刻度（对应六十甲子）
   * - 12: 30个刻度（对应十二地支）
   * - 30: 12个刻度
   */
  scaleInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  innerRadius: 0,
  startDegree: 0,
  rotation: 0,
  enableAnimation: false,
  animationSpeed: 0.5,
  showLabels: true,
  labelColor: '#ffffff',
  labelPosition: 0.5,
  showCircle: true,
  circleWidth: 1,
  circleColor: '#ffffff',
  showSectors: true,
  sectorColor: '#ffffff',
  sectorOpacity: 0.1,
  scaleInterval: 5  // 默认刻度间隔，调用时可修改为6或其他值
})

// 计算刻度数量
const scaleCount = computed(() => Math.floor(360 / props.scaleInterval))

/**
 * 生成扇形区域
 * 每个刻度间隔对应一个扇形区域
 */
const generateSectors = (getMidAngle: Function, generateArcPath: Function, totalRotation: number) => {
  const sectors = []
  for (let i = 0; i < scaleCount.value; i++) {
    const degree = props.scaleInterval + i * props.scaleInterval
    const startAngle = (degree - props.scaleInterval + props.startDegree) % 360
    const endAngle = (degree + props.startDegree) % 360

    sectors.push({
      startAngle,
      endAngle,
      path: generateArcPath(0, 0, props.radius, startAngle, endAngle, props.innerRadius)
    })
  }
  return sectors
}

/**
 * 生成所有刻度线
 * 包括每个刻度的边界线，确保文字之间有分隔线
 */
const generateAllTicks = (polarToCartesian: Function, totalRotation: number) => {
  const ticks = []

  // 生成所有刻度线（从0度到360度，包括闭合线）
  // 注意：使用 <= scaleCount 确保生成360度的闭合线
  for (let i = 0; i <= scaleCount.value; i++) {
    const angle = (i * props.scaleInterval + props.startDegree) % 360
    const inner = polarToCartesian(angle, props.innerRadius)
    const outer = polarToCartesian(angle, props.radius)

    ticks.push({
      x1: inner.x,
      y1: inner.y,
      x2: outer.x,
      y2: outer.y,
      angle
    })
  }
  return ticks
}

/**
 * 生成标签位置
 * 标签位于每个扇形区域的中央
 */
const generateLabels = (getMidAngle: Function, polarToCartesian: Function, totalRotation: number) => {
  const labels = []
  for (let i = 0; i < scaleCount.value; i++) {
    const degree = props.scaleInterval + i * props.scaleInterval
    const startAngle = (degree - props.scaleInterval + props.startDegree) % 360
    const endAngle = (degree + props.startDegree) % 360

    // 计算中点角度
    const midAngle = getMidAngle(startAngle, endAngle)

    // 文字位置在内圆和外圆之间
    const textRadius = props.innerRadius + (props.radius - props.innerRadius) * props.labelPosition
    const position = polarToCartesian(midAngle, textRadius)

    // 计算文字旋转角度，让文字底部指向圆心
    const textRotation = midAngle + 90

    labels.push({
      x: position.x,
      y: position.y,
      text: degree.toString(),
      textRotation
    })
  }
  return labels
}
</script>

<template>
  <PolarCanvas
    :enable-animation="enableAnimation"
    :animation-speed="animationSpeed"
    :rotation="rotation"
    :center-x="0"
    :center-y="0"
  >
    <template #default="slotProps">
      <g class="degree-scale">
        <!-- 外圆 -->
        <circle
          v-if="showCircle"
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="radius"
          fill="none"
          :stroke="circleColor"
          :stroke-width="circleWidth"
        />

        <!-- 内圆 -->
        <circle
          v-if="innerRadius > 0"
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="innerRadius"
          fill="none"
          :stroke="circleColor"
          :stroke-width="circleWidth"
        />

        <!-- 扇形区域 -->
        <g v-if="showSectors" v-for="sector in generateSectors(slotProps.getMidAngle, slotProps.generateArcPath, slotProps.totalRotation)" :key="sector.startAngle">
          <path
            :d="sector.path"
            :fill="sectorColor"
            :opacity="sectorOpacity"
          />
        </g>

        <!-- 所有刻度线（包括每个刻度的边界） -->
        <g v-for="tick in generateAllTicks(slotProps.polarToCartesian, slotProps.totalRotation)" :key="tick.angle">
          <line
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            :stroke="circleColor"
            :stroke-width="1"
            opacity="0.6"
          />
        </g>

        <!-- 标签（在扇形中心显示度数） -->
        <g v-if="showLabels" v-for="label in generateLabels(slotProps.getMidAngle, slotProps.polarToCartesian, slotProps.totalRotation)" :key="label.text">
          <text
            :x="label.x"
            :y="label.y"
            :fill="labelColor"
            font-size="12"
            text-anchor="middle"
            dominant-baseline="central"
            font-weight="bold"
            :transform="`rotate(${label.textRotation} ${label.x} ${label.y})`"
          >
            {{ label.text }}°
          </text>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.degree-scale {
  /* 通用度数刻度环组件样式 */
}
</style>