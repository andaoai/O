<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAnimation, AnimationType } from '@/composables/useAnimation'

// 基础点坐标
interface Point {
  x: number
  y: number
}

// 角度范围
interface AngleRange {
  startAngle: number
  endAngle: number
}

interface Props {
  // 画布尺寸和位置
  width?: number
  height?: number
  centerX?: number
  centerY?: number

  // 旋转和动画
  rotation?: number
  enableAnimation?: boolean
  animationSpeed?: number

  // 坐标系统参数
  maxRadius?: number
  minRadius?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
  centerX: 400,
  centerY: 300,
  rotation: 0,
  enableAnimation: false,
  animationSpeed: 0.5,
  maxRadius: 280,
  minRadius: 0
})

// 使用统一的动画系统
const animationId = `polar-canvas-${Date.now()}-${Math.random()}`
const { start, stop, setSpeed, getValue, setValue } = useAnimation(
  animationId,
  AnimationType.ROTATION,
  {
    enabled: props.enableAnimation,
    speed: props.animationSpeed
  }
)

// 监听动画开关
watch(() => props.enableAnimation, (enabled) => {
  if (enabled) {
    start()
  } else {
    stop()
    setValue(0)
  }
}, { immediate: true })

// 监听动画速度变化
watch(() => props.animationSpeed, (newSpeed) => {
  setSpeed(newSpeed)
})

// 计算总的旋转角度
const totalRotation = computed(() => {
  return (getValue() + props.rotation) % 360
})

// 角度转换为笛卡尔坐标
// 使用标准坐标系统：0度在右边，90度在上方，180度在左边，270度在下方
const polarToCartesian = (
  angle: number,
  radius: number,
  centerX: number = props.centerX,
  centerY: number = props.centerY
): Point => {
  const angleRad = (angle * Math.PI) / 180
  return {
    x: centerX + Math.cos(angleRad) * radius,
    y: centerY + Math.sin(angleRad) * radius
  }
}

// 计算角度范围的中点
const getMidAngle = (startAngle: number, endAngle: number): number => {
  // 处理跨越0度的情况
  if (startAngle > endAngle) {
    // 跨越0度的情况，比如345-15度
    const span = (360 - startAngle) + endAngle
    return (startAngle + span / 2 + 360) % 360
  } else {
    // 正常情况
    return (startAngle + endAngle) / 2
  }
}

// 计算两个角度之间的跨度
const getAngleSpan = (startAngle: number, endAngle: number): number => {
  if (startAngle > endAngle) {
    return (360 - startAngle) + endAngle
  } else {
    return endAngle - startAngle
  }
}

// 标准化角度到0-360范围
const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360
}

// 生成等分角度
const generateEqualAngles = (count: number, startAngle: number = 0): AngleRange[] => {
  const step = 360 / count
  return Array.from({ length: count }, (_, i) => ({
    startAngle: startAngle + i * step,
    endAngle: startAngle + (i + 1) * step
  }))
}

// 生成圆弧路径
const generateArcPath = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  innerRadius: number = 0
): string => {
  const start = polarToCartesian(startAngle, radius, centerX, centerY)
  const end = polarToCartesian(endAngle, radius, centerX, centerY)

  if (innerRadius === 0) {
    // 扇形
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
    return `M ${centerX},${centerY} L ${start.x},${start.y} A ${radius},${radius} 0 ${largeArcFlag},1 ${end.x},${end.y} Z`
  } else {
    // 环形
    const startInner = polarToCartesian(startAngle, innerRadius, centerX, centerY)
    const endInner = polarToCartesian(endAngle, innerRadius, centerX, centerY)
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

    return `M ${start.x},${start.y} A ${radius},${radius} 0 ${largeArcFlag},1 ${end.x},${end.y} L ${endInner.x},${endInner.y} A ${innerRadius},${innerRadius} 0 ${largeArcFlag},0 ${startInner.x},${startInner.y} Z`
  }
}

// 暴露给父组件的工具函数
defineExpose({
  polarToCartesian,
  getMidAngle,
  getAngleSpan,
  normalizeAngle,
  generateEqualAngles,
  generateArcPath,
  totalRotation,
  animationRotation: getValue,
  startAnimation: start,
  stopAnimation: stop,
  setAnimationSpeed: setSpeed
})
</script>

<template>
  <g class="polar-canvas" :transform="`rotate(${totalRotation} ${centerX} ${centerY})`">
    <slot
      :center-x="centerX"
      :center-y="centerY"
      :total-rotation="totalRotation"
      :polar-to-cartesian="polarToCartesian"
      :get-mid-angle="getMidAngle"
      :get-angle-span="getAngleSpan"
      :normalize-angle="normalizeAngle"
      :generate-equal-angles="generateEqualAngles"
      :generate-arc-path="generateArcPath"
    />
  </g>
</template>

<style scoped>
.polar-canvas {
  /* 基础样式，可以通过slot内容自定义 */
}
</style>