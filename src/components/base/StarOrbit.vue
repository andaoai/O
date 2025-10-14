<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PolarCanvas from './PolarCanvas.vue'
import { useAnimation, AnimationType } from '@/composables/useAnimation'

interface Star {
  name: string
  // 恒星位置（极坐标）
  distance: number  // 距离中心的距离
  angle: number     // 角度（度数）
  // 恒星属性
  magnitude?: number  // 星等（亮度）
  size?: number       // 恒星大小
  color?: string      // 恒星颜色
  twinkle?: boolean    // 是否闪烁
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

  // 恒星数据
  stars: Star[]

  // 显示控制
  showStars?: boolean      // 显示恒星
  showOrbits?: boolean     // 显示轨道
  showLabels?: boolean     // 显示标签
  showGrid?: boolean       // 显示网格

  // 轨道样式
  orbitColor?: string
  orbitWidth?: number
  orbitStyle?: 'solid' | 'dashed' | 'dotted'

  // 恒星样式
  defaultStarSize?: number
  defaultStarColor?: string
  twinkle?: boolean        // 闪烁效果

  // 标签样式
  labelColor?: string
  labelFontSize?: number
  labelDistance?: number   // 标签距离恒星的距离

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
  showStars: true,
  showOrbits: true,
  showLabels: true,
  showGrid: false,
  orbitColor: '#444444',
  orbitWidth: 1,
  orbitStyle: 'solid',
  defaultStarSize: 3,
  defaultStarColor: '#ffffff',
  twinkle: false,
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
  rotationSpeed: 0.5
})

// 使用统一的动画系统
const animationId = `star-orbit-${Date.now()}-${Math.random()}`
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

// 获取动画时间（用于恒星轨道运动）
const animationTime = computed(() => getValue())

// 生成轨道路径（考虑离心率的椭圆轨道）
const generateOrbitPath = (star: Star, centerX: number, centerY: number) => {
  const radius = star.orbitRadius || star.distance
  const eccentricity = star.orbitEccentricity || 0

  if (eccentricity === 0) {
    // 圆形轨道 - 以centerX,centerY为中心
    return `M ${centerX + radius},${centerY} A ${radius},${radius} 0 1,0 ${centerX + radius},${centerY + 0.1}`
  } else {
    // 椭圆轨道 - 以centerX,centerY为中心
    const a = radius  // 半长轴
    const b = radius * Math.sqrt(1 - eccentricity * eccentricity)  // 半短轴

    return `M ${centerX + a},${centerY} A ${a},${b} 0 1,0 ${centerX + a},${centerY + 0.1}`
  }
}

// 计算恒星当前位置（考虑动画）
const generateStarPositions = (polarToCartesian: Function) => {
  return props.stars.map((star, index) => {
    let currentAngle = star.angle
    const currentDistance = star.distance

    if (props.animate && star.orbitPeriod) {
      // 使用响应式动画时间
      const phase = (star.orbitPhase || 0) + (animationTime.value / star.orbitPeriod)
      currentAngle = (star.angle + phase * 360) % 360
    }

    const position = polarToCartesian(currentAngle, currentDistance)

    return {
      x: position.x,
      y: position.y,
      angle: currentAngle,
      star
    }
  })
}

// 生成网格圆圈
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

// 获取恒星显示大小
const getStarSize = (star: Star) => {
  if (star.size) return star.size

  // 根据星等计算大小（星等数值越小，恒星越亮）
  if (star.magnitude) {
    const baseSize = props.defaultStarSize
    const magnitudeFactor = Math.max(0.5, Math.min(2, 3 - star.magnitude))
    return baseSize * magnitudeFactor
  }

  return props.defaultStarSize
}

// 获取恒星显示颜色
const getStarColor = (star: Star) => {
  if (star.color) return star.color

  // 根据恒星类型设置默认颜色（可以根据光谱类型扩展）
  return props.defaultStarColor
}
</script>

<template>
  <PolarCanvas
    :enable-animation="enableRotation"
    :animation-speed="rotationSpeed"
    :rotation="rotation"
    :max-radius="maxRadius"
    :min-radius="minRadius"
    :center-x="0"
    :center-y="0"
  >
    <template #default="slotProps">
      <g class="star-orbit">

        <!-- 网格圆圈 -->
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

        <!-- 轨道 -->
        <g v-if="showOrbits" class="orbits">
          <path
            v-for="(star, index) in stars"
            :key="`orbit-${index}`"
            v-show="star.showOrbit !== false"
            :d="generateOrbitPath(star, slotProps.centerX, slotProps.centerY)"
            fill="none"
            :stroke="star.orbitColor || orbitColor"
            :stroke-width="star.orbitWidth || orbitWidth"
            :stroke-dasharray="(star.orbitStyle || orbitStyle) === 'dashed' ? '5,5' : (star.orbitStyle || orbitStyle) === 'dotted' ? '2,2' : ''"
            opacity="0.6"
          />
        </g>

        <!-- 恒星 -->
        <g v-if="showStars" class="stars">
          <g v-for="(position, index) in generateStarPositions(slotProps.polarToCartesian)" :key="`star-${index}`">
            <!-- 恒星光晕效果 -->
            <circle
              v-if="position.star.magnitude && position.star.magnitude < 2"
              :cx="position.x"
              :cy="position.y"
              :r="getStarSize(position.star) * 2"
              :fill="getStarColor(position.star)"
              opacity="0.1"
            />

            <!-- 主恒星 -->
            <circle
              :cx="position.x"
              :cy="position.y"
              :r="getStarSize(position.star)"
              :fill="getStarColor(position.star)"
              :class="{ 'twinkle': twinkle || position.star.twinkle }"
            />

            <!-- 恒星标签 -->
            <text
              v-if="showLabels && position.star.name"
              :x="position.x"
              :y="position.y - getStarSize(position.star) - labelDistance"
              :fill="labelColor"
              :font-size="labelFontSize"
              text-anchor="middle"
              font-family="Arial, sans-serif"
            >
              {{ position.star.name }}
            </text>

            </g>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.star-orbit {
  transition: all 0.3s ease;
}

.stars circle {
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
}

.twinkle {
  animation: twinkle 2s ease-in-out infinite alternate;
}

@keyframes twinkle {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

/* 不同类型恒星的默认颜色 */
.star-orbit circle[fill="#ffcc00"] {  /* 太阳型恒星 */
  filter: drop-shadow(0 0 3px rgba(255, 204, 0, 0.8));
}

.star-orbit circle[fill="#ffffff"] {  /* A型恒星 */
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.9));
}

.star-orbit circle[fill="#ffaa00"] {  /* K型恒星 */
  filter: drop-shadow(0 0 3px rgba(255, 170, 0, 0.7));
}

.star-orbit circle[fill="#ff6666"] {  /* M型恒星 */
  filter: drop-shadow(0 0 3px rgba(255, 102, 102, 0.6));
}
</style>