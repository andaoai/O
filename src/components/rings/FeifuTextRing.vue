<script setup lang="ts">
/**
 * FeifuTextRing — 飞伏图盘文本环
 *
 * 通用组件，通过 layer prop 区分 6 种文本层：
 *   name / element / unicode / innerElement / outerElement / yinYang
 *
 * 每环渲染 64 个卦节点的文本标签，与 FeifuCenter 共享角度基准。
 * 注入 useFeifuInteraction 获取 hover/筛选状态。
 *
 * ⚠️ 标准 RingStack 圆环组件：半径由 RingStack 控制
 */
import { computed, inject } from 'vue'
import { FEIFU_KEY } from '@/composables/useFeifuInteraction'
import { JING_FANG_64_GUA, JING_FANG_EIGHT_PALACE_STEP } from '@/data/rings/jingFangEightPalaces'
import { getUnicodeHexagram, WENWANG_GUA_BY_VALUE, GUA_STEP, bitReverse6 } from '@/data/sixtyFourGua'
import { BAGUA_YANG, BAGUA_ELEMENT, ELEMENT_COLORS } from '@/utils/guaInfo'
import { radialTextRotation, polarToCartesian } from '@/utils/geometry'
import PolarCanvas from '../base/PolarCanvas.vue'
import type { FeifuLayout } from '@/utils/feifu'

// ─── 图层配置 ───

export type FeifuTextLayer = 'name' | 'element' | 'unicode' | 'innerElement' | 'outerElement' | 'yinYang'

/** 阴阳体性 → 配色 */
const YINYANG_COLORS: Record<string, string> = {
  '纯阳卦': '#FF6B35',
  '纯阴卦': '#A29BFE',
  '阳长卦': '#FDCB6E',
  '阴长卦': '#74B9FF'
}

// ─── Props ───

interface Props {
  radius: number
  innerRadius: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  startDegree?: number
  layout?: FeifuLayout
  layer: FeifuTextLayer
  /**
   * 当本宫五行环隐藏时，卦名/卦符改用宫色着色补偿。
   * name / unicode 层使用此 prop，其他层忽略。
   */
  usePaletteColorFallback?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rotationDirection: 'clockwise',
  startDegree: 0,
  layout: 'houtian'
})

// ─── 交互状态注入 ───

const feifu = inject(FEIFU_KEY)!

// ─── 角度与坐标计算 ───

/** 获取某卦在当前布局下的圆心角 */
function getGuaAngle(value: number): number {
  const gua = JING_FANG_64_GUA.find(g => g.value === value)
  if (!gua) return 0
  if (props.layout === 'houtian') {
    const FEIFU_PALACE_ORDER = ['乾', '坎', '艮', '震', '坤', '离', '兑', '巽'] as const
    const orderInPalace = gua.jingFangOrder % 8
    const newPalacePos = FEIFU_PALACE_ORDER.indexOf(gua.palace as typeof FEIFU_PALACE_ORDER[number])
    const order = newPalacePos * 8 + orderInPalace
    return (270 + order * JING_FANG_EIGHT_PALACE_STEP + props.startDegree) % 360
  } else {
    const pos = bitReverse6(value)
    return ((pos >= 32 ? 270 + (63 - pos) * GUA_STEP : 270 - (32 - pos) * GUA_STEP) + props.startDegree) % 360
  }
}

/** 文本环的中间半径（文字渲染在此处） */
const textRadius = computed(() => (props.radius + props.innerRadius) / 2)

/** 由六爻二进制编码推阴阳体性 */
function getHexagramYinYang(value: number): string {
  const innerYang = BAGUA_YANG[value & 0b111]
  const outerYang = BAGUA_YANG[(value >> 3) & 0b111]
  if (innerYang && outerYang) return '纯阳卦'
  if (!innerYang && !outerYang) return '纯阴卦'
  if (innerYang && !outerYang) return '阳长卦'
  return '阴长卦'
}

// ─── 文本数据生成 ───

const items = computed(() => {
  const r = textRadius.value
  const isHov = feifu.isHovered.value

  return JING_FANG_64_GUA.map(gua => {
    const angle = getGuaAngle(gua.value)
    const pos = polarToCartesian(angle, r, props.rotationDirection)
    const rot = radialTextRotation(angle, props.rotationDirection)
    const meta = WENWANG_GUA_BY_VALUE[gua.value]!
    const active = feifu.isNodeActive(gua.value)
    const match = feifu.isNodeMatch(gua.value)

    // 计算不透明度
    let opacity: number
    if (!active) opacity = 0.04       // 不在筛选范围
    else if (isHov && !match) opacity = 0.08 // hover中但不匹配
    else if (isHov && match) opacity = 1     // hover中且匹配
    else opacity = 0.5                       // 正常

    // 层特定的标签与颜色
    let label: string
    let color: string
    let fontSize: number

    switch (props.layer) {
      case 'name':
        label = gua.name
        color = match
          ? (props.usePaletteColorFallback ? gua.color : (feifu.isPureGua(gua.value) ? '#66CCFF' : '#FFD700'))
          : (active ? '#555' : '#1a1a1a')
        fontSize = Math.max(9, Math.round(r * 0.032))
        break

      case 'element':
        label = gua.element
        color = match ? gua.color : (active ? '#555' : '#1a1a1a')
        fontSize = Math.max(8, Math.round(r * 0.024))
        break

      case 'unicode':
        label = getUnicodeHexagram(meta.wenwangOrder)
        color = match
          ? (props.usePaletteColorFallback ? gua.color : (feifu.isPureGua(gua.value) ? '#66CCFF' : '#FFD700'))
          : (active ? '#555' : '#1a1a1a')
        fontSize = Math.max(14, Math.round(r * 0.055))
        break

      case 'innerElement':
        label = BAGUA_ELEMENT[gua.value & 0b111] || ''
        color = match ? (ELEMENT_COLORS[label] || '#888') : (active ? '#555' : '#1a1a1a')
        fontSize = Math.max(7, Math.round(r * 0.020))
        break

      case 'outerElement':
        label = BAGUA_ELEMENT[(gua.value >> 3) & 0b111] || ''
        color = match ? (ELEMENT_COLORS[label] || '#888') : (active ? '#555' : '#1a1a1a')
        fontSize = Math.max(7, Math.round(r * 0.020))
        break

      case 'yinYang': {
        const yy = getHexagramYinYang(gua.value)
        label = yy
        color = match
          ? (YINYANG_COLORS[yy] || '#888')
          : (active ? '#555' : '#1a1a1a')
        fontSize = Math.max(7, Math.round(r * 0.020))
        break
      }

      default:
        label = ''
        color = '#555'
        fontSize = 10
    }

    return {
      value: gua.value,
      x: pos.x,
      y: pos.y,
      rot,
      label,
      color,
      fontSize,
      fontWeight: (isHov && match) ? 'bold' as const : 'normal' as const,
      opacity
    }
  })
})

// ─── Hover ───

function onTextEnter(value: number) {
  feifu.setHovered(value)
}

function onTextLeave() {
  feifu.setHovered(null)
}
</script>

<template>
  <PolarCanvas
    :rotation-direction="rotationDirection"
    :enable-animation="false"
    :center-x="0"
    :center-y="0"
  >
    <template #default>
      <g class="feifu-text-ring">
        <text
          v-for="item in items"
          :key="`${props.layer}-${item.value}`"
          :x="item.x"
          :y="item.y"
          :fill="item.color"
          :font-size="item.fontSize"
          :font-weight="item.fontWeight"
          :opacity="item.opacity"
          text-anchor="middle"
          dominant-baseline="central"
          :transform="`rotate(${item.rot} ${item.x} ${item.y})`"
          class="feifu-node-text"
          @mouseenter="onTextEnter(item.value)"
          @mouseleave="onTextLeave"
        >
          {{ item.label }}
        </text>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.feifu-text-ring { pointer-events: none; }
.feifu-node-text {
  pointer-events: all;
  cursor: pointer;
  transition: opacity 0.2s ease, fill 0.2s ease;
}
</style>
