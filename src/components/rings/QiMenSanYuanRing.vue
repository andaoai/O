<script setup lang="ts">
/**
 * 三元环（上元/中元/下元） — 奇门遁甲
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一为 timeRef computed
 *
 * 【关键设计】此环与 24 节气均分角度对齐（每节气 15° = 3 元 × 5°），
 * 但**高亮位置**严格锚定「上元甲子日」的元序号（每 5 天一元），
 * 因此当前元的角度与节气段边界会存在偏差 —— 这个偏差正是超神/接气！
 *
 * 72 段（24 节气 × 3 元），每段 5°。
 * 三元背景色 = 所属节气基色（节=绿/中气=蓝）× 三档深浅。
 * 当前元金色强高亮 + label 加粗。
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import type { RingData } from '@/data/rings/types'
import { getElementIndex, SOLAR_TERMS_FROM_DONGZHI } from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 368,
  innerRadius: 346,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

/** 当前元索引 0-71（严格 5 天切换，从上元甲子日起算） */
const currentElementIdx = computed(() => getElementIndex(timeRef.value))

/** 冬至=0 起序，偶数索引 = 中气蓝，奇数 = 节绿 */
function baseColor(termIndex: number): string {
  return termIndex % 2 === 0 ? '#3498DB' : '#2ECC71'
}

const YUAN_LABELS = ['上', '中', '下'] as const

const ringData = computed<RingData>(() => {
  const items = []
  for (let e = 0; e < 72; e++) {
    const t = Math.floor(e / 3)  // 元序号 → 节气索引
    const y = e % 3               // 元序号 → 上中下
    const isCurrent = e === currentElementIdx.value
    items.push({
      label: YUAN_LABELS[y]!,
      // 高亮：金背景 + 深色文字；未高亮：节/中气浅背景 + 浅色文字
      bgColor: isCurrent ? '#FFD700' : baseColor(t),
      color: isCurrent ? '#1a1a1a' : '#CCCCCC',
      highlight: isCurrent,
      highlightLevel: (isCurrent ? 3 : 0) as 0 | 1 | 2 | 3,
      fontSize: isCurrent ? 12 : 8
    })
  }
  return {
    items,
    showSectors: true,
    labelPosition: 0.5,
    labelColor: '#CCCCCC',
    circleColor: '#555555',
    circleWidth: 0.5
  }
})
</script>

<template>
  <DataRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :start-degree="startDegree"
    :rotation-direction="rotationDirection"
  />
</template>

