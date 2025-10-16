<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PolarCanvas from './base/PolarCanvas.vue'
import { AstroTime, SunPosition, MakeTime, GeoVector, Body, Ecliptic } from 'astronomy-engine'

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
 * 行星位置接口
 */
interface PlanetPosition {
  /** 当前黄经度数 */
  longitude: number
  /** 当前黄纬度数（黄道偏移） */
  latitude: number
  /** 行星符号 */
  symbol?: string
  /** 颜色 */
  color?: string
  /** 大小 */
  size?: number
  /** 行星名称 */
  name: string
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
  /** 是否显示五星 */
  showPlanets?: boolean
  /** 是否显示行星文字标签 */
  showPlanetLabels?: boolean
  /** 观测者纬度（度） */
  observerLatitude?: number
  /** 观测者经度（度） */
  observerLongitude?: number
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  enableAnimation: true,
  animationSpeed: 0.5,
  rotation: 0,
  showSunLabel: true,
  showPlanets: true,
  showPlanetLabels: true,
  observerLatitude: 39.9042,  // 北京纬度
  observerLongitude: 116.4074  // 北京经度
})

// 缓存太阳位置计算结果
const cachedSunPosition = ref<SunPosition>({
  longitude: 0,
  symbol: '☉',
  color: '#ffdd00',
  size: 20
})

// 五星配置
const PLANETS_CONFIG = {
  mercury: {
    name: '水星',
    symbol: '☿',
    color: '#8C8C8C',
    size: 8,
    body: Body.Mercury
  },
  venus: {
    name: '金星',
    symbol: '♀',
    color: '#FFC649',
    size: 14,
    body: Body.Venus
  },
  mars: {
    name: '火星',
    symbol: '♂',
    color: '#CD5C5C',
    size: 10,
    body: Body.Mars
  },
  jupiter: {
    name: '木星',
    symbol: '♃',
    color: '#DAA520',
    size: 18,
    body: Body.Jupiter
  },
  saturn: {
    name: '土星',
    symbol: '♄',
    color: '#F4E7D7',
    size: 16,
    body: Body.Saturn
  }
} as const

// 缓存行星位置计算结果
const cachedPlanetPositions = ref<Record<string, PlanetPosition>>({})

/**
 * 使用 astronomy-engine 计算行星的黄道位置
 */
const calculatePlanetPosition = (time: Date, planetKey: keyof typeof PLANETS_CONFIG): PlanetPosition => {
  const config = PLANETS_CONFIG[planetKey]

  // 将 JavaScript Date 转换为 astronomy-engine 的 AstroTime
  const astroTime = new AstroTime(time)

  // 获取行星的地心向量（已考虑光行差）
  const geoVector = GeoVector(config.body, astroTime, true)

  // 将赤道坐标转换为黄道坐标
  const eclipticCoords = Ecliptic(geoVector)

  // 提取黄经和黄纬
  const longitude = eclipticCoords.elon
  const latitude = eclipticCoords.elat

  // 调整经度到 0-360 范围
  const normalizedLongitude = (longitude + 360) % 360

  return {
    longitude: normalizedLongitude,
    latitude: latitude,
    symbol: config.symbol,
    color: config.color,
    size: config.size,
    name: config.name
  }
}

/**
 * 使用 astronomy-engine 计算太阳的真实黄经位置
 */
const calculateSunPosition = (time: Date): SunPosition => {
  // 将 JavaScript Date 转换为 astronomy-engine 的 AstroTime
  // MakeTime 接受单个 Date 对象作为参数
  const astroTime = MakeTime(time)

  // 使用 SunPosition 函数计算太阳的黄道坐标
  const sunEcliptic = SunPosition(astroTime)

  // 获取黄经（度数）， astronomy-engine 已经返回度数
  const longitude = sunEcliptic.elon

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

// 计算所有行星位置
const planetPositions = computed(() => {
  const positions: Record<string, PlanetPosition> = {}
  const time = props.time || new Date()

  Object.keys(PLANETS_CONFIG).forEach(key => {
    positions[key] = cachedPlanetPositions.value[key] || calculatePlanetPosition(time, key as keyof typeof PLANETS_CONFIG)
  })

  return positions
})

// 监听时间变化，更新太阳和行星位置
watch(
  () => props.time,
  (newTime) => {
    if (newTime) {
      // 更新太阳位置
      if (!props.sunPosition) {
        cachedSunPosition.value = calculateSunPosition(newTime)
      }

      // 更新行星位置
      Object.keys(PLANETS_CONFIG).forEach(key => {
        cachedPlanetPositions.value[key] = calculatePlanetPosition(newTime, key as keyof typeof PLANETS_CONFIG)
      })
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

/**
 * 获取行星在黄道上的坐标（包括黄纬偏移）
 */
const getPlanetCoordinates = (longitude: number, latitude: number, baseRadius: number) => {
  const rad = longitude * Math.PI / 180
  const latRad = latitude * Math.PI / 180

  // 计算黄道半径上的位置
  const x = Math.cos(rad) * baseRadius
  const y = Math.sin(rad) * baseRadius

  // 黄纬偏移 - 使用垂直于黄道面的方向
  // 正数黄纬向北偏移（在屏幕上是向外），负数向南偏移（向内）
  const latOffset = Math.sin(latRad) * 200 // 进一步增大缩放因子，让黄纬偏移更加明显

  // 计算垂直于黄道面的方向（从中心向外）
  const perpX = x / baseRadius
  const perpY = y / baseRadius

  return {
    x: x + perpX * latOffset,
    y: y + perpY * latOffset,
    // 返回偏移量用于绘制偏移线
    latOffset: latOffset,
    latDirection: {
      x: perpX,
      y: perpY
    }
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

        <!-- 五星 -->
        <g v-if="showPlanets" class="planets">
          <g v-for="(planet, key) in planetPositions" :key="key" :class="`planet-${key}`">
            <!-- 黄纬偏移指示线 -->
            <line
              v-if="Math.abs(planet.latitude) > 0.5"
              :x1="slotProps.centerX + getSunCoordinates(planet.longitude).x"
              :y1="slotProps.centerY + getSunCoordinates(planet.longitude).y"
              :x2="slotProps.centerX + getPlanetCoordinates(planet.longitude, planet.latitude, radius).x"
              :y2="slotProps.centerY + getPlanetCoordinates(planet.longitude, planet.latitude, radius).y"
              :stroke="planet.color || '#888888'"
              stroke-width="1"
              opacity="0.3"
              stroke-dasharray="2,2"
            />

            <!-- 行星本体 -->
            <circle
              :cx="slotProps.centerX + getPlanetCoordinates(planet.longitude, planet.latitude, radius).x"
              :cy="slotProps.centerY + getPlanetCoordinates(planet.longitude, planet.latitude, radius).y"
              :r="planet.size || 10"
              :fill="planet.color || '#888888'"
              opacity="0.9"
            />

  
            <!-- 行星文字标签 -->
            <g v-if="showPlanetLabels" class="planet-label">
              <text
                :x="slotProps.centerX + getPlanetCoordinates(planet.longitude, planet.latitude, radius).x"
                :y="slotProps.centerY + getPlanetCoordinates(planet.longitude, planet.latitude, radius).y + (planet.size || 10) + 15"
                :fill="planet.color || '#888888'"
                font-size="11"
                text-anchor="middle"
                dominant-baseline="top"
              >
                {{ planet.name }} 
                <!-- {{ Math.round(planet.longitude) }}° -->
                <!-- <tspan v-if="Math.abs(planet.latitude) > 0.5" font-size="9">
                  {{ planet.latitude > 0 ? ' 北' : ' 南' }}{{ Math.abs(Math.round(planet.latitude)) }}°
                </tspan> -->
              </text>
            </g>
          </g>
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

/* 行星样式 */
.planets {
  transition: all 0.3s ease;
}

.planet-mercury,
.planet-venus,
.planet-mars,
.planet-jupiter,
.planet-saturn {
  transition: all 0.3s ease;
  cursor: pointer;
}

.planet-mercury:hover,
.planet-venus:hover,
.planet-mars:hover,
.planet-jupiter:hover,
.planet-saturn:hover {
  filter: brightness(1.3) drop-shadow(0 0 8px currentColor);
}

.planet-label text {
  font-family: 'Microsoft YaHei', sans-serif;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
}

/* 黄纬偏移指示线动画 */
.planets line {
  animation: dash-move 2s linear infinite;
}

@keyframes dash-move {
  to {
    stroke-dashoffset: -4;
  }
}
</style>