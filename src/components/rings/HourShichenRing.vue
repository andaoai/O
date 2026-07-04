<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import { BRANCHES } from '@/utils/constants/ganzhi'
import { getJiaziIndices, branchOf } from '@/utils/liushiJiazi'
import { branchIndexToScreenCenter, centerToArcSpan } from '@/utils/jianJiang'
import { colorOfBranch } from '@/utils/wuxing'

/**
 * 时辰环组件（段环 · 时间驱动）
 *
 * ⚠️ 五层架构：接受 MaybeRef<Date>，内部统一为 timeRef computed。
 *
 * 「时辰」= 时柱地支，一日循环一圈（子时 23:00 起，每两小时一格）。
 *
 * 🎯 本环在观斗盘中的关键角色：
 *   北斗斗柄一日绕天极旋转 360°，任意时刻的物理指向 = 当前时辰。
 *   古法「初昏斗柄指卯 = 春」之所以成立，是因为在戌时（约 19:00）
 *   这个固定观测时刻，斗柄的时辰指向被「锁」住，此时它才折算为月建（季节）。
 *   本环让"斗柄射线的实时物理落点"直观可读——射线永远精确指向本环高亮格。
 *
 * ⚠️ 方位约定：与 MonthEstablishRing 同用「面朝北仰望」坐标，同轴对齐。
 */

interface Props {
  /** 时间源（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  highlightColor?: string
  /** 圈边颜色（默认青色，呼应圆心斗柄射线，暗示"斗柄实时所指=时辰"） */
  circleColor?: string
  circleWidth?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  circleColor: '#4A9EA8',
  circleWidth: 1.6,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

const hourJiaziIndex = computed(() => getJiaziIndices(timeRef.value).hour)
const activeBranch = computed(() => branchOf(hourJiaziIndex.value))
const activeColor = computed(() => {
  if (props.highlightColor) return props.highlightColor
  return colorOfBranch(activeBranch.value)
})

const GREY = '#666'

/**
 * 时辰环数据（面朝北仰望约定，与月建环同构对齐）
 */
const ringData = computed(() => ({
  startDegree: 0,
  circleColor: props.circleColor,
  circleWidth: props.circleWidth,
  tickColor: '#666666',
  tickWidth: 0.8,
  fontSize: 16,
  items: BRANCHES.map((branchName, index) => {
    const isActive = index === activeBranch.value
    const center = branchIndexToScreenCenter(index)
    const { startAngle, endAngle } = centerToArcSpan(center)
    return {
      label: isActive ? `${branchName} 时` : branchName,
      startAngle,
      endAngle,
      color: isActive ? activeColor.value : GREY,
      fontSize: isActive ? 20 : 16,
      highlight: isActive
    }
  })
}))
</script>

<template>
  <DataRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :rotation-direction="rotationDirection"
  />
</template>
