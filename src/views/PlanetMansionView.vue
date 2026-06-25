<script setup lang="ts">
import { ref, computed, markRaw, onMounted, onUnmounted } from 'vue'
import SkyChart from '../components/SkyChart.vue'
import HelioOrbits from '../components/HelioOrbits.vue'
import PlanetDegreeRing from '../components/rings/PlanetDegreeRing.vue'
import Control from '../components/Control.vue'
import DataRing from '../components/rings/DataRing.vue'
import DegreeScale from '../components/rings/DegreeScale.vue'
import RingStack from '../components/base/RingStack.vue'
import { twentyEightConstellations } from '../data/rings/twentyEightConstellations'
import { twentyFourSolarTerms } from '../data/rings/twentyFourSolarTerms'
import type { RingData } from '../data/rings/types'
import { getPlanetMansions, getMansionSpans, findMansion } from '../utils/planetMansion'
import { eclipticToEquatorial, OUTER_BULGE_RATIO, INNER_GAP_RATIO } from '../utils/skyProjection'
import { sunLongitude, sunEquatorial } from '../utils/celestial'
import { normalizeAngle } from '../utils/geometry'
import { getMansionEvents } from '../utils/skyEvents'

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

/** 七曜入宿度标记：按赤经定位、显示入宿度数（含太阳，getPlanetMansions 仅五星+月亮） */
const planetDegreeMarkers = computed(() => {
  const t = controlledTime.value
  const markers: { angle: number; symbol: string; color: string; degree: number }[] = []
  // 五星 + 月亮（已含 ra 与入宿度）
  for (const pm of planetMansions.value) {
    if (!pm.mansion) continue
    markers.push({
      angle: raToAngle(pm.ra),
      symbol: pm.symbol,
      color: pm.color,
      degree: pm.mansion.degreeInMansion
    })
  }
  // 补太阳
  const spans = getMansionSpans(t)
  const sunRa = sunEquatorial(t).ra
  const sunHit = findMansion(sunRa, spans)
  if (sunHit) {
    markers.push({ angle: raToAngle(sunRa), symbol: '日', color: '#ffdd00', degree: sunHit.degreeInMansion })
  }
  return markers
})

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

/** 角度归一化到 [0,360)（统一走 geometry） */
const norm = normalizeAngle
/** 赤经 → DataRing 顺时针角度 */
const raToAngle = (ra: number) => norm(360 - ra)

/** 当前各宿的天象事件（合/冲/聚 → 落宿分级），随时间重算 */
const mansionEvents = computed(() => getMansionEvents(controlledTime.value))

/**
 * 二十八宿环：高亮语义从「单曜落宿」改为「天象事件分级」。
 *   level 0 不亮：文字灰白
 *   level 1 微亮：仅单曜路过 → 文字上宿本色，无扇形
 *   level 2 中亮：合/冲/三星聚 → 呼吸扇形 + 文字脉动
 *   level 3 强亮：四/五星聚 → 强呼吸 + 强发光
 */
const mansionRingData = computed<RingData>(() => {
  const spans = getMansionSpans(controlledTime.value)
  // 单曜路过的宿（常态，仅给微亮）
  const litLabels = new Set(
    planetMansions.value.map((pm) => pm.mansion?.label).filter(Boolean) as string[]
  )
  const events = mansionEvents.value
  return {
    ...twentyEightConstellations,
    startDegree: 0,
    items: spans.map((s) => {
      const evt = events.get(s.label)
      const level = evt ? evt.level : litLabels.has(s.label) ? 1 : 0
      return {
        label: s.label,
        // 不亮=灰白；微亮及以上=宿本色
        color: level >= 1 ? s.color : '#cccccc',
        startAngle: raToAngle(s.endRa),
        endAngle: raToAngle(s.startRa),
        highlightLevel: level as 0 | 1 | 2 | 3
      }
    })
  }
})

/**
 * 四象环：四象本是二十八宿的四个分组，故不另取角度，直接按各象名下七宿的
 * 赤经区间合并而成 —— 起点即「角宿」距星赤经，与二十八宿环同一基准自动对齐，
 * 随岁差/时间一起转，无需手设起始度数。
 *   东·青龙 角→箕(0-6)，北·玄武 斗→壁(7-13)，西·白虎 奎→参(14-20)，南·朱雀 井→轸(21-27)
 */
const SI_XIANG_GROUPS = [
  { label: '青龙', color: '#2ECC71', start: 0, end: 6 },
  { label: '玄武', color: '#5DADE2', start: 7, end: 13 },
  { label: '白虎', color: '#D4AF37', start: 14, end: 20 },
  { label: '朱雀', color: '#E74C3C', start: 21, end: 27 }
] as const

const siXiangRingData = computed<RingData>(() => {
  const spans = getMansionSpans(controlledTime.value)
  return {
    startDegree: 0,
    circleColor: '#555555',
    circleWidth: 1,
    tickColor: '#444444',
    tickWidth: 1,
    fontSize: 18,
    items: SI_XIANG_GROUPS.map((g) => ({
      label: g.label,
      color: g.color,
      // 该象首宿起点 → 末宿终点（与宿环同样 endRa→startAngle 的方向约定）
      startAngle: raToAngle(spans[g.end]!.endRa),
      endAngle: raToAngle(spans[g.start]!.startRa)
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

/* ──────────────────────────────────────────────────────────────
 * 半径级联布局（单一来源：DISK_OUTER_RADIUS）
 *
 * 四层半径过去全靠手写常量，改环厚度就要逐个重算。现在从最外缘一个数
 * 级联推算出全部：
 *   最外 RingStack 外缘 = DISK_OUTER_RADIUS
 *     └ RingStack 内缘 = 外缘 − Σ(厚度) − Σ(间隙)
 *         └ SkyChart 赤道半径 = (内缘 − GAP) / 黄白道最大鼓出比(≈1.318)
 *               └ HelioOrbits 外半径 = 赤道半径 × 中心空区比(≈0.682) − GAP
 *                     └ HelioOrbits 内半径 = 外半径 × 0.16（留太阳本体）
 * 改任意环厚度，下游半径自动重排，永不重叠。
 * ────────────────────────────────────────────────────────────── */
const DISK_OUTER_RADIUS = 580
const RING_GAP = 8

// 外圈五环的厚度与间隙（由外到内）：360°刻度 → 入宿度 → 二十八星宿 → 二十四节气 → 四象
interface OuterRingDef {
  thickness: number
  gapBefore: number
}
const OUTER_RING_DEFS: [OuterRingDef, OuterRingDef, OuterRingDef, OuterRingDef, OuterRingDef] = [
  { thickness: 22, gapBefore: 0 }, // 360°赤经刻度
  { thickness: 28, gapBefore: 6 }, // 七曜入宿度
  { thickness: 40, gapBefore: 6 }, // 二十八星宿
  { thickness: 30, gapBefore: 8 }, // 二十四节气
  { thickness: 34, gapBefore: 4 } // 四象
]

/** RingStack 累加后的内缘半径 */
const ringStackInner = computed(
  () =>
    DISK_OUTER_RADIUS -
    OUTER_RING_DEFS.reduce((sum, r) => sum + r.thickness + r.gapBefore, 0)
)

/** 星图赤道半径：让黄/白道最大鼓出顶到外圈内缘下方 RING_GAP 处 */
const skyRadius = computed(() => (ringStackInner.value - RING_GAP) / OUTER_BULGE_RATIO)

/** 日心盘外半径：填满星图中心空区（INNER_GAP_RATIO×R）再留 RING_GAP */
const helioRadius = computed(() => skyRadius.value * INNER_GAP_RATIO - RING_GAP)
/** 日心盘内半径：留出太阳本体空间 */
const helioInnerRadius = computed(() => Math.max(20, helioRadius.value * 0.16))

// 外圈布局：由外到内 —— 360°赤经刻度 → 七曜入宿度 → 二十八星宿 → 二十四节气 → 四象；
// 度数环按等分生成、标签为度数，无法逐项重映射，只能靠方向对齐：
// 赤经 ra 在 y 取反下落于屏幕标准角 −ra，故用 counterclockwise + startDegree 0，
// 使 0°刻度对准春分点、度数沿赤经方向递增（与 28 宿/节气的 clockwise 方向相反）。
const outerRings = computed(() => [
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
  {
    component: markRaw(PlanetDegreeRing),
    thickness: OUTER_RING_DEFS[1].thickness,
    gapBefore: OUTER_RING_DEFS[1].gapBefore,
    props: { markers: planetDegreeMarkers.value }
  },
  { component: markRaw(DataRing), thickness: OUTER_RING_DEFS[2].thickness, gapBefore: OUTER_RING_DEFS[2].gapBefore, props: { data: mansionRingData.value } },
  { component: markRaw(DataRing), thickness: OUTER_RING_DEFS[3].thickness, gapBefore: OUTER_RING_DEFS[3].gapBefore, props: { data: solarTermRingData.value } },
  { component: markRaw(DataRing), thickness: OUTER_RING_DEFS[4].thickness, gapBefore: OUTER_RING_DEFS[4].gapBefore, props: { data: siXiangRingData.value } }
])


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
        <!-- 二十八宿改由外圈 RingStack 渲染（已同口径对齐），此处关闭内圈宿弧避免重复 -->
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

        <!-- 最里层：日心轨道盘（太阳居中，地球+五星按日心黄经落于等间距轨道圈，
             内行星合日时标注上合/下合）。内外半径由星图中心空区自动推算，互不重叠。 -->
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
