<template>
  <g
    :transform="`translate(${x}, ${y}) rotate(${displayRotation})`"
  >
    <!-- 整体外圆 - 白色背景 -->
    <circle
      :cx="0"
      :cy="0"
      :r="size"
      :fill="yangColor"
    />

    <!-- 左半边黑色半圆 (S形曲线) -->
    <path
      :d="`M 0,${-size} A ${size/2},${size/2} 0 0,1 0,0 A ${size/2},${size/2} 0 0,0 0,${size} A ${size},${size} 0 0,1 0,${-size}`"
      :fill="yinColor"
    />

    <!-- 上半部分小圆 (黑色，位置在1/4处) -->
    <circle
      :cx="0"
      :cy="-size/2"
      :r="size/4"
      :fill="yinColor"
    />

    <!-- 下半部分小圆 (白色，位置在3/4处) -->
    <circle
      :cx="0"
      :cy="size/2"
      :r="size/4"
      :fill="yangColor"
    />
  </g>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

interface Props {
  x?: number
  y?: number
  size?: number
  rotation?: number
  yinColor?: string
  yangColor?: string
  autoRotate?: boolean
  rotateSpeed?: number
}

const props = withDefaults(defineProps<Props>(), {
  x: 0,
  y: 0,
  size: 50,
  rotation: 0,
  yinColor: '#000000',
  yangColor: '#ffffff',
  autoRotate: false,
  rotateSpeed: 30
})

// 自动旋转相关
const currentRotation = ref(props.rotation)
let animationFrame: number | null = null
let startTime: number | null = null

// 当前旋转角度（用于动画）
const displayRotation = computed(() => {
  if (props.autoRotate) {
    return currentRotation.value
  }
  return props.rotation
})

// 动画循环
const animate = (timestamp: number) => {
  if (!startTime) startTime = timestamp
  const elapsed = timestamp - startTime

  // 根据速度计算旋转角度
  currentRotation.value = (props.rotation + (elapsed * props.rotateSpeed / 1000)) % 360

  animationFrame = requestAnimationFrame(animate)
}

// 启动自动旋转
const startAutoRotate = () => {
  if (props.autoRotate && !animationFrame) {
    animationFrame = requestAnimationFrame(animate)
  }
}

// 停止自动旋转
const stopAutoRotate = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
    startTime = null
  }
}

// 监听autoRotate变化
onMounted(() => {
  if (props.autoRotate) {
    startAutoRotate()
  }
})

onUnmounted(() => {
  stopAutoRotate()
})


</script>

<style scoped>
</style>