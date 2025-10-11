<script setup lang="ts">
import { computed } from 'vue'

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
  showSectors: false
})

const centerX = 400
const centerY = 300

// 计算每个项目的角度范围
const angleStep = computed(() => 360 / props.items.length)

// 生成扇形区域
const sectors = computed(() => {
  return props.items.map((item, index) => {
    const startAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const endAngle = item.endAngle !== undefined ? item.endAngle : (index + 1) * angleStep.value

    return {
      startAngle,
      endAngle,
      item
    }
  })
})

// 生成刻度点
const ticks = computed(() => {
  const allTicks: Array<{
    x1: number
    y1: number
    x2: number
    y2: number
    angle: number
    item: RingItem
  }> = []
  props.items.forEach((item, index) => {
    const startAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const endAngle = item.endAngle !== undefined ? item.endAngle : (index + 1) * angleStep.value

    // 添加起始刻度
    const startAngleRad = (startAngle * Math.PI) / 180
    const x1 = centerX + Math.cos(startAngleRad) * props.radius
    const y1 = centerY + Math.sin(startAngleRad) * props.radius
    const x2 = centerX + Math.cos(startAngleRad) * (props.radius + props.tickLength)
    const y2 = centerY + Math.sin(startAngleRad) * (props.radius + props.tickLength)

    allTicks.push({
      x1, y1, x2, y2,
      angle: startAngle,
      item
    })
  })
  return allTicks
})

// 生成标签位置（在扇形中心）
const labels = computed(() => {
  return props.items.map((item, index) => {
    const startAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const endAngle = item.endAngle !== undefined ? item.endAngle : (index + 1) * angleStep.value

    // 处理跨越0度的情况
    let midAngle
    if (startAngle > endAngle) {
      // 跨越0度的情况，比如345-15度
      const span = (360 - startAngle) + endAngle
      midAngle = (startAngle + span / 2 + 360) % 360
    } else {
      // 正常情况
      midAngle = (startAngle + endAngle) / 2
    }

    const angleRad = (midAngle * Math.PI) / 180

    // 文字位置在内圆和外圆之间
    const textRadius = props.innerRadius + (props.radius - props.innerRadius) * props.labelPosition
    const x = centerX + Math.cos(angleRad) * textRadius
    const y = centerY + Math.sin(angleRad) * textRadius

    return {
      x, y,
      item,
      angle: midAngle
    }
  })
})
</script>

<template>
  <g class="circle-ring">
    <!-- 外圆 -->
    <circle
      v-if="showCircle"
      :cx="centerX"
      :cy="centerY"
      :r="radius"
      fill="none"
      :stroke="circleColor"
      :stroke-width="circleWidth"
    />

    <!-- 内圆 -->
    <circle
      v-if="innerRadius > 0"
      :cx="centerX"
      :cy="centerY"
      :r="innerRadius"
      fill="none"
      :stroke="circleColor"
      :stroke-width="circleWidth"
    />

    <!-- 分隔线（从内圆到外圆） -->
    <g v-if="showTicks" v-for="tick in ticks" :key="tick.angle">
      <line
        :x1="centerX + Math.cos((tick.angle * Math.PI) / 180) * innerRadius"
        :y1="centerY + Math.sin((tick.angle * Math.PI) / 180) * innerRadius"
        :x2="centerX + Math.cos((tick.angle * Math.PI) / 180) * radius"
        :y2="centerY + Math.sin((tick.angle * Math.PI) / 180) * radius"
        :stroke="tick.item.color || tickColor"
        :stroke-width="tickWidth"
      />
    </g>

    <!-- 标签（在环内部中心位置） -->
    <g v-if="showLabels" v-for="label in labels" :key="label.angle">
      <text
        :x="label.x"
        :y="label.y"
        :fill="label.item.color || labelColor"
        :font-size="label.item.fontSize || 14"
        text-anchor="middle"
        dominant-baseline="middle"
        font-weight="bold"
      >
        {{ label.item.label }}
      </text>
    </g>
  </g>
</template>

<style scoped>
.circle-ring {
  transition: all 0.3s ease;
}
</style>