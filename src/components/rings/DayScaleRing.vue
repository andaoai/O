<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataPointRing from './DataPointRing.vue'
import { isGregorianLeapYear, getDayOfYear } from '@/utils/chineseCalendar'
import type { PointRingData } from '@/data/rings/types'

/**
 * 365天回归年刻度环（点环）
 *
 * 🔵 类型：点环 → DataPointRing → PointRing → PolarCanvas
 *
 * 三级刻度体系（从外缘向内画，标签在最内缘，永不重叠）：
 *
 *   外缘 ─┬─ 日刻度(短4px, 0.3px宽, 暗色) ─── 365条细节纹理
 *         ├─ 5日刻度(中8px, 0.6px宽)       ─── ~72条中等标记
 *         ├─ 月首刻度(长14px, 1.5px宽, 白)  ─── 12条+标签
 *         ├─ 当天刻度(红, 粗, 呼吸)         ─── 1条
 *   内缘 ─┴─ 标签区(离内缘3px)              ─── 与所有刻度线无接触
 *
 * @example
 * ```vue
 * <DayScaleRing :time="controlledTime" :radius="480" :inner-radius="452" />
 * ```
 */
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
  startDegree: 0,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

const MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
]

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const ringData = computed((): PointRingData => {
  const time = timeRef.value
  const year = time.getFullYear()
  const currentDayOfYear = getDayOfYear(time)
  const isLeap = isGregorianLeapYear(year)
  const daysInYear = isLeap ? 366 : 365
  const anglePerDay = 360 / daysInYear
  const ringWidth = props.radius - props.innerRadius

  // 每月首日
  const monthStarts: number[] = []
  let accum = 1
  for (let m = 0; m < 12; m++) {
    monthStarts.push(accum)
    accum += (m === 1 && isLeap) ? 29 : DAYS_IN_MONTH[m]!
  }

  // 刻度长度（从外缘向内延伸的像素）→ 转换为 tickInnerRatio
  // tickOuterRatio = 1.0（外缘），tickInnerRatio = 1 - len/ringWidth
  const dailyLen = ringWidth * 0.12    // 日刻度：极短，仅外缘纹理
  const fiveLen = ringWidth * 0.28     // 5日刻度：中等
  const monthLen = ringWidth * 0.50    // 月首刻度：半环宽

  const items: PointRingData['items'] = []

  for (let day = 1; day <= daysInYear; day++) {
    const angle = ((day - 1) * anglePerDay) % 360
    const isMonthStart = monthStarts.includes(day)
    const isFiveDay = day % 5 === 0
    const isCurrentDay = day === currentDayOfYear

    let tickInnerRatio: number
    let tickWidth: number
    let label: string
    let pointColor: string
    let highlightLevel: 0 | 1 | 2 | 3

    if (isCurrentDay) {
      tickInnerRatio = 1 - (ringWidth * 0.55) / ringWidth  // 更长
      tickWidth = 3
      label = ''
      pointColor = '#FF4444'
      highlightLevel = 3
    } else if (isMonthStart) {
      tickInnerRatio = 1 - monthLen / ringWidth
      tickWidth = 1.5
      const idx = monthStarts.indexOf(day)
      label = idx >= 0 ? (MONTH_LABELS[idx] ?? '') : ''
      pointColor = '#FFFFFF'
      highlightLevel = 1
    } else if (isFiveDay) {
      tickInnerRatio = 1 - fiveLen / ringWidth
      tickWidth = 0.6
      label = ''
      pointColor = '#999999'
      highlightLevel = 0
    } else {
      // 每日细节刻度
      tickInnerRatio = 1 - dailyLen / ringWidth
      tickWidth = 0.3
      label = ''
      pointColor = '#555555'
      highlightLevel = 0
    }

    items.push({
      angle,
      label,
      pointSymbol: 'tick',
      pointColor,
      fontSize: 10,
      tickInnerRatio: Math.max(0.4, tickInnerRatio),
      tickOuterRatio: 1.0,
      tickWidth,
      highlightLevel
    })
  }

  // 标签放在内缘外侧（远离所有刻度线）
  const labelOffset = Math.max(2, ringWidth * 0.1)

  return {
    radius: props.radius,
    innerRadius: props.innerRadius,
    startDegree: props.startDegree,
    labelColor: '#FFFFFF',
    labelOffset,
    labelOffsetBase: 'inner',
    circleColor: '#444444',
    circleWidth: 0.5,
    pointSymbol: 'tick',
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
