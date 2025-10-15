<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from './PolarCanvas.vue'

/**
 * 轨道样式接口
 */
interface OrbitStyle {
  /** 轨道半径 */
  radius: number
  /** 轨道颜色 */
  color?: string
  /** 轨道宽度 */
  width?: number
  /** 轨道类型：实线或虚线 */
  strokeDasharray?: string
  /** 轨道透明度 */
  opacity?: number
  /** 轨道标签 */
  label?: string
}

/**
 * 行星样式接口
 */
interface PlanetStyle {
  /** 行星名称 */
  name: string
  /** 行星颜色 */
  color?: string
  /** 行星大小 */
  size?: number
  /** 行星在轨道上的角度（0-360度） */
  angle?: number
  /** 行星距离中心的距离（如果不跟随轨道） */
  distance?: number
  /** 是否显示光晕 */
  hasGlow?: boolean
  /** 光晕颜色 */
  glowColor?: string
  /** 光晕大小 */
  glowSize?: number
  /** 行星标签 */
  label?: string
  /** 行星图标或符号 */
  symbol?: string
}

/**
 * 轨道组件属性接口
 */
interface Props {
  /** 轨道列表 */
  orbits: OrbitStyle[]
  /** 行星列表 */
  planets: PlanetStyle[]
  /** 是否启用动画 */
  enableAnimation?: boolean
  /** 动画速度 */
  animationSpeed?: number
  /** 整体旋转角度 */
  rotation?: number
  /** 是否显示轨道标签 */
  showOrbitLabels?: boolean
  /** 是否显示行星标签 */
  showPlanetLabels?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enableAnimation: false,
  animationSpeed: 0.5,
  rotation: 0,
  showOrbitLabels: false,
  showPlanetLabels: true
})

/**
 * 生成轨道元素
 */
const renderOrbits = () => {
  return props.orbits.map((orbit, index) => ({
    ...orbit,
    key: `orbit-${index}`
  }))
}

/**
 * 生成行星元素
 */
const renderPlanets = () => {
  return props.planets.map((planet, index) => {
    // 计算行星位置
    const angle = planet.angle || 0
    const distance = planet.distance || planet.size || 10

    return {
      ...planet,
      key: `planet-${index}`,
      angle,
      distance,
      x: Math.cos(angle * Math.PI / 180) * distance,
      y: Math.sin(angle * Math.PI / 180) * distance
    }
  })
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
      <g class="orbit-system">
        <!-- 渲染轨道 -->
        <g v-for="orbit in renderOrbits()" :key="orbit.key" class="orbit">
          <circle
            :cx="slotProps.centerX"
            :cy="slotProps.centerY"
            :r="orbit.radius"
            fill="none"
            :stroke="orbit.color || '#666666'"
            :stroke-width="orbit.width || 1"
            :stroke-dasharray="orbit.strokeDasharray"
            :opacity="orbit.opacity || 0.8"
          />

          <!-- 轨道标签 -->
          <text
            v-if="showOrbitLabels && orbit.label"
            :x="slotProps.centerX + orbit.radius + 10"
            :y="slotProps.centerY"
            :fill="orbit.color || '#666666'"
            font-size="10"
            text-anchor="start"
            dominant-baseline="middle"
          >
            {{ orbit.label }}
          </text>
        </g>

        <!-- 渲染行星 -->
        <g v-for="planet in renderPlanets()" :key="planet.key" class="planet">
          <!-- 行星光晕 -->
          <g v-if="planet.hasGlow" class="planet-glow">
            <circle
              :cx="slotProps.centerX + planet.x"
              :cy="slotProps.centerY + planet.y"
              :r="(planet.size || 10) + (planet.glowSize || 5)"
              :fill="planet.glowColor || planet.color || '#ffffff'"
              :opacity="0.3"
            />
            <circle
              :cx="slotProps.centerX + planet.x"
              :cy="slotProps.centerY + planet.y"
              :r="(planet.size || 10) + (planet.glowSize || 3)"
              :fill="planet.glowColor || planet.color || '#ffffff'"
              :opacity="0.5"
            />
          </g>

          <!-- 行星本体 -->
          <circle
            :cx="slotProps.centerX + planet.x"
            :cy="slotProps.centerY + planet.y"
            :r="planet.size || 10"
            :fill="planet.color || '#ffffff'"
          />

          <!-- 行星符号 -->
          <text
            v-if="planet.symbol"
            :x="slotProps.centerX + planet.x"
            :y="slotProps.centerY + planet.y"
            :fill="getContrastColor(planet.color || '#ffffff')"
            font-size="12"
            font-weight="bold"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ planet.symbol }}
          </text>

          <!-- 行星标签 -->
          <text
            v-if="showPlanetLabels && planet.label"
            :x="slotProps.centerX + planet.x"
            :y="slotProps.centerY + planet.y + (planet.size || 10) + 15"
            :fill="planet.color || '#ffffff'"
            font-size="10"
            text-anchor="middle"
            dominant-baseline="top"
          >
            {{ planet.label }}
          </text>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<script lang="ts">
/**
 * 获取对比色（用于文字显示）
 */
function getContrastColor(backgroundColor: string): string {
  // 简单的对比色计算
  const color = backgroundColor.toLowerCase()
  if (color === '#ffffff' || color === 'white' || color.includes('fff') || color.includes('white')) {
    return '#000000'
  }
  return '#ffffff'
}
</script>

<style scoped>
.orbit-system {
  transform-origin: center;
}

.orbit {
  transition: all 0.3s ease;
}

.planet {
  transition: all 0.3s ease;
}

.planet-glow {
  filter: blur(1px);
}

.planet:hover {
  cursor: pointer;
  filter: brightness(1.2);
}
</style>