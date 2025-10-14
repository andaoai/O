<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
import {
  getAllPlanetsEclipticPositions,
  convertEclipticToDisplayAngle,
  calculateDisplayRadius,
  createPlanetPositionCalculator,
  type PlanetData
} from './utils/eclipticPlanets'


// 黄道行星数据
const eclipticPlanets = ref<PlanetData[]>([])

// 黄道轨道半径（所有行星都在同一条黄道上）
const ECLIPTIC_RADIUS = 60

// 转换行星数据为StarOrbit组件所需的格式
const celestialBodies = computed(() => {
  return eclipticPlanets.value.map(planet => {
    return {
      name: planet.chineseName,
      distance: ECLIPTIC_RADIUS,  // 所有行星都在黄道上
      angle: convertEclipticToDisplayAngle(planet.eclipticLongitude, 0),
      magnitude: planet.magnitude,
      color: planet.color,
      size: planet.name === 'Sun' ? 6 : planet.name === 'Jupiter' ? 4 : 3,
      orbitRadius: ECLIPTIC_RADIUS,  // 统一的黄道轨道半径
      orbitEccentricity: 0,  // 黄道是正圆形
      orbitPeriod: 10,  // 给一个合理的周期用于演示动画
      orbitPhase: 0,
      orbitStyle: 'solid' as const,  // 黄道用实线
      orbitWidth: 2,
      showOrbit: planet.name === 'Sun',  // 只显示一次黄道（太阳）
      twinkle: false  // 关闭闪烁效果
    }
  })
})

// 时间控制
const controlledTime = ref(new Date())

// 缩放控制
const zoomLevel = ref(1)

// 平移控制
const offsetX = ref(0)
const offsetY = ref(0)

// 更新行星位置（使用控制的时间）
const updatePlanetPositions = () => {
  eclipticPlanets.value = getAllPlanetsEclipticPositions(controlledTime.value)
}

// 时间变化处理器
const handleTimeChange = (newTime: Date) => {
  controlledTime.value = newTime
  updatePlanetPositions()
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
  updatePlanetPositions()
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

      <!-- 黄道行星系统（第九层） -->
      <StarOrbit
        :stars="celestialBodies"
        :max-radius="90"
        :min-radius="25"
        :show-orbits="true"
        :show-stars="true"
        :show-labels="true"
        :show-grid="false"
        :animate="true"
        :animation-speed="0.5"
        :enable-rotation="true"
        :rotation-speed="0.2"
        :twinkle="false"
        :label-font-size="11"
        label-color="#ffffff"
        orbit-color="#444444"
        :orbit-width="1"
        :default-star-size="3"
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