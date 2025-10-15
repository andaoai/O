<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from './base/PolarCanvas.vue'

/**
 * 太阳位置接口
 */
interface SunPosition {
  /** 当前黄经度数 */
  longitude: number
  /** 太阳符号 */
  symbol?: string
  /** 颜色 */
  color?: string
  /** 大小 */
  size?: number
}

/**
 * 组件属性接口
 */
interface Props {
  /** 黄道半径 */
  radius?: number
  /** 太阳位置 */
  sunPosition?: SunPosition
  /** 是否启用动画 */
  enableAnimation?: boolean
  /** 动画速度 */
  animationSpeed?: number
  /** 整体旋转角度 */
  rotation?: number
  /** 是否显示太阳文字标签 */
  showSunLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  enableAnimation: true,
  animationSpeed: 0.5,
  rotation: 0,
  showSunLabel: true
})

/**
 * 默认太阳位置（当前日期的太阳黄经）
 */
const defaultSunPosition = computed(() => {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000))
  const longitude = (dayOfYear * 360 / 365.25) % 360

  return {
    longitude,
    symbol: '☉',
    color: '#ffdd00',
    size: 20
  }
})

/**
 * 当前太阳位置
 */
const currentSunPosition = computed(() => {
  return props.sunPosition || defaultSunPosition.value
})

/**
 * 获取太阳在黄道上的坐标
 */
const getSunCoordinates = (longitude: number) => {
  const rad = longitude * Math.PI / 180
  return {
    x: Math.cos(rad) * props.radius,
    y: Math.sin(rad) * props.radius
  }
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
      <g class="solar-ecliptic">
        <!-- 黄道圆圈 -->
        <circle
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="radius"
          fill="none"
          stroke="#ffdd00"
          stroke-width="2"
          opacity="0.8"
        />

        <!-- 太阳 -->
        <g>
          <!-- 太阳光晕 -->
          <circle
            :cx="slotProps.centerX + getSunCoordinates(currentSunPosition.longitude).x"
            :cy="slotProps.centerY + getSunCoordinates(currentSunPosition.longitude).y"
            :r="(currentSunPosition.size || 20) + 10"
            fill="#ffdd00"
            opacity="0.2"
          />
          <circle
            :cx="slotProps.centerX + getSunCoordinates(currentSunPosition.longitude).x"
            :cy="slotProps.centerY + getSunCoordinates(currentSunPosition.longitude).y"
            :r="(currentSunPosition.size || 20) + 5"
            fill="#ffdd00"
            opacity="0.4"
          />

          <!-- 太阳本体 -->
          <circle
            :cx="slotProps.centerX + getSunCoordinates(currentSunPosition.longitude).x"
            :cy="slotProps.centerY + getSunCoordinates(currentSunPosition.longitude).y"
            :r="currentSunPosition.size || 20"
            :fill="currentSunPosition.color || '#ffdd00'"
          />

          <!-- 太阳符号 -->
          <text
            :x="slotProps.centerX + getSunCoordinates(currentSunPosition.longitude).x"
            :y="slotProps.centerY + getSunCoordinates(currentSunPosition.longitude).y"
            fill="#ffffff"
            font-size="20"
            font-weight="bold"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ currentSunPosition.symbol || '☉' }}
          </text>
        </g>

        <!-- 太阳文字标签 -->
        <g v-if="showSunLabel" class="sun-label">
          <text
            :x="slotProps.centerX + getSunCoordinates(currentSunPosition.longitude).x"
            :y="slotProps.centerY + getSunCoordinates(currentSunPosition.longitude).y + (currentSunPosition.size || 20) + 20"
            fill="#ffdd00"
            font-size="12"
            text-anchor="middle"
            dominant-baseline="top"
          >
            太阳 {{ Math.round(currentSunPosition.longitude) }}°
          </text>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.solar-ecliptic {
  transform-origin: center;
}

.solar-term {
  transition: all 0.3s ease;
}

.solar-term:hover {
  filter: brightness(1.3);
}
</style>