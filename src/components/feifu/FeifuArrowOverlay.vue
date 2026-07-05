<script setup lang="ts">
import { ref, computed } from 'vue'
import { JING_FANG_64_GUA, JING_FANG_EIGHT_PALACE_STEP } from '@/data/rings/jingFangEightPalaces'
import {
  computeFeifuArrows,
  getNodePosition,
  PURE_GUA_VALUES,
  type FeifuEntry
} from '@/utils/feifu'
import { getUnicodeHexagram, WENWANG_GUA_BY_VALUE, GUA_STEP, bitReverse6 } from '@/data/sixtyFourGua'
import { radialTextRotation, polarToCartesian } from '@/utils/geometry'
import type { ShiyingType } from '@/data/rings/jingFangEightPalaces'
import type { FeifuLayout } from '@/utils/feifu'

/**
 * 飞伏箭头叠加层
 *   - 64 个卦节点（卦符+卦名，径向竖立），与布局排列对齐
 *   - 64 条有向箭头（飞→伏），伏卦端带箭头标记
 *   - hover 高亮 + 详情面板
 */
interface Props {
  innerRadius: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  startDegree?: number
  shiyingFilter?: ShiyingType[]
  palaceFilter?: string[]
  layout?: FeifuLayout
}

const props = withDefaults(defineProps<Props>(), {
  rotationDirection: 'clockwise',
  startDegree: 0,
  layout: 'houtian'
})

const nodeRadius = computed(() => props.innerRadius * 0.72)
const unicodeFontSize = computed(() => Math.max(14, Math.round(props.innerRadius * 0.055)))
const nameFontSize = computed(() => Math.max(9, Math.round(props.innerRadius * 0.03)))
const TEXT_GAP = 3
const unicodeOffset = computed(() => (unicodeFontSize.value + nameFontSize.value) / 2 + TEXT_GAP)

/** 获取某卦在当前布局下的圆心角（用于文字径向旋转） */
function getGuaAngle(value: number): number {
  const gua = JING_FANG_64_GUA.find(g => g.value === value)
  if (!gua) return 0
  if (props.layout === 'houtian') {
    const FEIFU_PALACE_ORDER = ['乾', '坎', '艮', '震', '坤', '离', '兑', '巽']
    const orderInPalace = gua.jingFangOrder % 8
    const newPalacePos = FEIFU_PALACE_ORDER.indexOf(gua.palace)
    const order = newPalacePos * 8 + orderInPalace
    return (270 + order * JING_FANG_EIGHT_PALACE_STEP + props.startDegree) % 360
  } else {
    const pos = bitReverse6(value)
    return ((pos >= 32 ? 270 + (63 - pos) * GUA_STEP : 270 - (32 - pos) * GUA_STEP) + props.startDegree) % 360
  }
}

/** 64 条飞伏箭头 */
const allArrows = computed(() =>
  computeFeifuArrows(nodeRadius.value, props.startDegree, props.rotationDirection, props.layout)
)

/** 按世位 + 宫位筛选后的箭头 */
const arrows = computed(() => {
  let result = allArrows.value
  if (props.shiyingFilter && props.shiyingFilter.length > 0) {
    result = result.filter(a => props.shiyingFilter!.includes(a.entry.shiyingType))
  }
  if (props.palaceFilter && props.palaceFilter.length > 0) {
    result = result.filter(a => props.palaceFilter!.includes(a.entry.palace))
  }
  return result
})

const activeFeiValues = computed(() => {
  const hasShiying = props.shiyingFilter && props.shiyingFilter.length > 0
  const hasPalace = props.palaceFilter && props.palaceFilter.length > 0
  if (!hasShiying && !hasPalace) return null
  const set = new Set<number>()
  for (const a of arrows.value) {
    set.add(a.entry.feiValue)
    set.add(a.entry.fuValue)
  }
  return set
})

/** 64 个节点（卦符 + 卦名径向堆叠） */
const nodePositions = computed(() =>
  JING_FANG_64_GUA.map(gua => {
    const pos = getNodePosition(gua.value, nodeRadius.value, props.startDegree, props.rotationDirection, props.layout)
    const angle = getGuaAngle(gua.value)
    const rot = radialTextRotation(angle, props.rotationDirection)
    const uniPos = polarToCartesian(angle, nodeRadius.value + unicodeOffset.value / 2, props.rotationDirection)
    const namePos = polarToCartesian(angle, nodeRadius.value - unicodeOffset.value / 2, props.rotationDirection)
    const meta = WENWANG_GUA_BY_VALUE[gua.value]!
    return {
      value: gua.value,
      unicode: getUnicodeHexagram(meta.wenwangOrder),
      name: gua.name,
      uniX: uniPos.x, uniY: uniPos.y,
      nameX: namePos.x, nameY: namePos.y,
      rot, palace: gua.palace, color: gua.color
    }
  })
)

// ─── Hover ───

const hoveredValue = ref<number | null>(null)

const hoveredPair = computed(() => {
  if (hoveredValue.value === null) return null
  return arrows.value.find(
    a => a.entry.feiValue === hoveredValue.value || a.entry.fuValue === hoveredValue.value
  )?.entry ?? null
})

const isHovered = computed(() => hoveredValue.value !== null)

function isArrowMatch(entry: FeifuEntry): boolean {
  if (hoveredValue.value === null) return true
  return entry.feiValue === hoveredValue.value || entry.fuValue === hoveredValue.value
}

function isNodeMatch(value: number): boolean {
  if (hoveredValue.value === null) return true
  return value === hoveredValue.value ||
    arrows.value.some(
      a => (a.entry.feiValue === hoveredValue.value && a.entry.fuValue === value) ||
           (a.entry.fuValue === hoveredValue.value && a.entry.feiValue === value)
    )
}

function isPureGua(value: number): boolean {
  return PURE_GUA_VALUES.includes(value)
}

function isNodeActive(value: number): boolean {
  if (!activeFeiValues.value) return true
  return activeFeiValues.value.has(value)
}
</script>

<template>
  <g class="feifu-overlay">
    <defs>
      <marker id="feifu-arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 Z" fill="#FFD700" />
      </marker>
    </defs>

    <!-- 64 条飞伏箭头 -->
    <line
      v-for="a in arrows"
      :key="`arrow-${a.entry.feiValue}`"
      :x1="a.x1"
      :y1="a.y1"
      :x2="a.x2"
      :y2="a.y2"
      :stroke="a.entry.color"
      :stroke-width="isHovered && !isArrowMatch(a.entry) ? 0.5 : 1.5"
      :opacity="isHovered && !isArrowMatch(a.entry) ? 0.06 : 0.45"
      marker-end="url(#feifu-arrowhead)"
      class="feifu-arrow"
      @mouseenter="hoveredValue = a.entry.feiValue"
      @mouseleave="hoveredValue = null"
    />

    <!-- 64 个卦节点：卦符（外）+ 卦名（内），径向竖立 -->
    <g
      v-for="n in nodePositions"
      :key="`node-${n.value}`"
      @mouseenter="hoveredValue = n.value"
      @mouseleave="hoveredValue = null"
      class="feifu-node"
    >
      <text
        :x="n.uniX"
        :y="n.uniY"
        :fill="!isNodeActive(n.value) ? '#1a1a1a' : (isNodeMatch(n.value) ? (isPureGua(n.value) ? '#66CCFF' : '#FFD700') : '#555')"
        :font-size="unicodeFontSize"
        :font-weight="isNodeMatch(n.value) ? 'bold' : 'normal'"
        text-anchor="middle"
        dominant-baseline="central"
        :opacity="isHovered && !isNodeMatch(n.value) ? 0.08 : (!isNodeActive(n.value) ? 0.04 : (isNodeMatch(n.value) ? 1 : 0.5))"
        :transform="`rotate(${n.rot} ${n.uniX} ${n.uniY})`"
        class="feifu-node-text"
      >
        {{ n.unicode }}
      </text>
      <text
        :x="n.nameX"
        :y="n.nameY"
        :fill="!isNodeActive(n.value) ? '#1a1a1a' : (isNodeMatch(n.value) ? (isPureGua(n.value) ? '#66CCFF' : '#FFD700') : '#555')"
        :font-size="nameFontSize"
        :font-weight="isNodeMatch(n.value) ? 'bold' : 'normal'"
        text-anchor="middle"
        dominant-baseline="central"
        :opacity="isHovered && !isNodeMatch(n.value) ? 0.08 : (!isNodeActive(n.value) ? 0.04 : (isNodeMatch(n.value) ? 1 : 0.5))"
        :transform="`rotate(${n.rot} ${n.nameX} ${n.nameY})`"
        class="feifu-node-text"
      >
        {{ n.name }}
      </text>
    </g>

    <!-- 详情面板 -->
    <g v-if="hoveredPair" class="feifu-detail-g">
      <rect x="-480" y="-560" width="280" height="160" rx="8" fill="rgba(0,0,0,0.85)" stroke="#FFD700" stroke-width="0.6" />
      <text x="-460" y="-540" fill="#FFD700" font-size="14" font-weight="bold">飞伏配对</text>
      <text x="-460" y="-516" fill="#F5E8C8" font-size="12">
        飞卦：<tspan :fill="hoveredPair.color" font-weight="bold">{{ hoveredPair.feiUnicode }} {{ hoveredPair.feiName }}</tspan>
      </text>
      <text x="-460" y="-496" fill="#66CCFF" font-size="12">
        伏卦：<tspan fill="#66CCFF" font-weight="bold">{{ hoveredPair.fuUnicode }} {{ hoveredPair.fuName }}</tspan>
      </text>
      <text x="-460" y="-476" fill="#aaa" font-size="11">所属宫：<tspan :fill="hoveredPair.color">{{ hoveredPair.palace }}</tspan></text>
      <text x="-460" y="-456" fill="#aaa" font-size="11">世位：<tspan fill="#F5E8C8">{{ hoveredPair.shiyingType }}</tspan></text>
      <text x="-460" y="-432" fill="#888" font-size="10" font-style="italic">飞为显、伏为隐。{{ hoveredPair.feiName }}显则{{ hoveredPair.fuName }}隐，阴阳互藏其宅。</text>
    </g>
  </g>
</template>

<style scoped>
.feifu-overlay { pointer-events: none; }
.feifu-arrow { pointer-events: stroke; cursor: pointer; transition: opacity 0.2s ease; }
.feifu-node { pointer-events: all; cursor: pointer; }
.feifu-node-text { transition: opacity 0.2s ease, fill 0.2s ease; }
</style>