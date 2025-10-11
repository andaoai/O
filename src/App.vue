<script setup lang="ts">
import { ref } from 'vue'
import HeavenlyStems from './components/HeavenlyStems.vue'
import EarthlyBranches from './components/EarthlyBranches.vue'

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
</script>

<template>
  <div class="container">
    <svg width="800" height="600" viewBox="0 0 800 600">
      <!-- 最外层：360度刻度圆环 -->
      <g class="main-ring">
        <!-- 外圆 -->
        <circle
          :cx="centerX"
          :cy="centerY"
          :r="radius"
          fill="none"
          stroke="white"
          stroke-width="1"
        />

        <!-- 360度刻度 -->
        <g v-for="tick in ticks" :key="tick.angle">
          <line
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            stroke="white"
            stroke-width="0.3"
          />
          <!-- 每30度显示数字 -->
          <text
            v-if="tick.angle % 30 === 0"
            :x="centerX + Math.cos((tick.angle * Math.PI) / 180) * (radius + 20)"
            :y="centerY + Math.sin((tick.angle * Math.PI) / 180) * (radius + 20)"
            fill="white"
            font-size="10"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ tick.angle }}
          </text>
        </g>
      </g>

      <!-- 十二地支圆环（中等半径） -->
      <EarthlyBranches />

      <!-- 十天干圆环（最小半径） -->
      <HeavenlyStems />
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
}

svg {
  display: block;
}
</style>
