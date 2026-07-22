<script setup lang="ts">
/**
 * GuaRelationTextRing — 卦关系图盘文本环
 *
 * 通用组件，通过 layer prop 区分 6 种文本层：
 *   name / element / unicode / innerElement / outerElement / yinYang
 *
 * 每环渲染 64 个卦节点的文本标签，与 GuaRelationCenter 共享角度基准。
 * 注入 useGuaRelationInteraction 获取 hover/筛选状态。
 * 通过 relationType prop 控制纯卦特殊着色（仅飞伏类型生效）。
 *
 * ⚠️ 标准 RingStack 圆环组件：半径由 RingStack 控制
 */
import { computed, inject } from 'vue'
import { GUA_RELATION_KEY } from '@/composables/useGuaRelationInteraction'
import { WENWANG_GUA_BY_VALUE, getUnicodeHexagram } from '@/data/sixtyFourGua'
import { JING_FANG_64_GUA } from '@/data/rings/jingFangEightPalaces'
import { BAGUA_ELEMENT, ELEMENT_COLORS } from '@/utils/guaInfo'
import { getGuaAngle, type GuaRelationType, type GuaLayout } from '@/utils/guaRelations'
import { radialTextRotation, polarToCartesian } from '@/utils/geometry'
import PolarCanvas from '../base/PolarCanvas.vue'

// ─── 图层配置 ───

export type GuaRelationTextLayer = 'name' | 'element' | 'unicode' | 'innerElement' | 'outerElement' | 'binary' | 'decimal'

// ─── Props ───

interface Props {
  radius: number
  innerRadius: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  startDegree?: number
  layout?: GuaLayout
  layer: GuaRelationTextLayer
  /** 卦关系类型（影响纯卦特殊着色） */
  relationType?: GuaRelationType
  /**
   * 当本宫五行环隐藏时，卦名/卦符改用宫色着色补偿。
   * name / unicode 层使用此 prop，其他层忽略。
   */
  usePaletteColorFallback?: boolean
  /**
   * 派生卦值表（长度 64，索引 i = 外圈源卦 value，值 = 该位置实际显示的卦 value）
   *
   * 未提供 → 恒等映射，行为与传统单层环一致（label / angle 都用 value 本身）。
   * 提供 → **角度**仍按索引 i（源卦位置排布），**label / color / hover / focus 判定**
   *   一律换用 derivedValues[i]，实现「同角度切片、不同层展示不同派生卦」的推衍效果。
   */
  derivedValues?: readonly number[]
}

const props = withDefaults(defineProps<Props>(), {
  rotationDirection: 'clockwise',
  startDegree: 0,
  layout: 'jingfang',
  relationType: 'feifu',
})

// ─── 交互状态注入 ───

const interaction = inject(GUA_RELATION_KEY)!

// ─── 角度与坐标计算 ───

/** 文本环的中间半径（文字渲染在此处） */
const textRadius = computed(() => (props.radius + props.innerRadius) / 2)

/** 当前是否为飞伏模式（纯卦特殊着色仅飞伏模式启用） */
const isFeifuMode = computed(() => props.relationType === 'feifu')

/** 获取某卦的宫色 */
function getGuaPaletteColor(value: number): string {
  const gua = JING_FANG_64_GUA.find(g => g.value === value)
  return gua?.color ?? '#FFD700'
}

/** 获取某卦本宫五行 */
function getGuaElement(value: number): string {
  const gua = JING_FANG_64_GUA.find(g => g.value === value)
  return gua?.element ?? ''
}

// ─── 文本数据生成 ───

const items = computed(() => {
  const r = textRadius.value
  const isHov = interaction.isHovered.value
  const derived = props.derivedValues
  const isDerive = interaction.mode.value === 'derive'

  return Array.from({ length: 64 }, (_, sourceValue) => {
    // 角度键：始终按外圈源卦 value 排布（推衍模式下所有层同角度对齐）
    const angle = getGuaAngle(sourceValue, props.layout, props.startDegree)
    const pos = polarToCartesian(angle, r, props.rotationDirection)
    const rot = radialTextRotation(angle, props.rotationDirection)

    // 渲染键：推衍层用派生卦 value，未提供 derivedValues 时退化为源卦本身
    const value = derived?.[sourceValue] ?? sourceValue

    // 交互键：推衍模式用列索引 sourceValue（同列高亮），其他模式用渲染卦 value
    const interactionKey = isDerive ? sourceValue : value

    const meta = WENWANG_GUA_BY_VALUE[value]!
    const active = interaction.isNodeActive(interactionKey)
    const match = interaction.isNodeMatch(interactionKey)
    const focused = interaction.isFocused(interactionKey)

    // 计算不透明度（聚焦卦永远高亮）
    let opacity: number
    if (focused) opacity = 1
    else if (!active) opacity = 0.04       // 不在筛选范围
    else if (isHov && !match) opacity = 0.08 // hover中但不匹配
    else if (isHov && match) opacity = 1     // hover中且匹配
    else opacity = 0.5                       // 正常

    // 层特定的标签与颜色
    let label: string
    let color: string
    let fontSize: number

    switch (props.layer) {
      case 'name': {
        label = meta.name
        // 纯卦特殊着色仅限 feifu 模式
        const specialPureColor = isFeifuMode.value && interaction.isPureGua(value) ? '#66CCFF' : null
        if (focused) {
          color = '#E5D0FF'
        } else if (match) {
          color = specialPureColor
            ?? (props.usePaletteColorFallback ? getGuaPaletteColor(value) : '#FFD700')
        } else {
          color = active ? '#555' : '#1a1a1a'
        }
        fontSize = Math.max(9, Math.round(r * 0.032))
        break
      }

      case 'element':
        label = getGuaElement(value)
        color = focused
          ? '#E5D0FF'
          : match ? getGuaPaletteColor(value) : (active ? '#555' : '#1a1a1a')
        fontSize = Math.max(8, Math.round(r * 0.024))
        break

      case 'unicode':
        label = getUnicodeHexagram(meta.wenwangOrder)
        if (focused) {
          color = '#E5D0FF'
        } else if (match) {
          color = isFeifuMode.value && interaction.isPureGua(value) ? '#66CCFF' : getGuaPaletteColor(value)
        } else {
          color = active ? '#555' : '#1a1a1a'
        }
        fontSize = Math.max(14, Math.round(r * 0.055))
        break

      case 'innerElement':
        label = BAGUA_ELEMENT[value & 0b111] || ''
        color = focused
          ? '#E5D0FF'
          : match ? ((ELEMENT_COLORS as Record<string, string>)[label] || '#888') : (active ? '#555' : '#1a1a1a')
        fontSize = Math.max(7, Math.round(r * 0.020))
        break

      case 'outerElement':
        label = BAGUA_ELEMENT[(value >> 3) & 0b111] || ''
        color = focused
          ? '#E5D0FF'
          : match ? ((ELEMENT_COLORS as Record<string, string>)[label] || '#888') : (active ? '#555' : '#1a1a1a')
        fontSize = Math.max(7, Math.round(r * 0.020))
        break

      case 'binary': {
        // 6 位二进制：MSB=上爻 (bit 5)，LSB=初爻 (bit 0)
        // 与先天六十四卦按 value 展开的二进制顺序一致
        label = value.toString(2).padStart(6, '0')
        color = focused
          ? '#E5D0FF'
          : match ? '#88DDFF' : (active ? '#555' : '#1a1a1a')
        fontSize = Math.max(7, Math.round(r * 0.018))
        break
      }

      case 'decimal':
        // 0 ~ 63 十进制序号（与先天卦位对应）
        label = String(value)
        color = focused
          ? '#E5D0FF'
          : match ? '#FFD08A' : (active ? '#555' : '#1a1a1a')
        fontSize = Math.max(9, Math.round(r * 0.026))
        break

      default:
        label = ''
        color = '#555'
        fontSize = 10
    }

    return {
      // 用于 v-for :key（一环内 sourceValue 唯一，稳定）
      key: sourceValue,
      // 传给 hover / click 事件的交互键：推衍层=列索引，其他=渲染卦本身
      interactionKey,
      x: pos.x,
      y: pos.y,
      rot,
      label,
      color,
      fontSize,
      fontWeight: focused || (isHov && match) ? 'bold' as const : 'normal' as const,
      opacity,
      focused,
    }
  })
})

// ─── Hover / Click ───

function onTextEnter(value: number) {
  interaction.setHovered(value)
}

function onTextLeave() {
  interaction.setHovered(null)
}

/** 点击卦名 → 聚焦模式下切换选中卦 */
function onTextClick(value: number) {
  if (interaction.mode.value === 'focus') {
    interaction.toggleFocused(value)
  }
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
      <g class="gua-relation-text-ring">
        <text
          v-for="item in items"
          :key="`${props.layer}-${item.key}`"
          :x="item.x"
          :y="item.y"
          :fill="item.color"
          :font-size="item.fontSize"
          :font-weight="item.fontWeight"
          :opacity="item.opacity"
          text-anchor="middle"
          dominant-baseline="central"
          :transform="`rotate(${item.rot} ${item.x} ${item.y})`"
          class="gua-relation-node-text"
          :class="{ 'focused-gua': item.focused }"
          @mouseenter="onTextEnter(item.interactionKey)"
          @mouseleave="onTextLeave"
          @click="onTextClick(item.interactionKey)"
        >
          {{ item.label }}
        </text>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.gua-relation-text-ring { pointer-events: none; }
.gua-relation-node-text {
  pointer-events: all;
  cursor: pointer;
  transition: opacity 0.2s ease, fill 0.2s ease;
}
.gua-relation-node-text.focused-gua {
  filter: drop-shadow(0 0 4px #9B59B6) drop-shadow(0 0 8px rgba(155, 89, 182, 0.6));
}
</style>
