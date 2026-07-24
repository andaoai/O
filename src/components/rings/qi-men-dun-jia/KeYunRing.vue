<script setup lang="ts">
/**
 * 奇门 · 客运环 —— 五运六气之「客运」五步排布（日粒度 + 冬至叠加）
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与主运环同构：段边界完全一致（大寒起 5 段 × 72°）
 *
 *  客运规则：
 *    · 初运 = 岁运（天干化运结果）
 *    · 后 4 步按木→火→土→金→水相生顺序循环，太少交替相生
 *
 *  颜色沿用主气/客气/主运的五行本色，跨 W1 段走「紫 → 本色」渐变。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, type MaybeRef } from 'vue'
import { SolarDay } from 'tyme4ts'
import PolarCanvas from '../../base/PolarCanvas.vue'
import { arcPath, polarToCartesian, radialTextRotation } from '@/utils/geometry'
import { usePolar } from '@/composables/useRingBase'
import { useQiMenContext } from '@/composables/useQiMenDunJiaContext'
import type { WuYunStep } from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 232,
  innerRadius: 208,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const ctx = useQiMenContext()

function diffDays(later: Date, earlier: Date): number {
  const a = SolarDay.fromYmd(later.getFullYear(), later.getMonth() + 1, later.getDate())
  const b = SolarDay.fromYmd(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate())
  return a.subtract(b)
}

const toXY = usePolar(
  () => props.startDegree,
  () => props.rotationDirection
)

const midRadius = computed(() => (props.radius + props.innerRadius) / 2)
const overlaySet = computed<Set<number>>(() => ctx.value.overlaySet)

/* ──────────────────────────────────────────────────────────
 *  五音配色（与主运环共用同一套）
 * ──────────────────────────────────────────────────────── */
interface WuYinStyle {
  bgTai: string
  bgShao: string
  labelColor: string
}

const WU_YIN_STYLE: Record<string, WuYinStyle> = {
  '角': { bgTai: '#1a3a24', bgShao: '#122a19', labelColor: '#7ED6A4' },
  '徵': { bgTai: '#3a1a1a', bgShao: '#2a1212', labelColor: '#F5B7B1' },
  '宫': { bgTai: '#3a1e0a', bgShao: '#2a1608', labelColor: '#F5CBA7' },
  '商': { bgTai: '#3a3010', bgShao: '#2a220b', labelColor: '#F9E79F' },
  '羽': { bgTai: '#0f2438', bgShao: '#0a1a29', labelColor: '#AED6F1' }
}

const FALLBACK: WuYinStyle = { bgTai: '#1a1a1a', bgShao: '#0f0f0f', labelColor: '#CCCCCC' }
function styleFor(step: WuYunStep): { bg: string; labelColor: string } {
  const s = WU_YIN_STYLE[step.yin] ?? FALLBACK
  return {
    bg: step.polarity === '太' ? s.bgTai : s.bgShao,
    labelColor: s.labelColor
  }
}

const COLOR_PURPLE = '#5B2C6F'

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

function winterGradient(distToWinter: number, targetHex: string): string {
  const t = Math.min(1, Math.max(0, distToWinter / 30))
  const eased = Math.pow(t, 0.85)
  return lerpHex(COLOR_PURPLE, targetHex, eased)
}

/* ──────────────────────────────────────────────────────────
 *  五运段边界：大寒起，每段 72°（= 主层 72 天）
 *  · 主层 360 格，多出的 5-6 天走 overlay 独立处理，不并入五段
 *  · seg 4（终运）跨 W1 冬至 → 走紫渐变
 *
 *  ⚠️ 段边界须与「标签角度」严格同源，两处都用 72°，否则错位。
 * ──────────────────────────────────────────────────────── */
interface SegRange {
  seg: number
  step: WuYunStep
  startK: number
  endK: number
}

const RUN_LEN = 72

function buildSegRanges(daHanK: number, steps: WuYunStep[]): SegRange[] {
  const ranges: SegRange[] = []
  for (let i = 0; i < 5; i++) {
    ranges.push({
      seg: i,
      step: steps[i]!,
      startK: daHanK + i * RUN_LEN,
      endK: daHanK + (i + 1) * RUN_LEN
    })
  }
  return ranges
}

function distToNearestWinter(k: number, L: number): number {
  return Math.min(k, L - k)
}

function segLookup(k: number, ranges: SegRange[], L: number): { seg: number; distToWinter: number } {
  for (const r of ranges) {
    const kNorm = ((k % 360) + 360) % 360
    if (r.endK <= 360) {
      if (kNorm >= r.startK && kNorm < r.endK) {
        return { seg: r.seg, distToWinter: distToNearestWinter(k, L) }
      }
    } else {
      const wrapEnd = r.endK - 360
      if ((kNorm >= r.startK && kNorm < 360) || (kNorm >= 0 && kNorm < wrapEnd)) {
        return { seg: r.seg, distToWinter: distToNearestWinter(k, L) }
      }
    }
  }
  return { seg: 4, distToWinter: distToNearestWinter(k, L) }
}

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
  const keYun = c.keYun

  const daHanK = c.termDayFromWinter.get('大寒') ?? 30
  const ranges = buildSegRanges(daHanK, keYun)

  function bgFor(k: number): string {
    const info = segLookup(k, ranges, L)
    const step = keYun[info.seg]
    if (!step) return '#1a1a1a'
    const { bg } = styleFor(step)
    if (info.seg === 4) return winterGradient(info.distToWinter, bg)
    return bg
  }

  const arr: Cell[] = []
  for (let i = 0; i < 360; i++) {
    const kMain = ((i - D1) % 360 + 360) % 360
    const cell: Cell = { index: i, kMain, mainBg: bgFor(kMain) }
    if (overlays.has(i)) cell.overlay = { kTail: 0, bg: '' }
    arr.push(cell)
  }

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

interface Seg {
  seg: number
  step: WuYunStep
  labelColor: string
  labelArcStart: number
  labelArcEnd: number
  isCurrent: boolean
  boundaryAngle: number
}

const segments = computed<Seg[]>(() => {
  const c = ctx.value
  const daHanRing = c.termDayInRing.get('大寒')
  if (daHanRing === undefined) return []

  const runArc = RUN_LEN // 每运严格 72°，与颜色 buildSegRanges 同源
  const today = c.todayInRing
  const results: Seg[] = []

  for (let i = 0; i < 5; i++) {
    const start = (daHanRing + i * runArc) % 360
    const end = start + runArc
    const delta = ((today - start) % 360 + 360) % 360
    const isCurrent = delta >= 0 && delta < runArc
    const step = c.keYun[i]!
    const { labelColor } = styleFor(step)
    results.push({
      seg: i,
      step,
      labelColor,
      labelArcStart: start,
      labelArcEnd: end,
      isCurrent,
      boundaryAngle: start
    })
  }
  return results
})

const boundaryLines = computed(() =>
  segments.value.map(seg => {
    const i = toXY(seg.boundaryAngle, props.innerRadius)
    const o = toXY(seg.boundaryAngle, props.radius)
    return { key: `bd-${seg.seg}`, x1: i.x, y1: i.y, x2: o.x, y2: o.y }
  })
)

interface CharPos { ch: string; x: number; y: number; rot: number }

const CHAR_ANGLE_STEP = computed(() => {
  const arcPerChar = 12
  return (arcPerChar / (2 * Math.PI * midRadius.value)) * 360
})

const SEG_SHORT = ['初', '二', '三', '四', '终'] as const

function labelChars(seg: Seg): CharPos[] {
  const text = `${SEG_SHORT[seg.seg]}客 · ${seg.step.fullName}`
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
      <g class="qimen-keyun-ring">
        <path
          v-for="s in mainNormalSectors"
          :key="`mn-${s.key}`"
          :d="s.path"
          :fill="s.fill"
          opacity="0.9"
        />

        <path
          v-for="s in overlayOuterSectors"
          :key="s.key"
          :d="s.path"
          :fill="s.fill"
          opacity="0.9"
        />

        <path
          v-for="s in overlayInnerSectors"
          :key="s.key"
          :d="s.path"
          :fill="s.fill"
          opacity="0.95"
        />

        <circle :cx="0" :cy="0" :r="radius" fill="none" stroke="#555555" stroke-width="0.6" />
        <circle :cx="0" :cy="0" :r="innerRadius" fill="none" stroke="#555555" stroke-width="0.6" />

        <path
          v-if="overlayMidArc"
          :d="overlayMidArc"
          fill="none"
          stroke="#B58900"
          stroke-width="0.6"
          stroke-dasharray="1.5 1"
          opacity="0.7"
        />

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

        <path
          v-for="hs in highlightSectors"
          :key="hs.key"
          class="highlight-sector-strong"
          :d="hs.path"
          fill="#FFD700"
        />

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
.qimen-keyun-ring {
  pointer-events: none;
  transform-origin: center;
  will-change: transform;
  backface-visibility: hidden;
}

.highlight-sector-strong {
  animation: qimen-keyun-breathe 1.2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes qimen-keyun-breathe {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.9; }
}
</style>
