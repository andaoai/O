<script setup lang="ts">
/**
 * 奇门 · 农历日期环（自绘 SVG）
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与外层「六轮甲子日环 / 24 节气环」共享 0° 起点（= 上元甲子日）
 *
 *  一环 360 天 = 360°：环第 i 格 = upperYuan + i 天的农历。
 *   · 初一格：显示月名（正月/腊月/闰X月）+ 深色底
 *   · 其余日：显示日号（初一/初二/…/三十）+ 中灰底
 *   · 今日格：金色高亮 + 呼吸
 *
 *  🌗 冬至叠加区（本岁 [D1..D1+4] 5 格）：
 *     一岁 365 天 > 环 360 天 = 多出 5 天，
 *     本岁头 5 天 (W1..W1+4) 与本岁末 5 天 (W2-5..W2-1) 共用同一环位置。
 *     这 5 格径向切分为上下两层：
 *       · 外半层 = 本岁头 5 天（含冬至日本身，金色描边）
 *       · 内半层 = 本岁末 5 天（暗紫色调，表示"上岁绕回来"）
 *
 *  ⚠️ 因为要在特定 5 格径向切一刀，不能走 DataRing/CircleRing 通用扇形，
 *     故与 GuaRing 类似自绘 SVG（PolarCanvas + arcPath + polarToCartesian）。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import { SolarDay } from 'tyme4ts'
import PolarCanvas from '../base/PolarCanvas.vue'
import { arcPath, radialTextRotation } from '@/utils/geometry'
import { usePolar } from '@/composables/useRingBase'
import {
  computeQiMenLunarRing,
  findUpperYuanJiaziDay,
  findLastWinterSolstice,
  getWinterOverlayIndices,
  type LunarRingEntry
} from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 420,
  innerRadius: 396,
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

/** 极坐标 → 笛卡尔（走 useRingBase.usePolar，按 startDegree/rotationDirection 处理） */
const toXY = usePolar(
  () => props.startDegree,
  () => props.rotationDirection
)

/** 环带径向厚度 */
const band = computed(() => props.radius - props.innerRadius)
/** 环带径向中线（划分上下两半的分界） */
const midRadius = computed(() => (props.radius + props.innerRadius) / 2)

/** ⚠️ 范式第二行：所有业务逻辑派生自 timeRef */
const entries = computed<LunarRingEntry[]>(() => computeQiMenLunarRing(timeRef.value))
const overlaySet = computed<Set<number>>(() => new Set(getWinterOverlayIndices(timeRef.value)))

/**
 * 今日在环上的定位。
 *  - index: 环格 0-359（= (D1 + k_today) mod 360）
 *  - isInOverlayTail: 今日是否落在本岁末尾 5 天（k_today ≥ 360）
 *    → 若为 true，冬至叠加区的高亮画在内层；否则画在外层
 */
const todayPos = computed<{ index: number; isInOverlayTail: boolean }>(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const winter = findLastWinterSolstice(now)
  const D1 = ((diffDays(winter, upperYuan) % 360) + 360) % 360
  const kToday = diffDays(now, winter)             // 0..364（本岁天数）
  const index = ((D1 + kToday) % 360 + 360) % 360
  return { index, isInOverlayTail: kToday >= 360 }
})

/** 段填色 + 文字判定（每格 1°） */
interface Cell {
  index: number
  bgColor: string
  labelColor: string
  label: string
  fontSize: number
  highlight: boolean
  overlay?: {
    bgColor: string
    labelColor: string
    label: string
    fontSize: number
  }
}

const cells = computed<Cell[]>(() => {
  const arr = entries.value
  const now = todayPos.value
  const overlays = overlaySet.value

  return arr.map((e): Cell => {
    const isOverlayCell = overlays.has(e.index)
    // 今日金色高亮的归属：
    //   · 环格 = today.index 且 today 在本岁头 360 天 → 主层
    //   · 环格 = today.index 且 today 在本岁末尾 5 天 → overlay 层
    const todayOnMain = e.index === now.index && !now.isInOverlayTail
    const todayOnOverlay = e.index === now.index && now.isInOverlayTail && isOverlayCell

    // 主层文本
    let label: string
    let bgColor: string
    let labelColor: string
    let fontSize: number
    if (e.isMonthFirst) {
      // 初一：显示月名（正月/闰X月/腊月）
      label = e.lunarMonthName
      bgColor = e.isLeapMonthFirst ? '#4A235A' : '#1B4F72'   // 闰月更深紫
      labelColor = e.isLeapMonthFirst ? '#F5B7B1' : '#AED6F1'
      fontSize = 6
    } else {
      // 其余：日号（初一/初二/…/三十）
      label = e.lunarDayName
      bgColor = '#1a1a1a'
      labelColor = '#7F8C8D'
      fontSize = 5
    }
    if (todayOnMain) {
      // 今日格（落在主层）：金底黑字
      bgColor = '#FFD700'
      labelColor = '#1a1a1a'
      fontSize = e.isMonthFirst ? 7 : 6
    }

    const cell: Cell = {
      index: e.index,
      bgColor,
      labelColor,
      label,
      fontSize,
      highlight: todayOnMain || todayOnOverlay
    }

    // 叠加层：本岁末 5 天（W1+360..W1+364）
    if (isOverlayCell && e.overlay) {
      const o = e.overlay
      let ol_label: string
      let ol_bgColor: string
      let ol_labelColor: string
      let ol_fontSize: number
      if (o.isMonthFirst) {
        ol_label = o.lunarMonthName
        ol_bgColor = o.isLeapMonthFirst ? '#5B2C6F' : '#5B2C6F'  // 暗紫
        ol_labelColor = o.isLeapMonthFirst ? '#F5B7B1' : '#F5D0FA'
        ol_fontSize = 6
      } else {
        ol_label = o.lunarDayName
        ol_bgColor = '#2C1F3A'                                    // 暗紫底
        ol_labelColor = '#B39DDB'
        ol_fontSize = 5
      }
      if (todayOnOverlay) {
        // 今日格（落在 overlay 层）：金底黑字
        ol_bgColor = '#FFD700'
        ol_labelColor = '#1a1a1a'
        ol_fontSize = o.isMonthFirst ? 7 : 6
      }
      cell.overlay = {
        bgColor: ol_bgColor,
        labelColor: ol_labelColor,
        label: ol_label,
        fontSize: ol_fontSize
      }
    }

    return cell
  })
})

/**
 * 分离出「普通格」与「叠加格」：
 *  - 普通格：整段填色 [innerRadius, radius]
 *  - 叠加格：拆两层
 *     · 外层 [midRadius, radius]   → 主层（本岁头 5 天）
 *     · 内层 [innerRadius, midRadius] → 叠加（本岁末 5 天）
 */
const normalSectors = computed(() =>
  cells.value
    .filter(c => !c.overlay)
    .map(c => {
      const a0 = c.index + props.startDegree
      const a1 = c.index + 1 + props.startDegree
      return {
        key: c.index,
        path: arcPath(props.radius, a0, a1, props.innerRadius, props.rotationDirection),
        fill: c.bgColor,
        highlight: c.highlight
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
        key: `ov-out-${c.index}`,
        path: arcPath(props.radius, a0, a1, midRadius.value, props.rotationDirection),
        fill: c.bgColor,
        highlight: c.highlight
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
        key: `ov-in-${c.index}`,
        path: arcPath(midRadius.value, a0, a1, props.innerRadius, props.rotationDirection),
        fill: c.overlay!.bgColor
      }
    })
)

/** 中间分隔弧（仅叠加区 5 格），画一条中线让上下两层视觉可辨 */
const overlayMidArc = computed(() => {
  const indices = Array.from(overlaySet.value).sort((a, b) => a - b)
  if (indices.length === 0) return ''
  // 连续 5 格通常是 [D1..D1+4]，但可能跨环回卷；简单起见分段画
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

/** 每格的分隔刻度线（从内圆到外圆） */
const ticks = computed(() =>
  cells.value.map(c => {
    const i = toXY(c.index, props.innerRadius)
    const o = toXY(c.index, props.radius)
    return { key: c.index, x1: i.x, y1: i.y, x2: o.x, y2: o.y }
  })
)

/** 主层文字位置 —— 无 overlay 用环带中线，有 overlay 用外半层中线 */
interface LabelSpec {
  key: string
  x: number
  y: number
  rot: number
  text: string
  color: string
  fontSize: number
}

const normalLabels = computed<LabelSpec[]>(() =>
  cells.value
    .filter(c => !c.overlay && c.label)
    .map(c => {
      const mid = c.index + 0.5
      const r = (props.radius + props.innerRadius) / 2
      const p = toXY(mid, r)
      return {
        key: `n-${c.index}`,
        x: p.x,
        y: p.y,
        rot: radialTextRotation(mid + props.startDegree, props.rotationDirection),
        text: c.label,
        color: c.labelColor,
        fontSize: c.fontSize
      }
    })
)

const overlayOuterLabels = computed<LabelSpec[]>(() =>
  cells.value
    .filter(c => !!c.overlay && c.label)
    .map(c => {
      const mid = c.index + 0.5
      const r = (props.radius + midRadius.value) / 2
      const p = toXY(mid, r)
      return {
        key: `oo-${c.index}`,
        x: p.x,
        y: p.y,
        rot: radialTextRotation(mid + props.startDegree, props.rotationDirection),
        text: c.label,
        color: c.labelColor,
        fontSize: c.fontSize
      }
    })
)

const overlayInnerLabels = computed<LabelSpec[]>(() =>
  cells.value
    .filter(c => !!c.overlay && !!c.overlay!.label)
    .map(c => {
      const mid = c.index + 0.5
      const r = (props.innerRadius + midRadius.value) / 2
      const p = toXY(mid, r)
      return {
        key: `oi-${c.index}`,
        x: p.x,
        y: p.y,
        rot: radialTextRotation(mid + props.startDegree, props.rotationDirection),
        text: c.overlay!.label,
        color: c.overlay!.labelColor,
        fontSize: c.overlay!.fontSize
      }
    })
)

/** 今日格高亮扇形（呼吸） */
const highlightSectors = computed(() =>
  cells.value
    .filter(c => c.highlight)
    .map(c => {
      // 今日在冬至叠加区时，只高亮它实际所在那一层：
      //   · isInOverlayTail = false → 今日属于本岁头 5 天 → 只高亮外层
      //   · isInOverlayTail = true  → 今日属于本岁末 5 天 → 只高亮内层
      // 其他 355 格无 overlay，整段高亮。
      const now = todayPos.value
      const inOverlayCell = overlaySet.value.has(c.index)
      let inner = props.innerRadius
      let outer = props.radius
      if (inOverlayCell) {
        if (now.isInOverlayTail) {
          outer = midRadius.value             // 内层：[innerRadius, midRadius]
        } else {
          inner = midRadius.value             // 外层：[midRadius, radius]
        }
      }
      const fill = inOverlayCell && now.isInOverlayTail
        ? c.overlay!.bgColor
        : c.bgColor
      const a0 = c.index + props.startDegree
      const a1 = c.index + 1 + props.startDegree
      return {
        key: `hl-${c.index}`,
        path: arcPath(outer, a0, a1, inner, props.rotationDirection),
        fill
      }
    })
)
</script>

<template>
  <PolarCanvas :center-x="0" :center-y="0" :rotation-direction="rotationDirection">
    <template #default>
      <g class="qimen-lunar-ring">
        <!-- 普通格背景 -->
        <path
          v-for="s in normalSectors"
          :key="`n-${s.key}`"
          :d="s.path"
          :fill="s.fill"
          opacity="0.85"
        />

        <!-- 叠加区外半层背景（本岁头 5 天） -->
        <path
          v-for="s in overlayOuterSectors"
          :key="s.key"
          :d="s.path"
          :fill="s.fill"
          opacity="0.9"
        />

        <!-- 叠加区内半层背景（本岁末 5 天） -->
        <path
          v-for="s in overlayInnerSectors"
          :key="s.key"
          :d="s.path"
          :fill="s.fill"
          opacity="0.9"
        />

        <!-- 内外圆边线 -->
        <circle :cx="0" :cy="0" :r="radius" fill="none" stroke="#555555" stroke-width="0.6" />
        <circle :cx="0" :cy="0" :r="innerRadius" fill="none" stroke="#555555" stroke-width="0.6" />

        <!-- 叠加区上下两层分隔弧（金色暗线，视觉可辨） -->
        <path
          v-if="overlayMidArc"
          :d="overlayMidArc"
          fill="none"
          stroke="#B58900"
          stroke-width="0.6"
          stroke-dasharray="1.5 1"
          opacity="0.7"
        />

        <!-- 分隔刻度线（细，避免与文字干扰） -->
        <line
          v-for="t in ticks"
          :key="`tk-${t.key}`"
          :x1="t.x1"
          :y1="t.y1"
          :x2="t.x2"
          :y2="t.y2"
          stroke="#333333"
          stroke-width="0.2"
        />

        <!-- 主层文字（普通格）—— 两/三字竖排 -->
        <g
          v-for="l in normalLabels"
          :key="l.key"
          :transform="`rotate(${l.rot} ${l.x} ${l.y})`"
        >
          <template v-if="l.text.length === 2">
            <text
              :x="l.x"
              :y="l.y - 5"
              :fill="l.color"
              :font-size="l.fontSize"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[0] }}</text>
            <text
              :x="l.x"
              :y="l.y + 5"
              :fill="l.color"
              :font-size="l.fontSize"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[1] }}</text>
          </template>
          <template v-else-if="l.text.length === 3">
            <text
              :x="l.x"
              :y="l.y - 8"
              :fill="l.color"
              :font-size="l.fontSize - 1"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[0] }}</text>
            <text
              :x="l.x"
              :y="l.y"
              :fill="l.color"
              :font-size="l.fontSize - 1"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[1] }}</text>
            <text
              :x="l.x"
              :y="l.y + 8"
              :fill="l.color"
              :font-size="l.fontSize - 1"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[2] }}</text>
          </template>
          <text
            v-else
            :x="l.x"
            :y="l.y"
            :fill="l.color"
            :font-size="l.fontSize - 1"
            text-anchor="middle"
            dominant-baseline="central"
            font-weight="bold"
          >{{ l.text }}</text>
        </g>

        <!-- 叠加外层文字（本岁头 5 天）—— 两/三字竖排，紧凑间距 -->
        <g
          v-for="l in overlayOuterLabels"
          :key="l.key"
          :transform="`rotate(${l.rot} ${l.x} ${l.y})`"
        >
          <template v-if="l.text.length === 2">
            <text
              :x="l.x"
              :y="l.y - 3"
              :fill="l.color"
              :font-size="l.fontSize - 1"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[0] }}</text>
            <text
              :x="l.x"
              :y="l.y + 3"
              :fill="l.color"
              :font-size="l.fontSize - 1"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[1] }}</text>
          </template>
          <template v-else-if="l.text.length === 3">
            <text
              :x="l.x"
              :y="l.y - 5"
              :fill="l.color"
              :font-size="l.fontSize - 2"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[0] }}</text>
            <text
              :x="l.x"
              :y="l.y"
              :fill="l.color"
              :font-size="l.fontSize - 2"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[1] }}</text>
            <text
              :x="l.x"
              :y="l.y + 5"
              :fill="l.color"
              :font-size="l.fontSize - 2"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[2] }}</text>
          </template>
          <text
            v-else
            :x="l.x"
            :y="l.y"
            :fill="l.color"
            :font-size="l.fontSize - 2"
            text-anchor="middle"
            dominant-baseline="central"
            font-weight="bold"
          >{{ l.text }}</text>
        </g>

        <!-- 叠加内层文字（本岁末 5 天）—— 两/三字竖排，紧凑间距 -->
        <g
          v-for="l in overlayInnerLabels"
          :key="l.key"
          :transform="`rotate(${l.rot} ${l.x} ${l.y})`"
        >
          <template v-if="l.text.length === 2">
            <text
              :x="l.x"
              :y="l.y - 3"
              :fill="l.color"
              :font-size="l.fontSize - 1"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[0] }}</text>
            <text
              :x="l.x"
              :y="l.y + 3"
              :fill="l.color"
              :font-size="l.fontSize - 1"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[1] }}</text>
          </template>
          <template v-else-if="l.text.length === 3">
            <text
              :x="l.x"
              :y="l.y - 5"
              :fill="l.color"
              :font-size="l.fontSize - 2"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[0] }}</text>
            <text
              :x="l.x"
              :y="l.y"
              :fill="l.color"
              :font-size="l.fontSize - 2"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[1] }}</text>
            <text
              :x="l.x"
              :y="l.y + 5"
              :fill="l.color"
              :font-size="l.fontSize - 2"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >{{ l.text[2] }}</text>
          </template>
          <text
            v-else
            :x="l.x"
            :y="l.y"
            :fill="l.color"
            :font-size="l.fontSize - 2"
            text-anchor="middle"
            dominant-baseline="central"
            font-weight="bold"
          >{{ l.text }}</text>
        </g>

        <!-- 今日格呼吸高亮 -->
        <path
          v-for="hs in highlightSectors"
          :key="hs.key"
          class="highlight-sector-strong"
          :d="hs.path"
          :fill="hs.fill"
        />
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.qimen-lunar-ring {
  transform-origin: center;
  will-change: transform;
  backface-visibility: hidden;
}

.highlight-sector-strong {
  animation: qimen-lunar-breathe 1.2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes qimen-lunar-breathe {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.85; }
}
</style>
