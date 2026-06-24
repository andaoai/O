<script setup lang="ts">
import { computed } from 'vue'
import {
  planetHeliocentric,
  earthHeliocentric,
  inferiorConjunctionKind,
  PLANET_SEMI_MAJOR_AU,
  PLANETS_CONFIG,
  type PlanetKey
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
}

const props = withDefaults(defineProps<Props>(), {
  radius: 180,
  innerRadius: 28,
  showLabels: true
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

    <!-- 太阳（中心） -->
    <circle cx="0" cy="0" r="14" fill="#ffdd00" opacity="0.25" />
    <circle cx="0" cy="0" r="9" fill="#ffcc00" />
    <text v-if="showLabels" x="0" y="0" fill="#663300" font-size="10" font-weight="bold" text-anchor="middle" dominant-baseline="middle">日</text>

    <!-- 地球 -->
    <circle :cx="earth.x" :cy="earth.y" r="7" fill="#4a90d9" />
    <text v-if="showLabels" :x="earth.x" :y="earth.y" fill="#fff" font-size="9" font-weight="bold" text-anchor="middle" dominant-baseline="middle">地</text>

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
