<script setup lang="ts">
import { ref, markRaw } from 'vue'
import HeavenlyStems from './components/HeavenlyStems.vue'
import EarthlyBranches from './components/EarthlyBranches.vue'
import TwentyEightConstellations from './components/TwentyEightConstellations.vue'
import SixtyJiazi from './components/SixtyJiazi.vue'
import EightGates from './components/EightGates.vue'
import TwelveLongevity from './components/TwelveLongevity.vue'
import tiangankongwang from './components/tianggankongwang.vue'
import SiXiang from './components/SiXiang.vue'
import DegreeScale from './components/DegreeScale.vue'
import SolarEcliptic from './components/SolarEcliptic.vue'
import TwentyFourSolarTerms from './components/TwentyFourSolarTerms.vue'
import TaiChi from './components/TaiChi.vue'
import Control from './components/Control.vue'
import RingStack from './components/base/RingStack.vue'


// 时间控制
const controlledTime = ref(new Date())

// 缩放控制
const zoomLevel = ref(1)

// 平移控制
const offsetX = ref(0)
const offsetY = ref(0)

// 旋转方向控制
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')

// 旋转角度控制
const rotationAngle = ref(0)

// 同心圆环自动布局配置（由外到内）。
// 只声明每个环的径向厚度，RingStack 会从 outerRadius 起自动分配 radius/innerRadius，
// 叠加时永不重叠。额外的组件专属 props 通过 props 字段透传。
const rings = [
  {
    component: markRaw(DegreeScale),
    thickness: 20,
    props: {
      showSectors: true,
      sectorColor: '#666666',
      sectorOpacity: 0.1,
      showLabels: true,
      labelColor: '#888888',
      scaleInterval: 6,
      showCircle: true,
      circleColor: '#666666',
      circleWidth: 1
    }
  },
  {
    component: markRaw(TwentyFourSolarTerms),
    thickness: 24,
    props: { showSectors: false }
  },
  { component: markRaw(TwentyEightConstellations), thickness: 30 },
  { component: markRaw(SixtyJiazi), thickness: 36 },
  { component: markRaw(HeavenlyStems), thickness: 28 },
  { component: markRaw(tiangankongwang), thickness: 30 },
  { component: markRaw(TwelveLongevity), thickness: 38 },
  { component: markRaw(EarthlyBranches), thickness: 28 },
  { component: markRaw(EightGates), thickness: 28 },
  { component: markRaw(SiXiang), thickness: 34 }
]

// 时间变化处理器
const handleTimeChange = (newTime: Date) => {
  controlledTime.value = newTime
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

// 旋转方向变化处理器
const handleRotationDirectionChange = (newDirection: 'clockwise' | 'counterclockwise') => {
  rotationDirection.value = newDirection
}

// 旋转角度变化处理器
const handleRotationAngleChange = (newAngle: number) => {
  rotationAngle.value = newAngle
}

</script>

<template>
  <div class="container">
    <svg
      :width="1200"
      :height="1200"
      viewBox="0 0 1200 1200"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">

      <!-- 同心圆环带：由外到内自动布局，不重叠 -->
      <RingStack
        :outer-radius="480"
        :gap="2"
        :rings="rings"
        :rotation-direction="rotationDirection"
      />

      <!-- 太阳黄道圆环（中心区） -->
      <SolarEcliptic
        :radius="150"
        :time="controlledTime"
        :enable-animation="true"
        :animation-speed="0.1"
        :show-sun-label="true"
        :rotation-direction="rotationDirection"
      />

      <!-- 太极图（中心） -->
      <TaiChi
        :radius="80"
        :time="controlledTime"
        :rotation-direction="rotationDirection"
      />
      </g>

    </svg>

    <!-- 控制面板 -->
    <Control
      v-model="controlledTime"
      v-model:zoom="zoomLevel"
      v-model:offsetX="offsetX"
      v-model:offsetY="offsetY"
      v-model:rotation-direction="rotationDirection"
      v-model:rotation-angle="rotationAngle"
      @time-change="handleTimeChange"
      @zoom-change="handleZoomChange"
      @offset-change="handleOffsetChange"
      @rotation-direction-change="handleRotationDirectionChange"
      @rotation-angle-change="handleRotationAngleChange"
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