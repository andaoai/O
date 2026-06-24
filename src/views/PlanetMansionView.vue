<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SkyChart from '../components/SkyChart.vue'
import Control from '../components/Control.vue'
import { getPlanetMansions } from '../utils/planetMansion'

// 时间控制（与控制面板双向绑定）
const controlledTime = ref(new Date())

// 实时时钟：默认每秒推进 controlledTime，七曜随真实时间移动。
// 一旦用户用控制面板调时，停掉实时跟随，把控制权交还用户。
let tickTimer: number | null = null
const liveMode = ref(true)

function startLiveClock() {
  if (tickTimer !== null) return
  tickTimer = window.setInterval(() => {
    controlledTime.value = new Date()
  }, 1000)
}

function stopLiveClock() {
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function onUserTimeChange() {
  if (liveMode.value) {
    liveMode.value = false
    stopLiveClock()
  }
}

onMounted(startLiveClock)
onUnmounted(stopLiveClock)

// 视口控制
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

// 当前七曜落宿（随时间重算，供右侧信息面板）
const planetMansions = computed(() => getPlanetMansions(controlledTime.value))
</script>

<template>
  <div class="container">
    <!-- 返回首页 -->
    <RouterLink to="/" class="back-link">← 罗盘列表</RouterLink>

    <!-- 落宿信息面板 -->
    <div class="mansion-panel">
      <h3>五星与月入宿</h3>
      <ul>
        <li v-for="pm in planetMansions" :key="pm.key">
          <span class="planet" :style="{ color: pm.color }">{{ pm.symbol }} {{ pm.name }}</span>
          <span class="mansion">
            入 <b :style="{ color: pm.mansion?.color }">{{ pm.mansion?.label ?? '—' }}</b> 宿
          </span>
          <span class="degree" v-if="pm.mansion">{{ pm.mansion.degreeInMansion.toFixed(1) }}°</span>
        </li>
      </ul>
    </div>

    <svg :width="1200" :height="1200" viewBox="0 0 1200 1200">
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">
        <!-- 天极投影星图：赤道正圆居中，黄道/白道偏心，二十八宿按距星实位，七曜各按赤经落位 -->
        <SkyChart
          :time="controlledTime"
          :radius="360"
          :show-equator="true"
          :show-ecliptic="true"
          :show-white-way="true"
          :show-mansions="true"
          :show-planets="true"
          :show-sun="true"
          :show-moon="true"
        />
      </g>
    </svg>

    <!-- 控制面板 -->
    <Control
      v-model="controlledTime"
      @time-change="onUserTimeChange"
      v-model:zoom="zoomLevel"
      v-model:offsetX="offsetX"
      v-model:offsetY="offsetY"
      v-model:rotation-direction="rotationDirection"
      v-model:rotation-angle="rotationAngle"
    />
  </div>
</template>

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

.back-link {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  color: #aaa;
  text-decoration: none;
  font-size: 14px;
  padding: 6px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.5);
}

.back-link:hover {
  color: #fff;
  border-color: #888;
}

.mansion-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  min-width: 180px;
  padding: 12px 16px;
  border: 1px solid #444;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #ddd;
  font-size: 13px;
}

.mansion-panel h3 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #fff;
  font-weight: 600;
}

.mansion-panel ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.mansion-panel li {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 3px 0;
}

.mansion-panel .planet {
  font-weight: 600;
  min-width: 56px;
}

.mansion-panel .mansion b {
  font-size: 15px;
}

.mansion-panel .degree {
  margin-left: auto;
  color: #888;
  font-size: 12px;
}
</style>
