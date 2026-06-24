<script setup lang="ts">
import { ref, computed, markRaw, onMounted, onUnmounted } from 'vue'
import SkyChart from '../components/SkyChart.vue'
import Control from '../components/Control.vue'
import DataRing from '../components/DataRing.vue'
import DegreeScale from '../components/DegreeScale.vue'
import RingStack from '../components/base/RingStack.vue'
import { twentyEightConstellations } from '../data/rings/twentyEightConstellations'
import { twentyFourSolarTerms } from '../data/rings/twentyFourSolarTerms'
import type { RingData } from '../data/rings/types'
import { getPlanetMansions, getMansionSpans } from '../utils/planetMansion'
import { eclipticToEquatorial } from '../utils/skyProjection'
import { sunLongitude } from '../utils/celestial'

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

/* ──────────────────────────────────────────────────────────────
 * 外圈复用环（动态对齐星图）
 *
 * 坐标系对齐：星图为天极投影且 y 取反，赤经 ra 的点落在「标准角 −ra」；
 * DataRing（顺时针）角度 θ 的点落在「标准角 θ」。故 θ = 360 − ra 时二者径向重合。
 * 春分校验：星图春分点 ra=0 → θ=0（正右方），与 SkyChart vernalPoint 一致。
 *
 * 外圈始终顺时针、不随控制面板的 rotationDirection 翻转——因为 SkyChart 没有该
 * 概念，翻转只会让外圈与星图错位（整盘 rotationAngle 作用于共同的 <g>，不受影响）。
 * ────────────────────────────────────────────────────────────── */

/** 角度归一化到 [0,360) */
const norm = (a: number) => ((a % 360) + 360) % 360
/** 赤经 → DataRing 顺时针角度 */
const raToAngle = (ra: number) => norm(360 - ra)

/** 二十八宿环：用实时距星赤经区间，七曜所入之宿高亮（与星图内宿位同口径） */
const mansionRingData = computed<RingData>(() => {
  const spans = getMansionSpans(controlledTime.value)
  const hitLabels = new Set(
    planetMansions.value.map((pm) => pm.mansion?.label).filter(Boolean) as string[]
  )
  return {
    ...twentyEightConstellations,
    startDegree: 0,
    items: spans.map((s) => ({
      label: s.label,
      color: s.color,
      // 区间 [startRa, endRa) 映射到屏幕角：起点取较小角(360−endRa)，顺时针扫到 360−startRa
      startAngle: raToAngle(s.endRa),
      endAngle: raToAngle(s.startRa),
      highlight: hitLabels.has(s.label)
    }))
  }
})

/** 二十四节气环：按黄经定位（春分=黄经0），转赤经后映射，使春分边界对准星图春分点 */
const solarTermRingData = computed<RingData>(() => {
  const labels = twentyFourSolarTerms.items.map((it) => it.label)
  // 当前太阳所在节气（黄经从立春 315° 起、每 15° 一气）用于高亮
  const sunLon = sunLongitude(controlledTime.value)
  const currentIndex = Math.floor(norm(sunLon - 315) / 15)
  return {
    ...twentyFourSolarTerms,
    startDegree: 0,
    items: labels.map((label, i) => {
      const eclStart = norm(315 + i * 15) // 立春黄经 315°
      const eclEnd = eclStart + 15
      const raStart = eclipticToEquatorial(eclStart).ra
      const raEnd = eclipticToEquatorial(eclEnd).ra
      return {
        label,
        startAngle: raToAngle(raEnd),
        endAngle: raToAngle(raStart),
        highlight: i === currentIndex
      }
    })
  }
})

// 外圈布局：由外到内 —— 360°赤经刻度 → 二十四节气 → 二十八星宿；
// 起始半径 580 > 黄道最大鼓出(≈454)，与星图彻底分离不重叠。
// 度数环按等分生成、标签为度数，无法逐项重映射，只能靠方向对齐：
// 赤经 ra 在 y 取反下落于屏幕标准角 −ra，故用 counterclockwise + startDegree 0，
// 使 0°刻度对准春分点、度数沿赤经方向递增（与 28 宿/节气的 clockwise 方向相反）。
const outerRings = computed(() => [
  {
    component: markRaw(DegreeScale),
    thickness: 22,
    props: {
      scaleInterval: 10,
      startDegree: 0,
      rotationDirection: 'counterclockwise',
      showSectors: false,
      showLabels: true,
      labelColor: '#888888',
      circleColor: '#555555'
    }
  },
  { component: markRaw(DataRing), thickness: 30, gapBefore: 6, props: { data: solarTermRingData.value } },
  { component: markRaw(DataRing), thickness: 40, gapBefore: 8, props: { data: mansionRingData.value } }
])


</script>

<template>
  <div class="container">
    <!-- 返回首页 -->
    <RouterLink to="/" class="back-link">← 罗盘列表</RouterLink>

    <!-- 落宿信息面板 -->
    <div class="mansion-panel">
      <h3>七曜入宿</h3>
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

    <svg viewBox="0 0 1200 1200" preserveAspectRatio="xMidYMid meet" class="sky-svg">
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">
        <!-- 外圈复用环：360°赤经刻度 + 二十四节气 + 二十八星宿（动态对齐星图赤经） -->
        <RingStack
          :outer-radius="580"
          :rings="outerRings"
          rotation-direction="clockwise"
        />

        <!-- 天极投影星图：赤道正圆居中，黄道/白道偏心，七曜各按赤经落位 -->
        <!-- 二十八宿改由外圈 RingStack 渲染（已同口径对齐），此处关闭内圈宿弧避免重复 -->
        <SkyChart
          :time="controlledTime"
          :radius="288"
          :show-equator="true"
          :show-ecliptic="true"
          :show-white-way="true"
          :show-mansions="false"
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

.sky-svg {
  display: block;
  /* 按视口最短边自适应，正方形保持星图不变形；viewBox 不变，内部坐标无需调整 */
  width: min(100vw, 100vh);
  height: min(100vw, 100vh);
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
