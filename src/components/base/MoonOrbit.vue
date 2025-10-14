<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PolarCanvas from './PolarCanvas.vue'
import { useAnimation, AnimationType } from '@/composables/useAnimation'

interface Moon {
  name: string
  // 月球位置（极坐标，相对于白道中心）
  distance: number  // 距离白道中心的距离
  angle: number     // 角度（度数）
  // 月球属性
  size?: number       // 月球大小
  color?: string      // 月球颜色
  // 轨道属性
  orbitRadius?: number    // 轨道半径
  orbitEccentricity?: number  // 轨道离心率 (0-1, 0为正圆)
  orbitPeriod?: number   // 轨道周期（用于动画）
  orbitPhase?: number    // 轨道初始相位
  // 轨道样式
  showOrbit?: boolean     // 是否显示轨道
  orbitStyle?: 'solid' | 'dashed' | 'dotted'  // 轨道样式
  orbitWidth?: number     // 轨道宽度
  orbitColor?: string     // 轨道颜色
}

interface Props {
  // 基础属性
  maxRadius?: number      // 最大轨道半径
  minRadius?: number      // 最小轨道半径

  // 月球数据
  moons: Moon[]

  // 白道偏离黄道的参数
  offsetDistance?: number  // 白道中心偏离黄道中心的距离
  offsetAngle?: number     // 白道中心偏离的角度

  // 显示控制
  showMoons?: boolean      // 显示月球
  showOrbits?: boolean     // 显示轨道
  showLabels?: boolean     // 显示标签
  showGrid?: boolean       // 显示网格
  showWhitePath?: boolean  // 显示白道轨道

  // 轨道样式
  orbitColor?: string
  orbitWidth?: number
  orbitStyle?: 'solid' | 'dashed' | 'dotted'
  whitePathColor?: string  // 白道颜色
  whitePathWidth?: number  // 白道宽度

  // 月球样式
  defaultMoonSize?: number
  defaultMoonColor?: string

  // 标签样式
  labelColor?: string
  labelFontSize?: number
  labelDistance?: number   // 标签距离月球的距离

  // 网格样式
  gridColor?: string
  gridWidth?: number
  gridLevels?: number      // 网格层数

  // 动画
  animate?: boolean        // 是否启用轨道动画
  animationSpeed?: number  // 动画速度

  // 旋转
  rotation?: number        // 整体旋转角度
  enableRotation?: boolean // 是否启用整体旋转
  rotationSpeed?: number   // 旋转速度
}

const props = withDefaults(defineProps<Props>(), {
  maxRadius: 280,
  minRadius: 0,
  showMoons: true,
  showOrbits: true,
  showLabels: true,
  showGrid: false,
  showWhitePath: true,
  orbitColor: '#444444',
  orbitWidth: 1,
  orbitStyle: 'solid',
  whitePathColor: '#8B7D6B',
  whitePathWidth: 2,
  defaultMoonSize: 5,
  defaultMoonColor: '#F0F0F0',
  labelColor: '#cccccc',
  labelFontSize: 12,
  labelDistance: 15,
  gridColor: '#333333',
  gridWidth: 0.5,
  gridLevels: 5,
  animate: false,
  animationSpeed: 1,
  rotation: 0,
  enableRotation: false,
  rotationSpeed: 0.5,
  offsetDistance: 30,  // 白道中心偏离黄道中心30像素
  offsetAngle: 0       // 白道中心偏离的角度
})

// 使用统一的动画系统
const animationId = `moon-orbit-${Date.now()}-${Math.random()}`
const { start, stop, setSpeed, getValue, setValue } = useAnimation(
  animationId,
  AnimationType.ORBITAL,
  {
    enabled: props.animate,
    speed: props.animationSpeed
  }
)

// 监听动画开关
watch(() => props.animate, (enabled: boolean) => {
  if (enabled) {
    start()
  } else {
    stop()
    setValue(0)
  }
}, { immediate: true })

// 监听动画速度变化
watch(() => props.animationSpeed, (newSpeed: number) => {
  setSpeed(newSpeed)
})

// 获取动画时间（用于月球轨道运动）
const animationTime = computed(() => getValue())

// 计算白道中心位置（相对于黄道中心）
const whitePathCenter = computed(() => {
  const angleRad = (props.offsetAngle * Math.PI) / 180
  const centerX = props.offsetDistance * Math.cos(angleRad)
  const centerY = props.offsetDistance * Math.sin(angleRad)
  return { x: centerX, y: centerY }
})

// 生成白道路径（以白道中心为中心的圆或椭圆）
const generateWhitePath = (centerX: number, centerY: number) => {
  const radius = (props.maxRadius + props.minRadius) / 2

  return `M ${centerX + radius},${centerY} A ${radius},${radius} 0 1,0 ${centerX + radius},${centerY + 0.1}`
}

// 生成轨道路径（考虑离心率的椭圆轨道，以白道中心为中心）
const generateOrbitPath = (moon: Moon, centerX: number, centerY: number) => {
  const radius = moon.orbitRadius || moon.distance
  const eccentricity = moon.orbitEccentricity || 0

  if (eccentricity === 0) {
    // 圆形轨道 - 以白道中心为中心
    return `M ${centerX + radius},${centerY} A ${radius},${radius} 0 1,0 ${centerX + radius},${centerY + 0.1}`
  } else {
    // 椭圆轨道 - 以白道中心为中心
    const a = radius  // 半长轴
    const b = radius * Math.sqrt(1 - eccentricity * eccentricity)  // 半短轴

    return `M ${centerX + a},${centerY} A ${a},${b} 0 1,0 ${centerX + a},${centerY + 0.1}`
  }
}

// 计算月球当前位置（考虑动画，相对于白道中心）
const generateMoonPositions = (polarToCartesian: Function) => {
  return props.moons.map((moon, index) => {
    let currentAngle = moon.angle
    const currentDistance = moon.distance

    if (props.animate && moon.orbitPeriod) {
      // 使用响应式动画时间
      const phase = (moon.orbitPhase || 0) + (animationTime.value / moon.orbitPeriod)
      currentAngle = (moon.angle + phase * 360) % 360
    }

    const position = polarToCartesian(currentAngle, currentDistance)

    return {
      x: position.x,
      y: position.y,
      angle: currentAngle,
      moon
    }
  })
}

// 生成网格圆圈（相对于白道中心）
const generateGridCircles = () => {
  const circles = []
  const step = (props.maxRadius - props.minRadius) / props.gridLevels

  for (let i = 1; i <= props.gridLevels; i++) {
    const radius = props.minRadius + step * i
    circles.push({
      radius,
      level: i
    })
  }

  return circles
}

// 获取月球显示大小
const getMoonSize = (moon: Moon) => {
  if (moon.size) return moon.size
  return props.defaultMoonSize
}

// 获取月球显示颜色
const getMoonColor = (moon: Moon) => {
  if (moon.color) return moon.color
  return props.defaultMoonColor
}
</script>

<template>
  <PolarCanvas
    :enable-animation="enableRotation"
    :animation-speed="rotationSpeed"
    :rotation="rotation"
    :max-radius="maxRadius"
    :min-radius="minRadius"
    :center-x="whitePathCenter.x"
    :center-y="whitePathCenter.y"
  >
    <template #default="slotProps">
      <g class="moon-orbit">

        <!-- 网格圆圈（相对于白道中心） -->
        <g v-if="showGrid" class="grid">
          <circle
            v-for="grid in generateGridCircles()"
            :key="grid.level"
            :cx="slotProps.centerX"
            :cy="slotProps.centerY"
            :r="grid.radius"
            fill="none"
            :stroke="gridColor"
            :stroke-width="gridWidth"
            stroke-dasharray="2,4"
            opacity="0.3"
          />
        </g>

        <!-- 白道轨道（以白道中心为中心） -->
        <g v-if="showWhitePath" class="white-path">
          <path
            :d="generateWhitePath(slotProps.centerX, slotProps.centerY)"
            fill="none"
            :stroke="whitePathColor"
            :stroke-width="whitePathWidth"
            stroke-dasharray="8,4"
            opacity="0.8"
          />
        </g>

        <!-- 月球轨道 -->
        <g v-if="showOrbits" class="orbits">
          <path
            v-for="(moon, index) in moons"
            :key="`orbit-${index}`"
            v-show="moon.showOrbit !== false"
            :d="generateOrbitPath(moon, slotProps.centerX, slotProps.centerY)"
            fill="none"
            :stroke="moon.orbitColor || orbitColor"
            :stroke-width="moon.orbitWidth || orbitWidth"
            :stroke-dasharray="(moon.orbitStyle || orbitStyle) === 'dashed' ? '5,5' : (moon.orbitStyle || orbitStyle) === 'dotted' ? '2,2' : ''"
            opacity="0.6"
          />
        </g>

        <!-- 月球 -->
        <g v-if="showMoons" class="moons">
          <g v-for="(position, index) in generateMoonPositions(slotProps.polarToCartesian)" :key="`moon-${index}`">
            <!-- 月光光晕效果 -->
            <circle
              :cx="position.x"
              :cy="position.y"
              :r="getMoonSize(position.moon) * 2.5"
              :fill="getMoonColor(position.moon)"
              opacity="0.15"
            />

            <!-- 主月球 -->
            <circle
              :cx="position.x"
              :cy="position.y"
              :r="getMoonSize(position.moon)"
              :fill="getMoonColor(position.moon)"
              filter="drop-shadow(0 0 3px rgba(240, 240, 240, 0.6))"
            />

            <!-- 月球标签 -->
            <text
              v-if="showLabels && position.moon.name"
              :x="position.x"
              :y="position.y - getMoonSize(position.moon) - labelDistance"
              :fill="labelColor"
              :font-size="labelFontSize"
              text-anchor="middle"
              font-family="Arial, sans-serif"
            >
              {{ position.moon.name }}
            </text>

            </g>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.moon-orbit {
  transition: all 0.3s ease;
}

.moons circle {
  filter: drop-shadow(0 0 2px rgba(240, 240, 240, 0.8));
}

/* 月光效果 */
.moon-orbit circle[fill="#F0F0F0"] {
  filter: drop-shadow(0 0 4px rgba(240, 240, 240, 0.7));
}
</style>