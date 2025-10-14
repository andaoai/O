<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import HeavenlyStems from './components/HeavenlyStems.vue'
import EarthlyBranches from './components/EarthlyBranches.vue'
import TwentyEightConstellations from './components/TwentyEightConstellations.vue'
import SixtyJiazi from './components/SixtyJiazi.vue'
import EightGates from './components/EightGates.vue'
import TwelveLongevity from './components/TwelveLongevity.vue'
import SiXiang from './components/SiXiang.vue'
import Taiji from './components/Taiji.vue'
import StarOrbit from './components/base/StarOrbit.vue'
import CircleScale from './components/base/CircleScale.vue'
import Control from './components/Control.vue'
import { calculateSolarOrbitAngle, calculateLunarOrbitAngle } from './utils/solarTime'


// 太阳系天体数据
const celestialBodies = ref([
  {
    name: '太阳',
    distance: 80,
    angle: 0,      // 将通过太阳时角动态计算
    magnitude: -26.7,
    color: '#ffcc00',
    orbitRadius: 80,
    orbitEccentricity: 0.02,
    orbitPeriod: 0,    // 0表示不使用动画，而是使用实际时间
    orbitPhase: 0,
    orbitStyle: 'solid' as const,
    orbitWidth: 3,
    showOrbit: true
  },
  {
    name: '木星',
    distance: 60,
    angle: 90,     // 正左方
    magnitude: -2.5,
    color: '#d4a373',
    orbitRadius: 60,
    orbitEccentricity: 0.05,
    orbitPeriod: 45,    // 45秒转一圈
    orbitPhase: 0,
    orbitStyle: 'solid' as const,
    orbitWidth: 2,
    showOrbit: true
  },
  {
    name: '月亮',
    distance: 40,
    angle: 0,      // 将通过月亮时角动态计算
    magnitude: -12.6,
    color: '#f0f0f0',
    orbitRadius: 40,
    orbitEccentricity: 0.05,
    orbitPeriod: 0,    // 0表示不使用动画，而是使用实际时间
    orbitPhase: 0,
    orbitStyle: 'dashed' as const,
    orbitWidth: 1,
    showOrbit: true,
    twinkle: true
  }
])

// 时间控制
const controlledTime = ref(new Date())

// 缩放控制
const zoomLevel = ref(1)

// 平移控制
const offsetX = ref(0)
const offsetY = ref(0)

// 更新太阳角度（使用控制的时间）
const updateSolarAngle = () => {
  const solarAngle = calculateSolarOrbitAngle(0, controlledTime.value)
  if (celestialBodies.value[0]) {
    celestialBodies.value[0].angle = solarAngle
  }
}

// 更新月亮角度（使用控制的时间）
const updateLunarAngle = () => {
  const lunarAngle = calculateLunarOrbitAngle(0, controlledTime.value)
  if (celestialBodies.value[2]) { // 月亮是第3个天体（索引2）
    celestialBodies.value[2].angle = lunarAngle
  }
}

// 时间变化处理器
const handleTimeChange = (newTime: Date) => {
  controlledTime.value = newTime
  updateSolarAngle()
  updateLunarAngle()
}

// 缩放变化处理器
const handleZoomChange = (newZoom: number) => {
  zoomLevel.value = newZoom
}

// 平移变化处理器
const handleOffsetChange = (newOffset: { x: number, y: number }) => {
  offsetX.value = newOffset.x
  offsetY.value = newOffset.y
}

onMounted(() => {
  // 立即更新一次
  updateSolarAngle()
  updateLunarAngle()
})

</script>

<template>
  <div class="container">
    <svg
      :width="1200"
      :height="1200"
      viewBox="0 0 1200 1200"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel})`">

      <!-- 360度刻度尺（最外层） -->
      <CircleScale
        :radius="480"
        :inner-radius="460"
        :show-sectors="true"
        sector-color="#666666"
        :sector-opacity="0.1"
        :show-labels="true"
        label-color="#888888"
        :scale-interval="5"
        :show-circle="true"
        circle-color="#666666"
        :circle-width="1"
      />

      <!-- 二十八星宿圆环（第二层） -->
      <TwentyEightConstellations />

      <!-- 六十甲子圆环（第三层） -->
      <!-- <SixtyJiazi /> -->

      <!-- 十天干圆环（第四层） -->
      <!-- <HeavenlyStems /> -->

      <!-- 十二地支圆环（第五层） -->
      <EarthlyBranches />

      <!-- 八门圆环（第六层） -->
      <!-- <EightGates /> -->

      <!-- 十二长生圆环（第七层） -->
      <!-- <TwelveLongevity /> -->

      <!-- 四象圆环（第八层） -->
      <!-- <SiXiang /> -->

      <!-- 太阳系天体轨道系统（第九层） -->
      <StarOrbit
        :stars="celestialBodies"
        :max-radius="90"
        :min-radius="30"
        :show-orbits="true"
        :show-stars="true"
        :show-labels="true"
        :show-grid="false"
        :animate="true"
        :animation-speed="1"
        :twinkle="false"
        :label-font-size="12"
      />

      <!-- 太极图（中心） -->
      <Taiji
        :x="0"
        :y="0"
        :size="25"
        :auto-rotate="false"
        :point-to-sun="true"
        :sun-angle="celestialBodies[0]?.angle || 0"
      />
      </g>

    </svg>

    <!-- 控制面板 -->
    <Control
      v-model="controlledTime"
      v-model:zoom="zoomLevel"
      v-model:offsetX="offsetX"
      v-model:offsetY="offsetY"
      @time-change="handleTimeChange"
      @zoom-change="handleZoomChange"
      @offset-change="handleOffsetChange"
    />

    </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  background-color: black;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  background-color: black;
}
</style>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  background-color: black;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

svg {
  display: block;
}
</style>
