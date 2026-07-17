<script setup lang="ts">
/**
 * 二十四节气**点**环（奇门遁甲）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一为 timeRef computed
 *
 * 【关键设计】以「上元甲子日 = 0°」为坐标基准，每个节气 = 1 个精确刻度点
 * 落在其对应的**具体那一天**上（1° = 1 天）。
 *
 * 与 60×6 甲子日环视觉直接对应：可以一眼读出"冬至 = 甲子日"、
 * "立春 = 己未日"这样的具体日期关系。
 *
 * 节 = 绿刻度 / 中气 = 蓝刻度 / 当前 = 金色加长刻度
 * 二分二至 = 加粗描边（特殊标记）
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataPointRing from './DataPointRing.vue'
import type { PointRingData } from '@/data/rings/types'
import {
  getSolarTermIndex, getSolarTermAnglesFromUpperYuan
} from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 396,
  innerRadius: 372,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

const currentTermIdx = computed(() => getSolarTermIndex(timeRef.value))

/** 冬至=0 起序，偶数索引 = 中气；奇数索引 = 节 */
function isMidTermFromDongzhi(idx: number): boolean {
  return idx % 2 === 0
}

/** 二分二至：冬至(0)/春分(6)/夏至(12)/秋分(18) */
function isCardinal(idx: number): boolean {
  return idx % 6 === 0
}

const ringData = computed<PointRingData>(() => {
  const termAngles = getSolarTermAnglesFromUpperYuan(timeRef.value)

  const items = termAngles.map(t => {
    const isCurrent = t.termIndex === currentTermIdx.value
    const isMid = isMidTermFromDongzhi(t.termIndex)
    const cardinal = isCardinal(t.termIndex)

    let pointColor: string
    let labelColor: string
    if (isCurrent) {
      pointColor = '#FFD700'
      labelColor = '#FFD700'
    } else if (cardinal) {
      pointColor = '#F1C40F'  // 二分二至 = 醒目金黄
      labelColor = '#F1C40F'
    } else if (isMid) {
      pointColor = '#3498DB'  // 中气 = 蓝
      labelColor = '#88CCFF'
    } else {
      pointColor = '#2ECC71'  // 节 = 绿
      labelColor = '#7FE4A0'
    }

    return {
      label: t.name,
      angle: t.angle,
      pointColor,
      color: labelColor,
      pointSymbol: 'tick' as const,
      // 当前节气刻度加长加粗；二分二至次强；其余标准
      tickInnerRatio: isCurrent ? 0.0 : (cardinal ? 0.15 : 0.35),
      tickOuterRatio: 1.0,
      tickWidth: isCurrent ? 2.5 : (cardinal ? 1.8 : 1.2),
      highlight: isCurrent,
      highlightLevel: (isCurrent ? 3 : 0) as 0 | 1 | 2 | 3,
      fontSize: isCurrent ? 12 : (cardinal ? 10 : 9)
    }
  })

  return {
    items,
    labelOffset: 3,
    labelOffsetBase: 'inner' as const,
    circleColor: '#555555',
    circleWidth: 0.5
  }
})
</script>

<template>
  <DataPointRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :start-degree="startDegree"
    :rotation-direction="rotationDirection"
  />
</template>
