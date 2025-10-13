<template>
  <PolarCanvas
    :enable-animation="autoRotate"
    :animation-speed="rotateSpeed"
    :rotation="rotation"
  >
    <template #default="slotProps">
      <g
        :transform="`translate(${slotProps.centerX + x}, ${slotProps.centerY + y}) rotate(${getDisplayPosition(slotProps.centerX, slotProps.centerY, slotProps.totalRotation).rotation}, 0, 0)`"
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
          :d="generateTaijiPath(size, yinColor)"
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
  </PolarCanvas>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from './base/PolarCanvas.vue'

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

// 生成太极图的S形曲线路径
const generateTaijiPath = (size: number, yinColor: string) => {
  return `M 0,${-size} A ${size/2},${size/2} 0 0,1 0,0 A ${size/2},${size/2} 0 0,0 0,${size} A ${size},${size} 0 0,1 0,${-size}`
}

// 计算显示位置
const getDisplayPosition = (centerX: number, centerY: number, totalRotation: number) => {
  const position = {
    x: centerX + props.x,
    y: centerY + props.y
  }
  return {
    x: position.x,
    y: position.y,
    rotation: props.autoRotate ? totalRotation : props.rotation
  }
}
</script>

<style scoped>
</style>