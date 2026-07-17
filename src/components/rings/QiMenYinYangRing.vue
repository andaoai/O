<script setup lang="ts">
/**
 * 阴阳两遁环（奇门遁甲最外/最内环）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一为 timeRef computed
 *
 * 【关键设计】以「上元甲子日 = 0°」为坐标基准，段边界跟随节气段：
 * 阳遁 = 冬至→芒种（termIndex 0-11）
 * 阴遁 = 夏至→大雪（termIndex 12-23）
 * 由于节气日期不均，两段的实际弧长可能略偏离 180°（超神/接气偏差）。
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import type { RingData } from '@/data/rings/types'
import {
  getSolarTermIndex, isYangDun, YIN_YANG_DUN,
  getSolarTermAnglesFromUpperYuan
} from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 480,
  innerRadius: 452,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

const isYang = computed(() => isYangDun(getSolarTermIndex(timeRef.value)))

const ringData = computed<RingData>(() => {
  const termAngles = getSolarTermAnglesFromUpperYuan(timeRef.value)
  // 阳遁: 冬至(0) → 芒种末(夏至前, termIndex 12)
  const yangStart = termAngles.find(t => t.termIndex === 0)?.angle ?? 0
  const yinStart = termAngles.find(t => t.termIndex === 12)?.angle ?? 180

  const yangEnd = yinStart
  let yinEnd = yangStart
  if (yinEnd <= yinStart) yinEnd += 360

  const items = YIN_YANG_DUN.map(d => {
    const isCurrent = (d.name === 'yang') === isYang.value
    const isYangSeg = d.name === 'yang'
    return {
      label: d.label,
      bgColor: d.color,
      color: isCurrent ? '#1a1a1a' : '#EEEEEE',
      startAngle: isYangSeg ? yangStart : yinStart,
      endAngle: isYangSeg ? yangEnd : yinEnd,
      highlight: isCurrent,
      highlightLevel: (isCurrent ? 2 : 0) as 0 | 1 | 2 | 3,
      fontSize: isCurrent ? 16 : 14
    }
  })

  return {
    items,
    showSectors: true,
    labelPosition: 0.5,
    labelColor: '#EEEEEE',
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

