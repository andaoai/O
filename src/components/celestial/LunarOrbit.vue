<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from '../base/PolarCanvas.vue'
import { lunarOrbit, moonOrbitPath } from '@/utils/celestial'
import { polarToCartesian } from '@/utils/geometry'

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

/** 把"黄经"转为黄道圆上的坐标（中心 0,0，统一走 geometry） */
const longitudeToPoint = (longitude: number) =>
  polarToCartesian(longitude, props.radius, props.rotationDirection)

/** 把"黄经+黄纬"转为含偏移的坐标（与月亮本体口径一致） */
const sampleToPoint = (longitude: number, latitude: number) => {
  const base = longitudeToPoint(longitude)
  const latOffset = Math.sin((latitude * Math.PI) / 180) * props.latScale
  const perpX = base.x / props.radius
  const perpY = base.y / props.radius
  return { x: base.x + perpX * latOffset, y: base.y + perpY * latOffset }
}

/** 白道轨迹 SVG path（中心 0,0） */
const orbitPathD = computed(() =>
  orbitSamples.value
    .map((s, index) => {
      const p = sampleToPoint(s.longitude, s.latitude)
      return `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    })
    .join(' ')
)

/** 升交点坐标 */
const ascNode = computed(() => longitudeToPoint(orbit.value.ascendingNodeLongitude))
/** 降交点坐标 */
const descNode = computed(() => longitudeToPoint(orbit.value.descendingNodeLongitude))
</script>

<template>
  <PolarCanvas
    :enable-animation="false"
    :rotation-direction="rotationDirection"
    :center-x="0"
    :center-y="0"
  >
    <template #default>
      <g class="white-way">
        <!-- 白道轨迹 -->
        <path
          :d="orbitPathD"
          fill="none"
          stroke="#ffffff"
          stroke-width="1.5"
          stroke-dasharray="12,6"
          opacity="0.7"
        />

        <!-- 轨道交点 -->
        <g v-if="showOrbitalNodes" class="orbital-nodes">
          <!-- 升交点（绿点） -->
          <circle class="ascending-node" :cx="ascNode.x" :cy="ascNode.y" r="6" fill="#00ff00" opacity="0.9" />
          <!-- 降交点（红点） -->
          <circle class="descending-node" :cx="descNode.x" :cy="descNode.y" r="6" fill="#ff0000" opacity="0.9" />
        </g>

        <!-- 黄道圆心标记 -->
        <circle :cx="0" :cy="0" r="4" fill="#ffdd00" opacity="0.6" />
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
