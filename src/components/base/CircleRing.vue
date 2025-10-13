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
  items: RingItem[]
  showLabels?: boolean
  labelColor?: string
  labelPosition?: number  // 文字位置半径比例 (0-1, 0为内圆，1为外圆)
  showTicks?: boolean
  tickLength?: number
  tickWidth?: number
  tickColor?: string
  showCircle?: boolean
  circleWidth?: number
  circleColor?: string
  showSectors?: boolean  // 是否显示扇形区域
  rotation?: number      // 旋转角度（度数）
  enableAnimation?: boolean  // 是否启用自动旋转动画
  animationSpeed?: number    // 动画速度（度/帧），正数为顺时针，负数为逆时针
  startDegree?: number       // 起始度数
  verticalTwoChar?: boolean  // 是否对双字符标签进行垂直排列
}

const props = withDefaults(defineProps<Props>(), {
  innerRadius: 0,
  showLabels: true,
  labelColor: 'white',
  labelPosition: 0.7,
  showTicks: true,
  tickLength: 10,
  tickWidth: 0.5,
  tickColor: 'white',
  showCircle: true,
  circleWidth: 1,
  circleColor: 'white',
  showSectors: false,
  rotation: 0,
  enableAnimation: false,
  animationSpeed: 0.5,
  startDegree: 0,
  verticalTwoChar: false
})

// 计算每个项目的角度范围
const angleStep = computed(() => 360 / props.items.length)

// 生成扇形区域
const generateSectors = (getMidAngle: Function, generateArcPath: Function, totalRotation: number) => {
  return props.items.map((item, index) => {
    const baseStartAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const baseEndAngle = item.endAngle !== undefined ? item.endAngle : (index + 1) * angleStep.value

    // 只应用起始度数，不需要再加 totalRotation（PolarCanvas 已经处理了旋转）
    const startAngle = (baseStartAngle + props.startDegree) % 360
    const endAngle = (baseEndAngle + props.startDegree) % 360

    return {
      startAngle,
      endAngle,
      item,
      path: generateArcPath(0, 0, props.radius, startAngle, endAngle, props.innerRadius)
    }
  })
}

// 生成刻度点
const generateTicks = (polarToCartesian: Function, totalRotation: number) => {
  const allTicks: Array<{
    x1: number
    y1: number
    x2: number
    y2: number
    angle: number
    item: RingItem
  }> = []

  props.items.forEach((item, index) => {
    const baseStartAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value

    // 只应用起始度数，不需要再加 totalRotation（PolarCanvas 已经处理了旋转）
    const startAngle = (baseStartAngle + props.startDegree) % 360

    // 添加起始刻度
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
  return props.items.map((item, index) => {
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

    // 检查是否为双字符标签且启用垂直排列（用于十二长生）
    const isTwoCharacter = item.label.length === 2 && props.verticalTwoChar

    return {
      x: position.x,
      y: position.y,
      item,
      angle: midAngle,
      textRotation,
      isTwoCharacter
    }
  })
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
      <g class="circle-ring">
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
            :fill="sector.item.color || '#ffffff'"
            opacity="0.3"
          />
        </g>

        <!-- 分隔线（从内圆到外圆） -->
        <g v-if="showTicks" v-for="tick in generateTicks(slotProps.polarToCartesian, slotProps.totalRotation)" :key="tick.angle">
          <line
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            :stroke="tickColor"
            :stroke-width="tickWidth"
          />
        </g>

        <!-- 标签（在环内部中心位置） -->
        <g v-if="showLabels" v-for="label in generateLabels(slotProps.getMidAngle, slotProps.polarToCartesian, slotProps.totalRotation)" :key="label.angle">
          <!-- 单字符或四象标签（水平显示） -->
          <text
            v-if="!label.isTwoCharacter"
            :x="label.x"
            :y="label.y"
            :fill="label.item.color || labelColor"
            :font-size="label.item.fontSize || 14"
            text-anchor="middle"
            dominant-baseline="central"
            font-weight="bold"
            :transform="`rotate(${label.textRotation} ${label.x} ${label.y})`"
          >
            {{ label.item.label }}
          </text>
          <!-- 双字符标签垂直排列（用于十二长生） -->
          <g v-else :transform="`rotate(${label.textRotation} ${label.x} ${label.y})`">
            <text
              :x="label.x"
              :y="label.y - 6"
              :fill="label.item.color || labelColor"
              :font-size="label.item.fontSize || 14"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >
              {{ label.item.label[0] }}
            </text>
            <text
              :x="label.x"
              :y="label.y + 6"
              :fill="label.item.color || labelColor"
              :font-size="label.item.fontSize || 14"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >
              {{ label.item.label[1] }}
            </text>
          </g>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.circle-ring {
  /* 移除 transition 避免与 JavaScript 动画冲突 */
}
</style>