<script setup lang="ts">
/**
 * GuaRelationCenter — 卦关系箭矢圆心组件
 *
 * 渲染 64 条从源卦→目标卦的有向箭头，支持五种关系类型：
 *   飞伏 / 互卦 / 对卦 / 综卦 / 交卦
 * 通过 relationType prop 动态切换。
 *
 * 支持 hover 交互：悬停箭头/节点高亮关联配对，显示详情面板。
 * 支持自环（综卦不变卦）：sourceValue === targetValue 时渲染小圆环标记。
 *
 * ⚠️ 圆心组件：只有 radius，无 innerRadius
 */
import { inject, computed } from 'vue'
import { GUA_RELATION_KEY, type GuaRelationInteraction } from '@/composables/useGuaRelationInteraction'
import { computeRelationTable, getGuaAngle, getArrowColor, RELATION_METAS, type GuaRelationType, type GuaRelationEntry } from '@/utils/guaRelations'
import { polarToCartesian } from '@/utils/geometry'

interface Props {
  /** 圆心区域半径（由 RingStack #center slot 注入） */
  radius: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  startDegree?: number
  layout?: 'jingfang' | 'xiantian'
  /** 卦关系类型（默认飞伏） */
  relationType?: GuaRelationType
}

const props = withDefaults(defineProps<Props>(), {
  rotationDirection: 'clockwise',
  startDegree: 0,
  layout: 'jingfang',
  relationType: 'feifu',
})

// ─── 注入交互状态 ───

const interaction = inject(GUA_RELATION_KEY)!

// ─── 箭头计算 ───

/** 箭头节点的布局圆半径 */
const arrowRadius = computed(() => props.radius * 0.93)

/** 当前关系类型元数据 */
const relationMeta = computed(() => RELATION_METAS[props.relationType])

/** 根据当前关系类型计算完整的 64 条关系 */
const currentTable = computed(() => computeRelationTable(props.relationType))

/** 一条箭头的渲染数据 */
interface ArrowRenderItem {
  entry: ReturnType<typeof computeRelationTable>[number]
  x1: number
  y1: number
  x2: number
  y2: number
  isSelfLoop: boolean
  arrowColor: string
  strokeOpacity: number
  strokeWidth: number
  showMarker: boolean
  circleOpacity: number
}

/**
 * 全部箭头的笛卡尔坐标 + 样式
 *
 * 使用泛型关系表（而非固定的 FEIFU_TABLE）：
 *  - sourceValue → targetValue 即为箭头方向
 *  - 角度通过 getGuaAngle 按当前布局（京房/先天）计算
 *  - 自环（sourceValue === targetValue）用 circleMarker 渲染
 */
const arrows = computed<ArrowRenderItem[]>(() => {
  const isHov = interaction.isHovered.value

  return currentTable.value.map(entry => {
    const sourceAngle = getGuaAngle(entry.sourceValue, props.layout, props.startDegree)
    const targetAngle = getGuaAngle(entry.targetValue, props.layout, props.startDegree)
    const from = polarToCartesian(sourceAngle, arrowRadius.value, props.rotationDirection)
    const to = polarToCartesian(targetAngle, arrowRadius.value, props.rotationDirection)

    const match = interaction.isArrowMatch(entry)
    const active = interaction.isEntryFiltered(entry.sourceValue, entry.targetValue)
    const isSelfLoop = entry.sourceValue === entry.targetValue
    const arrowColor = getArrowColor(entry)

    let strokeOpacity: number
    let strokeWidth: number
    let showMarker: boolean
    let circleOpacity: number

    if (!active) {
      strokeOpacity = 0.04
      strokeWidth = 0.5
      showMarker = false
      circleOpacity = 0
    } else if (isHov && !match) {
      strokeOpacity = 0.06
      strokeWidth = 0.5
      showMarker = false
      circleOpacity = 0
    } else if (isSelfLoop) {
      // 自环 → 不画箭头，画小圆环
      strokeOpacity = 0
      strokeWidth = 0
      showMarker = false
      circleOpacity = isHov && match ? 0.8 : 0.4
    } else {
      strokeOpacity = 0.45
      strokeWidth = 1.5
      showMarker = true
      circleOpacity = 0
    }

    return { entry, x1: from.x, y1: from.y, x2: to.x, y2: to.y, isSelfLoop, arrowColor, strokeOpacity, strokeWidth, showMarker, circleOpacity }
  })
})

/** 自环子集（综卦不变卦） */
const selfLoopArrows = computed(() => arrows.value.filter(a => a.isSelfLoop))

// ─── 详情面板 ───

const hoveredPair = computed(() => {
  if (interaction.hoveredValue.value === null) return null
  return currentTable.value.find(
    e => e.sourceValue === interaction.hoveredValue.value || e.targetValue === interaction.hoveredValue.value,
  ) ?? null
})

function onArrowEnter(value: number) {
  interaction.setHovered(value)
}

function onArrowLeave() {
  interaction.setHovered(null)
}
</script>

<template>
  <g class="gua-relation-center">
    <!-- 箭头标记 -->
    <defs>
      <marker
        id="gua-relation-arrowhead"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 Z" fill="#FFD700" />
      </marker>
    </defs>

    <!-- 64 条有向箭头（不含自环） -->
    <line
      v-for="a in arrows"
      :key="`arrow-${a.entry.sourceValue}`"
      v-show="!a.isSelfLoop"
      :x1="a.x1"
      :y1="a.y1"
      :x2="a.x2"
      :y2="a.y2"
      :stroke="a.arrowColor"
      :stroke-width="a.strokeWidth"
      :opacity="a.strokeOpacity"
      :marker-end="a.showMarker ? 'url(#gua-relation-arrowhead)' : undefined"
      class="gua-relation-arrow"
      @mouseenter="onArrowEnter(a.entry.sourceValue)"
      @mouseleave="onArrowLeave"
    />

    <!-- 自环标记：小圆环（综卦不变卦：sourceValue === targetValue） -->
    <circle
      v-for="a in selfLoopArrows"
      :key="`loop-${a.entry.sourceValue}`"
      :cx="a.x1"
      :cy="a.y1"
      :r="8"
      :fill="a.arrowColor"
      :opacity="a.circleOpacity"
      class="gua-relation-self-loop"
      @mouseenter="onArrowEnter(a.entry.sourceValue)"
      @mouseleave="onArrowLeave"
    />
    <text
      v-for="a in selfLoopArrows"
      :key="`loop-label-${a.entry.sourceValue}`"
      :x="a.x1"
      :y="a.y1"
      fill="#FFD700"
      font-size="10"
      text-anchor="middle"
      dominant-baseline="central"
      opacity="0.3"
      class="gua-relation-self-loop-label"
    >
      ↻
    </text>

    <!-- 详情面板 -->
    <g v-if="hoveredPair" class="gua-relation-detail">
      <rect
        x="-480" y="-560"
        width="280" height="170"
        rx="8"
        fill="rgba(0,0,0,0.85)"
        stroke="#FFD700"
        stroke-width="0.6"
      />
      <text x="-460" y="-540" fill="#FFD700" font-size="14" font-weight="bold">
        {{ relationMeta.label }}配对
      </text>
      <text x="-460" y="-516" fill="#F5E8C8" font-size="12">
        {{ relationMeta.label === '飞伏' ? '飞卦' : '源卦' }}：
        <tspan :fill="getArrowColor(hoveredPair)" font-weight="bold">
          {{ hoveredPair.sourceUnicode }} {{ hoveredPair.sourceName }}
        </tspan>
      </text>
      <text x="-460" y="-496" fill="#66CCFF" font-size="12">
        {{ relationMeta.label === '飞伏' ? '伏卦' : '目标卦' }}：
        <tspan fill="#66CCFF" font-weight="bold">
          {{ hoveredPair.targetUnicode }} {{ hoveredPair.targetName }}
        </tspan>
      </text>
      <text v-if="hoveredPair.palace && relationMeta.type === 'feifu'" x="-460" y="-476" fill="#aaa" font-size="11">
        所属宫：
        <tspan :fill="hoveredPair.color || '#aaa'">{{ hoveredPair.palace }}</tspan>
      </text>
      <text v-if="hoveredPair.shiyingType && relationMeta.type === 'feifu'" x="-460" y="-456" fill="#aaa" font-size="11">
        世位：
        <tspan fill="#F5E8C8">{{ hoveredPair.shiyingType }}</tspan>
      </text>
      <!-- 非 feifu 关系：分别显示源卦和目标卦的宫/世位 -->
      <template v-if="relationMeta.type !== 'feifu'">
        <text x="-460" y="-476" fill="#aaa" font-size="11">
          源卦：
          <tspan :fill="hoveredPair.color || '#aaa'">{{ hoveredPair.palace || '—' }}宫</tspan>
          <tspan fill="#666" dx="12">世</tspan>
          <tspan fill="#F5E8C8">{{ hoveredPair.shiyingType || '—' }}</tspan>
        </text>
        <text x="-460" y="-456" fill="#aaa" font-size="11">
          目标卦：
          <tspan fill="#66CCFF">{{ hoveredPair.targetPalace || '—' }}宫</tspan>
          <tspan fill="#666" dx="12">世</tspan>
          <tspan fill="#A29BFE">{{ hoveredPair.targetShiyingType || '—' }}</tspan>
        </text>
      </template>
      <text x="-460" y="-432" fill="#888" font-size="10" font-style="italic">
        {{ relationMeta.description }}
      </text>
    </g>
  </g>
</template>

<style scoped>
.gua-relation-center { pointer-events: none; }
.gua-relation-arrow { pointer-events: stroke; cursor: pointer; transition: opacity 0.2s ease; }
.gua-relation-self-loop { pointer-events: all; cursor: pointer; transition: opacity 0.2s ease; }
.gua-relation-self-loop-label { pointer-events: none; }
</style>
