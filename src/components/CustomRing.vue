<script setup lang="ts">
import { computed } from 'vue'
import CircleRing from './base/CircleRing.vue'

/**
 * 自定义圆环组件
 *
 * 可以自定义开始位置和内容的高度灵活环形组件
 * 支持任意数量的项目，每个项目占据相同的角度
 */

interface Props {
  /** 圆环外半径（像素） */
  radius: number
  /** 圆环内半径（像素） */
  innerRadius?: number
  /** 环上的项目数组 */
  items: Array<{ label: string; color?: string }>
  /** 起始度数偏移（0-360度） */
  startDegree: number
  /** 是否显示标签文字 */
  showLabels?: boolean
  /** 是否显示扇形区域 */
  showSectors?: boolean
  /** 扇形透明度 */
  sectorOpacity?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 整体旋转角度 */
  rotation?: number
  /** 是否启用动画 */
  enableAnimation?: boolean
  /** 动画速度 */
  animationSpeed?: number
  /** 标签颜色 */
  labelColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  innerRadius: 0,
  showLabels: true,
  showSectors: false,
  sectorOpacity: 0.2,
  rotationDirection: 'clockwise',
  rotation: 0,
  enableAnimation: false,
  animationSpeed: 0.5,
  labelColor: 'white'
})

/**
 * 计算每个项目的角度范围
 */
const angleStep = computed(() => 360 / props.items.length)

/**
 * 生成带自定义角度的项目数据
 */
const ringItems = computed(() =>
  props.items.map((item, index) => ({
    label: item.label,
    color: item.color,
    startAngle: index * angleStep.value,
    endAngle: (index + 1) * angleStep.value,
    fontSize: 12
  }))
)
</script>

<template>
  <CircleRing
    :radius="radius"
    :inner-radius="innerRadius"
    :items="ringItems"
    :show-labels="showLabels"
    :show-sectors="showSectors"
    :show-ticks="true"
    :tick-length="8"
    :tick-width="0.5"
    :tick-color="'#888888'"
    :show-circle="true"
    :circle-width="0.5"
    :circle-color="'#666666'"
    :start-degree="startDegree"
    :rotation="rotation"
    :rotation-direction="rotationDirection"
    :enable-animation="enableAnimation"
    :animation-speed="animationSpeed"
    :label-position="0.5"
    :label-color="labelColor"
  />
</template>

<style scoped>
/* 自定义圆环组件样式 */
</style>