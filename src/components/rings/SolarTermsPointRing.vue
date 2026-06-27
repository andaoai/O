<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataPointRing from './DataPointRing.vue'
import { sunLongitude } from '@/utils/celestial'
import type { PointRingData } from '@/data/rings/types'

/**
 * 二十四节气参照环（刻度样式 / 节·中气 双色）
 *
 * 🔵 类型：点环 → DataPointRing → PointRing → PolarCanvas
 *
 * 24 根节气刻度线，从外缘向内画：
 *   - 节（立春、惊蛰…12个）：绿色 #2ECC71
 *   - 中气（雨水、春分…12个）：蓝色 #3498DB
 *   - 二分二至：稍长、金色 #FFD700
 *   - 当前节气：最长、金色加粗 + 呼吸动画
 *
 * 标签从内缘向外偏移，始终在自环内，不与外层 DayScaleRing 重叠。
 */
interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 178,
  startDegree: 0,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())
const norm = (a: number) => ((a % 360) + 360) % 360

const ringData = computed((): PointRingData => {
  const sunLon = sunLongitude(timeRef.value)
  const currentIndex = Math.floor(norm(sunLon - 315) / 15)
  const ringWidth = props.radius - props.innerRadius

  const termNames = [
    '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
    '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
    '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
    '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
  ]

  const specialNames = new Set(['春分', '夏至', '秋分', '冬至'])

  // 刻度长度（从外缘向内）
  const baseLen = ringWidth * 0.35     // 普通节气
  const specialLen = ringWidth * 0.50  // 二分二至
  const currentLen = ringWidth * 0.65  // 当前节气

  const items: PointRingData['items'] = termNames.map((name, i) => {
    const angle = i * 15
    const isZhongQi = i % 2 === 1
    const isCurrent = i === currentIndex
    const isSpecial = specialNames.has(name)

    const len = isCurrent ? currentLen : (isSpecial ? specialLen : baseLen)
    const tickInnerRatio = 1 - len / ringWidth

    return {
      label: name,
      angle,
      pointSymbol: 'tick' as const,
      pointColor: isCurrent
        ? '#FFD700'
        : isZhongQi
          ? '#3498DB'
          : '#2ECC71',
      tickInnerRatio: Math.max(0.3, tickInnerRatio),
      tickOuterRatio: 1.0,
      tickWidth: isCurrent ? 2.5 : (isSpecial ? 1.5 : 1),
      fontSize: isCurrent ? 12 : (isSpecial ? 11 : 9),
      color: isCurrent ? '#FFD700' : (isSpecial ? '#FFD700' : '#CCCCCC'),
      highlightLevel: (isCurrent ? 2 : 0) as 0 | 1 | 2 | 3
    }
  })

  return {
    radius: props.radius,
    innerRadius: props.innerRadius,
    startDegree: props.startDegree,
    labelColor: '#CCCCCC',
    labelOffset: 3,
    labelOffsetBase: 'inner',  // 标签靠近内缘，留在自环内
    circleColor: '#333333',
    circleWidth: 0.5,
    pointSymbol: 'tick',
    pointSize: 0,
    items
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
