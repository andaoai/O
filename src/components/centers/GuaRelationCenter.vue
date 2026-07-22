<script setup lang="ts">
/**
 * GuaRelationCenter — 卦关系箭矢圆心组件
 *
 * 两种渲染模式：
 *   global — 依 relationType 绘制全 64 条 source→target 箭头（原行为）
 *   focus  — 从 focusedValue 出发，对 focusRelationTypes 中每种关系
 *            分别绘制一条彩色箭头（按 RELATION_COLORS 着色）
 *
 * 支持 hover 交互：悬停箭头/节点高亮关联配对，显示详情面板。
 * 支持自环：sourceValue === targetValue 时渲染小圆环标记。
 *
 * ⚠️ 圆心组件：只有 radius，无 innerRadius
 */
import { inject, computed } from 'vue'
import { GUA_RELATION_KEY } from '@/composables/useGuaRelationInteraction'
import {
  computeRelationTable,
  computeFocusRelations,
  getGuaAngle,
  getArrowColor,
  RELATION_COLORS,
  type GuaRelationType,
  type GuaLayout,
  type GuaRelationEntry,
  type FocusRelationEntry,
} from '@/utils/guaRelations'
import { polarToCartesian } from '@/utils/geometry'

interface Props {
  /** 圆心区域半径（由 RingStack #center slot 注入） */
  radius: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  startDegree?: number
  layout?: GuaLayout
  /** 卦关系类型（全局模式生效，默认飞伏） */
  relationType?: GuaRelationType
  /** 显示模式 */
  mode?: 'global' | 'focus'
  /** 聚焦卦 value（focus 模式） */
  focusedValue?: number | null
  /** 聚焦模式下要显示的关系类型集合 */
  focusRelationTypes?: Set<GuaRelationType>
  /** 变卦动爻位（0..5） */
  movingLines?: Set<number>
}

const props = withDefaults(defineProps<Props>(), {
  rotationDirection: 'clockwise',
  startDegree: 0,
  layout: 'jingfang',
  relationType: 'feifu',
  mode: 'global',
  focusedValue: null,
  focusRelationTypes: () => new Set<GuaRelationType>(),
  movingLines: () => new Set<number>(),
})

// ─── 注入交互状态 ───

const interaction = inject(GUA_RELATION_KEY)!

// ─── 箭头计算 ───

/** 箭头节点的布局圆半径 */
const arrowRadius = computed(() => props.radius * 0.93)

/**
 * 当前关系表：
 *   global — 全 64 条 GuaRelationEntry
 *   focus  — 单源卦对 N 种关系的 FocusRelationEntry
 *
 * 聚焦模式下的源卦优先取 focusedValue（点击固定），
 * 否则回落到 interaction.hoveredValue（hover 预览）。
 */
const currentTable = computed<readonly (GuaRelationEntry | FocusRelationEntry)[]>(() => {
  if (props.mode === 'focus') {
    const source = props.focusedValue ?? interaction.hoveredValue.value
    if (source === null) return []
    const types = Array.from(props.focusRelationTypes)
    if (types.length === 0) return []
    return computeFocusRelations(
      source,
      types,
      Array.from(props.movingLines),
    )
  }
  return computeRelationTable(props.relationType, Array.from(props.movingLines))
})

/** 一条箭头的渲染数据 */
interface ArrowRenderItem {
  entry: GuaRelationEntry | FocusRelationEntry
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
  markerId: string
}

/**
 * 全部箭头的笛卡尔坐标 + 样式
 *
 * 聚焦模式按 RELATION_COLORS[entry.type] 上色（互卦绿/综卦蓝/错卦红/变卦紫…）
 * 全局模式沿用宫色 (getArrowColor)
 */
const arrows = computed<ArrowRenderItem[]>(() => {
  const isHov = interaction.isHovered.value
  const isFocus = props.mode === 'focus'

  return currentTable.value.map((entry, idx) => {
    const sourceAngle = getGuaAngle(entry.sourceValue, props.layout, props.startDegree)
    const targetAngle = getGuaAngle(entry.targetValue, props.layout, props.startDegree)
    const from = polarToCartesian(sourceAngle, arrowRadius.value, props.rotationDirection)
    const to = polarToCartesian(targetAngle, arrowRadius.value, props.rotationDirection)

    const match = interaction.isArrowMatch(entry)
    const active = interaction.isEntryFiltered(entry.sourceValue, entry.targetValue)
    const isSelfLoop = entry.sourceValue === entry.targetValue

    // 聚焦模式：按关系类型上色；全局模式：按源卦宫色
    const arrowColor = isFocus && 'type' in entry
      ? RELATION_COLORS[(entry as FocusRelationEntry).type]
      : getArrowColor(entry)

    const markerId = isFocus && 'type' in entry
      ? `gua-relation-arrowhead-${(entry as FocusRelationEntry).type}`
      : 'gua-relation-arrowhead'

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
      circleOpacity = isFocus ? 0.65 : (isHov && match ? 0.8 : 0.4)
    } else if (isFocus) {
      // 聚焦模式默认更醒目
      strokeOpacity = 0.85
      strokeWidth = 2.2
      showMarker = true
      circleOpacity = 0
    } else {
      strokeOpacity = 0.45
      strokeWidth = 1.5
      showMarker = true
      circleOpacity = 0
    }

    return { entry, x1: from.x, y1: from.y, x2: to.x, y2: to.y, isSelfLoop, arrowColor, strokeOpacity, strokeWidth, showMarker, circleOpacity, markerId, idx } as ArrowRenderItem & { idx: number }
  })
})

/** 自环子集（综卦不变卦 / 变卦无动爻等） */
const selfLoopArrows = computed(() => arrows.value.filter(a => a.isSelfLoop))

/** 聚焦模式需要为每种关系类型生成一个对应颜色的箭头标记 */
const focusMarkerTypes = computed<GuaRelationType[]>(() => {
  if (props.mode !== 'focus') return []
  return Array.from(new Set(
    currentTable.value
      .filter(e => 'type' in e)
      .map(e => (e as FocusRelationEntry).type)
  ))
})

// ─── 悬停回调 ───

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
      <!-- 聚焦模式：按关系类型生成彩色箭头标记 -->
      <marker
        v-for="t in focusMarkerTypes"
        :key="`marker-${t}`"
        :id="`gua-relation-arrowhead-${t}`"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 Z" :fill="RELATION_COLORS[t]" />
      </marker>
    </defs>

    <!-- 有向箭头（不含自环） -->
    <line
      v-for="(a, idx) in arrows"
      :key="`arrow-${idx}-${a.entry.sourceValue}-${a.entry.targetValue}`"
      v-show="!a.isSelfLoop"
      :x1="a.x1"
      :y1="a.y1"
      :x2="a.x2"
      :y2="a.y2"
      :stroke="a.arrowColor"
      :stroke-width="a.strokeWidth"
      :opacity="a.strokeOpacity"
      :marker-end="a.showMarker ? `url(#${a.markerId})` : undefined"
      class="gua-relation-arrow"
      @mouseenter="onArrowEnter(a.entry.sourceValue)"
      @mouseleave="onArrowLeave"
    />

    <!-- 自环标记：小圆环 -->
    <circle
      v-for="(a, idx) in selfLoopArrows"
      :key="`loop-${idx}-${a.entry.sourceValue}`"
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
      v-for="(a, idx) in selfLoopArrows"
      :key="`loop-label-${idx}-${a.entry.sourceValue}`"
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
  </g>
</template>

<style scoped>
.gua-relation-center { pointer-events: none; }
.gua-relation-arrow { pointer-events: stroke; cursor: pointer; transition: opacity 0.2s ease; }
.gua-relation-self-loop { pointer-events: all; cursor: pointer; transition: opacity 0.2s ease; }
.gua-relation-self-loop-label { pointer-events: none; }
</style>
