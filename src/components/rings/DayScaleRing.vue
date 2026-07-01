<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataPointRing from './DataPointRing.vue'
import { isGregorianLeapYear, getDayOfYear, getSolarTermPositions } from '@/utils/chineseCalendar'
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
 * 🔑 基准模式（originMode）：
 *   - 'jan1'：公历 1 月 1 日 = 0°（默认，通用回归年刻度）
 *   - 'winterSolstice'：冬至日 = 0°（京房卦气体系专用）
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
  /** 角度基准模式：'jan1' 公历1月1日=0°（默认），'winterSolstice' 冬至=0°（京房卦气） */
  originMode?: 'jan1' | 'winterSolstice'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 480,
  innerRadius: 452,
  startDegree: 0,
  rotationDirection: 'clockwise',
  originMode: 'jan1'  // 默认：公历1月1日=0°，兼容其他视图
})

const timeRef = computed(() => unref(props.time) ?? new Date())

/** 当前公历年（拆出来让 yearLayout 只依赖 year，而非 timeRef 本身） */
const currentYear = computed(() => timeRef.value.getFullYear())

const MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
]

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/**
 * 🔑 性能关键：把「一整年 365/366 天的刻度布局」拆到只依赖 year / originMode
 * 的 computed。Vue computed 有值 memoization，year 不变则整年数组不重建。
 * 按住 D 键快速拖时间时，year 保持不变，这个大计算被跳过；下面的 ringData 只
 * 做一次浅拷贝 + 覆写当天那一项。
 */
const yearLayout = computed(() => {
  const year = currentYear.value
  const isLeap = isGregorianLeapYear(year)
  const daysInYear = isLeap ? 366 : 365
  const anglePerDay = 360 / daysInYear
  const ringWidth = props.radius - props.innerRadius

  // 角度基准偏移
  let originDayOfYear = 1
  if (props.originMode === 'winterSolstice') {
    const solarTerms = getSolarTermPositions(year)
    const winterSolstice = solarTerms.find(p => p.name === '冬至')
    originDayOfYear = winterSolstice?.dayOfYear ?? 355
  }

  // 每月首日索引（用 Map 免去 O(n) indexOf/includes）
  const monthStartIndex = new Map<number, number>()
  let accum = 1
  for (let m = 0; m < 12; m++) {
    monthStartIndex.set(accum, m)
    accum += (m === 1 && isLeap) ? 29 : DAYS_IN_MONTH[m]!
  }

  const dailyLen = ringWidth * 0.12
  const fiveLen = ringWidth * 0.28
  const monthLen = ringWidth * 0.50

  const items: PointRingData['items'] = new Array(daysInYear)

  for (let day = 1; day <= daysInYear; day++) {
    let daysFromOrigin = day - originDayOfYear
    if (daysFromOrigin < 0) {
      daysFromOrigin += daysInYear
    }
    const angle = (daysFromOrigin * anglePerDay) % 360

    const monthIdx = monthStartIndex.get(day)
    const isMonthStart = monthIdx !== undefined
    const isFiveDay = day % 5 === 0

    let tickInnerRatio: number
    let tickWidth: number
    let label: string
    let pointColor: string
    let highlightLevel: 0 | 1 | 2 | 3

    if (isMonthStart) {
      tickInnerRatio = 1 - monthLen / ringWidth
      tickWidth = 1.5
      label = MONTH_LABELS[monthIdx!] ?? ''
      pointColor = '#FFFFFF'
      highlightLevel = 1
    } else if (isFiveDay) {
      tickInnerRatio = 1 - fiveLen / ringWidth
      tickWidth = 0.6
      label = ''
      pointColor = '#999999'
      highlightLevel = 0
    } else {
      tickInnerRatio = 1 - dailyLen / ringWidth
      tickWidth = 0.3
      label = ''
      pointColor = '#555555'
      highlightLevel = 0
    }

    items[day - 1] = {
      angle,
      label,
      pointSymbol: 'tick',
      pointColor,
      fontSize: 7,
      tickInnerRatio: Math.max(0.4, tickInnerRatio),
      tickOuterRatio: 1.0,
      tickWidth,
      highlightLevel
    }
  }

  const labelOffset = Math.max(2, ringWidth * 0.1)

  return {
    items,
    ringWidth,
    labelOffset,
    monthStartIndex,
    daysInYear
  }
})

const currentDayOfYear = computed(() => getDayOfYear(timeRef.value))

const ringData = computed((): PointRingData => {
  const layout = yearLayout.value
  const day = currentDayOfYear.value
  const ringWidth = layout.ringWidth

  // 只对「当天」这一项做浅拷贝覆写，避免整年 items 数组重建
  const items = layout.items.slice()
  const idx = day - 1
  if (idx >= 0 && idx < items.length) {
    const orig = items[idx]!
    const monthIdx = layout.monthStartIndex.get(day)
    items[idx] = {
      ...orig,
      tickInnerRatio: 1 - (ringWidth * 0.55) / ringWidth,
      tickWidth: 3,
      // 当天恰逢月首时保留月份标签
      label: monthIdx !== undefined ? (MONTH_LABELS[monthIdx] ?? '') : '',
      pointColor: '#FF4444',
      highlightLevel: 3
    }
  }

  return {
    radius: props.radius,
    innerRadius: props.innerRadius,
    startDegree: props.startDegree,
    labelColor: '#FFFFFF',
    labelOffset: layout.labelOffset,
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
