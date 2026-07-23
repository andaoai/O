<script setup lang="ts">
/**
 * 奇门 · 客气环 —— 五运六气之「客气」六步排布（日粒度 + 冬至叠加）
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与主气环完全同构：
 *   · 360 格 × 1° 主层，每格 = 一个具体日期，与外圈六轮甲子日环
 *     严格对齐（0° = 上元甲子日）
 *   · 岁末 overflow 天（含 W2 下一岁冬至）以 overlay 径向切上下两层：
 *       — 外半层：本岁头 overflow+1 天（含 W1）
 *       — 内半层：本岁末 overflow+1 天（含 W2，即下岁冬至）
 *     视觉表达：冬至日同时"结束当岁 + 开始下岁"
 *
 *  客气排布规则（只看「年地支」）：
 *    · 司天之气(三之气) 由年支决定
 *    · 固定循环顺序：厥阴风木 → 少阴君火 → 太阴湿土 →
 *                    少阳相火 → 阳明燥金 → 太阳寒水
 *    · ctx.keQi[0..5] 即为初 / 二 / 三 / 四 / 五 / 终之气客气名
 *
 *  客气配色（与主气一致的五行本色）：
 *    · 五个普通段直接取该客气的五行本色
 *    · 跨冬至段（seg 5）走「紫 → 该客气本色」渐变：
 *        - 紧贴 W1/W2 冬至 → 紫 #5B2C6F
 *        - 远离冬至        → 该客气对应五行本色
 *      —— 冬至日始终为紫，但每年的紫是从不同客气本色渐变来的。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, type MaybeRef } from 'vue'
import { SolarDay } from 'tyme4ts'
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

/** 走 tyme4ts 儒略日整数运算的整日差（抗时区标准化） */
function diffDays(later: Date, earlier: Date): number {
  const a = SolarDay.fromYmd(later.getFullYear(), later.getMonth() + 1, later.getDate())
  const b = SolarDay.fromYmd(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate())
  return a.subtract(b)
}

/** 极坐标 → 笛卡尔 */
const toXY = usePolar(
  () => props.startDegree,
  () => props.rotationDirection
)

/** 环带径向中线（overlay 分层分界） */
const midRadius = computed(() => (props.radius + props.innerRadius) / 2)

/** overlay 索引集 */
const overlaySet = computed<Set<number>>(() => ctx.value.overlaySet)

/* ──────────────────────────────────────────────────────────
 *  六气配色（与主气一致，按「五行属性名」查表）
 *  · 五个普通段 → 直接使用该客气的五行本色
 *  · 跨 W1 冬至段（seg 5，即客气终之气位置）→ 紫 → 该客气本色 渐变：
 *      - 贴近 W1/W2 冬至（dist=0）→ 紫 #5B2C6F
 *      - 远离冬至（dist≥30）→ 该客气对应的五行本色
 *    冬至同时"结束当岁 / 开始下岁"仍以 overlay 上下层表达。
 * ──────────────────────────────────────────────────────── */
interface KeQiStyle {
  bgColor: string
  labelColor: string
}

/** 按五行属性查配色（与主气 QI_LIST 完全一致的暖色五行本色） */
const KE_QI_STYLE: Record<string, KeQiStyle> = {
  '厥阴风木': { bgColor: '#1a3a24', labelColor: '#7ED6A4' },
  '少阴君火': { bgColor: '#3a1a1a', labelColor: '#F5B7B1' },
  '少阳相火': { bgColor: '#3a2410', labelColor: '#FAD7A0' },
  '太阴湿土': { bgColor: '#3a1e0a', labelColor: '#F5CBA7' },
  '阳明燥金': { bgColor: '#3a3010', labelColor: '#F9E79F' },
  '太阳寒水': { bgColor: '#0f2438', labelColor: '#AED6F1' }
}

const FALLBACK_STYLE: KeQiStyle = { bgColor: '#1a1a1a', labelColor: '#CCCCCC' }
function styleFor(name: string): KeQiStyle {
  return KE_QI_STYLE[name] ?? FALLBACK_STYLE
}

/** 冬至端点紫色 */
const COLOR_PURPLE = '#5B2C6F'

/** 十六进制颜色线性插值 */
function lerpHex(a: string, b: string, t: number): string {
  const ah = a.replace('#', '')
  const bh = b.replace('#', '')
  const ar = parseInt(ah.substring(0, 2), 16)
  const ag = parseInt(ah.substring(2, 4), 16)
  const ab = parseInt(ah.substring(4, 6), 16)
  const br = parseInt(bh.substring(0, 2), 16)
  const bg = parseInt(bh.substring(2, 4), 16)
  const bb = parseInt(bh.substring(4, 6), 16)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}

/**
 * 跨冬至段渐变：紫 → 该客气本色
 *   dist = 距最近冬至天数(0..~30) → 归一 t → 从紫插值到本色
 */
function winterGradient(distToWinter: number, targetHex: string): string {
  const t = Math.min(1, Math.max(0, distToWinter / 30))
  const eased = Math.pow(t, 0.85)
  return lerpHex(COLOR_PURPLE, targetHex, eased)
}

const KE_QI_ORDER_NAMES = ['初之气', '二之气', '三之气', '四之气', '五之气', '终之气'] as const
const KE_QI_SHORT_ORDER = ['初', '二', '三', '四', '五', '终'] as const

/* ──────────────────────────────────────────────────────────
 *  段索引查表：与主气段边界完全一致
 *  · [大寒, 春分)   → seg 0 (初之气)
 *  · [春分, 小满)   → seg 1 (二之气)
 *  · [小满, 大暑)   → seg 2 (三之气 = 司天)
 *  · [大暑, 秋分)   → seg 3 (四之气)
 *  · [秋分, 小雪)   → seg 4 (五之气)
 *  · [小雪, 大寒)   → seg 5 (终之气，跨 W1 冬至)
 * ──────────────────────────────────────────────────────── */
const SEG_BOUNDARIES: readonly { seg: number; start: string; end: string }[] = [
  { seg: 0, start: '大寒', end: '春分' },
  { seg: 1, start: '春分', end: '小满' },
  { seg: 2, start: '小满', end: '大暑' },
  { seg: 3, start: '大暑', end: '秋分' },
  { seg: 4, start: '秋分', end: '小雪' },
  { seg: 5, start: '小雪', end: '大寒' }  // 跨 W1
] as const

/**
 * 构造 k(距 W1 天数) → { 段索引, 距最近冬至天数 } 查表。
 * 终之气段 [小雪, 大寒) 跨 W1(k=0) → 拆 [zhongStartK, L) ∪ [0, zhongEndK)
 * distToWinter 仅对跨冬至段有意义（其他段返回 0）。
 */
function buildSegLookup(termDayFromWinter: Map<string, number>, L: number) {
  const segs: Array<{ seg: number; startK: number; endK: number }> = []
  let zhongStartK = 0
  let zhongEndK = 0

  for (const b of SEG_BOUNDARIES) {
    const s = termDayFromWinter.get(b.start)
    const e = termDayFromWinter.get(b.end)
    if (s === undefined || e === undefined) continue
    if (b.seg === 5) {
      zhongStartK = s
      zhongEndK = e
    } else {
      segs.push({ seg: b.seg, startK: s, endK: e })
    }
  }

  return (k: number): { seg: number; distToWinter: number } => {
    if (k >= zhongStartK || k < zhongEndK) {
      // 距最近冬至天数：min(k, L - k)
      const distToWinter = Math.min(k, L - k)
      return { seg: 5, distToWinter }
    }
    for (const seg of segs) {
      if (k >= seg.startK && k < seg.endK) return { seg: seg.seg, distToWinter: 0 }
    }
    return { seg: 5, distToWinter: 0 }
  }
}

/* ──────────────────────────────────────────────────────────
 *  360 格 + overlay 层 cell 构造：与主气环同构
 * ──────────────────────────────────────────────────────── */
interface Cell {
  index: number
  kMain: number
  mainBg: string
  overlay?: {
    kTail: number
    bg: string
  }
}

const cells = computed<Cell[]>(() => {
  const c = ctx.value
  const upperYuan = c.upperYuan
  const winter = c.W1
  const D1 = c.D1
  const L = c.yearLength
  const of = c.overflow
  const overlays = c.overlaySet
  const keQi = c.keQi

  const segLookup = buildSegLookup(c.termDayFromWinter, L)

  function bgFor(k: number): string {
    const info = segLookup(k)
    const qiName = keQi[info.seg] ?? '—'
    const targetBg = styleFor(qiName).bgColor
    if (info.seg === 5) {
      // 跨冬至段：从紫渐变到该客气本色
      return winterGradient(info.distToWinter, targetBg)
    }
    return targetBg
  }

  const arr: Cell[] = []
  for (let i = 0; i < 360; i++) {
    const kMain = ((i - D1) % 360 + 360) % 360
    const cell: Cell = {
      index: i,
      kMain,
      mainBg: bgFor(kMain)
    }
    if (overlays.has(i)) {
      cell.overlay = { kTail: 0, bg: '' }
    }
    arr.push(cell)
  }

  // 后处理 overlay cells 精确 kTail
  const nextWinter = c.W2
  if (nextWinter) {
    const nextSD = SolarDay.fromYmd(
      nextWinter.getFullYear(), nextWinter.getMonth() + 1, nextWinter.getDate()
    )
    for (let step = 0; step < of + 1; step++) {
      const tailSD = step < of ? nextSD.next(-of + step) : nextSD
      const tailDate = new Date(tailSD.getYear(), tailSD.getMonth() - 1, tailSD.getDay())
      const ringIdx = ((diffDays(tailDate, upperYuan) % 360) + 360) % 360
      const kTail = diffDays(tailDate, winter)
      const target = arr[ringIdx]
      if (target && target.overlay) {
        target.overlay.kTail = kTail
        target.overlay.bg = bgFor(kTail)
      }
    }
  }

  return arr
})

/** 主层普通扇形（无 overlay 的 355 格）*/
const mainNormalSectors = computed(() =>
  cells.value
    .filter(c => !c.overlay)
    .map(c => {
      const a0 = c.index + props.startDegree
      const a1 = c.index + 1 + props.startDegree
      return {
        key: c.index,
        path: arcPath(props.radius, a0, a1, props.innerRadius, props.rotationDirection),
        fill: c.mainBg
      }
    })
)

/** overlay 外半层（本岁头，含 W1） */
const overlayOuterSectors = computed(() =>
  cells.value
    .filter(c => !!c.overlay)
    .map(c => {
      const a0 = c.index + props.startDegree
      const a1 = c.index + 1 + props.startDegree
      return {
        key: `oo-${c.index}`,
        path: arcPath(props.radius, a0, a1, midRadius.value, props.rotationDirection),
        fill: c.mainBg
      }
    })
)

/** overlay 内半层（本岁末，含 W2） */
const overlayInnerSectors = computed(() =>
  cells.value
    .filter(c => !!c.overlay)
    .map(c => {
      const a0 = c.index + props.startDegree
      const a1 = c.index + 1 + props.startDegree
      return {
        key: `oi-${c.index}`,
        path: arcPath(midRadius.value, a0, a1, props.innerRadius, props.rotationDirection),
        fill: c.overlay!.bg
      }
    })
)

/** overlay 上下层分隔弧线 */
const overlayMidArc = computed(() => {
  const indices = Array.from(overlaySet.value).sort((a, b) => a - b)
  if (indices.length === 0) return ''
  const runs: { start: number; end: number }[] = []
  let runStart = indices[0]!
  let prev = indices[0]!
  for (let i = 1; i < indices.length; i++) {
    const v = indices[i]!
    if (v !== prev + 1) {
      runs.push({ start: runStart, end: prev + 1 })
      runStart = v
    }
    prev = v
  }
  runs.push({ start: runStart, end: prev + 1 })
  return runs
    .map(r => {
      const s = toXY(r.start, midRadius.value)
      const e = toXY(r.end, midRadius.value)
      const large = r.end - r.start > 180 ? 1 : 0
      const sweep = props.rotationDirection === 'counterclockwise' ? 0 : 1
      return `M ${s.x},${s.y} A ${midRadius.value},${midRadius.value} 0 ${large},${sweep} ${e.x},${e.y}`
    })
    .join(' ')
})

/** 今日格高亮 —— 落在 overlay 时仅高亮所属层 */
const highlightSectors = computed(() => {
  const c = ctx.value
  const now = { index: c.todayInRing, isInOverlayTail: c.isInOverlayTail }
  const inOverlay = overlaySet.value.has(now.index)
  const a0 = now.index + props.startDegree
  const a1 = now.index + 1 + props.startDegree

  if (!inOverlay) {
    return [{
      key: `hl-${now.index}`,
      path: arcPath(props.radius, a0, a1, props.innerRadius, props.rotationDirection)
    }]
  }
  if (now.isInOverlayTail) {
    return [{
      key: `hl-${now.index}`,
      path: arcPath(midRadius.value, a0, a1, props.innerRadius, props.rotationDirection)
    }]
  }
  return [{
    key: `hl-${now.index}`,
    path: arcPath(props.radius, a0, a1, midRadius.value, props.rotationDirection)
  }]
})

/* ──────────────────────────────────────────────────────────
 *  客气六段标签：与主气共用相同的节气边界
 * ──────────────────────────────────────────────────────── */
interface KeSeg {
  seg: number
  orderName: string
  shortOrder: string
  qiName: string
  labelColor: string
  labelArcStart: number
  labelArcEnd: number
  isCurrent: boolean
  boundaryAngle: number
}

const segments = computed<KeSeg[]>(() => {
  const c = ctx.value
  const termDayInRing = c.termDayInRing
  const today = c.todayInRing
  const keQi = c.keQi
  const results: KeSeg[] = []

  for (const b of SEG_BOUNDARIES) {
    const s = termDayInRing.get(b.start)
    const e = termDayInRing.get(b.end)
    if (s === undefined || e === undefined) continue

    const rawSpan = s < e ? e - s : e + 360 - s
    const delta = ((today - s) % 360 + 360) % 360
    const isCurrent = delta >= 0 && delta < rawSpan
    const qiName = keQi[b.seg] ?? '—'
    const style = styleFor(qiName)

    results.push({
      seg: b.seg,
      orderName: KE_QI_ORDER_NAMES[b.seg]!,
      shortOrder: KE_QI_SHORT_ORDER[b.seg]!,
      qiName,
      labelColor: style.labelColor,
      labelArcStart: s,
      labelArcEnd: s + rawSpan,
      isCurrent,
      boundaryAngle: s
    })
  }
  return results
})

/** 段间径向分隔线（与主气 boundary 完全对齐） */
const boundaryLines = computed(() =>
  segments.value.map(seg => {
    const i = toXY(seg.boundaryAngle, props.innerRadius)
    const o = toXY(seg.boundaryAngle, props.radius)
    return { key: `bd-${seg.seg}`, x1: i.x, y1: i.y, x2: o.x, y2: o.y }
  })
)

/* ──────────────────────────────────────────────────────────
 *  标签：逐字沿弧线径向分布
 * ──────────────────────────────────────────────────────── */
interface CharPos { ch: string; x: number; y: number; rot: number }

const CHAR_ANGLE_STEP = computed(() => {
  const arcPerChar = 12
  return (arcPerChar / (2 * Math.PI * midRadius.value)) * 360
})

function labelChars(seg: KeSeg): CharPos[] {
  const text = `${seg.shortOrder}客 · ${seg.qiName}`
  const chars = Array.from(text)
  const step = CHAR_ANGLE_STEP.value
  const totalSpan = (chars.length - 1) * step
  const midRaw = seg.labelArcStart + (seg.labelArcEnd - seg.labelArcStart) / 2

  return chars.map((ch, i) => {
    const rawAngle = midRaw - totalSpan / 2 + i * step
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
        <!-- 主层 355 格 -->
        <path
          v-for="s in mainNormalSectors"
          :key="`mn-${s.key}`"
          :d="s.path"
          :fill="s.fill"
          opacity="0.9"
        />

        <!-- overlay 外半层：本岁头（含 W1）-->
        <path
          v-for="s in overlayOuterSectors"
          :key="s.key"
          :d="s.path"
          :fill="s.fill"
          opacity="0.9"
        />

        <!-- overlay 内半层：本岁末（含 W2）-->
        <path
          v-for="s in overlayInnerSectors"
          :key="s.key"
          :d="s.path"
          :fill="s.fill"
          opacity="0.95"
        />

        <!-- 内外圆边线 -->
        <circle :cx="0" :cy="0" :r="radius" fill="none" stroke="#555555" stroke-width="0.6" />
        <circle :cx="0" :cy="0" :r="innerRadius" fill="none" stroke="#555555" stroke-width="0.6" />

        <!-- overlay 上下层分隔弧 -->
        <path
          v-if="overlayMidArc"
          :d="overlayMidArc"
          fill="none"
          stroke="#B58900"
          stroke-width="0.6"
          stroke-dasharray="1.5 1"
          opacity="0.7"
        />

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

        <!-- 今日格金色高亮 -->
        <path
          v-for="hs in highlightSectors"
          :key="hs.key"
          class="highlight-sector-strong"
          :d="hs.path"
          fill="#FFD700"
        />

        <!-- 客气标签：逐字沿弧线分布 -->
        <g v-for="seg in segments" :key="seg.seg">
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

.highlight-sector-strong {
  animation: qimen-keqi-breathe 1.2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes qimen-keqi-breathe {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.9; }
}
</style>
