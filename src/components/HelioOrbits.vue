<script setup lang="ts">
import { computed } from 'vue'
import {
  planetHeliocentric,
  earthHeliocentric,
  inferiorConjunctionKind,
  moonPosition,
  detectAspects,
  formatAspect,
  PLANET_SEMI_MAJOR_AU,
  PLANETS_CONFIG,
  type PlanetKey,
  type LuminaryKey
} from '@/utils/celestial'

/**
 * 日心轨道盘（最里层）
 *
 * 以太阳为中心，按真实轨道内外顺序（水→金→地→火→木→土）等间距画 6 个同心圆。
 * 等间距而非真实 AU：土星轨道是水星的 24 倍，真实比例下中心区放不下五星。
 *
 * 每个天体按其「日心黄经」摆到自己的轨道圈上。画出「地球—太阳」基准线，
 * 内行星（水/金）合日时自动标注上合/下合：靠地球侧=下合，靠太阳背侧=上合。
 *
 * 坐标系与 SkyChart 对齐：日心黄经 lon 的点落在屏幕标准角 −lon（y 取反），
 * 与外层黄道圈同向，便于和地心星图对照。
 */
interface Props {
  time?: Date
  /** 最外轨道（土星）半径（像素） */
  radius?: number
  /** 最内圈与中心（太阳）之间的预留半径（像素） */
  innerRadius?: number
  showLabels?: boolean
  /** 显示七曜合/冲相位连线 */
  showAspects?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  radius: 180,
  innerRadius: 28,
  showLabels: true,
  showAspects: true
})

const currentTime = computed(() => props.time ?? new Date())
const D2R = Math.PI / 180

/** 轨道顺序（由内到外），地球插在金星与火星之间 */
type OrbitKey = PlanetKey | 'earth'
const ORBIT_ORDER = computed<OrbitKey[]>(() => {
  const planets = (Object.keys(PLANETS_CONFIG) as PlanetKey[])
  const all: OrbitKey[] = [...planets, 'earth']
  // 按真实半长轴排序（地球=1.0）
  return all.sort((a, b) => au(a) - au(b))
})

const au = (k: OrbitKey) => (k === 'earth' ? 1.0 : PLANET_SEMI_MAJOR_AU[k])

/** 第 i 圈（由内到外）的等间距半径 */
const orbitRadius = (index: number) => {
  const n = ORBIT_ORDER.value.length
  // 最内圈留出太阳本体空间（innerRadius），最外圈到 props.radius
  const inner = props.innerRadius
  return inner + ((props.radius - inner) * (index + 1)) / n
}

/** 日心黄经 → 画布坐标（y 取反，与 SkyChart 同向） */
const place = (lon: number, r: number) => ({
  x: r * Math.cos(lon * D2R),
  y: -r * Math.sin(lon * D2R)
})

/** 地球（蓝点）位置与所在轨道半径 */
const earth = computed(() => {
  const idx = ORBIT_ORDER.value.indexOf('earth')
  const r = orbitRadius(idx)
  const pos = earthHeliocentric(currentTime.value)
  return { r, ...place(pos.longitude, r), lon: pos.longitude }
})

/** 地球—太阳基准线：沿地球黄经方向贯穿全盘的直径（一端朝地球，一端朝其对侧） */
const earthLine = computed(() => {
  const p = place(earth.value.lon, props.radius)
  return { x1: -p.x, y1: -p.y, x2: p.x, y2: p.y }
})

/**
 * 月亮：绕地球的小卫星圈（真实月地距离仅 0.0026 AU，必须放大才可见）。
 * 月亮地心黄经 = 它相对地球的方向；卫星圈半径取固定像素。
 * 朔：月亮转到地球朝太阳一侧；望：转到背侧 —— 与地心星图的日月合冲对应。
 */
const MOON_ORBIT_PX = computed(() => Math.max(14, props.innerRadius * 0.8))
const moon = computed(() => {
  const lon = moonPosition(currentTime.value).longitude
  const local = place(lon, MOON_ORBIT_PX.value)
  return {
    orbitR: MOON_ORBIT_PX.value,
    x: earth.value.x + local.x,
    y: earth.value.y + local.y
  }
})

/** 五星：位置 + 所在轨道半径 + 上下合标记 */
const planets = computed(() =>
  (Object.keys(PLANETS_CONFIG) as PlanetKey[]).map((key) => {
    const cfg = PLANETS_CONFIG[key]
    const idx = ORBIT_ORDER.value.indexOf(key)
    const r = orbitRadius(idx)
    const pos = planetHeliocentric(currentTime.value, key)
    const conj = inferiorConjunctionKind(currentTime.value, key)
    return {
      key,
      symbol: cfg.symbol,
      color: cfg.color,
      size: Math.max(6, (cfg.size ?? 10) * 0.7),
      r,
      conj,
      ...place(pos.longitude, r)
    }
  })
)

/** 所有轨道圈半径（用于画同心圆） */
const orbitCircles = computed(() => ORBIT_ORDER.value.map((k, i) => ({ key: k, r: orbitRadius(i) })))

/* ── 七曜相位（合/冲）连线 ──
 * 合/冲本质是「从地球看两天体同向/反向」，即地球、A、B 三点共线。
 * 在日心盘上连接成相位的两天体，连线自然穿过地球点 —— 这正是地心视线的几何体现。
 */
/** 各天体在日心盘上的画布坐标（太阳=中心，五星=轨道，月=卫星圈） */
const luminaryPoint = computed<Record<LuminaryKey, { x: number; y: number }>>(() => {
  const map = {} as Record<LuminaryKey, { x: number; y: number }>
  map.sun = { x: 0, y: 0 }
  map.moon = { x: moon.value.x, y: moon.value.y }
  for (const p of planets.value) map[p.key] = { x: p.x, y: p.y }
  return map
})

/** 当前合/冲相位连线（连接成相位的两天体，过地球点） */
const aspectLines = computed(() =>
  detectAspects(currentTime.value, 6).map((e) => {
    const pa = luminaryPoint.value[e.a]
    const pb = luminaryPoint.value[e.b]
    return {
      key: `${e.a}-${e.b}-${e.kind}`,
      conjunction: e.kind === 'conjunction',
      x1: pa.x,
      y1: pa.y,
      x2: pb.x,
      y2: pb.y,
      labelX: (pa.x + pb.x) / 2,
      labelY: (pa.y + pb.y) / 2,
      label: formatAspect(e)
    }
  })
)
</script>

<template>
  <g class="helio-orbits">
    <!-- 同心轨道圈 -->
    <circle
      v-for="o in orbitCircles"
      :key="o.key"
      cx="0"
      cy="0"
      :r="o.r"
      fill="none"
      :stroke="o.key === 'earth' ? '#4a90d9' : '#666'"
      :stroke-width="o.key === 'earth' ? 1.2 : 0.8"
      :stroke-dasharray="o.key === 'earth' ? '2,3' : 'none'"
      :opacity="o.key === 'earth' ? 0.7 : 0.4"
    />

    <!-- 地球—太阳基准线（贯穿全盘，标识合日方向轴） -->
    <line
      :x1="earthLine.x1"
      :y1="earthLine.y1"
      :x2="earthLine.x2"
      :y2="earthLine.y2"
      stroke="#4a90d9"
      stroke-width="0.8"
      stroke-dasharray="4,4"
      opacity="0.45"
    />

    <!-- 七曜相位连线（合=青实线，冲=橙虚线），连接成相位的两天体、过地球点 -->
    <g v-if="showAspects" class="aspects">
      <template v-for="a in aspectLines" :key="a.key">
        <line
          :x1="a.x1"
          :y1="a.y1"
          :x2="a.x2"
          :y2="a.y2"
          :stroke="a.conjunction ? '#00e5ff' : '#ff9500'"
          stroke-width="1.5"
          :stroke-dasharray="a.conjunction ? 'none' : '5,4'"
          opacity="0.8"
        />
        <text
          v-if="showLabels"
          :x="a.labelX"
          :y="a.labelY"
          :fill="a.conjunction ? '#00e5ff' : '#ff9500'"
          font-size="11"
          font-weight="bold"
          text-anchor="middle"
          dominant-baseline="middle"
          paint-order="stroke"
          stroke="#000"
          stroke-width="3"
        >{{ a.label }}</text>
      </template>
    </g>

    <!-- 太阳（中心） -->
    <circle cx="0" cy="0" r="14" fill="#ffdd00" opacity="0.25" />
    <circle cx="0" cy="0" r="9" fill="#ffcc00" />
    <text v-if="showLabels" x="0" y="0" fill="#663300" font-size="10" font-weight="bold" text-anchor="middle" dominant-baseline="middle">日</text>

    <!-- 地球 -->
    <circle :cx="earth.x" :cy="earth.y" r="7" fill="#4a90d9" />
    <text v-if="showLabels" :x="earth.x" :y="earth.y" fill="#fff" font-size="9" font-weight="bold" text-anchor="middle" dominant-baseline="middle">地</text>

    <!-- 月亮：绕地球的小卫星圈（放大显示，朔=朝太阳侧/望=背侧） -->
    <circle :cx="earth.x" :cy="earth.y" :r="moon.orbitR" fill="none" stroke="#c0c0c0" stroke-width="0.6" stroke-dasharray="2,2" opacity="0.4" />
    <circle :cx="moon.x" :cy="moon.y" r="4.5" fill="#c0c0c0" />
    <text v-if="showLabels" :x="moon.x" :y="moon.y" fill="#333" font-size="7" font-weight="bold" text-anchor="middle" dominant-baseline="middle">月</text>

    <!-- 五星 -->
    <g v-for="p in planets" :key="p.key">
      <circle :cx="p.x" :cy="p.y" :r="p.size + 3" :fill="p.color" opacity="0.25" />
      <circle :cx="p.x" :cy="p.y" :r="p.size" :fill="p.color" />
      <text v-if="showLabels" :x="p.x" :y="p.y" fill="#fff" font-size="9" font-weight="bold" text-anchor="middle" dominant-baseline="middle">{{ p.symbol }}</text>
      <!-- 上合/下合标注（仅内行星合日时出现） -->
      <text
        v-if="showLabels && p.conj"
        :x="p.x"
        :y="p.y - p.size - 6"
        :fill="p.conj === 'inferior' ? '#ff3b30' : '#34c759'"
        font-size="9"
        font-weight="bold"
        text-anchor="middle"
        dominant-baseline="middle"
      >{{ p.conj === 'inferior' ? '下合' : '上合' }}</text>
    </g>
  </g>
</template>

<style scoped>
.helio-orbits text { font-family: 'Microsoft YaHei', sans-serif; pointer-events: none; }
</style>
