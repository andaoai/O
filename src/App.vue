<script setup lang="ts">
import { ref } from 'vue'
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
import Control from './components/Control.vue'
import CustomRing from './components/CustomRing.vue'


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

      <!-- 360度刻度尺（最外层） -->
      <!-- scale-interval使用6度间隔，共60个刻度，对应六十甲子 -->
      <DegreeScale
        :radius="480"
        :inner-radius="460"
        :show-sectors="true"
        sector-color="#666666"
        :sector-opacity="0.1"
        :show-labels="true"
        label-color="#888888"
        :scale-interval="6"
        :show-circle="true"
        circle-color="#666666"
        :circle-width="1"
        :rotation-direction="rotationDirection"
      />

      <!-- 二十四节气圆环（第二层） -->
      <!-- <TwentyFourSolarTerms
        :radius="460"
        :inner-radius="440"
        :show-sectors="false"
        :rotation-direction="rotationDirection"
      /> -->

      <!-- 太阳黄道圆环（第三层） -->
      <SolarEcliptic
        :radius="160"
        :time="controlledTime"
        :enable-animation="true"
        :animation-speed="0.1"
        :show-sun-label="true"
        :rotation-direction="rotationDirection"
      />

      <!-- 二十八星宿圆环（第三层） -->
      <!-- <TwentyEightConstellations :rotation-direction="rotationDirection" /> -->

      <!-- 六十甲子圆环（第四层） -->
      <!-- <SixtyJiazi /> -->

      <!-- 十天干圆环（第五层） -->
      <!-- <HeavenlyStems /> -->

      <!-- 多个天干空亡圆环，不同半径和起始度数 -->
      <tiangankongwang
        :rotation-direction="rotationDirection"
        :radius="310"
        :inner-radius="280"
        :start-degree="-90"
      />
      <!-- <tiangankongwang
        :rotation-direction="rotationDirection"
        :radius="340"
        :inner-radius="310"
        :start-degree="-30"
      />
      
      <tiangankongwang
        :rotation-direction="rotationDirection"
        :radius="370"
        :inner-radius="340"
        :start-degree="30"
      />
      <tiangankongwang
        :rotation-direction="rotationDirection"
        :radius="400"
        :inner-radius="370"
        :start-degree="90"
      />
      <tiangankongwang
        :rotation-direction="rotationDirection"
        :radius="430"
        :inner-radius="400"
        :start-degree="150"
      />
      <tiangankongwang
        :rotation-direction="rotationDirection"
        :radius="460"
        :inner-radius="430"
        :start-degree="210"
      /> -->
      <!-- 十二地支圆环（第六层） -->
      <EarthlyBranches :rotation-direction="rotationDirection" />

      <!-- 八门圆环（第七层） -->
      <!-- <EightGates /> -->

      <!-- 十二长生圆环（第八层） -->
      <!-- <TwelveLongevity /> -->

      <!-- 四象圆环（第九层） -->
      <!-- <SiXiang :rotation-direction="rotationDirection" /> -->
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