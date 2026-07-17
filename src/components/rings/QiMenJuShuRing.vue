<script setup lang="ts">
/**
 * 局数环（一~九局） — 奇门遁甲
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一为 timeRef computed
 *
 * 【关键设计】此环 72 段（每段 5°）按元序号排布，与三元环角度完全对齐。
 * **高亮位置**严格锚定「上元甲子日」的元序号（每 5 天一局），
 * 与最外的 60 甲子日环每 5 格切换一次严格对齐。
 * 与节气段的偏差正是超神/接气！
 *
 * 局数背景色 = 九星紫白色（1白/2黑/3碧/4绿/5黄/6白/7赤/8白/9紫）。
 * 当前局呼吸高亮 highlightLevel:3。
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import type { RingData } from '@/data/rings/types'
import {
  getElementIndex, BUREAU_BY_ELEMENT,
  JIU_XING_COLORS, JU_HANZI
} from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 346,
  innerRadius: 320,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

const currentElementIdx = computed(() => getElementIndex(timeRef.value))

const ringData = computed<RingData>(() => {
  const items = []
  for (let e = 0; e < 72; e++) {
    const juNumber = BUREAU_BY_ELEMENT[e] ?? 1
    const isCurrent = e === currentElementIdx.value
    const starColor = JIU_XING_COLORS[juNumber] ?? '#888888'
    // 局数文字颜色：深色九星（如2黑/7赤）用白字，浅色（如5黄）用深字，保证可读
    const isDarkBg = ['2', '7'].includes(String(juNumber))
    items.push({
      label: JU_HANZI[juNumber] ?? '',
      bgColor: isCurrent ? '#FFD700' : starColor,
      color: isCurrent
        ? '#1a1a1a'
        : (isDarkBg ? '#EEEEEE' : '#333333'),
      highlight: isCurrent,
      highlightLevel: (isCurrent ? 3 : 0) as 0 | 1 | 2 | 3,
      fontSize: isCurrent ? 16 : 11
    })
  }
  return {
    items,
    showSectors: true,
    labelPosition: 0.5,
    labelColor: '#333333',
    circleColor: '#666666',
    circleWidth: 1
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

