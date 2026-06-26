<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import {
  project,
  eclipticToEquatorial,
  moonPointToEquatorial,
  type PlanePoint,
  OUTER_BULGE_RATIO,
  INNER_GAP_RATIO
} from '@/utils/skyProjection'
import { lunarOrbit } from '@/utils/celestial'
import { getMansionSpans, findMansion, type MansionHit } from '@/utils/planetMansion'
import BodyMarker from '../celestial/BodyMarker.vue'
import PlanetSvg from '../celestial/PlanetSvg.vue'
import { useSevenLuminaries } from '@/composables/useSevenLuminaries'
import { getLuminarySize, getLuminaryHalos } from '@/data/rings/sevenLuminaries'
import HelioOrbits from '../centers/HelioOrbits.vue'

/** 环与星图之间的默认间隙 */
const RING_GAP = 8

/**
 * 天极投影星图（标准时间驱动环组件）
 *
 * ⚠️ 五层架构范式：接受 MaybeRef<Date>，内部 computed 派生所有数据
 *   - 自动计算：赤道半径、黄道/白道缩放、日心盘半径
 *   - 无需父组件手动计算任何半径
 *
 * ⚠️ 架构优化：SkyChart 仅负责轨道背景渲染
 *   - 赤道圈 / 黄道圈 / 白道圈 的路径绘制
 *   - 二十八宿区间与宿名
 *   - 春秋分点 / 升降交点标记
 *   - 内嵌日心轨道盘（中心区域自动布局）
 *
 * 🔑 双重视锥架构设计：两套行星视角并存，互为补充
 *
 *   【视角一：SkyChart 内置 · 天极投影视角】
 *     - 太阳 + 五星 → 黄道圈（偏心椭圆轨道）
 *     - 月球 → 白道圈（另一个偏心椭圆，与黄道相交于升降交点）
 *     - 视觉特色：轨道偏心、黄赤交角、月球纬度摆动
 *
 *   【视角二：SevenLuminariesRing · 赤道环带视角】
 *     - 所有天体按赤经投影到赤道环带上
 *     - 视觉特色：与二十八宿精确对齐，直观显示"入宿度"
 *
 * 每个天体待在自己的圈上：
 *   - 二十八宿距星 → 赤道圈（按赤经）
 *   - 太阳 + 五星 → 黄道圈（按黄道坐标）
 *   - 月球 → 白道圈（按白道）
 *
 * 黄道与赤道相交于春秋分点；白道与黄道相交于升降交点。
 */
interface Props {
  time?: MaybeRef<Date>
  /** 环外半径（由 RingStack 注入） */
  radius?: number
  /** 环内半径（由 RingStack 注入，未使用，保持接口一致） */
  innerRadius?: number
  /** 旋转方向（由 RingStack 注入） */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  showEquator?: boolean
  showEcliptic?: boolean
  showWhiteWay?: boolean
  showMansions?: boolean
  showPlanets?: boolean
  showSun?: boolean
  showMoon?: boolean
  showNodes?: boolean
  /** 显示黄道/白道圆心（几何中心） */
  showCenters?: boolean
  /** 是否显示内嵌日心轨道盘 */
  showHelioOrbits?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  radius: 320,
  showEquator: true,
  showEcliptic: true,
  showWhiteWay: true,
  showMansions: true,
  // ⚠️ 架构说明：两套行星视角并存，不冲突
  //   - SkyChart 内置行星：天极投影视角，黄道/白道偏心轨道
  //   - SevenLuminariesRing：赤道环带视角，突出二十八宿位置
  showPlanets: true,
  showSun: true,
  showMoon: true,
  showNodes: true,
  showCenters: true,
  showHelioOrbits: true
})

/**
 * ⚠️ 五层架构范式：所有半径自动计算，零手动配置
 *
 * 计算链：
 *   outerRadius (RingStack 注入)
 *     → skyRadius = (outerRadius - RING_GAP) / OUTER_BULGE_RATIO
 *       → helioRadius = skyRadius * INNER_GAP_RATIO - RING_GAP
 *         → helioInnerRadius = max(20, helioRadius * 0.16)
 */

/** 赤道半径（自动计算：让黄/白道最大鼓出顶到外环内缘下方） */
const skyRadius = computed(() => (props.radius - RING_GAP) / OUTER_BULGE_RATIO)

/** 日心盘外半径（自动计算：填满星图中心空区） */
const helioRadius = computed(() => skyRadius.value * INNER_GAP_RATIO - RING_GAP)

/** 日心盘内半径（自动计算：留出太阳本体空间） */
const helioInnerRadius = computed(() => Math.max(20, helioRadius.value * 0.16))

/** 赤道半径别名（兼容原有逻辑） */
const R = computed(() => skyRadius.value)

/** 确保时间参数是响应式的（默认值用 computed 包裹） */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 调用统一的七曜计算 composable */
const { sun, moon, planets } = useSevenLuminaries(timeRef)

/** 单位投影坐标 → 画布坐标（y 取反：北天极朝上、赤经逆时针） */
const toCanvas = (p: PlanePoint) => ({ x: p.x * R.value, y: -p.y * R.value })
/** 赤经赤纬 → 画布坐标 */
const eq2c = (ra: number, dec: number) => toCanvas(project(ra, dec))
/** 黄道坐标 → 画布坐标（先转赤道再投影，落在黄道圈上） */
const ecl2c = (lon: number, lat = 0) => {
  const eq = eclipticToEquatorial(lon, lat)
  return eq2c(eq.ra, eq.dec)
}

/* ── 三条轨道圈的采样路径 ── */
const buildPath = (fn: (deg: number) => { ra: number; dec: number }): string => {
  const pts: string[] = []
  for (let d = 0; d <= 360; d += 3) {
    const eq = fn(d)
    const p = eq2c(eq.ra, eq.dec)
    pts.push(`${d === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
  }
  return pts.join(' ') + ' Z'
}

/** 赤道圈（正圆，二十八宿落于此） */
const equatorPath = computed(() => buildPath((ra) => ({ ra, dec: 0 })))
/** 黄道圈（太阳五星落于此） */
const eclipticPath = computed(() => buildPath((lon) => eclipticToEquatorial(lon)))
/** 白道圈（月球落于此） */
const node = computed(() => lunarOrbit(timeRef.value).ascendingNodeLongitude)
const whiteWayPath = computed(() => buildPath((u) => moonPointToEquatorial(u, node.value)))

/* ── 交点标记 ── */
/** 春分点（黄经0，黄道∩赤道）、秋分点（黄经180） */
const vernalPoint = computed(() => ecl2c(0))
const autumnPoint = computed(() => ecl2c(180))
/** 升交点（白道∩黄道，黄经=node）、降交点（node+180） */
const ascNode = computed(() => ecl2c(node.value))
const descNode = computed(() => ecl2c(node.value + 180))

/* ── 三圈圆心 ── */
/** 赤道圆心 = 天极（原点） */
const equatorCenter = { x: 0, y: 0 }

/* ── 二十八宿（赤道圈上的宿区间）─ */
const spans = computed(() => getMansionSpans(timeRef.value))

/** 沿赤道采样一段弧（startRa→endRa，含跨 360°）的折线路径 */
const arcPath = (startRa: number, endRa: number): string => {
  const span = ((endRa - startRa) % 360 + 360) % 360
  const step = 2
  const n = Math.max(2, Math.ceil(span / step))
  const pts: string[] = []
  for (let i = 0; i <= n; i++) {
    const ra = startRa + (span * i) / n
    const c = eq2c(ra, 0)
    pts.push(`${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
  }
  return pts.join(' ')
}

/** 二十八宿渲染数据 */
const mansions = computed(() => {
  // 获取当前行星落宿用于高亮
  const hitLabels = new Set<string>()
  for (const p of planets.value) {
    const m = findMansion(p.equatorial.ra, spans.value)
    if (m) hitLabels.add(m.label)
  }
  const moonMansion = findMansion(moon.value.equatorial.ra, spans.value)
  if (moonMansion) hitLabels.add(moonMansion.label)

  return spans.value.map((s) => {
    const span = ((s.endRa - s.startRa) % 360 + 360) % 360
    const midRa = s.startRa + span / 2
    // 距星处径向分隔短线（赤道圈内外各延伸一点）
    const bIn = toCanvas({ x: project(s.startRa, 0).x * 0.96, y: project(s.startRa, 0).y * 0.96 })
    const bOut = toCanvas({ x: project(s.startRa, 0).x * 1.04, y: project(s.startRa, 0).y * 1.04 })
    // 宿名标在弧段中点、略偏圈外
    const labelPt = toCanvas({ x: project(midRa, 0).x * 1.1, y: project(midRa, 0).y * 1.1 })
    const hit = hitLabels.has(s.label)
    return {
      label: s.label,
      color: s.color,
      span,
      arc: arcPath(s.startRa, s.endRa),
      boundary: { x1: bIn.x, y1: bIn.y, x2: bOut.x, y2: bOut.y },
      labelPt,
      hit
    }
  })
})

/* ── 天体位置画布坐标转换 ── */
const sunPos = computed(() => ecl2c(sun.value.ecliptic.longitude))
const moonPos = computed(() => ecl2c(moon.value.ecliptic.longitude, moon.value.ecliptic.latitude))
const planetPos = computed(() => planets.value.map((p) => ({
  ...p,
  ...ecl2c(p.ecliptic.longitude, p.ecliptic.latitude)
})))
</script>

<template>
  <g class="sky-chart">
    <!-- 赤道圈（二十八宿） -->
    <path v-if="showEquator" :d="equatorPath" fill="none" stroke="#888888" stroke-width="1.5" opacity="0.85" />
    <!-- 黄道圈（太阳五星） -->
    <path v-if="showEcliptic" :d="eclipticPath" fill="none" stroke="#ffdd00" stroke-width="2" opacity="0.85" />
    <!-- 白道圈（月球） -->
    <path v-if="showWhiteWay" :d="whiteWayPath" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="10,6" opacity="0.6" />

    <!-- 天极中心 -->
    <circle cx="0" cy="0" r="3" fill="#aaaaaa" opacity="0.7" />

    <!-- 三圈圆心（几何中心） -->
    <g v-if="showCenters" class="centers">
      <!-- 赤道圆心（=天极）：十字标 -->
      <g stroke="#888888" stroke-width="1.5">
        <line :x1="equatorCenter.x - 7" :y1="equatorCenter.y" :x2="equatorCenter.x + 7" :y2="equatorCenter.y" />
        <line :x1="equatorCenter.x" :y1="equatorCenter.y - 7" :x2="equatorCenter.x" :y2="equatorCenter.y + 7" />
      </g>
    </g>

    <!-- 交点标记 -->
    <g v-if="showNodes" class="nodes">
      <!-- 春分点（绿）/秋分点（青） -->
      <g v-if="showEcliptic">
        <circle :cx="vernalPoint.x" :cy="vernalPoint.y" r="5" fill="#00ff88" />
        <text :x="vernalPoint.x * 1.12" :y="vernalPoint.y * 1.12" fill="#00ff88" font-size="12" text-anchor="middle" dominant-baseline="middle">春分</text>
        <circle :cx="autumnPoint.x" :cy="autumnPoint.y" r="5" fill="#33ccff" />
        <text :x="autumnPoint.x * 1.12" :y="autumnPoint.y * 1.12" fill="#33ccff" font-size="12" text-anchor="middle" dominant-baseline="middle">秋分</text>
      </g>
      <!-- 升交点（亮绿）/降交点（红） -->
      <g v-if="showWhiteWay">
        <circle :cx="ascNode.x" :cy="ascNode.y" r="5" fill="#00ff00" />
        <text :x="ascNode.x * 1.12" :y="ascNode.y * 1.12" fill="#00ff00" font-size="12" text-anchor="middle" dominant-baseline="middle">☊升</text>
        <circle :cx="descNode.x" :cy="descNode.y" r="5" fill="#ff3333" />
        <text :x="descNode.x * 1.12" :y="descNode.y * 1.12" fill="#ff3333" font-size="12" text-anchor="middle" dominant-baseline="middle">☋降</text>
      </g>
    </g>

    <!-- 二十八宿（赤道圈上的宿区间：弧段 + 宿界 + 宿名） -->
    <g v-if="showMansions" class="mansions">
      <template v-for="m in mansions" :key="m.label">
        <!-- 宿区间弧段（命中宿加粗高亮） -->
        <path
          :d="m.arc"
          fill="none"
          :stroke="m.hit ? m.color : '#888'"
          :stroke-width="m.hit ? 5 : 3"
          :opacity="m.hit ? 0.9 : 0.55"
          stroke-linecap="butt"
        />
        <!-- 宿界（距星处径向短线） -->
        <line
          :x1="m.boundary.x1"
          :y1="m.boundary.y1"
          :x2="m.boundary.x2"
          :y2="m.boundary.y2"
          stroke="#bbb"
          stroke-width="1"
          opacity="0.8"
        />
        <!-- 宿名（弧段中点） -->
        <text
          :x="m.labelPt.x"
          :y="m.labelPt.y"
          :fill="m.hit ? m.color : '#aaa'"
          :font-size="m.hit ? 15 : 11"
          :font-weight="m.hit ? 'bold' : 'normal'"
          text-anchor="middle"
          dominant-baseline="middle"
        >
          {{ m.label }}
        </text>
      </template>
    </g>

    <!-- 太阳（黄道圈） -->
    <g v-if="showSun">
      <PlanetSvg
        :x="sunPos.x"
        :y="sunPos.y"
        kind="sun"
        :scale="getLuminarySize('sun', 1.0) / 22"
        :halos="getLuminaryHalos('sun', 1.0, 0.25)"
        halo-color="#ffdd00"
      />
      <text
        :x="sunPos.x"
        :y="sunPos.y"
        fill="#333"
        font-size="12"
        font-weight="bold"
        text-anchor="middle"
        dominant-baseline="middle"
      >日</text>
    </g>

    <!-- 月球（白道圈） -->
    <g v-if="showMoon">
      <PlanetSvg
        :x="moonPos.x"
        :y="moonPos.y"
        kind="moon"
        :scale="getLuminarySize('moon', 1.0) / 22"
        :halos="getLuminaryHalos('moon', 1.0, 0.25)"
        halo-color="#c0c0c0"
      />
      <text
        :x="moonPos.x"
        :y="moonPos.y"
        fill="#333"
        font-size="11"
        font-weight="bold"
        text-anchor="middle"
        dominant-baseline="middle"
      >月</text>
    </g>

    <!-- 五星（黄道圈；逆行加红色虚线环 + 「逆」角标） -->
    <g v-if="showPlanets" class="planets">
      <g v-for="p in planetPos" :key="p.key">
        <PlanetSvg
          :x="p.x"
          :y="p.y"
          :kind="p.key"
          :scale="p.size / 22"
          :halos="getLuminaryHalos(p.key, 1.0, 0.25)"
          :halo-color="p.color"
        />
        <text
          :x="p.x"
          :y="p.y"
          fill="#fff"
          font-size="11"
          font-weight="bold"
          text-anchor="middle"
          dominant-baseline="middle"
        >{{ p.symbol }}</text>
        <!-- 逆行标记（SkyChart 特有装饰） -->
        <template v-if="p.retrograde">
          <circle
            :cx="p.x"
            :cy="p.y"
            :r="p.size + 7"
            fill="none"
            stroke="#ff3b30"
            stroke-width="1.5"
            stroke-dasharray="4,3"
            class="retro-ring"
          />
          <text
            :x="p.x + p.size + 6"
            :y="p.y - p.size - 4"
            fill="#ff3b30"
            font-size="11"
            font-weight="bold"
            text-anchor="middle"
            dominant-baseline="middle"
          >逆</text>
        </template>
      </g>
    </g>

    <!-- 🔹 内嵌日心轨道盘（自动计算半径，零手动配置） -->
    <HelioOrbits
      v-if="showHelioOrbits"
      :time="timeRef"
      :radius="helioRadius"
      :inner-radius="helioInnerRadius"
      :show-labels="true"
    />
  </g>
</template>

<style scoped>
.sky-chart { transition: all 0.3s ease; }
.mansions text,
.planets text,
.nodes text,
.centers text { font-family: 'Microsoft YaHei', sans-serif; pointer-events: none; }
.retro-ring { animation: retro-pulse 1.6s ease-in-out infinite; transform-origin: center; }
@keyframes retro-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
