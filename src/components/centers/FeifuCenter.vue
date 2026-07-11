<script setup lang="ts">
/**
 * FeifuCenter — 飞伏箭矢圆心组件
 *
 * 渲染 64 条从飞卦→伏卦的有向箭头，呈放射状收敛至 8 个纯卦。
 * 支持 hover 交互：悬停箭头/节点高亮关联配对，显示详情面板。
 *
 * ⚠️ 圆心组件：只有 radius，无 innerRadius
 */
import { inject, computed } from 'vue'
import { FEIFU_KEY } from '@/composables/useFeifuInteraction'
import { FEIFU_TABLE, computeFeifuArrows, type FeifuLayout } from '@/utils/feifu'

interface Props {
  /** 圆心区域半径（由 RingStack #center slot 注入） */
  radius: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  startDegree?: number
  layout?: FeifuLayout
}

const props = withDefaults(defineProps<Props>(), {
  rotationDirection: 'clockwise',
  startDegree: 0,
  layout: 'houtian'
})

// ─── 注入交互状态 ───

const feifu = inject(FEIFU_KEY)!

// ─── 箭头计算 ───

/**
 * 箭头节点的布局圆半径
 *
 * 使用 0.93 比率使箭头贴近最内环的卦名文本。
 * 核心区半径 ~450，箭头在 450*0.93≈419，与 ~457 处卦名文本间隙 ≈ 38px。
 */
const arrowRadius = computed(() => props.radius * 0.93)

/** 全部 64 条箭头的笛卡尔坐标 */
const allArrows = computed(() =>
  computeFeifuArrows(arrowRadius.value, props.startDegree, props.rotationDirection, props.layout)
)

/** 带 hover/筛选样式的箭头 */
const arrows = computed(() =>
  allArrows.value.map(a => {
    const match = feifu.isArrowMatch(a.entry)
    const active = feifu.isNodeActive(a.entry.feiValue)
    const hov = feifu.isHovered.value
    // 不在筛选内 → 几乎消失
    if (!active) return { ...a, strokeOpacity: 0.04, strokeWidth: 0.5 }
    // hover 中且不匹配 → 淡化
    if (hov && !match) return { ...a, strokeOpacity: 0.06, strokeWidth: 0.5 }
    // 正常/hover匹配 → 标准显隐
    return { ...a, strokeOpacity: 0.45, strokeWidth: 1.5 }
  })
)

// ─── 详情面板 ───

const hoveredPair = computed(() => {
  if (feifu.hoveredValue.value === null) return null
  return FEIFU_TABLE.find(
    e => e.feiValue === feifu.hoveredValue.value || e.fuValue === feifu.hoveredValue.value
  ) ?? null
})

function onArrowEnter(value: number) {
  feifu.setHovered(value)
}

function onArrowLeave() {
  feifu.setHovered(null)
}
</script>

<template>
  <g class="feifu-center">
    <!-- 箭头标记 -->
    <defs>
      <marker
        id="feifu-arrowhead"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
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
      :stroke-width="a.strokeWidth"
      :opacity="a.strokeOpacity"
      marker-end="url(#feifu-arrowhead)"
      class="feifu-arrow"
      @mouseenter="onArrowEnter(a.entry.feiValue)"
      @mouseleave="onArrowLeave"
    />

    <!-- 详情面板 -->
    <g v-if="hoveredPair" class="feifu-detail">
      <rect
        x="-480" y="-560"
        width="280" height="160"
        rx="8"
        fill="rgba(0,0,0,0.85)"
        stroke="#FFD700"
        stroke-width="0.6"
      />
      <text x="-460" y="-540" fill="#FFD700" font-size="14" font-weight="bold">
        飞伏配对
      </text>
      <text x="-460" y="-516" fill="#F5E8C8" font-size="12">
        飞卦：
        <tspan :fill="hoveredPair.color" font-weight="bold">
          {{ hoveredPair.feiUnicode }} {{ hoveredPair.feiName }}
        </tspan>
      </text>
      <text x="-460" y="-496" fill="#66CCFF" font-size="12">
        伏卦：
        <tspan fill="#66CCFF" font-weight="bold">
          {{ hoveredPair.fuUnicode }} {{ hoveredPair.fuName }}
        </tspan>
      </text>
      <text x="-460" y="-476" fill="#aaa" font-size="11">
        所属宫：
        <tspan :fill="hoveredPair.color">{{ hoveredPair.palace }}</tspan>
      </text>
      <text x="-460" y="-456" fill="#aaa" font-size="11">
        世位：
        <tspan fill="#F5E8C8">{{ hoveredPair.shiyingType }}</tspan>
      </text>
      <text x="-460" y="-432" fill="#888" font-size="10" font-style="italic">
        飞为显、伏为隐。{{ hoveredPair.feiName }}显则{{ hoveredPair.fuName }}隐，阴阳互藏其宅。
      </text>
    </g>
  </g>
</template>

<style scoped>
.feifu-center { pointer-events: none; }
.feifu-arrow { pointer-events: stroke; cursor: pointer; transition: opacity 0.2s ease; }
</style>
