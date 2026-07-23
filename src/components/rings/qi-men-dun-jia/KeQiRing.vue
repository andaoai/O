<script setup lang="ts">
/**
 * 奇门 · 客气环 —— 五运六气之「客气」六步排布
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与外层「六轮甲子日环 / 24 节气环 / 农历日期环 / 主气环」共享
 *     0° 起点 = 上元甲子日。段边界与主气完全一致（大寒/春分/小满/
 *     大暑/秋分/小雪 六个节气切分岁内六段）。
 *
 *  客气排布规则（只看「年地支」）：
 *    · 司天之气(三之气) 由年支决定：
 *        子/午 → 少阴君火    丑/未 → 太阴湿土
 *        寅/申 → 少阳相火    卯/酉 → 阳明燥金
 *        辰/戌 → 太阳寒水    巳/亥 → 厥阴风木
 *    · 固定循环顺序：厥阴风木 → 少阴君火 → 太阴湿土 →
 *                    少阳相火 → 阳明燥金 → 太阳寒水
 *    · 把司天放到第 3 步，前推 2 步即得初之气 → 排出 6 步。
 *
 *  客气配色（与主气刻意分离，避免视觉混淆）：
 *    主气用「暖调五行本色」，客气则一律走「冷调深色 + 淡色文字」，
 *    读盘时一眼分得清「主气环 vs 客气环」。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, type MaybeRef } from 'vue'
import PolarCanvas from '../../base/PolarCanvas.vue'
import { arcPath, polarToCartesian, radialTextRotation } from '@/utils/geometry'
import { usePolar } from '@/composables/useRingBase'
import { useQiMenContext } from '@/composables/useQiMenDunJiaContext'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 328,
  innerRadius: 304,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

/** 共享上下文（跨天才变） */
const ctx = useQiMenContext()

/** 极坐标 → 笛卡尔 */
const toXY = usePolar(
  () => props.startDegree,
  () => props.rotationDirection
)

/** 环带径向中线 */
const midRadius = computed(() => (props.radius + props.innerRadius) / 2)

/* ──────────────────────────────────────────────────────────
 *  客气六气配色：冷调深底 + 冷淡浅色文字
 *  刻意与主气环（暖调五行本色）区分，两环叠在一起时一眼可辨。
 * ──────────────────────────────────────────────────────── */
interface KeQiStyle {
  /** 段落背景色 */
  bgColor: string
  /** 标签文字色 */
  labelColor: string
}

const KE_QI_STYLE: Record<string, KeQiStyle> = {
  '厥阴风木': { bgColor: '#0d2a26', labelColor: '#7FDBCA' },
  '少阴君火': { bgColor: '#2a1230', labelColor: '#E8B4E4' },
  '少阳相火': { bgColor: '#2a1a30', labelColor: '#D6B4F5' },
  '太阴湿土': { bgColor: '#1a1a2e', labelColor: '#B9BBE4' },
  '阳明燥金': { bgColor: '#2a2a2e', labelColor: '#E0E4EC' },
  '太阳寒水': { bgColor: '#0a1a30', labelColor: '#8FB4E0' }
}

const FALLBACK_STYLE: KeQiStyle = { bgColor: '#1a1a1a', labelColor: '#CCCCCC' }
function styleFor(name: string): KeQiStyle {
  return KE_QI_STYLE[name] ?? FALLBACK_STYLE
}

/* ──────────────────────────────────────────────────────────
 *  客气六段几何：与主气共用相同的节气边界
 *  · 六段起讫 = 大寒/春分/小满/大暑/秋分/小雪/(下岁大寒)
 *  · 每段的「客气名」由 ctx.keQi[i] 决定
 * ──────────────────────────────────────────────────────── */
const KE_QI_TERM_BOUNDARIES: readonly {
  start: string
  end: string
  order: number
}[] = [
  { start: '大寒', end: '春分', order: 0 }, // 初之气
  { start: '春分', end: '小满', order: 1 }, // 二之气
  { start: '小满', end: '大暑', order: 2 }, // 三之气
  { start: '大暑', end: '秋分', order: 3 }, // 四之气
  { start: '秋分', end: '小雪', order: 4 }, // 五之气
  { start: '小雪', end: '大寒', order: 5 }  // 终之气（跨冬至）
] as const

const KE_QI_ORDER_NAMES = ['初之气', '二之气', '三之气', '四之气', '五之气', '终之气'] as const

interface KeSeg {
  order: number
  orderName: string
  qiName: string             // 客气属性名（如 '少阴君火'）
  startAngle: number         // 环上真实起点角度（含跨环）
  endAngle: number
  span: number
  isCurrent: boolean
  isWinterCross: boolean     // 是否跨过 W1 冬至（即终之气段）
  bgColor: string
  labelColor: string
}

const segments = computed<KeSeg[]>(() => {
  const c = ctx.value
  const termDayInRing = c.termDayInRing
  const today = c.todayInRing
  const keQi = c.keQi
  const results: KeSeg[] = []

  for (const b of KE_QI_TERM_BOUNDARIES) {
    const s = termDayInRing.get(b.start)
    const e = termDayInRing.get(b.end)
    if (s === undefined || e === undefined) continue

    const rawSpan = s < e ? e - s : e + 360 - s
    const delta = ((today - s) % 360 + 360) % 360
    const isCurrent = delta >= 0 && delta < rawSpan
    const qiName = keQi[b.order] ?? '—'
    const style = styleFor(qiName)

    results.push({
      order: b.order,
      orderName: KE_QI_ORDER_NAMES[b.order]!,
      qiName,
      startAngle: s,
      endAngle: s + rawSpan,
      span: rawSpan,
      isCurrent,
      isWinterCross: rawSpan > 30 && s + rawSpan > 360, // 只标记跨环的段
      bgColor: style.bgColor,
      labelColor: style.labelColor
    })
  }
  return results
})

/** 段落填充：整段一个 arcPath（客气无冬至叠加层需求） */
const segmentPaths = computed(() =>
  segments.value.map(seg => {
    const a0 = seg.startAngle + props.startDegree
    const a1 = seg.endAngle + props.startDegree
    return {
      key: `seg-${seg.order}`,
      path: arcPath(props.radius, a0, a1, props.innerRadius, props.rotationDirection),
      fill: seg.bgColor
    }
  })
)

/** 段间径向分隔线（用起点画） */
const boundaryLines = computed(() =>
  segments.value.map(seg => {
    const i = toXY(seg.startAngle, props.innerRadius)
    const o = toXY(seg.startAngle, props.radius)
    return { key: `bd-${seg.order}`, x1: i.x, y1: i.y, x2: o.x, y2: o.y }
  })
)

/** 当前段高亮：金色呼吸边框（仅当今日落在某段内时显示） */
const highlightPath = computed<string | null>(() => {
  const cur = segments.value.find(s => s.isCurrent)
  if (!cur) return null
  const a0 = cur.startAngle + props.startDegree
  const a1 = cur.endAngle + props.startDegree
  return arcPath(props.radius, a0, a1, props.innerRadius, props.rotationDirection)
})

/* ──────────────────────────────────────────────────────────
 *  标签：逐字沿弧线径向分布，中心 = 段几何中点
 *  文字形式：「初客·少阴君火」六字（首两字用「初/二/三/四/五/终 + 客」压缩）
 * ──────────────────────────────────────────────────────── */
interface CharPos { ch: string; x: number; y: number; rot: number }

const CHAR_STEP = computed(() => {
  const arcPerChar = 12
  return (arcPerChar / (2 * Math.PI * midRadius.value)) * 360
})

const KE_QI_SHORT_ORDER = ['初', '二', '三', '四', '五', '终'] as const

function labelChars(seg: KeSeg): CharPos[] {
  const text = `${KE_QI_SHORT_ORDER[seg.order]}客 · ${seg.qiName}`
  const chars = Array.from(text)
  const step = CHAR_STEP.value
  const totalSpan = (chars.length - 1) * step
  const mid = seg.startAngle + seg.span / 2

  return chars.map((ch, i) => {
    const rawAngle = mid - totalSpan / 2 + i * step
    const absAngle = rawAngle + props.startDegree
    const p = polarToCartesian(absAngle, midRadius.value, props.rotationDirection)
    const rot = radialTextRotation(absAngle, props.rotationDirection)
    return { ch, x: p.x, y: p.y, rot }
  })
}
</script>

<template>
  <PolarCanvas :center-x="0" :center-y="0" :rotation-direction="rotationDirection">
    <template #default>
      <g class="qimen-keqi-ring">
        <!-- 段落填充 -->
        <path
          v-for="s in segmentPaths"
          :key="s.key"
          :d="s.path"
          :fill="s.fill"
          opacity="0.92"
        />

        <!-- 内外圆边线 -->
        <circle :cx="0" :cy="0" :r="radius" fill="none" stroke="#555555" stroke-width="0.6" />
        <circle :cx="0" :cy="0" :r="innerRadius" fill="none" stroke="#555555" stroke-width="0.6" />

        <!-- 段间径向分隔线 -->
        <line
          v-for="l in boundaryLines"
          :key="l.key"
          :x1="l.x1"
          :y1="l.y1"
          :x2="l.x2"
          :y2="l.y2"
          stroke="#B0B0B0"
          stroke-width="0.6"
          opacity="0.55"
        />

        <!-- 当前段呼吸高亮 -->
        <path
          v-if="highlightPath"
          class="highlight-seg-strong"
          :d="highlightPath"
          fill="#FFD700"
        />

        <!-- 客气标签：逐字沿弧线分布 -->
        <g v-for="seg in segments" :key="seg.order">
          <text
            v-for="(c, ci) in labelChars(seg)"
            :key="ci"
            :x="c.x"
            :y="c.y"
            :transform="`rotate(${c.rot} ${c.x} ${c.y})`"
            :fill="seg.labelColor"
            :font-size="seg.isCurrent ? 9 : 8"
            :font-weight="seg.isCurrent ? 'bold' : 'normal'"
            text-anchor="middle"
            dominant-baseline="central"
            paint-order="stroke"
            stroke="#000000"
            stroke-width="1.2"
            stroke-opacity="0.55"
          >{{ c.ch }}</text>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.qimen-keqi-ring {
  pointer-events: none;
  transform-origin: center;
  will-change: transform;
  backface-visibility: hidden;
}

.highlight-seg-strong {
  animation: qimen-keqi-breathe 1.6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes qimen-keqi-breathe {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.45; }
}
</style>
