<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PolarCanvas from './base/PolarCanvas.vue'
import { AstroTime, SunPosition, MakeTime } from 'astronomy-engine'

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
  /** 太阳位置（可选，如果不提供则根据时间计算） */
  sunPosition?: SunPosition
  /** 观测时间（用于计算太阳位置） */
  time?: Date
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

// 缓存太阳位置计算结果
const cachedSunPosition = ref<SunPosition>({
  longitude: 0,
  symbol: '☉',
  color: '#ffdd00',
  size: 20
})

/**
 * 使用 astronomy-engine 计算太阳的真实黄经位置
 */
const calculateSunPosition = (time: Date): SunPosition => {
  try {
    // 将 JavaScript Date 转换为 astronomy-engine 的 AstroTime
    // MakeTime 接受单个 Date 对象作为参数
    const astroTime = MakeTime(time)

    // 使用 SunPosition 函数计算太阳的黄道坐标
    const sunEcliptic = SunPosition(astroTime)

    if (sunEcliptic) {
      // 获取黄经（度数）， astronomy-engine 已经返回度数
      const longitude = sunEcliptic.elon

      // 根据黄经确定太阳颜色（可选：根据季节变化）
      let color = '#ffdd00'
      if (longitude >= 80 && longitude < 100) {
        color = '#ff6666' // 夏至 - 偏红
      } else if (longitude >= 170 && longitude < 190) {
        color = '#ff8844' // 秋分 - 偏橙
      } else if (longitude >= 260 && longitude < 280) {
        color = '#6666ff' // 冬至 - 偏蓝
      } else if (longitude >= 350 || longitude < 10) {
        color = '#00ff88' // 春分 - 偏绿
      }

      return {
        longitude,
        symbol: '☉',
        color,
        size: 20
      }
    }
  } catch (error) {
    console.warn('计算太阳位置失败，使用简单计算:', error)
  }

  // 如果天文计算失败，使用简单计算作为后备
  const yearStart = new Date(time.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((time.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000))
  // 添加280度偏移以大致匹配春分点（3月21日左右在0度）
  const longitude = (dayOfYear * 360 / 365.25 + 280) % 360

  return {
    longitude,
    symbol: '☉',
    color: '#ffdd00',
    size: 20
  }
}

/**
 * 默认太阳位置（使用 astronomy-engine 计算）
 */
const defaultSunPosition = computed(() => {
  const time = props.time || new Date()
  return calculateSunPosition(time)
})

/**
 * 当前太阳位置
 */
const currentSunPosition = computed(() => {
  return props.sunPosition || cachedSunPosition.value
})

// 监听时间变化，更新太阳位置
watch(
  () => props.time,
  (newTime) => {
    if (newTime && !props.sunPosition) {
      cachedSunPosition.value = calculateSunPosition(newTime)
    }
  },
  { immediate: true }
)

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

        <!-- 春分点标记（0度） -->
        <g class="vernal-equinox">
          <line
            :x1="slotProps.centerX + radius * 0.9"
            :y1="slotProps.centerY"
            :x2="slotProps.centerX + radius * 1.1"
            :y2="slotProps.centerY"
            stroke="#00ff88"
            stroke-width="2"
            opacity="0.8"
          />
          <text
            :x="slotProps.centerX + radius * 1.25"
            :y="slotProps.centerY"
            fill="#00ff88"
            font-size="12"
            text-anchor="start"
            dominant-baseline="middle"
          >
            春分
          </text>
        </g>

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

.solar-ecliptic {
  transition: all 0.3s ease;
}

.vernal-equinox {
  transition: all 0.3s ease;
}

.vernal-equinox:hover {
  filter: brightness(1.3);
}
</style>