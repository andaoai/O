<script setup lang="ts">
import { ref, computed, markRaw, onMounted, onUnmounted } from 'vue'
import DataRing from '../components/DataRing.vue'
import Control from '../components/Control.vue'
import RingStack from '../components/base/RingStack.vue'
import { sixtyJiazi } from '../data/rings'
import { getJiaziIndices, ganzhiName, type PillarId } from '../utils/liushiJiazi'

// 时间控制（与控制面板双向绑定）
const controlledTime = ref(new Date())

// 实时时钟：默认每秒推进 controlledTime → 六环随真实时间自动跳。
// 一旦用户用控制面板播放/手动调时/选时，停掉实时跟随，把控制权交还给用户。
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

// 控制面板触发的时间变化 = 用户接管，停掉实时跟随
function onUserTimeChange() {
  if (liveMode.value) {
    liveMode.value = false
    stopLiveClock()
  }
}

onMounted(startLiveClock)
onUnmounted(stopLiveClock)

// 视图控制：缩放 / 平移 / 旋转
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

// 六柱元信息：由外到内，每环径向厚度交给 RingStack 自动分配半径
const PILLARS: { id: PillarId; name: string; thickness: number; color: string }[] = [
  { id: 'year', name: '年柱', thickness: 24, color: '#FFD700' },
  { id: 'month', name: '月柱', thickness: 24, color: '#FFA500' },
  { id: 'day', name: '日柱', thickness: 24, color: '#FF6B6B' },
  { id: 'hour', name: '时柱', thickness: 24, color: '#4ECDC4' },
  { id: 'minute', name: '分柱', thickness: 24, color: '#45B7D1' },
  { id: 'second', name: '秒柱', thickness: 24, color: '#9370DB' }
]

const OUTER_RADIUS = 460
const DataRingComp = markRaw(DataRing)

// 当前各柱的六十甲子序号（0-59）
const currentIndices = computed(() => getJiaziIndices(controlledTime.value))

// 非当前格统一灰色，仅当前时间点所在格高亮放大
const GREY = '#555'

// 为某一环构造带高亮的甲子数据：当前柱所在格高亮，其余灰色
function buildRingData(activeIndex: number, highlightColor: string) {
  return {
    ...sixtyJiazi,
    items: sixtyJiazi.items.map((it, i) => ({
      ...it,
      color: i === activeIndex ? highlightColor : GREY,
      fontSize: i === activeIndex ? 14 : 10,
      highlight: i === activeIndex
    }))
  }
}

// RingStack 的环配置：每环把当前高亮后的甲子数据透传给 DataRing。
// 整体随 currentIndices 重算，避免在模板里逐帧重建。
const rings = computed(() =>
  PILLARS.map(p => ({
    component: DataRingComp,
    thickness: p.thickness,
    props: { data: buildRingData(currentIndices.value[p.id], p.color) }
  }))
)

// 当前六柱干支名（用于右上角面板显示）
const pillarNames = computed(
  () =>
    Object.fromEntries(
      PILLARS.map(p => [p.id, ganzhiName(currentIndices.value[p.id])])
    ) as Record<PillarId, string>
)
</script>

<template>
  <div class="container">
    <RouterLink to="/" class="back-link">← 罗盘列表</RouterLink>

    <!-- 六柱当前值显示 -->
    <div class="pillars-panel">
      <div class="pillar-title">六柱</div>
      <div class="pillar-items">
        <div class="pillar-item" v-for="p in PILLARS" :key="p.id">
          <span class="pillar-name" :style="{ color: p.color }">{{ p.name }}</span>
          <span class="pillar-value" :style="{ color: p.color }">{{ pillarNames[p.id] }}</span>
        </div>
      </div>
    </div>

    <svg
      :width="1200"
      :height="1200"
      viewBox="0 0 1200 1200"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">

        <!-- 六十甲子六环：由外到内，年月日时分秒；半径由 RingStack 自动分配 -->
        <RingStack
          :outer-radius="OUTER_RADIUS"
          :gap="2"
          :rings="rings"
          :rotation-direction="rotationDirection"
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

.pillars-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid #333;
  border-radius: 6px;
  padding: 12px 16px;
}

.pillar-title {
  color: #888;
  font-size: 12px;
  text-align: center;
  margin-bottom: 8px;
  letter-spacing: 0.1em;
}

.pillar-items {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 6px 18px;
}

.pillar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.pillar-name {
  font-size: 11px;
  opacity: 0.7;
}

.pillar-value {
  font-size: 17px;
  font-weight: bold;
}
</style>
