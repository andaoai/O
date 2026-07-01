<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import PolarCanvas from '../base/PolarCanvas.vue'
import {
  normalizeAngle,
  polarToCartesian,
  radialTextRotation
} from '@/utils/geometry'
import { getDayOfYear, isGregorianLeapYear } from '@/utils/chineseCalendar'
import {
  isWaxing,
  moonAge,
  moonIllumination,
  moonPhaseAngle,
  moonPhaseName
} from '@/utils/moonPhase'

/**
 * 月亮月相变化环（专用 SVG 图形环）
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed。
 *
 * 环内每一格对应公历一天，全年 365 / 366 天均分 360°，与外层 DayScaleRing
 * (originMode='jan1') 和 SolarTermsPointRing (originMode='jan1') 1:1 对齐：
 *   angle = (dayOfYear - 1) / daysInYear * 360
 *
 * 🌙 只显示「当天」这一格的月相符号，其余日期留空。
 * 拖动控制面板时间时，月牙符号沿环移动到对应日期，形状随日月黄经差变化。
 *
 * 视觉：
 *   - 月牙 path：亮面比例 k = (1 - cos D) / 2，盈月朝右 / 亏月朝左
 *   - 金色描边 + 金色 halo + 呼吸动画
 *   - 符号 + halo + 描边严格收敛在环带内，不越界压到相邻环
 *   - 悬停查看相位名 / 月龄 / 亮面百分比（<title> tooltip）
 *
 * 本组件不复用 DataPointRing，因为 PointRing 只支持 circle / tick，
 * 无法表达亮面比例和朝向动态变化的月牙 path。
 */

interface Props {
  /** 时间源，支持 ref 或 plain Date */
  time?: MaybeRef<Date>
  /** 环外半径，由 RingStack 注入 */
  radius?: number
  /** 环内半径，由 RingStack 注入 */
  innerRadius?: number
  /** 起始角度偏移 */
  startDegree?: number
  /** 旋转方向，由 RingStack 注入 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 440,
  innerRadius: 418,
  startDegree: 0,
  rotationDirection: 'clockwise'
})

/* ─── 范式：唯一响应式时间源 ─────────────────────── */
const timeRef = computed(() => unref(props.time) ?? new Date())

const bandWidth = computed(() => props.radius - props.innerRadius)

/** 月牙符号在环带内的径向位置（环带正中，左右留白对称） */
const trackRadius = computed(() => props.innerRadius + bandWidth.value * 0.5)

/**
 * 当日月牙符号半径 —— 自动收敛在环带内，保证符号 + halo（+3）+ 描边
 * 都不会溢出内缘 / 外缘去压到相邻环。
 *
 *   可用半宽 = bandWidth / 2
 *   预留 halo(3) + stroke(1) + safety(0.5) = 4.5
 *   → symbolRadius ≤ bandWidth / 2 - 4.5
 */
const symbolRadius = computed(() => {
  const half = bandWidth.value / 2
  const maxR = Math.max(2, half - 4.5)
  return Math.min(7.5, maxR)
})

/** 文字字号 —— 让文字高度与月牙直径相近，自然协调 */
const labelFontSize = computed(() => {
  const target = symbolRadius.value * 1.4
  return Math.max(6, Math.min(11, target))
})

/**
 * 估算标签像素宽度：
 *   中文字符宽度 ≈ fontSize，ASCII 字符宽度 ≈ fontSize × 0.55
 * 标签形如「望 · 月龄15.0」，混合中英文，取平均系数 0.75。
 */
function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.75
}

/**
 * 文字锚点（中心）相对符号中心的切线角度偏移：
 *   偏移距离 = symbolRadius + halo(3) + 半个文字宽度 + 视觉间隙(2)
 *
 * text-anchor="middle" 时，锚点就是文字中心。这样：
 *   - 文字整体沿切线延伸，两端对称
 *   - 旋转角度 = 文字中心位置的切线方向，与文字自身对齐
 *   - 右端距月牙 halo 边缘 = 视觉间隙(2)，物理上不重叠
 */
function computeTextOffsetDeg(labelText: string): number {
  const arcPerDeg = (trackRadius.value * Math.PI) / 180
  const halfTextWidth = estimateTextWidth(labelText, labelFontSize.value) / 2
  const pixelOffset = symbolRadius.value + 3 + halfTextWidth + 2
  return pixelOffset / arcPerDeg
}

/* ─── SVG 月牙 path 算法 ─────────────────────────
 * 外弧：月盘外缘半圆（半径 r）
 * 内弧：明暗边界椭圆弧，横半径 rx = r * |1 - 2k|
 *   k = 0    朔  → 用完整圆轮廓（fillOpacity 低）
 *   k = 0.5  弦月 → rx ≈ 0，明暗边界为直线
 *   k = 1    望  → 完整实心圆
 * waxing 决定外弧走右侧（sweep=1）或左侧（sweep=0）
 */
function moonCrescentPath(
  illumination: number,
  waxing: boolean,
  r: number
): string {
  const k = Math.max(0, Math.min(1, illumination))
  const EPS = 0.015

  if (k <= EPS || k >= 1 - EPS) {
    return [`M ${-r},0`, `A ${r},${r} 0 1,0 ${r},0`, `A ${r},${r} 0 1,0 ${-r},0`, 'Z'].join(' ')
  }

  const rx = Math.max(0.01, r * Math.abs(1 - 2 * k))
  const outerSweep = waxing ? 1 : 0
  const terminatorSweep = waxing ? (k < 0.5 ? 0 : 1) : (k < 0.5 ? 1 : 0)

  return [
    `M 0,${-r}`,
    `A ${r},${r} 0 0,${outerSweep} 0,${r}`,
    `A ${rx},${r} 0 0,${terminatorSweep} 0,${-r}`,
    'Z'
  ].join(' ')
}

/* ─── 当日月相 ───────────────────────────────── */
const todayPhase = computed(() => {
  const now = timeRef.value
  const year = now.getFullYear()
  const daysInYear = isGregorianLeapYear(year) ? 366 : 365
  const dayOfYear = getDayOfYear(now)

  const angle = ((dayOfYear - 1) / daysInYear) * 360
  const renderAngle = normalizeAngle(angle + props.startDegree)

  const phaseAngle = moonPhaseAngle(now)
  const illumination = moonIllumination(now)
  const waxing = isWaxing(phaseAngle)
  const age = moonAge(now)
  const phaseName = moonPhaseName(phaseAngle)

  const r = symbolRadius.value
  const pos = polarToCartesian(renderAngle, trackRadius.value, props.rotationDirection)

  // 文字沿切线放在符号「后面」（角度更小 = 逆着时间流方向）
  // 锚点是文字中心，偏移量包含半个文字宽度，让整条文字落在符号后方
  const labelText = `${phaseName} · 月龄${age.toFixed(1)}`
  const textOffsetDeg = computeTextOffsetDeg(labelText)
  const textAngle = normalizeAngle(renderAngle - textOffsetDeg)
  const textPos = polarToCartesian(textAngle, trackRadius.value, props.rotationDirection)

  return {
    dayOfYear,
    angle,
    renderAngle,
    phaseAngle,
    illumination,
    waxing,
    age,
    phaseName,
    x: pos.x,
    y: pos.y,
    textX: textPos.x,
    textY: textPos.y,
    // 旋转按文字中心位置的切线方向计算 —— 与文字自身对齐
    textRotation: radialTextRotation(textAngle, props.rotationDirection),
    labelText,
    path: moonCrescentPath(illumination, waxing, r),
    symbolRadius: r,
    fillOpacity: illumination <= 0.015 ? 0.15 : 1
  }
})
</script>

<template>
  <PolarCanvas :center-x="0" :center-y="0" :rotation-direction="rotationDirection">
    <template #default>
      <g class="moon-phase-ring">
        <!-- 环外圈参考线 -->
        <circle :r="radius" fill="none" stroke="#333333" stroke-width="0.5" />
        <!-- 环内圈参考线 -->
        <circle :r="innerRadius" fill="none" stroke="#333333" stroke-width="0.5" />

        <!-- 当日月相符号 -->
        <g
          class="moon-phase-item"
          :transform="`translate(${todayPhase.x}, ${todayPhase.y})`"
        >
          <!-- 金色 halo -->
          <circle
            :r="todayPhase.symbolRadius + 3"
            fill="none"
            stroke="#FFD700"
            stroke-width="0.9"
            class="moon-phase-today-halo"
          />

          <!-- 月牙 path -->
          <path
            :d="todayPhase.path"
            fill="#DDE6F0"
            :fill-opacity="todayPhase.fillOpacity"
            stroke="#FFD700"
            stroke-width="1.1"
            class="moon-phase-today"
          />

          <title>
            {{ todayPhase.phaseName }} 月龄{{ todayPhase.age.toFixed(1) }}天 亮面{{
              Math.round(todayPhase.illumination * 100)
            }}%
          </title>
        </g>

        <!-- 当日月相标签（锚点=文字中心，落在符号切线后方，旋转按文字中心切线角） -->
        <text
          :x="todayPhase.textX"
          :y="todayPhase.textY"
          fill="#FFD700"
          :font-size="labelFontSize"
          text-anchor="middle"
          dominant-baseline="middle"
          font-weight="bold"
          :transform="`rotate(${todayPhase.textRotation} ${todayPhase.textX} ${todayPhase.textY})`"
          class="moon-phase-label"
        >
          {{ todayPhase.labelText }}
        </text>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.moon-phase-ring {
  transform-origin: center;
  will-change: transform;
  backface-visibility: hidden;
}

.moon-phase-today {
  animation: moon-phase-breathe 1.4s ease-in-out infinite;
}

.moon-phase-today-halo {
  animation: moon-phase-halo 1.4s ease-in-out infinite;
}

.moon-phase-label {
  pointer-events: none;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  paint-order: stroke;
  stroke: #000;
  stroke-width: 2.2;
  stroke-linejoin: round;
}

@keyframes moon-phase-breathe {
  0%,
  100% {
    opacity: 0.85;
    filter: drop-shadow(0 0 3px #FFD700);
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 0 8px #FFD700);
  }
}

@keyframes moon-phase-halo {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.95;
  }
}
</style>
