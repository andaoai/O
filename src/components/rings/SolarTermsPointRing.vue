<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataPointRing from './DataPointRing.vue'
import { sunLongitude } from '@/utils/celestial'
import { getSolarTermPositions, isGregorianLeapYear } from '@/utils/chineseCalendar'
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
 * 🔑 角度对齐（2026-06 修复）：
 *   旧版将节气以固定 15° 间隔均匀铺开（立春恒在 0°），
 *   与 DayScaleRing 的 365 天日点刻度完全错位。
 *   现改为通过 getSolarTermPositions() 获取各节气在当年公历
 *   中的确切日序，再换算为角度：angle = (dayOfYear-1)/daysInYear*360，
 *   确保节气刻度线与日点环精确对齐。
 *
 * 🔑 基准模式（originMode）：
 *   - 'jan1'：公历 1 月 1 日 = 0°（默认，与回归年刻度对齐）
 *   - 'winterSolstice'：冬至日 = 0°（京房卦气体系专用）
 *
 * 标签从内缘向外偏移，始终在自环内，不与外层 DayScaleRing 重叠。
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
  radius: 200,
  innerRadius: 178,
  startDegree: 0,
  rotationDirection: 'clockwise',
  originMode: 'jan1'  // 默认：公历1月1日=0°，兼容其他视图
})

const timeRef = computed(() => unref(props.time) ?? new Date())
const norm = (a: number) => ((a % 360) + 360) % 360

const ringData = computed((): PointRingData => {
  const time = timeRef.value
  const year = time.getFullYear()
  const daysInYear = isGregorianLeapYear(year) ? 366 : 365
  const anglePerDay = 360 / daysInYear

  // 🔑 获取当年每个节气的确切公历日序
  const positions = getSolarTermPositions(year)

  // 🔑 计算角度基准偏移
  let originDayOfYear = 1  // 默认：公历 1 月 1 日 = 0°
  if (props.originMode === 'winterSolstice') {
    const winterSolsticePos = positions.find(p => p.name === '冬至')
    originDayOfYear = winterSolsticePos?.dayOfYear ?? 355
  }

  // 当前节气检测（基于太阳黄经，立春=0 起序）
  const sunLon = sunLongitude(time)
  const currentLichunIndex = Math.floor(norm(sunLon - 315) / 15)

  const ringWidth = props.radius - props.innerRadius

  const specialNames = new Set(['春分', '夏至', '秋分', '冬至'])

  // 刻度长度（从外缘向内）
  const baseLen = ringWidth * 0.35     // 普通节气
  const specialLen = ringWidth * 0.50  // 二分二至
  const currentLen = ringWidth * 0.65  // 当前节气

  const items: PointRingData['items'] = positions.map((pos) => {
    // 🔑 角度 = 相对于基准日的日差
    let daysFromOrigin = pos.dayOfYear - originDayOfYear
    if (daysFromOrigin < 0) {
      daysFromOrigin += daysInYear
    }
    const angle = (daysFromOrigin * anglePerDay) % 360

    const isZhongQi = pos.isMidTerm
    const isCurrent = pos.lichunIndex === currentLichunIndex
    const isSpecial = specialNames.has(pos.name)

    const len = isCurrent ? currentLen : (isSpecial ? specialLen : baseLen)
    const tickInnerRatio = 1 - len / ringWidth

    return {
      label: pos.name,
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
      fontSize: 9,
      color: isCurrent ? '#FFD700' : (isSpecial ? '#FFD700' : '#CCCCCC'),
      highlightLevel: (isCurrent ? 3 : 0) as 0 | 1 | 2 | 3
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
