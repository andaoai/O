<script setup lang="ts">
import { ref, markRaw } from 'vue'
import DataRing from './components/DataRing.vue'
import DegreeScale from './components/DegreeScale.vue'
import SolarEcliptic from './components/SolarEcliptic.vue'
import TaiChi from './components/TaiChi.vue'
import Control from './components/Control.vue'
import RingStack from './components/base/RingStack.vue'
import {
  twentyFourSolarTerms,
  twentyEightConstellations,
  sixtyJiazi,
  sixtyJiaziNayin,
  heavenlyStems,
  tianganKongwang,
  twelveLongevity,
  earthlyBranches,
  eightGates,
  siXiang
} from './data/rings'


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
// 只声明每个环的径向厚度，RingStack 会从 outerRadius 起自动分配 radius/innerRadius。
// 数据驱动的环统一用 DataRing 渲染，data 字段经 props 透传；
// DegreeScale 按角度间隔生成（非数据驱动），保留独立组件。
const DataRingComp = markRaw(DataRing)
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
  { component: DataRingComp, thickness: 24, props: { data: twentyFourSolarTerms } },
  { component: DataRingComp, thickness: 30, props: { data: twentyEightConstellations } },
  { component: DataRingComp, thickness: 30, props: { data: sixtyJiazi } },
  // 五行纳音：与六十甲子同源同转，紧贴其内侧
  { component: DataRingComp, thickness: 26, gapBefore: 0, props: { data: sixtyJiaziNayin } },
  { component: DataRingComp, thickness: 28, props: { data: heavenlyStems } },
  { component: DataRingComp, thickness: 30, props: { data: tianganKongwang } },
  { component: DataRingComp, thickness: 38, props: { data: twelveLongevity } },
  { component: DataRingComp, thickness: 28, props: { data: earthlyBranches } },
  { component: DataRingComp, thickness: 28, props: { data: eightGates } },
  { component: DataRingComp, thickness: 34, props: { data: siXiang } }
]

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
      <!-- 不开整体旋转：日月五星位置由 time 驱动天文计算，整盘旋转会导致天体绕中心乱转 -->
      <SolarEcliptic
        :radius="150"
        :time="controlledTime"
        :enable-animation="false"
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