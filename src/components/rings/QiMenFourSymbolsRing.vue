<script setup lang="ts">
/**
 * 四象环（奇门遁甲）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一为 timeRef computed
 *
 * 【关键设计】以「上元甲子日 = 0°」为坐标基准，段边界跟随节气段（每 6 节气 = 1 象）。
 * 冬 = 冬至~立春前（tIdx 0-5）
 * 春 = 立春~立夏前（tIdx 6-11）—— 注意包含芒种（阳遁尾）
 * 夏 = 夏至~立秋前（tIdx 12-17）
 * 秋 = 立秋~立冬前（tIdx 18-23）
 *
 * 由于奇门四象采用「二分二至/立四立」划分季节，与阳/阴遁分界不完全同：
 * 阳遁 = 冬至→芒种（含冬春夏三季边界）；阴遁 = 夏至→大雪。
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import type { RingData } from '@/data/rings/types'
import {
  getSolarTermIndex, getFourSymbolIndex, FOUR_SYMBOLS,
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
  radius: 452,
  innerRadius: 428,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

const currentIdx = computed(() => getFourSymbolIndex(getSolarTermIndex(timeRef.value)))

const ringData = computed<RingData>(() => {
  const termAngles = getSolarTermAnglesFromUpperYuan(timeRef.value)

  // 每象 = 6 节气：起点 termIndex = i*6，终点 termIndex = (i+1)*6
  const items = FOUR_SYMBOLS.map((s, i) => {
    const startTerm = termAngles.find(t => t.termIndex === i * 6)
    const endTermIdx = (i + 1) * 6
    const endTerm = termAngles.find(t => t.termIndex === endTermIdx)
    const startAngle = startTerm?.angle ?? i * 90
    let endAngle = endTerm?.angle ?? (startAngle + 90)
    if (endAngle <= startAngle) endAngle += 360
    const isCurrent = i === currentIdx.value
    return {
      label: s.label,
      bgColor: s.color,
      color: isCurrent ? '#1a1a1a' : '#DDDDDD',
      startAngle,
      endAngle,
      highlight: isCurrent,
      highlightLevel: (isCurrent ? 2 : 0) as 0 | 1 | 2 | 3,
      fontSize: isCurrent ? 16 : 13
    }
  })

  return {
    items,
    showSectors: true,
    labelPosition: 0.5,
    labelColor: '#DDDDDD',
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

