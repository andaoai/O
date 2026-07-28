<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import { polarToCartesian } from '@/utils/geometry'
import {
  findConjunctions,
  PLANET_PAIRS,
  pairKey,
  type ConjunctionEvent,
  type PlanetPair
} from '@/utils/conjunctions'

/**
 * ⚫ 会合周期盘 · 圆心画布
 *
 * ═══════════════════════════════════════════════════════════════
 *  职责：在整个圆心区绘制五星 10 对的会合序列（双向）
 *
 *  数据流：
 *    1. `time` = 观察原点（当前时刻）
 *    2. `windowYears` = 半宽：向未来 windowYears / 向过去 windowYears
 *    3. showFuture / showPast 分别控制两个方向是否显示
 *    4. 未来方向 = 蓝色（futureColor）；过去方向 = 红色（pastColor）
 *    5. 对每对启用的行星，同方向内相邻会合两点连线
 *    6. `opacity = clamp(0.08, 1, 1 − |t_conj − now| / windowYears)`：当前最亮，越远越暗
 *
 *  坐标系：赤经（RA），与外圈 MansionDegreeRing / SolarTermsSkyRing 严格一致
 *  屏幕角：`screenAngle(ra) = (360 − ra) % 360`
 *
 *  性能：观察原点按「日」粒度截断 `time`，一天内不重复触发。
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  time?: MaybeRef<Date>
  /** RingStack #center slot 注入的最大可用半径 */
  radius: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 单方向观察年数（未来 windowYears 年，过去 windowYears 年） */
  windowYears?: number
  /** 勾选启用的行星对 key 集合 */
  enabledPairs?: Set<string>
  /** 每对行星的配色（保留供图例；实际连线使用方向色） */
  pairColors?: Record<string, string>
  showPoints?: boolean
  showLines?: boolean
  /** 观察方向：未来（蓝）/ 过去（红） */
  showFuture?: boolean
  showPast?: boolean
  futureColor?: string
  pastColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  rotationDirection: 'clockwise',
  windowYears: 200,
  enabledPairs: () => new Set(PLANET_PAIRS.map(pairKey)),
  pairColors: () => ({}),
  showPoints: true,
  showLines: true,
  showFuture: true,
  showPast: true,
  futureColor: '#4a9eff',
  pastColor: '#ff5a5a'
})

/** ⚠️ 五层架构范式：time 统一转成 computed ref */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 观察原点按「日」粒度截断（UTC 00:00），避免每秒 tick 触发会合重算 */
const originDay = computed(() => {
  const t = timeRef.value.getTime()
  return new Date(Math.floor(t / 86400000) * 86400000)
})

/** 会合点画在圆心画布最外沿（贴 MansionDegreeRing 内缘） */
const pointRadius = computed(() => props.radius * 0.95)

/** 屏幕角：RA → screen angle（顺时针 0° 在右） */
const screenAngle = (ra: number): number => ((360 - ra) % 360 + 360) % 360

// ────────────────────────────────────────────────────────────
// 数据模型
// ────────────────────────────────────────────────────────────

interface PairPoint {
  x: number
  y: number
  opacity: number
  r: number
  isOrigin: boolean   // 是否是最靠近观察原点的一次会合（该对该方向首点）
  date: Date
}

interface PairSegment {
  x1: number
  y1: number
  x2: number
  y2: number
  opacity: number
}

/** 单对行星 · 单方向的完整序列 */
interface DirectionalSeries {
  pair: PlanetPair
  key: string
  direction: 'future' | 'past'
  color: string
  points: PairPoint[]
  segments: PairSegment[]
}

/**
 * 计算指定方向内单对行星的会合序列。
 * @param pair 行星对
 * @param direction 'future' 或 'past'
 * @param origin 观察原点（日粒度截断）
 * @param windowMs 半宽（毫秒）
 * @param color 方向色
 */
function buildDirectionalSeries(
  pair: PlanetPair,
  direction: 'future' | 'past',
  origin: Date,
  windowMs: number,
  color: string,
  rotationDir: 'clockwise' | 'counterclockwise',
  pRadius: number
): DirectionalSeries {
  const k = pairKey(pair)

  // 时间窗口
  const originMs = origin.getTime()
  const t1 = direction === 'future' ? origin : new Date(originMs - windowMs)
  const t2 = direction === 'future' ? new Date(originMs + windowMs) : origin

  const rawEvents = findConjunctions(pair, t1, t2)

  // 过去方向要「近→远」= 时间倒序，便于第一条连线从原点出发
  const events: ConjunctionEvent[] = direction === 'future'
    ? rawEvents
    : rawEvents.slice().reverse()

  const points: PairPoint[] = events.map((evt, idx) => {
    const dt = Math.abs(evt.date.getTime() - originMs)
    const opacity = Math.max(0.08, Math.min(1, 1 - dt / windowMs))
    const r = Math.max(1.5, 3 * opacity)
    const { x, y } = polarToCartesian(screenAngle(evt.ra), pRadius, rotationDir)
    return {
      x, y, opacity, r,
      isOrigin: idx === 0,
      date: evt.date
    }
  })

  const segments: PairSegment[] = []
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    // 每段 opacity 取较靠近原点（较亮）的一端
    const opacity = Math.max(a.opacity, b.opacity)
    segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, opacity })
  }

  return { pair, key: k, direction, color, points, segments }
}

/** 两方向合并的所有序列 */
const allSeries = computed<DirectionalSeries[]>(() => {
  const origin = originDay.value
  const windowMs = props.windowYears * 365.25 * 86400000
  const rotationDir = props.rotationDirection
  const pRadius = pointRadius.value

  const results: DirectionalSeries[] = []
  for (const pair of PLANET_PAIRS) {
    const k = pairKey(pair)
    if (!props.enabledPairs.has(k)) continue

    if (props.showFuture) {
      results.push(buildDirectionalSeries(pair, 'future', origin, windowMs, props.futureColor, rotationDir, pRadius))
    }
    if (props.showPast) {
      results.push(buildDirectionalSeries(pair, 'past', origin, windowMs, props.pastColor, rotationDir, pRadius))
    }
  }
  return results
})
</script>

<template>
  <g class="conjunction-canvas">
    <!-- 连线层（先画，位于点之下） -->
    <g v-if="showLines">
      <template v-for="s in allSeries" :key="`lines-${s.key}-${s.direction}`">
        <line
          v-for="(seg, i) in s.segments"
          :key="`${s.key}-${s.direction}-${i}`"
          :x1="seg.x1"
          :y1="seg.y1"
          :x2="seg.x2"
          :y2="seg.y2"
          :stroke="s.color"
          :stroke-width="1"
          :opacity="seg.opacity"
          fill="none"
          stroke-linecap="round"
        />
      </template>
    </g>

    <!-- 会合点层 -->
    <g v-if="showPoints">
      <template v-for="s in allSeries" :key="`points-${s.key}-${s.direction}`">
        <!-- 会合点本体 -->
        <circle
          v-for="(pt, i) in s.points"
          :key="`pt-${s.key}-${s.direction}-${i}`"
          :cx="pt.x"
          :cy="pt.y"
          :r="pt.r"
          :fill="s.color"
          :opacity="pt.opacity"
        />
      </template>
    </g>
  </g>
</template>

<style scoped>
.conjunction-canvas {
  pointer-events: none;
}
</style>
