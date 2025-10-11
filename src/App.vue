<script setup lang="ts">
import { ref } from 'vue'
import HeavenlyStems from './components/HeavenlyStems.vue'
import EarthlyBranches from './components/EarthlyBranches.vue'
import TwentyEightConstellations from './components/TwentyEightConstellations.vue'
import AstronomicalCalculator from './components/AstronomicalCalculator.vue'
import LunarCalendarCard from './components/LunarCalendarCard.vue'
import Taiji from './components/Taiji.vue'
import StarOrbit from './components/StarOrbit.vue'

const radius = ref(240)
const centerX = ref(400)
const centerY = ref(300)

// 生成360度刻度点
const generateTicks = () => {
  const ticks = []
  for (let i = 0; i < 360; i++) {
    const angle = (i * Math.PI) / 180
    const x1 = centerX.value + Math.cos(angle) * radius.value
    const y1 = centerY.value + Math.sin(angle) * radius.value
    const x2 = centerX.value + Math.cos(angle) * (radius.value + 10)
    const y2 = centerY.value + Math.sin(angle) * (radius.value + 10)

    ticks.push({
      x1, y1, x2, y2, angle: i
    })
  }
  return ticks
}

const ticks = ref(generateTicks())

// 太阳系天体数据
const celestialBodies = ref([
  {
    name: '木星',
    distance: 110,
    angle: 30,
    magnitude: -2.5,
    color: '#d4a373',
    orbitRadius: 110,
    orbitEccentricity: 0.05,
    orbitStyle: 'solid' as const,
    orbitWidth: 2,
    showOrbit: true
  },
  {
    name: '土星',
    distance: 100,
    angle: 120,
    magnitude: 0.5,
    color: '#fad5a5',
    orbitRadius: 100,
    orbitEccentricity: 0.05,
    orbitStyle: 'solid' as const,
    orbitWidth: 2,
    showOrbit: true
  },
  {
    name: '火星',
    distance: 90,
    angle: 200,
    magnitude: -0.5,
    color: '#cd5c5c',
    orbitRadius: 90,
    orbitEccentricity: 0.09,
    orbitStyle: 'solid' as const,
    orbitWidth: 2,
    showOrbit: true
  },
  {
    name: '金星',
    distance: 80,
    angle: 300,
    magnitude: -4.4,
    color: '#ffd700',
    orbitRadius: 80,
    orbitEccentricity: 0.01,
    orbitStyle: 'solid' as const,
    orbitWidth: 2,
    showOrbit: true
  },
  {
    name: '水星',
    distance: 70,
    angle: 45,
    magnitude: -0.2,
    color: '#c0c0c0',
    orbitRadius: 70,
    orbitEccentricity: 0.2,
    orbitStyle: 'solid' as const,
    orbitWidth: 2,
    showOrbit: true
  },
  {
    name: '月亮',
    distance: 60,
    angle: 180,
    magnitude: -12.6,
    color: '#f0f0f0',
    orbitRadius: 60,
    orbitEccentricity: 0.05,
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


      <!-- 二十八星宿圆环（最外层） -->
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
        :animate="false"
        :twinkle="false"
        :label-font-size="12"
      />

      <!-- 太极图（中心） -->
      <Taiji
        :x="400"
        :y="300"
        :size="20"
        :auto-rotate="true"
      />

    </svg>
    <AstronomicalCalculator />
    <LunarCalendarCard />

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
