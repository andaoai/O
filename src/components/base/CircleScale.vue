<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from './PolarCanvas.vue'

interface RingItem {
  label: string
  color?: string
  fontSize?: number
  startAngle?: number  // 起始角度
  endAngle?: number    // 结束角度
}

interface Props {
  radius: number
  innerRadius?: number  // 内半径
  startDegree?: number       // 起始度数
  rotation?: number      // 旋转角度（度数）
  enableAnimation?: boolean  // 是否启用自动旋转动画
  animationSpeed?: number    // 动画速度（度/帧），正数为顺时针，负数为逆时针
  showLabels?: boolean
  labelColor?: string
  labelPosition?: number  // 文字位置半径比例 (0-1, 0为内圆，1为外圆)
  showCircle?: boolean
  circleWidth?: number
  circleColor?: string
  showSectors?: boolean  // 是否显示扇形区域
  sectorColor?: string   // 扇形颜色
  sectorOpacity?: number // 扇形透明度
  scaleInterval?: number  // 刻度间隔（度数）
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
  scaleInterval: 5  // 默认每5度一个刻度
})

// 计算刻度数量
const scaleCount = computed(() => Math.floor(360 / props.scaleInterval))

// 生成刻度项目
const scaleItems = computed(() => {
  const items: RingItem[] = []
  for (let i = 0; i < scaleCount.value; i++) {
    const degree = props.scaleInterval + i * props.scaleInterval  // 从5度开始
    items.push({
      label: degree.toString(),
      color: props.labelColor,
      fontSize: 12,
      startAngle: degree - props.scaleInterval,  // 宫格起始位置
      endAngle: degree  // 宫格结束位置
    })
  }
  return items
})

// 计算每个项目的角度范围
const angleStep = computed(() => 360 / scaleItems.value.length)

// 生成扇形区域
const generateSectors = (getMidAngle: Function, generateArcPath: Function, totalRotation: number) => {
  return scaleItems.value.map((item, index) => {
    const baseStartAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const baseEndAngle = item.endAngle !== undefined ? item.endAngle : (index + 1) * angleStep.value

    // 只应用起始度数，不需要再加 totalRotation（PolarCanvas 已经处理了旋转）
    const startAngle = (baseStartAngle + props.startDegree) % 360
    const endAngle = (baseEndAngle + props.startDegree) % 360

    return {
      startAngle,
      endAngle,
      item,
      path: generateArcPath(400, 300, props.radius, startAngle, endAngle, props.innerRadius)
    }
  })
}

// 生成刻度点（在扇形边界）
const generateTicks = (polarToCartesian: Function, totalRotation: number) => {
  const allTicks: Array<{
    x1: number
    y1: number
    x2: number
    y2: number
    angle: number
    item: RingItem
  }> = []

  scaleItems.value.forEach((item, index) => {
    const baseStartAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value

    // 只应用起始度数，不需要再加 totalRotation（PolarCanvas 已经处理了旋转）
    const startAngle = (baseStartAngle + props.startDegree) % 360

    // 添加起始刻度线
    const startInner = polarToCartesian(startAngle, props.innerRadius)
    const startOuter = polarToCartesian(startAngle, props.radius)

    allTicks.push({
      x1: startInner.x,
      y1: startInner.y,
      x2: startOuter.x,
      y2: startOuter.y,
      angle: startAngle,
      item
    })
  })
  return allTicks
}

// 生成标签位置（在扇形中心）
const generateLabels = (getMidAngle: Function, polarToCartesian: Function, totalRotation: number) => {
  return scaleItems.value.map((item, index) => {
    const baseStartAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const baseEndAngle = item.endAngle !== undefined ? item.endAngle : (index + 1) * angleStep.value

    // 只应用起始度数，不需要再加 totalRotation（PolarCanvas 已经处理了旋转）
    const startAngle = (baseStartAngle + props.startDegree) % 360
    const endAngle = (baseEndAngle + props.startDegree) % 360

    // 计算中点角度
    const midAngle = getMidAngle(startAngle, endAngle)

    // 文字位置在内圆和外圆之间
    const textRadius = props.innerRadius + (props.radius - props.innerRadius) * props.labelPosition
    const position = polarToCartesian(midAngle, textRadius)

    // 计算文字旋转角度，让文字底部指向圆心
    const textRotation = (270 - midAngle) + 90

    return {
      x: position.x,
      y: position.y,
      item,
      angle: midAngle,
      textRotation
    }
  })
}
</script>

<template>
  <PolarCanvas
    :enable-animation="enableAnimation"
    :animation-speed="animationSpeed"
    :rotation="rotation"
  >
    <template #default="slotProps">
      <g class="circle-scale">
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

        <!-- 扇形区域（每个5度的宫格） -->
        <g v-if="showSectors" v-for="sector in generateSectors(slotProps.getMidAngle, slotProps.generateArcPath, slotProps.totalRotation)" :key="sector.startAngle">
          <path
            :d="sector.path"
            :fill="sectorColor"
            :opacity="sectorOpacity"
          />
        </g>

        <!-- 刻度线（宫格边界） -->
        <g v-for="tick in generateTicks(slotProps.polarToCartesian, slotProps.totalRotation)" :key="tick.angle">
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

        <!-- 标签（在宫格中心显示度数） -->
        <g v-if="showLabels" v-for="label in generateLabels(slotProps.getMidAngle, slotProps.polarToCartesian, slotProps.totalRotation)" :key="label.angle">
          <text
            :x="label.x"
            :y="label.y"
            :fill="label.item.color || labelColor"
            :font-size="label.item.fontSize || 12"
            text-anchor="middle"
            dominant-baseline="central"
            font-weight="bold"
            :transform="`rotate(${label.textRotation} ${label.x} ${label.y})`"
          >
            {{ label.item.label }}°
          </text>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.circle-scale {
  /* 移除 transition 避免与 JavaScript 动画冲突 */
}
</style>