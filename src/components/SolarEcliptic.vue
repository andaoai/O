<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PolarCanvas from './base/PolarCanvas.vue'
import { AstroTime, SunPosition, MakeTime, GeoVector, Body, Ecliptic, EclipticGeoMoon, SearchMoonNode, NextMoonNode, NodeEventInfo, NodeEventKind } from 'astronomy-engine'

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
 * 月亮位置接口
 */
interface MoonPosition {
  /** 当前黄经度数 */
  longitude: number
  /** 当前黄纬度数 */
  latitude: number
  /** 月亮符号 */
  symbol?: string
  /** 颜色 */
  color?: string
  /** 大小 */
  size?: number
  /** 距地距离（千米） */
  distance?: number
}

/**
 * 白道轨道参数接口
 */
interface LunarOrbitInfo {
  /** 轨道倾角（度） */
  inclination: number
  /** 升交点黄经（度） */
  ascendingNodeLongitude: number
  /** 降交点黄经（度） */
  descendingNodeLongitude: number
  /** 白道圆心相对于黄道圆心的偏移方向（度） */
  orbitCenterAngle: number
  /** 白道圆心偏移量 */
  orbitCenterOffset: number
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
  /** 是否显示月亮 */
  showMoon?: boolean
  /** 是否显示白道 */
  showWhiteWay?: boolean
  /** 是否显示月亮文字标签 */
  showMoonLabel?: boolean
  /** 是否显示轨道交点 */
  showOrbitalNodes?: boolean
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
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
  observerLongitude: 116.4074, // 北京经度
  showMoon: true,
  showWhiteWay: true,
  showMoonLabel: true,
  showOrbitalNodes: true,
  rotationDirection: 'clockwise'
})

// 缓存太阳位置计算结果
const cachedSunPosition = ref<SunPosition>({
  longitude: 0,
  symbol: '日',
  color: '#ffdd00',
  size: 20
})

// 五星配置
const PLANETS_CONFIG = {
  mercury: {
    name: '水星',
    symbol: '水',
    color: '#8C8C8C',
    size: 8,
    body: Body.Mercury
  },
  venus: {
    name: '金星',
    symbol: '金',
    color: '#FFC649',
    size: 14,
    body: Body.Venus
  },
  mars: {
    name: '火星',
    symbol: '火',
    color: '#CD5C5C',
    size: 10,
    body: Body.Mars
  },
  jupiter: {
    name: '木星',
    symbol: '木',
    color: '#DAA520',
    size: 18,
    body: Body.Jupiter
  },
  saturn: {
    name: '土星',
    symbol: '土',
    color: '#F4E7D7',
    size: 16,
    body: Body.Saturn
  }
} as const

// 缓存行星位置计算结果
const cachedPlanetPositions = ref<Record<string, PlanetPosition>>({})

// 缓存月亮位置计算结果
const cachedMoonPosition = ref<MoonPosition>({
  longitude: 0,
  latitude: 0,
  symbol: '月',
  color: '#c0c0c0',
  size: 12
})

// 缓存白道轨道参数
const cachedLunarOrbit = ref<LunarOrbitInfo>({
  inclination: 5.145, // 月球轨道倾角（黄白交角）
  ascendingNodeLongitude: 0,
  descendingNodeLongitude: 180,
  orbitCenterAngle: 0,
  orbitCenterOffset: 0
})

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
 * 使用 astronomy-engine 计算月亮的黄道位置
 */
const calculateMoonPosition = (time: Date): MoonPosition => {
  // 将 JavaScript Date 转换为 astronomy-engine 的 AstroTime
  const astroTime = MakeTime(time)

  // 使用 EclipticGeoMoon 函数计算月亮的黄道坐标
  const moonEcliptic = EclipticGeoMoon(astroTime)

  // 提取黄经、黄纬和距离
  const longitude = (moonEcliptic.lon + 360) % 360
  const latitude = moonEcliptic.lat
  const distance = moonEcliptic.dist

  return {
    longitude,
    latitude,
    symbol: '月',
    color: '#c0c0c0',
    size: 12,
    distance
  }
}

/**
 * 计算白道轨道参数（包括升交点和降交点）
 */
const calculateLunarOrbit = (time: Date): LunarOrbitInfo => {
  const astroTime = MakeTime(time)

  // 搜索最近的节点
  let firstNode = SearchMoonNode(astroTime)
  let secondNode = NextMoonNode(firstNode)

  // 判断第一个节点是升交点还是降交点
  let ascendingNode: NodeEventInfo
  let descendingNode: NodeEventInfo

  if (firstNode.kind === NodeEventKind.Ascending) {
    ascendingNode = firstNode
    descendingNode = secondNode
  } else {
    // 第一个是降交点，那么第二个就是升交点
    ascendingNode = secondNode
    descendingNode = firstNode
  }

  // 获取升交点和降交点的时刻
  const ascendingTime = ascendingNode.time
  const descendingTime = descendingNode.time

  // 计算升交点和降交点的黄经
  const ascendingMoonPos = EclipticGeoMoon(ascendingTime)
  const descendingMoonPos = EclipticGeoMoon(descendingTime)

  const ascendingLongitude = (ascendingMoonPos.lon + 360) % 360
  const descendingLongitude = (descendingMoonPos.lon + 360) % 360

  // 计算白道圆心偏移
  // 白道相对于黄道有约5度的倾角，圆心偏移用于可视化这个倾斜
  const orbitCenterAngle = (ascendingLongitude + 90) % 360 // 升交点后90度为最大偏移方向
  const orbitCenterOffset = props.radius * Math.tan(5.145 * Math.PI / 180) * 0.5 // 基于倾角计算偏移量

  return {
    inclination: 5.145, // 黄白交角
    ascendingNodeLongitude: ascendingLongitude,
    descendingNodeLongitude: descendingLongitude,
    orbitCenterAngle,
    orbitCenterOffset
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
    symbol: '日',
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

// 计算月亮位置
const moonPosition = computed(() => {
  const time = props.time || new Date()
  return cachedMoonPosition.value || calculateMoonPosition(time)
})

// 计算白道轨道参数
const lunarOrbit = computed(() => {
  const time = props.time || new Date()
  return cachedLunarOrbit.value || calculateLunarOrbit(time)
})


// 监听时间变化，更新太阳、行星和月亮位置
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

      // 更新月亮位置
      cachedMoonPosition.value = calculateMoonPosition(newTime)

      // 更新白道轨道参数
      cachedLunarOrbit.value = calculateLunarOrbit(newTime)
    }
  },
  { immediate: true }
)

/**
 * 获取太阳在黄道上的坐标（使用PolarCanvas的坐标系统）
 */
const getSunCoordinates = (longitude: number, polarToCartesian: Function) => {
  return polarToCartesian(longitude, props.radius, 0, 0)
}

/**
 * 获取行星在黄道上的坐标（包括黄纬偏移，使用PolarCanvas的坐标系统）
 */
const getPlanetCoordinates = (longitude: number, latitude: number, baseRadius: number, polarToCartesian: Function) => {
  // 先获取黄道上的基础位置
  const baseCoords = polarToCartesian(longitude, baseRadius, 0, 0)

  // 黄纬偏移 - 使用垂直于黄道面的方向
  const latRad = latitude * Math.PI / 180
  const latOffset = Math.sin(latRad) * 200 // 进一步增大缩放因子，让黄纬偏移更加明显

  // 计算垂直于黄道面的方向（从中心向外）
  const perpX = baseCoords.x / baseRadius
  const perpY = baseCoords.y / baseRadius

  return {
    x: baseCoords.x + perpX * latOffset,
    y: baseCoords.y + perpY * latOffset,
    // 返回偏移量用于绘制偏移线
    latOffset: latOffset,
    latDirection: {
      x: perpX,
      y: perpY
    }
  }
}

/**
 * 生成白道轨迹点（基于月亮实际运动轨迹，使用PolarCanvas的坐标系统）
 */
const generateMoonOrbitPath = (polarToCartesian: Function) => {
  const points = []
  const steps = 40 // 减少到40个点

  for (let i = 0; i < steps - 2; i++) {  // 少生成两个点，避免路径闭合
    // 计算轨迹上的时间点（从当前时间开始，计算一个完整月周期）
    const daysOffset = (i / steps) * 29.53 // 月球轨道周期约29.53天
    const orbitTime = new Date((props.time || new Date()).getTime() + daysOffset * 24 * 60 * 60 * 1000)

    // 计算该时间点的月亮位置
    const moonPos = calculateMoonPosition(orbitTime)

    // 转换为坐标
    const coords = getMoonCoordinates(moonPos.longitude, moonPos.latitude, props.radius, polarToCartesian)
    points.push({ x: coords.x, y: coords.y })
  }

  return points
}

/**
 * 获取月亮的坐标（基于黄道坐标系，使用PolarCanvas的坐标系统）
 */
const getMoonCoordinates = (longitude: number, latitude: number, baseRadius: number, polarToCartesian: Function) => {
  // 先获取黄道上的基础位置
  const baseCoords = polarToCartesian(longitude, baseRadius, 0, 0)

  // 黄纬偏移 - 使用垂直于黄道面的方向
  const latRad = latitude * Math.PI / 180
  const latOffset = Math.sin(latRad) * 300 // 增大缩放因子，让黄纬偏移更加明显

  // 计算垂直于黄道面的方向（从中心向外）
  const perpX = baseCoords.x / baseRadius
  const perpY = baseCoords.y / baseRadius

  return {
    x: baseCoords.x + perpX * latOffset,
    y: baseCoords.y + perpY * latOffset
  }
}
</script>

<template>
  <PolarCanvas
    :enable-animation="enableAnimation"
    :animation-speed="animationSpeed"
    :rotation="rotation"
    :rotation-direction="rotationDirection"
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
        </g>

        <!-- 太阳 -->
        <g>
          <!-- 太阳光晕 -->
          <circle
            :cx="slotProps.centerX + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).x"
            :cy="slotProps.centerY + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).y"
            :r="(currentSunPosition.size || 20) + 10"
            fill="#ffdd00"
            opacity="0.2"
          />
          <circle
            :cx="slotProps.centerX + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).x"
            :cy="slotProps.centerY + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).y"
            :r="(currentSunPosition.size || 20) + 5"
            fill="#ffdd00"
            opacity="0.4"
          />

          <!-- 太阳本体 -->
          <circle
            :cx="slotProps.centerX + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).x"
            :cy="slotProps.centerY + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).y"
            :r="currentSunPosition.size || 20"
            :fill="currentSunPosition.color || '#ffdd00'"
          />

          <!-- 太阳符号 -->
          <text
            :x="slotProps.centerX + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).x"
            :y="slotProps.centerY + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).y"
            fill="#333"
            font-size="14"
            font-weight="bold"
            text-anchor="middle"
            dominant-baseline="middle"
            :transform="`rotate(${rotationDirection === 'counterclockwise' ? -currentSunPosition.longitude + 90 : currentSunPosition.longitude + 90}, ${slotProps.centerX + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).x}, ${slotProps.centerY + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).y})`"
          >
            {{ currentSunPosition.symbol }}
          </text>
          </g>

        <!-- 太阳文字标签 -->
        <!-- <g v-if="showSunLabel" class="sun-label">
          <text
            :x="slotProps.centerX + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).x"
            :y="slotProps.centerY + getSunCoordinates(currentSunPosition.longitude, slotProps.polarToCartesian).y + (currentSunPosition.size || 20) + 20"
            fill="#ffdd00"
            font-size="12"
            text-anchor="middle"
            dominant-baseline="top"
          >
            太阳
          </text>
        </g> -->

        <!-- 白道（月球轨道） -->
        <g v-if="showWhiteWay" class="white-way">
          <!-- 白道轨迹（基于月亮实际运动轨迹） -->
          <g>
            <!-- 生成白道路径 -->
            <path
              :d="generateMoonOrbitPath(slotProps.polarToCartesian).map((point, index) =>
                `${index === 0 ? 'M' : 'L'} ${slotProps.centerX + point.x} ${slotProps.centerY + point.y}`
              ).join(' ')"
              fill="none"
              stroke="#ffffff"
              stroke-width="1.5"
              stroke-dasharray="12,6"
              opacity="0.7"
            />
          </g>

          <!-- 轨道交点 -->
          <g v-if="showOrbitalNodes" class="orbital-nodes">
            <!-- 升交点（绿点） -->
            <g class="ascending-node">
              <circle
                :cx="slotProps.centerX + getSunCoordinates(lunarOrbit.ascendingNodeLongitude, slotProps.polarToCartesian).x"
                :cy="slotProps.centerY + getSunCoordinates(lunarOrbit.ascendingNodeLongitude, slotProps.polarToCartesian).y"
                r="6"
                fill="#00ff00"
                opacity="0.9"
              />
              <!-- <text
                :x="slotProps.centerX + getSunCoordinates(lunarOrbit.ascendingNodeLongitude, slotProps.polarToCartesian).x"
                :y="slotProps.centerY + getSunCoordinates(lunarOrbit.ascendingNodeLongitude, slotProps.polarToCartesian).y + 15"
                fill="#00ff00"
                font-size="11"
                text-anchor="middle"
                dominant-baseline="top"
              >
                升交点 {{ Math.round(lunarOrbit.ascendingNodeLongitude) }}°
              </text> -->
            </g>

            <!-- 降交点（红点） -->
            <g class="descending-node">
              <circle
                :cx="slotProps.centerX + getSunCoordinates(lunarOrbit.descendingNodeLongitude, slotProps.polarToCartesian).x"
                :cy="slotProps.centerY + getSunCoordinates(lunarOrbit.descendingNodeLongitude, slotProps.polarToCartesian).y"
                r="6"
                fill="#ff0000"
                opacity="0.9"
              />
              <!-- <text
                :x="slotProps.centerX + getSunCoordinates(lunarOrbit.descendingNodeLongitude, slotProps.polarToCartesian).x"
                :y="slotProps.centerY + getSunCoordinates(lunarOrbit.descendingNodeLongitude, slotProps.polarToCartesian).y + 15"
                fill="#ff0000"
                font-size="11"
                text-anchor="middle"
                dominant-baseline="top"
              >
                降交点 {{ Math.round(lunarOrbit.descendingNodeLongitude) }}°
              </text> -->
            </g>
          </g>

          <!-- 黄道圆心标记（黄点） -->
          <circle
            :cx="slotProps.centerX"
            :cy="slotProps.centerY"
            r="4"
            fill="#ffdd00"
            opacity="0.6"
          />
        </g>

        <!-- 月亮 -->
        <g v-if="showMoon" class="moon">
          <!-- 月亮光晕 -->
          <circle
            :cx="slotProps.centerX + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).x"
            :cy="slotProps.centerY + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).y"
            :r="(moonPosition.size || 12) + 6"
            fill="#c0c0c0"
            opacity="0.2"
          />
          <circle
            :cx="slotProps.centerX + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).x"
            :cy="slotProps.centerY + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).y"
            :r="(moonPosition.size || 12) + 3"
            fill="#c0c0c0"
            opacity="0.4"
          />

          <!-- 月亮本体 -->
          <circle
            :cx="slotProps.centerX + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).x"
            :cy="slotProps.centerY + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).y"
            :r="moonPosition.size || 12"
            :fill="moonPosition.color || '#c0c0c0'"
          />

          <!-- 月亮符号 -->
          <text
            :x="slotProps.centerX + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).x"
            :y="slotProps.centerY + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).y"
            fill="#333"
            font-size="12"
            font-weight="bold"
            text-anchor="middle"
            dominant-baseline="middle"
            :transform="`rotate(${rotationDirection === 'counterclockwise' ? -moonPosition.longitude + 90 : moonPosition.longitude + 90}, ${slotProps.centerX + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).x}, ${slotProps.centerY + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).y})`"
          >
            {{ moonPosition.symbol }}
          </text>

          <!-- 月亮文字标签 -->
          <!-- <g v-if="showMoonLabel" class="moon-label">
            <text
              :x="slotProps.centerX + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).x"
              :y="slotProps.centerY + getMoonCoordinates(moonPosition.longitude, moonPosition.latitude, radius, slotProps.polarToCartesian).y + (moonPosition.size || 12) + 15"
              fill="#c0c0c0"
              font-size="11"
              text-anchor="middle"
              dominant-baseline="top"
            >
              月亮
              <tspan v-if="Math.abs(moonPosition.latitude) > 0.5" font-size="9">
                {{ moonPosition.latitude > 0 ? ' 北' : ' 南' }}{{ Math.abs(Math.round(moonPosition.latitude)) }}°
              </tspan>
            </text>
          </g> -->
        </g>

        <!-- 五星 -->
        <g v-if="showPlanets" class="planets">
          <g v-for="(planet, key) in planetPositions" :key="key" :class="`planet-${key}`">
            <!-- 黄纬偏移指示线 -->
            <line
              v-if="Math.abs(planet.latitude) > 0.5"
              :x1="slotProps.centerX + getSunCoordinates(planet.longitude, slotProps.polarToCartesian).x"
              :y1="slotProps.centerY + getSunCoordinates(planet.longitude, slotProps.polarToCartesian).y"
              :x2="slotProps.centerX + getPlanetCoordinates(planet.longitude, planet.latitude, radius, slotProps.polarToCartesian).x"
              :y2="slotProps.centerY + getPlanetCoordinates(planet.longitude, planet.latitude, radius, slotProps.polarToCartesian).y"
              :stroke="planet.color || '#888888'"
              stroke-width="1"
              opacity="0.3"
              stroke-dasharray="2,2"
            />

            <!-- 行星本体 -->
            <circle
              :cx="slotProps.centerX + getPlanetCoordinates(planet.longitude, planet.latitude, radius, slotProps.polarToCartesian).x"
              :cy="slotProps.centerY + getPlanetCoordinates(planet.longitude, planet.latitude, radius, slotProps.polarToCartesian).y"
              :r="planet.size || 10"
              :fill="planet.color || '#888888'"
              opacity="0.9"
            />

            <!-- 行星符号 -->
            <text
              :x="slotProps.centerX + getPlanetCoordinates(planet.longitude, planet.latitude, radius, slotProps.polarToCartesian).x"
              :y="slotProps.centerY + getPlanetCoordinates(planet.longitude, planet.latitude, radius, slotProps.polarToCartesian).y"
              fill="#fff"
              font-size="11"
              font-weight="bold"
              text-anchor="middle"
              dominant-baseline="middle"
              :transform="`rotate(${rotationDirection === 'counterclockwise' ? -planet.longitude + 90 : planet.longitude + 90}, ${slotProps.centerX + getPlanetCoordinates(planet.longitude, planet.latitude, radius, slotProps.polarToCartesian).x}, ${slotProps.centerY + getPlanetCoordinates(planet.longitude, planet.latitude, radius, slotProps.polarToCartesian).y})`"
            >
              {{ planet.symbol }}
            </text>


            <!-- 行星文字标签 -->
            <!-- <g v-if="showPlanetLabels" class="planet-label">
              <text
                :x="slotProps.centerX + getPlanetCoordinates(planet.longitude, planet.latitude, radius, slotProps.polarToCartesian).x"
                :y="slotProps.centerY + getPlanetCoordinates(planet.longitude, planet.latitude, radius, slotProps.polarToCartesian).y + (planet.size || 10) + 15"
                :fill="planet.color || '#888888'"
                font-size="11"
                text-anchor="middle"
                dominant-baseline="top"
              >
                {{ planet.name }}
                {{ Math.round(planet.longitude) }}°
                <tspan v-if="Math.abs(planet.latitude) > 0.5" font-size="9">
                  {{ planet.latitude > 0 ? ' 北' : ' 南' }}{{ Math.abs(Math.round(planet.latitude)) }}°
                </tspan>
              </text>
            </g> -->
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

/* 白道样式 */
.white-way {
  transition: all 0.3s ease;
}

.white-way circle {
  transition: all 0.3s ease;
}

.orbital-nodes {
  transition: all 0.3s ease;
}

.orbital-nodes circle {
  filter: drop-shadow(0 0 4px currentColor);
}

.ascending-node:hover,
.descending-node:hover {
  filter: brightness(1.5) drop-shadow(0 0 8px currentColor);
}

/* 月亮样式 */
.moon {
  transition: all 0.3s ease;
  cursor: pointer;
}

.moon:hover {
  filter: brightness(1.3) drop-shadow(0 0 8px currentColor);
}

.moon-label text {
  font-family: 'Microsoft YaHei', sans-serif;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
}
</style>