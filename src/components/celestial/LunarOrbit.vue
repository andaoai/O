<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from '../base/PolarCanvas.vue'
import { lunarOrbit, moonOrbitPath } from '@/utils/celestial'

/**
 * 白道（月球轨道）组件
 *
 * 画白道轨迹（基于月亮一个完整轨道周期的采样点）+ 升/降交点 + 黄道圆心标记。
 * 位置数据全部来自 utils/celestial。自带 PolarCanvas，可单独使用。
 */
interface Props {
  /** 黄道基准半径 */
  radius?: number
  /** 观测时间 */
  time?: Date
  /** 是否显示轨道交点 */
  showOrbitalNodes?: boolean
  /** 月亮黄纬偏移缩放因子（与月亮本体保持一致） */
  latScale?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  showOrbitalNodes: true,
  latScale: 300,
  rotationDirection: 'clockwise'
})

/** 当前时间（缺省取此刻） */
const currentTime = computed(() => props.time ?? new Date())

/** 白道轨道参数（升/降交点黄经） */
const orbit = computed(() => lunarOrbit(currentTime.value))

/** 白道轨迹采样点（黄经/黄纬） */
const orbitSamples = computed(() => moonOrbitPath(currentTime.value))

/** 把"黄经"转为黄道圆上的坐标 */
const longitudeToPoint = (longitude: number, polarToCartesian: Function) => {
  return polarToCartesian(longitude, props.radius, 0, 0)
}

/** 把"黄经+黄纬"转为含偏移的坐标（与月亮本体口径一致） */
const sampleToPoint = (
  longitude: number,
  latitude: number,
  polarToCartesian: Function
) => {
  const base = longitudeToPoint(longitude, polarToCartesian)
  const latOffset = Math.sin((latitude * Math.PI) / 180) * props.latScale
  const perpX = base.x / props.radius
  const perpY = base.y / props.radius
  return { x: base.x + perpX * latOffset, y: base.y + perpY * latOffset }
}

/** 生成白道轨迹的 SVG path */
const orbitPath = (centerX: number, centerY: number, polarToCartesian: Function): string => {
  return orbitSamples.value
    .map((s, index) => {
      const p = sampleToPoint(s.longitude, s.latitude, polarToCartesian)
      return `${index === 0 ? 'M' : 'L'} ${centerX + p.x} ${centerY + p.y}`
    })
    .join(' ')
}
</script>

<template>
  <PolarCanvas
    :enable-animation="false"
    :rotation-direction="rotationDirection"
    :center-x="0"
    :center-y="0"
  >
    <template #default="slotProps">
      <g class="white-way">
        <!-- 白道轨迹 -->
        <path
          :d="orbitPath(slotProps.centerX, slotProps.centerY, slotProps.polarToCartesian)"
          fill="none"
          stroke="#ffffff"
          stroke-width="1.5"
          stroke-dasharray="12,6"
          opacity="0.7"
        />

        <!-- 轨道交点 -->
        <g v-if="showOrbitalNodes" class="orbital-nodes">
          <!-- 升交点（绿点） -->
          <circle
            class="ascending-node"
            :cx="slotProps.centerX + longitudeToPoint(orbit.ascendingNodeLongitude, slotProps.polarToCartesian).x"
            :cy="slotProps.centerY + longitudeToPoint(orbit.ascendingNodeLongitude, slotProps.polarToCartesian).y"
            r="6"
            fill="#00ff00"
            opacity="0.9"
          />
          <!-- 降交点（红点） -->
          <circle
            class="descending-node"
            :cx="slotProps.centerX + longitudeToPoint(orbit.descendingNodeLongitude, slotProps.polarToCartesian).x"
            :cy="slotProps.centerY + longitudeToPoint(orbit.descendingNodeLongitude, slotProps.polarToCartesian).y"
            r="6"
            fill="#ff0000"
            opacity="0.9"
          />
        </g>

        <!-- 黄道圆心标记 -->
        <circle :cx="slotProps.centerX" :cy="slotProps.centerY" r="4" fill="#ffdd00" opacity="0.6" />
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.white-way {
  transition: all 0.3s ease;
}

.orbital-nodes circle {
  filter: drop-shadow(0 0 4px currentColor);
}

.ascending-node:hover,
.descending-node:hover {
  filter: brightness(1.5) drop-shadow(0 0 8px currentColor);
}
</style>
