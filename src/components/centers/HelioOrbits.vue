<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import {
  earthHeliocentric,
  inferiorConjunctionKind,
  moonPosition,
  detectAspects,
  formatAspect,
  PLANET_SEMI_MAJOR_AU
} from '@/utils/celestial'
import BodyMarker from '../celestial/BodyMarker.vue'
import PlanetSvg from '../celestial/PlanetSvg.vue'
import { useSevenLuminaries, useEarthHeliocentric, getLuminarySize, getLuminaryHalos } from '@/composables/useSevenLuminaries'
import type { LuminaryKey } from '@/data/rings/types'

/**
 * 🔴 日心轨道盘（标准圆心组件 · 时间驱动）
 *
 * ⚠️ 五层架构规范：圆心组件统一接口
 *   - 仅需 radius 参数（由 RingStack #center slot 或 SkyChart 内嵌注入）
 *   - 支持 MaybeRef<Date> 时间驱动
 *   - 支持 rotationDirection 统一控制
 *
 * 以太阳为中心，按真实轨道内外顺序（水→金→地→火→木→土）等间距画同心圆。
 * 等间距而非真实 AU：土星轨道是水星的 24 倍，真实比例下中心区放不下五星。
 *
 * 每个天体按其「日心黄经」摆到自己的轨道圈上。画出「地球—太阳」基准线，
 * 内行星（水/金）合日时自动标注上合/下合：靠地球侧=下合，靠太阳背侧=上合。
 *
 * 坐标系与 SkyChart 对齐：日心黄经 lon 的点落在屏幕标准角 −lon（y 取反），
 * 与外层黄道圈同向，便于和地心星图对照。
 */
interface Props {
  time?: MaybeRef<Date>
  /** 日心盘最外轨道半径（通常由父组件自动注入） */
  radius?: number
  /** 统一旋转方向控制 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  showLabels?: boolean
  /** 显示七曜合/冲相位连线 */
  showAspects?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  radius: 180,
  rotationDirection: 'clockwise',
  showLabels: true,
  showAspects: true
})

/** 最内圈与中心（太阳）之间的预留半径：自动按半径比例计算，约 15% */
const innerRadius = computed(() => Math.max(20, props.radius * 0.155))

/** 确保时间参数是响应式的（默认值用 computed 包裹） */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 调用统一的七曜计算 composable */
const { sun, moon, planets } = useSevenLuminaries(timeRef)

/** 地球日心位置（独立获取） */
const earthHelio = useEarthHeliocentric(timeRef)

const D2R = Math.PI / 180

/** 轨道顺序（由内到外），地球插在金星与火星之间 */
type OrbitKey = LuminaryKey | 'earth'
const ORBIT_ORDER = computed<OrbitKey[]>(() => {
  // 按真实半长轴排序（地球=1.0）
  const allPlanets: OrbitKey[] = [...planets.value.map(p => p.key), 'earth']
  const au = (k: OrbitKey) => {
    if (k === 'earth') return 1.0
    if (k === 'sun' || k === 'moon') return 0 // 不参与排序
    return PLANET_SEMI_MAJOR_AU[k]
  }
  return allPlanets.sort((a, b) => au(a) - au(b))
})

/** 第 i 圈（由内到外）的等间距半径 */
const orbitRadius = (index: number) => {
  const n = ORBIT_ORDER.value.length
  // 最内圈留出太阳本体空间（innerRadius），最外圈到 props.radius
  const inner = innerRadius.value
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
  const pos = earthHelio.value
  return { r, ...place(pos.longitude, r), lon: pos.longitude }
})

/** 地球—太阳基准线：沿地球黄经方向贯穿全盘的直径（一端朝地球，一端朝其对侧） */
const earthLine = computed(() => {
  const p = place(earth.value.lon, props.radius)
  return { x1: -p.x, y1: -p.y, x2: p.x, y2: p.y }
})

/** 相邻轨道圈的径向间距（等间距布局） */
const orbitSpacing = computed(() => (props.radius - innerRadius.value) / ORBIT_ORDER.value.length)

/**
 * 月亮：绕地球的小卫星圈（真实月地距离仅 0.0026 AU，必须放大才可见）。
 * 月亮地心黄经 = 它相对地球的方向；卫星圈半径跟随轨道间距并留安全余量，
 * 保证月亮始终待在地球轨道两侧的环带内，不越界撞到相邻的金星/火星星点。
 * 朔：月亮转到地球朝太阳一侧；望：转到背侧 —— 与地心星图的日月合冲对应。
 */
const MOON_ORBIT_PX = computed(() => {
  // 上限取轨道间距的 0.4：月亮最远也只伸到地球与相邻轨道之间的中段，留出余量
  const cap = orbitSpacing.value * 0.4
  return Math.max(10, Math.min(cap, 22))
})
const moonHelio = computed(() => {
  const lon = moon.value.ecliptic.longitude
  const local = place(lon, MOON_ORBIT_PX.value)
  return {
    orbitR: MOON_ORBIT_PX.value,
    x: earth.value.x + local.x,
    y: earth.value.y + local.y
  }
})

/** 五星：位置 + 所在轨道半径 + 上下合标记 */
const planetsWithOrbit = computed(() =>
  planets.value.map((p) => {
    const idx = ORBIT_ORDER.value.indexOf(p.key)
    const r = orbitRadius(idx)
    // 仅内行星（水/金）需要计算上下合
    const conj = (p.key === 'mercury' || p.key === 'venus')
      ? inferiorConjunctionKind(timeRef.value, p.key)
      : null
    return {
      ...p,
      r,
      conj,
      ...place(p.heliocentric?.longitude ?? 0, r)
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
  map.moon = { x: moonHelio.value.x, y: moonHelio.value.y }
  for (const p of planetsWithOrbit.value) {
    map[p.key] = { x: p.x, y: p.y }
  }
  return map
})

/** 当前合/冲相位连线（连接成相位的两天体，过地球点） */
const aspectLines = computed(() =>
  detectAspects(timeRef.value, 6).map((e) => {
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
    <PlanetSvg
      :x="0"
      :y="0"
      kind="sun"
      :scale="getLuminarySize('sun', 0.7) / 22"
      :halos="showLabels ? [] : getLuminaryHalos('sun', 0.7, 0.25)"
      halo-color="#ffcc00"
    />
    <text
      v-if="showLabels"
      x="0"
      y="0"
      fill="#663300"
      font-size="10"
      font-weight="bold"
      text-anchor="middle"
      dominant-baseline="middle"
    >日</text>

    <!-- 地球 -->
    <PlanetSvg
      :x="earth.x"
      :y="earth.y"
      kind="earth"
      :scale="getLuminarySize('mercury', 0.9) / 22"
    />
    <text
      v-if="showLabels"
      :x="earth.x"
      :y="earth.y"
      fill="#fff"
      font-size="9"
      font-weight="bold"
      text-anchor="middle"
      dominant-baseline="middle"
    >地</text>

    <!-- 月亮：绕地球的小卫星圈（放大显示，朔=朝太阳侧/望=背侧） -->
    <circle :cx="earth.x" :cy="earth.y" :r="moonHelio.orbitR" fill="none" stroke="#c0c0c0" stroke-width="0.6" stroke-dasharray="2,2" opacity="0.4" />
    <PlanetSvg
      :x="moonHelio.x"
      :y="moonHelio.y"
      kind="moon"
      :scale="getLuminarySize('moon', 0.6) / 22"
    />
    <text
      v-if="showLabels"
      :x="moonHelio.x"
      :y="moonHelio.y"
      fill="#333"
      font-size="7"
      font-weight="bold"
      text-anchor="middle"
      dominant-baseline="middle"
    >月</text>

    <!-- 五星 -->
    <g v-for="p in planetsWithOrbit" :key="p.key">
      <PlanetSvg
        :x="p.x"
        :y="p.y"
        :kind="p.key"
        :scale="Math.max(6, Math.round(p.size * 0.7)) / 22"
        :halos="showLabels ? [] : getLuminaryHalos(p.key, 0.7, 0.25)"
        :halo-color="p.color"
      />
      <text
        v-if="showLabels"
        :x="p.x"
        :y="p.y"
        fill="#fff"
        font-size="9"
        font-weight="bold"
        text-anchor="middle"
        dominant-baseline="middle"
      >{{ p.symbol }}</text>
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
