<script setup lang="ts">
import { ref, computed, markRaw, onMounted, onUnmounted } from 'vue'
import SkyChart from '../components/SkyChart.vue'
import HelioOrbits from '../components/HelioOrbits.vue'
import MansionDegreeRing from '../components/rings/MansionDegreeRing.vue'
import ConstellationsRing from '../components/rings/ConstellationsRing.vue'
import SiXiangRing from '../components/rings/SiXiangRing.vue'
import SolarTermsSkyRing from '../components/rings/SolarTermsSkyRing.vue'
import Control from '../components/Control.vue'
import DegreeScale from '../components/rings/DegreeScale.vue'
import RingStack from '../components/base/RingStack.vue'
import { OUTER_BULGE_RATIO, INNER_GAP_RATIO } from '../utils/skyProjection'

/**
 * 七曜入宿天象盘（时间驱动统一架构）
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 架构原则：唯一时间源 controlledTime
 *  ─────────────────────────────────────────────────────────────
 *  父组件不做任何数据计算，只传 time ref 给各子组件。
 *  所有计算逻辑都封装在各自的 Ring 组件内部。
 *  time 变化 → 所有子组件自动响应，重新计算并渲染。
 * ═══════════════════════════════════════════════════════════════
 */

// 唯一时间源
const controlledTime = ref(new Date())

// 实时时钟：默认每秒推进 controlledTime，七曜随真实时间移动
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

/* ──────────────────────────────────────────────────────────────
 * 半径级联布局（单一来源：DISK_OUTER_RADIUS）
 *
 * 四层半径过去全靠手写常量，改环厚度就要逐个重算。现在从最外缘一个数
 * 级联推算出全部，永不重叠。
 * ────────────────────────────────────────────────────────────── */
const DISK_OUTER_RADIUS = 580
const RING_GAP = 8

// 外圈五环的厚度与间隙（由外到内）：
// 360°刻度 → 七曜入宿度 → 二十八星宿 → 二十四节气 → 四象
interface OuterRingDef {
  thickness: number
  gapBefore: number
}
const OUTER_RING_DEFS: [OuterRingDef, OuterRingDef, OuterRingDef, OuterRingDef, OuterRingDef] = [
  { thickness: 22, gapBefore: 0 }, // 360°赤经刻度
  { thickness: 28, gapBefore: 6 }, // 七曜入宿度
  { thickness: 40, gapBefore: 6 }, // 二十八星宿
  { thickness: 30, gapBefore: 8 }, // 二十四节气
  { thickness: 34, gapBefore: 4 }  // 四象
]

/** RingStack 累加后的内缘半径 */
const ringStackInner = computed(
  () =>
    DISK_OUTER_RADIUS -
    OUTER_RING_DEFS.reduce((sum, r) => sum + r.thickness + r.gapBefore, 0)
)

// 常量已从 skyProjection 导入，无需重复定义

/** 星图赤道半径：让黄/白道最大鼓出顶到外圈内缘下方 RING_GAP 处 */
const skyRadius = computed(() => (ringStackInner.value - RING_GAP) / OUTER_BULGE_RATIO)

/** 日心盘外半径：填满星图中心空区再留 RING_GAP */
const helioRadius = computed(() => skyRadius.value * INNER_GAP_RATIO - RING_GAP)
/** 日心盘内半径：留出太阳本体空间 */
const helioInnerRadius = computed(() => Math.max(20, helioRadius.value * 0.16))

/* ──────────────────────────────────────────────────────────────
 * 外圈 RingStack 配置（由外到内）
 *
 * ⚠️ 全时间驱动架构：所有组件都只传 controlledTime ref
 * 没有父组件 computed，没有 .value 提取，整条链路响应式。
 * ────────────────────────────────────────────────────────────── */
const outerRings = [
  // 360°赤经刻度（静态间隔，不随时间）
  {
    component: markRaw(DegreeScale),
    thickness: OUTER_RING_DEFS[0].thickness,
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
  // 七曜入宿度标记环（时间驱动）
  {
    component: markRaw(MansionDegreeRing),
    thickness: OUTER_RING_DEFS[1].thickness,
    gapBefore: OUTER_RING_DEFS[1].gapBefore,
    props: { time: controlledTime }
  },
  // 二十八宿环（时间驱动：动态赤经区间 + 天象事件高亮）
  {
    component: markRaw(ConstellationsRing),
    thickness: OUTER_RING_DEFS[2].thickness,
    gapBefore: OUTER_RING_DEFS[2].gapBefore,
    props: { time: controlledTime }
  },
  // 二十四节气环（时间驱动：赤经动态对齐 + 当前节气高亮）
  {
    component: markRaw(SolarTermsSkyRing),
    thickness: OUTER_RING_DEFS[3].thickness,
    gapBefore: OUTER_RING_DEFS[3].gapBefore,
    props: { time: controlledTime }
  },
  // 四象环（时间驱动：按宿赤经动态合并）
  {
    component: markRaw(SiXiangRing),
    thickness: OUTER_RING_DEFS[4].thickness,
    gapBefore: OUTER_RING_DEFS[4].gapBefore,
    props: { time: controlledTime }
  }
]
</script>

<template>
  <div class="container">
    <!-- 返回首页 -->
    <RouterLink to="/" class="back-link">← 罗盘列表</RouterLink>

    <svg viewBox="0 0 1200 1200" preserveAspectRatio="xMidYMid meet" class="sky-svg">
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">
        <!-- 外圈复用环：360°赤经刻度 + 二十四节气 + 二十八星宿（动态对齐星图赤经） -->
        <RingStack
          :outer-radius="DISK_OUTER_RADIUS"
          :rings="outerRings"
          rotation-direction="clockwise"
        />

        <!-- 天极投影星图：赤道正圆居中，黄道/白道偏心，七曜各按赤经落位 -->
        <SkyChart
          :time="controlledTime"
          :radius="skyRadius"
          :show-equator="true"
          :show-ecliptic="true"
          :show-white-way="true"
          :show-mansions="false"
          :show-planets="true"
          :show-sun="true"
          :show-moon="true"
        />

        <!-- 最里层：日心轨道盘（太阳居中，地球+五星按日心黄经落位） -->
        <HelioOrbits :time="controlledTime" :radius="helioRadius" :inner-radius="helioInnerRadius" :show-labels="true" />
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
</style>
