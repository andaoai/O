<script setup lang="ts">
import { ref } from 'vue'
import HeavenlyStems from './components/HeavenlyStems.vue'
import EarthlyBranches from './components/EarthlyBranches.vue'
import TwentyEightConstellations from './components/TwentyEightConstellations.vue'
import Taiji from './components/Taiji.vue'
import StarOrbit from './components/base/StarOrbit.vue'
import CircleScale from './components/base/CircleScale.vue'


// 太阳系天体数据
const celestialBodies = ref([
  {
    name: '太阳',
    distance: 150,
    angle: 0,      // 正上方
    magnitude: -26.7,
    color: '#ffcc00',
    orbitRadius: 150,
    orbitEccentricity: 0.02,
    orbitPeriod: 60,    // 60秒转一圈
    orbitPhase: 0,
    orbitStyle: 'solid' as const,
    orbitWidth: 3,
    showOrbit: true
  },
  {
    name: '木星',
    distance: 110,
    angle: 90,     // 正左方
    magnitude: -2.5,
    color: '#d4a373',
    orbitRadius: 110,
    orbitEccentricity: 0.05,
    orbitPeriod: 45,    // 45秒转一圈
    orbitPhase: 0,
    orbitStyle: 'solid' as const,
    orbitWidth: 2,
    showOrbit: true
  },
  {
    name: '月亮',
    distance: 60,
    angle: 180,    // 正下方
    magnitude: -12.6,
    color: '#f0f0f0',
    orbitRadius: 60,
    orbitEccentricity: 0.05,
    orbitPeriod: 30,    // 30秒转一圈
    orbitPhase: 0,
    orbitStyle: 'dashed' as const,
    orbitWidth: 1,
    showOrbit: true,
    twinkle: true
  }
])
</script>

<template>
  <div class="container">
    <svg width="800" height="600" viewBox="0 0 800 600">

      <!-- 360度刻度尺（最外层） -->
      <CircleScale
        :radius="380"
        :inner-radius="365"
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

      <!-- 十天干圆环（第二层） -->
      <HeavenlyStems />

      <!-- 十二地支圆环（第三层） -->
      <EarthlyBranches />

      <!-- 太阳系天体轨道系统（第四层） -->
      <StarOrbit
        :stars="celestialBodies"
        :max-radius="400"
        :min-radius="20"
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
        :size="20"
        :auto-rotate="true"
        :rotate-speed="0.8"
      />

    </svg>

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
