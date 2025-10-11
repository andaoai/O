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
