<script setup lang="ts">
/**
 * 奇门 · 五运六气环 —— 一年六气（厥阴风木 / 少阴君火 / 少阳相火 /
 *                                     太阴湿土 / 阳明燥金 / 太阳寒水）
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与外层「六轮甲子日环 / 24 节气环 / 农历日期环」共享 0° 起点
 *
 *  五运六气学说：一年分六气，每气 60 天 = 4 个 15 天节气段
 *    · 初之气 · 厥阴风木：大寒 → 立春 → 雨水 → 惊蛰（止于春分前）
 *    · 二之气 · 少阴君火：春分 → 清明 → 谷雨 → 立夏（止于小满前）
 *    · 三之气 · 少阳相火：小满 → 芒种 → 夏至 → 小暑（止于大暑前）
 *    · 四之气 · 太阴湿土：大暑 → 立秋 → 处暑 → 白露（止于秋分前）
 *    · 五之气 · 阳明燥金：秋分 → 寒露 → 霜降 → 立冬（止于小雪前）
 *    · 终之气 · 太阳寒水：小雪 → 大雪 → 冬至 → 小寒（止于大寒前，跨年）
 *
 *  🎨 六气背景配色（新版）：
 *     · 五个「普通」气(初/二/三/四/五) → 各自暗色调背景（五行本色）
 *     · 终之气「太阳寒水」 → 紫→蓝→紫渐变
 *       - 靠近 W1（当岁冬至）最紫 `#5B2C6F`
 *       - 靠近 W2（下一岁冬至，在 overlay 层）最紫 `#5B2C6F`
 *       - 远离冬至（小雪 / 大寒端）渐变到蓝 `#1B4F72`
 *     视觉上呈现"冬紫夏（无覆盖）"的对比,只有跨年 60 天寒水段带渐变。
 *
 *  ✨ 逐格高亮：整环拆成 360 格 × 1° + 岁末 overflow 格 overlay（径向切分）
 *     · 与农历环完全同构，几何轴系一致，跨盘对读不错位
 *     · 只有今日那一格金色呼吸高亮
 *     · 其他格子只显示背景渐变，无网格线 → 视觉上"整片渐变合并"
 *
 *  🌗 冬至叠加区（末 overflow+1 格）：
 *     一岁 365 天 > 环 360 天 = 溢出 5-6 天，
 *     溢出天与本岁头相同环位置，径向切分为上下两层：
 *       · 外半层 = 本岁头（含 W1 冬至）
 *       · 内半层 = 本岁末（含 W2 冬至）
 *
 *  🏷️ 六气标签逐字沿弧线径向分布，标签中心 = 六气几何中点
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import { SolarDay } from 'tyme4ts'
import PolarCanvas from '../../base/PolarCanvas.vue'
import { arcPath, polarToCartesian, radialTextRotation } from '@/utils/geometry'
import { usePolar } from '@/composables/useRingBase'
import {
  computeQiMenSolarTerms,
  findUpperYuanJiaziDay,
  findLastWinterSolstice,
  findNextWinterSolstice,
  getWinterOverlayIndices
} from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 356,
  innerRadius: 332,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

/** ⚠️ 范式第一行：统一转换为响应式 timeRef */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 走 tyme4ts 儒略日整数运算的整日差（抗时区标准化） */
function diffDays(later: Date, earlier: Date): number {
  const a = SolarDay.fromYmd(later.getFullYear(), later.getMonth() + 1, later.getDate())
  const b = SolarDay.fromYmd(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate())
  return a.subtract(b)
}

/** 极坐标 → 笛卡尔（走 useRingBase.usePolar） */
const toXY = usePolar(
  () => props.startDegree,
  () => props.rotationDirection
)

/** 环带径向中线（划分上下两半的分界） */
const midRadius = computed(() => (props.radius + props.innerRadius) / 2)

/** 本岁实际年长（365 或 366 天） */
const yearLength = computed<number>(() => {
  const now = timeRef.value
  const winter = findLastWinterSolstice(now)
  const next = findNextWinterSolstice(winter)
  if (!next) return 365
  return diffDays(next, winter)
})

/** overflow = 岁末溢出天数（一般 5 或 6） */
const overflow = computed<number>(() => yearLength.value - 360)

/** 冬至叠加区 (末 overflow+1 格) 索引集 */
const overlaySet = computed<Set<number>>(() => new Set(getWinterOverlayIndices(timeRef.value)))

/** 六气定义（起讫节气用真实公历日期，与农历环、24 节气环严格同源） */
interface QiDef {
  key: number
  name: string
  attr: string
  startTermName: string
  endTermName: string
  /** 段内格子的默认背景色（仅普通五气使用；终之气走渐变，忽略此值） */
  bgColor: string
  /** 六气标签文字色 */
  labelColor: string
  /** 是否走「紫→蓝→紫」冬至渐变（仅终之气 = true） */
  isWinterQi?: boolean
}

const QI_LIST: readonly QiDef[] = [
  { key: 1, name: '初之气', attr: '厥阴风木', startTermName: '大寒', endTermName: '春分',
    bgColor: '#1a3a24', labelColor: '#7ED6A4' },
  { key: 2, name: '二之气', attr: '少阴君火', startTermName: '春分', endTermName: '小满',
    bgColor: '#3a1a1a', labelColor: '#F5B7B1' },
  { key: 3, name: '三之气', attr: '少阳相火', startTermName: '小满', endTermName: '大暑',
    bgColor: '#3a2410', labelColor: '#FAD7A0' },
  { key: 4, name: '四之气', attr: '太阴湿土', startTermName: '大暑', endTermName: '秋分',
    bgColor: '#3a1e0a', labelColor: '#F5CBA7' },
  { key: 5, name: '五之气', attr: '阳明燥金', startTermName: '秋分', endTermName: '小雪',
    bgColor: '#3a3010', labelColor: '#F9E79F' },
  { key: 6, name: '终之气', attr: '太阳寒水', startTermName: '小雪', endTermName: '大寒',
    bgColor: '#0f2438', labelColor: '#AED6F1', isWinterQi: true }
] as const

/**
 * 十六进制颜色线性插值：t=0 返回 a，t=1 返回 b。
 */
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

/** 渐变端点：紫（贴近冬至端）、蓝（远离冬至端） */
const COLOR_PURPLE = '#5B2C6F'
const COLOR_BLUE = '#1B4F72'

/**
 * 终之气「紫→蓝→紫」渐变:
 *   仅用于终之气段(小雪 → 大寒,跨过 W1 冬至,含 overlay W2 段)。
 *
 *   distToWinter = 距最近冬至的天数(取 W1 与 W2 中较近的)
 *   一岁中「距离最近冬至」的最大天数出现在 [芒种,夏至] 附近 ≈ 180 天
 *   → 但终之气只覆盖 60 天左右,dist 最大在段中点(≈ 30 天)
 *
 *   规则:dist = 0(冬至日本身) → 最紫;dist 越大 → 越蓝
 *   段最深天数约 30 天,用它作归一分母:t = clamp(dist / 30, 0, 1)
 */
function zhongQiGradient(distToWinter: number): string {
  const t = Math.min(1, Math.max(0, distToWinter / 30))
  const eased = Math.pow(t, 0.85)
  return lerpHex(COLOR_PURPLE, COLOR_BLUE, eased)
}

/**
 * 今日在环上的定位。
 *  - index: 环格 0-359（= (D1 + k_today) mod 360）
 *  - isInOverlayTail: 今日是否落在本岁末尾 overflow 天（k_today ≥ 360，含 W2）
 */
const todayPos = computed<{ index: number; kToday: number; isInOverlayTail: boolean }>(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const winter = findLastWinterSolstice(now)
  const D1 = ((diffDays(winter, upperYuan) % 360) + 360) % 360
  const kToday = diffDays(now, winter)             // 0..364/365（本岁天数）
  const index = ((D1 + kToday) % 360 + 360) % 360
  return { index, kToday, isInOverlayTail: kToday >= 360 }
})

/**
 * 主层 360 格：每格对应岁内第 k=(i−D1) mod 360 天。
 * 每格 1°，按所属气决定背景：
 *   · 终之气 → 紫→蓝→紫渐变（贴近 W1/W2 冬至越紫）
 *   · 其他五气 → qi.bgColor 各自暗色调
 */
interface Cell {
  index: number
  kMain: number                   // 主层 daysFromYearStart（0..359）
  mainBg: string                  // 主层背景色
  overlay?: {
    kTail: number                 // overlay daysFromYearStart（yearLength-overflow..yearLength）
    bg: string
  }
}

/**
 * 按 k 判定所属气 —— 返回 { qi, distToWinter }。
 * distToWinter 只在终之气段内有意义（距离最近冬至的天数）。
 *
 * 用节气 daysFromWinter 表构造气边界:
 *   yearTerms[0] = W1 冬至 (k=0), 后面依次小寒/大寒/…/小雪 (~k=335)
 *   六气边界 = 该气 startTermName 的 daysFromWinter
 *   终之气 [小雪, W1] ∪ [W1, 大寒) —— 跨过 W1
 */
function buildQiLookup(termDayFromWinter: Map<string, number>, L: number) {
  // 五气的 [startK, endK) 段 —— 不跨 W1
  const segs: Array<{ qi: QiDef; startK: number; endK: number }> = []
  let zhongQiStartK = 0 // 小雪 daysFromWinter (环末)
  let zhongQiEndK = 0   // 大寒 daysFromWinter (环头,W1 之后)

  for (const qi of QI_LIST) {
    const s = termDayFromWinter.get(qi.startTermName)
    const e = termDayFromWinter.get(qi.endTermName)
    if (s === undefined || e === undefined) continue
    if (qi.isWinterQi) {
      zhongQiStartK = s          // 小雪
      zhongQiEndK = e            // 大寒
    } else {
      segs.push({ qi, startK: s, endK: e })
    }
  }

  return (k: number): { qi: QiDef; distToWinter: number } | null => {
    // 优先判定终之气:k 在 [zhongQiStartK, L) 或 [0, zhongQiEndK) 内
    const inWinterTailOfYear = k >= zhongQiStartK
    const inWinterHeadOfYear = k < zhongQiEndK
    if (inWinterTailOfYear || inWinterHeadOfYear) {
      const zhongQi = QI_LIST.find(q => q.isWinterQi)!
      // 距最近冬至的天数: min(k, L - k)
      //   k 靠近 0 → 距 W1 近; k 靠近 L → 距 W2 近
      const distToWinter = Math.min(k, L - k)
      return { qi: zhongQi, distToWinter }
    }
    // 五个普通气
    for (const seg of segs) {
      if (k >= seg.startK && k < seg.endK) {
        return { qi: seg.qi, distToWinter: 0 }
      }
    }
    return null
  }
}

const cells = computed<Cell[]>(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const winter = findLastWinterSolstice(now)
  const D1 = ((diffDays(winter, upperYuan) % 360) + 360) % 360
  const L = yearLength.value
  const of = overflow.value
  const overlays = overlaySet.value

  // 节气名 → daysFromWinter,用于 buildQiLookup
  const terms = computeQiMenSolarTerms(now)
  const yearTerms = terms.filter(t => !t.isNextWinter)
  const termDayFromWinter = new Map<string, number>()
  for (const t of yearTerms) {
    const d = diffDays(t.date, winter)
    if (!termDayFromWinter.has(t.name)) termDayFromWinter.set(t.name, d)
  }
  const qiForK = buildQiLookup(termDayFromWinter, L)

  function bgFor(k: number): string {
    const info = qiForK(k)
    if (!info) return '#1a1a1a'
    if (info.qi.isWinterQi) return zhongQiGradient(info.distToWinter)
    return info.qi.bgColor
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
      cell.overlay = { kTail: 0, bg: '' }   // 占位,后续精确填
    }
    arr.push(cell)
  }

  // 后处理:为每个 overlay cell 精确计算 kTail 与背景色
  const nextWinter = findNextWinterSolstice(winter)
  if (nextWinter) {
    const nextSD = SolarDay.fromYmd(
      nextWinter.getFullYear(), nextWinter.getMonth() + 1, nextWinter.getDate()
    )
    for (let step = 0; step < of + 1; step++) {
      const tailSD = step < of ? nextSD.next(-of + step) : nextSD
      const tailDate = new Date(tailSD.getYear(), tailSD.getMonth() - 1, tailSD.getDay())
      const ringIdx = ((diffDays(tailDate, upperYuan) % 360) + 360) % 360
      const kTail = diffDays(tailDate, winter)  // L-of..L
      const target = arr[ringIdx]
      if (target && target.overlay) {
        target.overlay.kTail = kTail
        target.overlay.bg = bgFor(kTail)
      }
    }
  }

  return arr
})

/** 主层普通扇形（无 overlay 的 355 格 —— 主层背景占满整个环带） */
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

/** overlay 外半层（主层：本岁头 overflow+1 天，含 W1 及紧邻的 4-5 天）*/
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

/** overlay 内半层（本岁末 overflow+1 天，含 W2） */
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

/** overlay 区上下层分隔弧线 */
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

/** 今日格高亮（金色呼吸）—— 若落在 overlay，仅高亮所属那一层 */
const highlightSectors = computed(() => {
  const now = todayPos.value
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
    // 今日在岁末溢出天 → 只高亮内半层
    return [{
      key: `hl-${now.index}`,
      path: arcPath(midRadius.value, a0, a1, props.innerRadius, props.rotationDirection)
    }]
  }
  // 今日在岁首头几天 → 只高亮外半层
  return [{
    key: `hl-${now.index}`,
    path: arcPath(props.radius, a0, a1, midRadius.value, props.rotationDirection)
  }]
})

/**
 * 六气几何：从真实节气日期派生 arc 起讫。
 * 只保留一段（不需要"跨冬至拆两段"—— 终之气跨环起点走 arcPath 允许 end > 360 即可）。
 */
interface Qi6 {
  qi: QiDef
  labelArcStart: number
  labelArcEnd: number
  isCurrent: boolean
  /** 六气段间分隔弧：起点角度（用于画气与气之间的细线） */
  boundaryAngle: number
}

const qiList = computed<Qi6[]>(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const terms = computeQiMenSolarTerms(now)
  const yearTerms = terms.filter(t => !t.isNextWinter)

  // 节气名 → 真实 dayInRing 索引
  const termDayInRing = new Map<string, number>()
  for (const t of yearTerms) {
    const realIdx = ((diffDays(t.date, upperYuan) % 360) + 360) % 360
    if (!termDayInRing.has(t.name)) termDayInRing.set(t.name, realIdx)
  }

  const today = ((diffDays(now, upperYuan) % 360) + 360) % 360
  const results: Qi6[] = []

  for (const qi of QI_LIST) {
    const start = termDayInRing.get(qi.startTermName)
    const end = termDayInRing.get(qi.endTermName)
    if (start === undefined || end === undefined) continue

    const rawSpan = start < end ? end - start : end + 360 - start
    const delta = ((today - start) % 360 + 360) % 360
    const isCurrent = delta >= 0 && delta < rawSpan

    results.push({
      qi,
      labelArcStart: start,
      labelArcEnd: start + rawSpan,
      isCurrent,
      boundaryAngle: start
    })
  }
  return results
})

/**
 * 逐字沿弧线均匀分布 —— 与旧实现一致。
 */
interface CharPos {
  ch: string
  x: number
  y: number
  rot: number
}

const CHAR_ANGLE_STEP = computed(() => {
  const arcPerChar = 12
  return (arcPerChar / (2 * Math.PI * midRadius.value)) * 360
})

function labelChars(q: Qi6): CharPos[] {
  const text = `${q.qi.name} · ${q.qi.attr}`
  const chars = Array.from(text)
  const step = CHAR_ANGLE_STEP.value
  const totalSpan = (chars.length - 1) * step
  const midRaw = q.labelArcStart + (q.labelArcEnd - q.labelArcStart) / 2

  return chars.map((ch, i) => {
    const rawAngle = midRaw - totalSpan / 2 + i * step
    const absAngle = rawAngle + props.startDegree
    const p = polarToCartesian(absAngle, midRadius.value, props.rotationDirection)
    const rot = radialTextRotation(absAngle, props.rotationDirection)
    return { ch, x: p.x, y: p.y, rot }
  })
}

/** 六气段间的径向分隔线（用起始节气角度画） */
const boundaryLines = computed(() =>
  qiList.value.map(q => {
    const i = toXY(q.boundaryAngle, props.innerRadius)
    const o = toXY(q.boundaryAngle, props.radius)
    return { key: `bd-${q.qi.key}`, x1: i.x, y1: i.y, x2: o.x, y2: o.y }
  })
)
</script>

<template>
  <PolarCanvas :center-x="0" :center-y="0" :rotation-direction="rotationDirection">
    <template #default>
      <g class="qimen-liuqi-ring">
        <!-- 主层：无 overlay 的 355 格背景（紫→蓝→紫渐变）-->
        <path
          v-for="s in mainNormalSectors"
          :key="`mn-${s.key}`"
          :d="s.path"
          :fill="s.fill"
          opacity="0.9"
        />

        <!-- overlay 外半层：本岁头 overflow+1 天 -->
        <path
          v-for="s in overlayOuterSectors"
          :key="s.key"
          :d="s.path"
          :fill="s.fill"
          opacity="0.9"
        />

        <!-- overlay 内半层：本岁末 overflow+1 天（含 W2）-->
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

        <!-- 六气段间分隔线（跨内外圆）-->
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

        <!-- 今日格金色高亮（呼吸）-->
        <path
          v-for="hs in highlightSectors"
          :key="hs.key"
          class="highlight-sector-strong"
          :d="hs.path"
          fill="#FFD700"
        />

        <!-- 六气标签：逐字沿弧线均匀分布 -->
        <g v-for="q in qiList" :key="q.qi.key">
          <text
            v-for="(c, ci) in labelChars(q)"
            :key="ci"
            :x="c.x"
            :y="c.y"
            :transform="`rotate(${c.rot} ${c.x} ${c.y})`"
            :fill="q.qi.labelColor"
            :font-size="q.isCurrent ? 9 : 8"
            :font-weight="q.isCurrent ? 'bold' : 'normal'"
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
.qimen-liuqi-ring {
  pointer-events: none;
  transform-origin: center;
  will-change: transform;
  backface-visibility: hidden;
}

.highlight-sector-strong {
  animation: qimen-liuqi-breathe 1.2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes qimen-liuqi-breathe {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.9; }
}
</style>
