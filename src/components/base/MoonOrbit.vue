<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PolarCanvas from './PolarCanvas.vue'
import { useAnimation, AnimationType } from '@/composables/useAnimation'
import {
  getMoonPosition,
  convertMoonToDisplayPosition,
  calculateMoonOrbitCenter,
  type MoonData
} from '@/utils/eclipticPlanets'

interface Props {
  // 基础属性
  maxRadius?: number      // 最大轨道半径
  minRadius?: number      // 最小轨道半径

  // 月球轨道半径
  moonOrbitRadius?: number  // 月球轨道半径

  // 显示控制
  showMoon?: boolean       // 显示月球
  showOrbit?: boolean      // 显示轨道
  showLabel?: boolean      // 显示标签
  showPhase?: boolean      // 显示月相信息

  // 轨道样式
  orbitColor?: string
  orbitWidth?: number
  orbitStyle?: 'solid' | 'dashed' | 'dotted'

  // 月球样式
  defaultMoonSize?: number
  defaultMoonColor?: string

  // 标签样式
  labelColor?: string
  labelFontSize?: number
  labelDistance?: number   // 标签距离月球的距离

  // 动画
  animate?: boolean        // 是否启用轨道动画
  animationSpeed?: number  // 动画速度

  // 旋转
  rotation?: number        // 整体旋转角度
  enableRotation?: boolean // 是否启用整体旋转
  rotationSpeed?: number   // 旋转速度

  // 时间控制
  controlledTime?: Date    // 控制时间
}

const props = withDefaults(defineProps<Props>(), {
  maxRadius: 200,
  minRadius: 100,
  moonOrbitRadius: 120,
  showMoon: true,
  showOrbit: true,
  showLabel: true,
  showPhase: true,
  orbitColor: '#999999',
  orbitWidth: 2,
  orbitStyle: 'dashed',
  defaultMoonSize: 8,
  defaultMoonColor: '#f0f0f0',
  labelColor: '#cccccc',
  labelFontSize: 14,
  labelDistance: 20,
  animate: false,
  animationSpeed: 1,
  rotation: 0,
  enableRotation: false,
  rotationSpeed: 0.5,
  controlledTime: () => new Date()
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

// 月球数据（响应式）
const moonData = ref<MoonData>(getMoonPosition(props.controlledTime))

// 监听控制时间变化
watch(() => props.controlledTime?.getTime(), (newTimestamp) => {
  if (newTimestamp) {
    const newTime = new Date(newTimestamp)
    moonData.value = getMoonPosition(newTime)
  }
}, { immediate: true })

// 生成月球轨道路径（考虑倾角的椭圆轨道）
const generateMoonOrbitPath = (centerX: number, centerY: number) => {
  const moon = moonData.value
  const radius = props.moonOrbitRadius

  // 计算月球轨道的投影中心
  const orbitCenter = calculateMoonOrbitCenter(moon, radius)

  // 将倾角转换为弧度
  const inclination = moon.orbitalInclination * Math.PI / 180

  // 计算椭圆参数（考虑倾角的投影）
  const a = radius // 半长轴
  const b = radius * Math.cos(inclination) // 半短轴（投影后）

  const actualCenterX = centerX + orbitCenter.x
  const actualCenterY = centerY + orbitCenter.y

  // 生成椭圆路径
  const path = `M ${actualCenterX + a},${actualCenterY} A ${a},${b} 0 1,0 ${actualCenterX + a},${actualCenterY + 0.1}`

  return path
}

// 计算月球当前位置
const moonPosition = computed(() => {
  const moon = moonData.value

  // 使用当前控制时间计算位置
  let currentAngle = moon.eclipticLongitude

  if (props.animate) {
    // 使用响应式动画时间，但基于控制时间的基础上进行动画
    const phase = animationTime.value * 0.1 // 调整动画速度
    currentAngle = (moon.eclipticLongitude + phase * 360) % 360
  }

  // 创建临时月球数据用于位置计算
  const tempMoonData = {
    ...moon,
    eclipticLongitude: currentAngle
  }

  const position = convertMoonToDisplayPosition(tempMoonData, 0, 0, props.moonOrbitRadius)

  
  return position
})

// 获取月球显示大小
const getMoonSize = () => {
  // 根据月相调整大小（满月时最大）
  const phaseFactor = 0.8 + moonData.value.orbitalPhase * 0.4
  return props.defaultMoonSize * phaseFactor
}

// 获取月球显示颜色
const getMoonColor = () => {
  // 根据月相调整颜色亮度
  const brightness = 0.7 + moonData.value.orbitalPhase * 0.3
  const moon = moonData.value

  if (moon.orbitalPhase < 0.1 || moon.orbitalPhase > 0.9) {
    // 新月附近，颜色更暗
    return `rgba(240, 240, 240, ${brightness * 0.3})`
  } else if (moon.orbitalPhase > 0.4 && moon.orbitalPhase < 0.6) {
    // 满月附近，颜色更亮
    return `rgba(255, 255, 255, ${brightness})`
  } else {
    // 其他月相
    return `rgba(240, 240, 240, ${brightness})`
  }
}

// 获取月相显示文本
const getMoonPhaseText = () => {
  const phase = moonData.value.orbitalPhase
  if (phase < 0.1) return '新月'
  else if (phase < 0.25) return '蛾眉月'
  else if (phase < 0.4) return '上弦月'
  else if (phase < 0.6) return '满月'
  else if (phase < 0.75) return '下弦月'
  else return '残月'
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
      <g class="moon-orbit">

        <!-- 月球轨道 -->
        <g v-if="showOrbit" class="moon-orbit-path">
          <path
            :d="generateMoonOrbitPath(slotProps.centerX, slotProps.centerY)"
            fill="none"
            :stroke="orbitColor"
            :stroke-width="orbitWidth"
            :stroke-dasharray="orbitStyle === 'dashed' ? '8,4' : orbitStyle === 'dotted' ? '2,3' : ''"
            opacity="0.7"
          />
        </g>

        <!-- 月球 -->
        <g v-if="showMoon" class="moon">
          <!-- 月球光晕效果 -->
          <circle
            v-if="moonData.orbitalPhase > 0.4 && moonData.orbitalPhase < 0.6"
            :cx="moonPosition.x + slotProps.centerX"
            :cy="moonPosition.y + slotProps.centerY"
            :r="getMoonSize() * 2"
            :fill="getMoonColor()"
            opacity="0.2"
          />

          <!-- 主月球 -->
          <circle
            :cx="moonPosition.x + slotProps.centerX"
            :cy="moonPosition.y + slotProps.centerY"
            :r="getMoonSize()"
            :fill="getMoonColor()"
            filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))"
          />

          <!-- 月球标签 -->
          <text
            v-if="showLabel"
            :x="moonPosition.x + slotProps.centerX"
            :y="moonPosition.y + slotProps.centerY - getMoonSize() - labelDistance"
            :fill="labelColor"
            :font-size="labelFontSize"
            text-anchor="middle"
            font-family="Arial, sans-serif"
          >
            {{ moonData.chineseName }}
          </text>

          <!-- 月相信息 -->
          <text
            v-if="showPhase"
            :x="moonPosition.x + slotProps.centerX"
            :y="moonPosition.y + slotProps.centerY + getMoonSize() + labelDistance"
            :fill="labelColor"
            :font-size="labelFontSize - 2"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            opacity="0.8"
          >
            {{ getMoonPhaseText() }}
          </text>

        </g>

      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.moon-orbit {
  transition: all 0.3s ease;
}

.moon-orbit circle {
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.6));
}

.moon-orbit-path path {
  filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.3));
}
</style>