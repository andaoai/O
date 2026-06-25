<script setup lang="ts">
import { computed } from 'vue'
import {
  project,
  eclipticToEquatorial,
  moonPointToEquatorial,
  type PlanePoint
} from '@/utils/skyProjection'
import {
  sunLongitude,
  planetPosition,
  planetRetrograde,
  moonPosition,
  lunarOrbit,
  planetEquatorial,
  moonEquatorial,
  PLANETS_CONFIG,
  type PlanetKey
} from '@/utils/celestial'
import { getMansionSpans, findMansion } from '@/utils/planetMansion'
import BodyMarker from './celestial/BodyMarker.vue'

/**
 * 天极投影星图
 *
 * 每个天体待在自己的圈上：
 * - 二十八宿距星 → 赤道圈（按赤经）
 * - 太阳 + 五星 → 黄道圈（按黄道坐标）→ 可看其经过春分点/秋分点
 * - 月球 → 白道圈（按白道）→ 可看其经过升交点/降交点
 *
 * 黄道与赤道相交于春秋分点；白道与黄道相交于升降交点（圈的交点 = 真实天象的交点）。
 */
interface Props {
  time?: Date
  /** 赤道半径（像素，天极居中） */
  radius?: number
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
}

const props = withDefaults(defineProps<Props>(), {
  radius: 320,
  showEquator: true,
  showEcliptic: true,
  showWhiteWay: true,
  showMansions: true,
  showPlanets: true,
  showSun: true,
  showMoon: true,
  showNodes: true,
  showCenters: true
})

const currentTime = computed(() => props.time ?? new Date())
const R = computed(() => props.radius)

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
const node = computed(() => lunarOrbit(currentTime.value).ascendingNodeLongitude)
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

/* ── 落宿（28宿在赤道，七曜用赤经判断入宿）── */
const spans = computed(() => getMansionSpans(currentTime.value))
const hitLabels = computed(() => {
  const s = new Set<string>()
  const t = currentTime.value
  for (const key of Object.keys(PLANETS_CONFIG) as PlanetKey[]) {
    const m = findMansion(planetEquatorial(t, key).ra, spans.value)
    if (m) s.add(m.label)
  }
  const moonHit = findMansion(moonEquatorial(t).ra, spans.value)
  if (moonHit) s.add(moonHit.label)
  return s
})

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

/**
 * 二十八宿（赤道圈上的「宿区间」）
 * 每宿 = [本宿距星赤经, 下一宿距星赤经) 的一段赤道弧，宿名标在弧段中点。
 * 距星点（区间起点）用径向短线分隔，命中宿高亮。
 */
const mansions = computed(() => {
  return spans.value.map((s) => {
    const span = ((s.endRa - s.startRa) % 360 + 360) % 360
    const midRa = s.startRa + span / 2
    // 距星处径向分隔短线（赤道圈内外各延伸一点）
    const bIn = toCanvas({ x: project(s.startRa, 0).x * 0.96, y: project(s.startRa, 0).y * 0.96 })
    const bOut = toCanvas({ x: project(s.startRa, 0).x * 1.04, y: project(s.startRa, 0).y * 1.04 })
    // 宿名标在弧段中点、略偏圈外
    const labelPt = toCanvas({ x: project(midRa, 0).x * 1.1, y: project(midRa, 0).y * 1.1 })
    const hit = hitLabels.value.has(s.label)
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

/* ── 天体位置 ── */
/** 太阳（黄道圈） */
const sun = computed(() => ecl2c(sunLongitude(currentTime.value)))
/** 五星（黄道圈，带各自黄纬；retro 标记逆行） */
const planets = computed(() =>
  (Object.keys(PLANETS_CONFIG) as PlanetKey[]).map((key) => {
    const cfg = PLANETS_CONFIG[key]
    const pos = planetPosition(currentTime.value, key)
    const retro = planetRetrograde(currentTime.value, key)
    return { key, symbol: cfg.symbol, color: cfg.color, size: cfg.size, retro, ...ecl2c(pos.longitude, pos.latitude) }
  })
)
/** 月球（白道圈） */
const moon = computed(() => {
  const pos = moonPosition(currentTime.value)
  return ecl2c(pos.longitude, pos.latitude)
})
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

    <!-- 三圈圆心（几何中心）-->
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
    <BodyMarker
      v-if="showSun"
      :x="sun.x"
      :y="sun.y"
      :radius="13"
      color="#ffdd00"
      :halos="[{ radius: 20, opacity: 0.25 }]"
      symbol="日"
      symbol-color="#333"
      :symbol-font-size="12"
    />

    <!-- 月球（白道圈） -->
    <BodyMarker
      v-if="showMoon"
      :x="moon.x"
      :y="moon.y"
      :radius="9"
      color="#c0c0c0"
      :halos="[{ radius: 13, opacity: 0.3 }]"
      symbol="月"
      symbol-color="#333"
      :symbol-font-size="11"
    />

    <!-- 五星（黄道圈；逆行加红色虚线环 + 「逆」角标） -->
    <g v-if="showPlanets" class="planets">
      <g v-for="p in planets" :key="p.key">
        <BodyMarker
          :x="p.x"
          :y="p.y"
          :radius="p.size ?? 10"
          :color="p.color"
          :halos="[{ radius: (p.size ?? 10) + 4, opacity: 0.25 }]"
          :symbol="p.symbol"
          symbol-color="#fff"
          :symbol-font-size="11"
        />
        <!-- 逆行标记（SkyChart 特有装饰） -->
        <template v-if="p.retro">
          <circle
            :cx="p.x"
            :cy="p.y"
            :r="(p.size ?? 10) + 7"
            fill="none"
            stroke="#ff3b30"
            stroke-width="1.5"
            stroke-dasharray="4,3"
            class="retro-ring"
          />
          <text
            :x="p.x + (p.size ?? 10) + 6"
            :y="p.y - (p.size ?? 10) - 4"
            fill="#ff3b30"
            font-size="11"
            font-weight="bold"
            text-anchor="middle"
            dominant-baseline="middle"
          >逆</text>
        </template>
      </g>
    </g>
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
