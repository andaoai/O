<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from '../base/PolarCanvas.vue'
import { polarToCartesian as polarUtil, arcPath as arcPathUtil, radialTextRotation } from '@/utils/geometry'
import { getUnicodeHexagram, WENWANG_GUA_BY_VALUE } from '@/data/sixtyFourGua'
import { JING_FANG_64_GUA, JING_FANG_EIGHT_PALACE_STEP } from '@/data/rings/jingFangEightPalaces'

/**
 * 京房八宫六十四卦环
 *
 * 与外圈 GuaRing 使用同一 64 卦、同一 5.625° 步长，但**排列顺序完全不同**：
 *   外圈 GuaRing 走先天伏羲圆图序（按二进制位反转，乾南坤北）；
 *   本环走京房八宫序（乾宫8卦 → 坎宫8卦 → 艮宫8卦 → 震宫8卦 → 巽宫8卦 → 离宫8卦 → 坤宫8卦 → 兑宫8卦），
 *   每宫内按「本宫→一世→二世→三世→四世→五世→游魂→归魂」的变爻规则排列。
 *
 * 【与外圈对齐的角度约定】
 *   jingFangOrder=0（乾宫·乾）居顶部（centerAngle=270°），其后顺时针铺展。
 *   这样：外圈先天乾（顶部）与内圈京房乾（顶部）对齐，肉眼可直接对照两种排列。
 *
 * 【视觉三层】
 *   1. 8 色宫属淡背景（宫内 8 卦同色），代替先天环的阴阳两仪淡背景
 *   2. 分隔刻度（64 条）
 *   3. 卦符 + 卦名（径向从外到内）
 */
interface Props {
  /** 外半径 */
  radius: number
  /** 内半径 */
  innerRadius?: number
  /** 旋转方向（RingStack 注入） */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 起始角度偏移，jingFangOrder=0 的中心角相对 270° 再加此值 */
  startDegree?: number
  /** 卦符字号 */
  unicodeFontSize?: number
  /** 卦名字号 */
  nameFontSize?: number
  /** 圆环边线颜色 */
  circleColor?: string
  /** 卦符颜色 */
  unicodeColor?: string
  /** 卦名颜色 */
  nameColor?: string
  /** 宫属淡背景透明度 */
  palaceTintOpacity?: number
}

const props = withDefaults(defineProps<Props>(), {
  innerRadius: undefined,
  rotationDirection: 'clockwise',
  startDegree: 0,
  unicodeFontSize: 18,
  nameFontSize: 9,
  circleColor: '#888888',
  unicodeColor: '#F5E8C8',
  nameColor: '#C8B88A',
  palaceTintOpacity: 0.22
})

/** 实际内半径：视图/RingStack 传入则用之；否则按字号自动算 */
const resolvedInnerRadius = computed(() => {
  if (props.innerRadius !== undefined) return props.innerRadius
  const pad = 12
  return props.radius - (props.unicodeFontSize + props.nameFontSize + pad)
})

const band = computed(() => props.radius - resolvedInnerRadius.value)
const midRadius = computed(() => (props.radius + resolvedInnerRadius.value) / 2)

// 卦符（外）+ 卦名（内），组合几何居中于环带中线
const TEXT_GAP = 3
const unicodeRadius = computed(() => {
  const u = props.unicodeFontSize
  const n = props.nameFontSize
  const d = (u + n) / 2 + TEXT_GAP
  return midRadius.value + (n - u) / 4 + d / 2
})
const nameRadius = computed(() => {
  const u = props.unicodeFontSize
  const n = props.nameFontSize
  const d = (u + n) / 2 + TEXT_GAP
  return midRadius.value + (n - u) / 4 - d / 2
})

/** jingFangOrder → 圆心角（SVG 空间）。让 order=0 居顶（270°），顺时针铺开 */
const centerAngleOf = (order: number) =>
  (270 + order * JING_FANG_EIGHT_PALACE_STEP + props.startDegree) % 360

/** 极坐标 → 笛卡尔 */
const polarToCartesian = (angle: number, radius: number) =>
  polarUtil(angle, radius, props.rotationDirection)

/** 环形扇形 path */
const arcPath = (rOuter: number, rInner: number, startAngle: number, endAngle: number) =>
  arcPathUtil(rOuter, startAngle, endAngle, rInner, props.rotationDirection)

/** 文字径向旋转（顶部指向圆心） */
const textRotationOf = (midAngle: number) => radialTextRotation(midAngle, props.rotationDirection)

/** 每卦渲染就绪数据 */
const rendered = computed(() =>
  JING_FANG_64_GUA.map(gua => {
    const centerAngle = centerAngleOf(gua.jingFangOrder)
    const startAngle = centerAngle - JING_FANG_EIGHT_PALACE_STEP / 2
    const endAngle = centerAngle + JING_FANG_EIGHT_PALACE_STEP / 2
    const meta = WENWANG_GUA_BY_VALUE[gua.value]!
    const unicode = getUnicodeHexagram(meta.wenwangOrder)
    return { gua, centerAngle, startAngle, endAngle, unicode }
  })
)

/** 宫属淡背景扇形（每卦一个，同宫 8 卦同色） */
const palaceSectors = computed(() =>
  rendered.value.map(r => ({
    key: r.gua.jingFangOrder,
    fill: r.gua.color,
    path: arcPath(props.radius, resolvedInnerRadius.value, r.startAngle, r.endAngle)
  }))
)

/** 64 条分隔刻度线 */
const ticks = computed(() =>
  rendered.value.map(r => {
    const i = polarToCartesian(r.startAngle, resolvedInnerRadius.value)
    const o = polarToCartesian(r.startAngle, props.radius)
    return { key: r.gua.jingFangOrder, x1: i.x, y1: i.y, x2: o.x, y2: o.y }
  })
)

/** 卦符标签 */
const unicodeLabels = computed(() =>
  rendered.value.map(r => {
    const p = polarToCartesian(r.centerAngle, unicodeRadius.value)
    return { key: r.gua.jingFangOrder, char: r.unicode, x: p.x, y: p.y, rot: textRotationOf(r.centerAngle) }
  })
)

/** 卦名标签 */
const nameLabels = computed(() =>
  rendered.value.map(r => {
    const p = polarToCartesian(r.centerAngle, nameRadius.value)
    return { key: r.gua.jingFangOrder, name: r.gua.name, x: p.x, y: p.y, rot: textRotationOf(r.centerAngle) }
  })
)

/** 8 条宫界粗刻度（每宫首格起始边），加强宫的视觉分组 */
const palaceBoundaries = computed(() =>
  rendered.value
    .filter(r => r.gua.jingFangOrder % 8 === 0)
    .map(r => {
      const i = polarToCartesian(r.startAngle, resolvedInnerRadius.value)
      const o = polarToCartesian(r.startAngle, props.radius)
      return { key: r.gua.palace, x1: i.x, y1: i.y, x2: o.x, y2: o.y, color: r.gua.color }
    })
)
</script>

<template>
  <PolarCanvas :center-x="0" :center-y="0" :rotation-direction="rotationDirection">
    <template #default>
      <g class="jingfang-eight-palace-ring">
        <!-- 宫属淡背景（宫内 8 卦同色） -->
        <path
          v-for="s in palaceSectors"
          :key="`palace-${s.key}`"
          :d="s.path"
          :fill="s.fill"
          :opacity="palaceTintOpacity"
        />

        <!-- 内外圆边线 -->
        <circle :cx="0" :cy="0" :r="radius" fill="none" :stroke="circleColor" :stroke-width="1" />
        <circle :cx="0" :cy="0" :r="resolvedInnerRadius" fill="none" :stroke="circleColor" :stroke-width="1" />

        <!-- 64 条分隔刻度（细） -->
        <line
          v-for="t in ticks"
          :key="`tick-${t.key}`"
          :x1="t.x1"
          :y1="t.y1"
          :x2="t.x2"
          :y2="t.y2"
          :stroke="circleColor"
          :stroke-width="0.5"
        />

        <!-- 8 条宫界（粗，用宫属色） -->
        <line
          v-for="b in palaceBoundaries"
          :key="`boundary-${b.key}`"
          :x1="b.x1"
          :y1="b.y1"
          :x2="b.x2"
          :y2="b.y2"
          :stroke="b.color"
          stroke-width="1.6"
          opacity="0.85"
        />

        <!-- 卦符 -->
        <text
          v-for="u in unicodeLabels"
          :key="`uni-${u.key}`"
          :x="u.x"
          :y="u.y"
          :fill="unicodeColor"
          :font-size="unicodeFontSize"
          text-anchor="middle"
          dominant-baseline="central"
          :transform="`rotate(${u.rot} ${u.x} ${u.y})`"
        >
          {{ u.char }}
        </text>

        <!-- 卦名 -->
        <text
          v-for="n in nameLabels"
          :key="`name-${n.key}`"
          :x="n.x"
          :y="n.y"
          :fill="nameColor"
          :font-size="nameFontSize"
          text-anchor="middle"
          dominant-baseline="central"
          font-weight="bold"
          :transform="`rotate(${n.rot} ${n.x} ${n.y})`"
        >
          {{ n.name }}
        </text>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.jingfang-eight-palace-ring {
  transform-origin: center;
  will-change: transform;
  backface-visibility: hidden;
}
</style>
