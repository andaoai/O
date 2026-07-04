<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import { BRANCHES } from '@/utils/constants/ganzhi'
import { getJiaziIndices, branchOf } from '@/utils/liushiJiazi'
import { branchIndexToScreenCenter, centerToArcSpan } from '@/utils/jianJiang'
import { colorOfBranch } from '@/utils/wuxing'

/**
 * 月建环组件（段环 · 时间驱动）
 *
 * ⚠️ 五层架构：接受 MaybeRef<Date>，内部统一为 timeRef computed。
 *
 * 「建月」体系：北斗七星斗柄在赤道十二辰中的指向，一年转一圈。
 *   正月建寅 → 二月建卯 → ……
 * 高亮取月柱地支：tyme4ts 按节气立春分年、正月建寅，
 * 与传统建月体系严格一致。
 *
 * ⚠️ 方位约定：本盘使用「面朝北仰望」坐标（子北在下、卯东在右、
 *   午南在上、酉西在左；地支顺序在盘上呈逆时针）。
 *   与项目其他盘（六十甲子六环等，用"上北下南"地图约定）方向不同。
 *   角度派生自 utils/jianJiang.ts 的 branchIndexToScreenCenter()。
 */

/** 月建对应表：地支索引 → 月序中文名（正月起于寅位） */
const BRANCH_TO_MONTH_LABEL: Record<number, string> = {
  2: '正月',  // 寅
  3: '二月',  // 卯
  4: '三月',  // 辰
  5: '四月',  // 巳
  6: '五月',  // 午
  7: '六月',  // 未
  8: '七月',  // 申
  9: '八月',  // 酉
  10: '九月', // 戌
  11: '十月', // 亥
  0: '仲冬',  // 子（十一月）
  1: '腊月'   // 丑
}

interface Props {
  /** 时间源（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  /** 环外半径（RingStack 自动注入） */
  radius?: number
  /** 环内半径（RingStack 自动注入） */
  innerRadius?: number
  /** 高亮色（默认按地支五行自动配色） */
  highlightColor?: string
  /** 圈边颜色 */
  circleColor?: string
  /** 圈边宽度 */
  circleWidth?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  circleColor: '#9C6B22',
  circleWidth: 1.6,
  rotationDirection: 'clockwise'
})

/** ⚠️ 五层架构范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 当前月柱六十甲子序号 */
const monthJiaziIndex = computed(() => getJiaziIndices(timeRef.value).month)

/** 当前月建地支序号（子=0…亥=11） */
const activeBranch = computed(() => branchOf(monthJiaziIndex.value))

/** 当前月建高亮色（按地支五行自动配色） */
const activeColor = computed(() => {
  if (props.highlightColor) return props.highlightColor
  return colorOfBranch(activeBranch.value)
})

/** 非当前格灰色 */
const GREY = '#666'

/**
 * 月建环数据（面朝北仰望约定）
 *
 * items 直接以「地支索引 → 屏幕 SVG 中心角度」派生：
 *   子=SVG 90°（下）、卯=SVG 0°（右）、午=SVG 270°（上）、酉=SVG 180°（左）。
 * 地支顺序在盘上呈逆时针，与斗柄的物理旋转方向一致。
 */
const ringData = computed(() => ({
  startDegree: 0,
  circleColor: props.circleColor,
  circleWidth: props.circleWidth,
  tickColor: '#666666',
  tickWidth: 0.8,
  fontSize: 18,
  items: BRANCHES.map((branchName, index) => {
    const isActive = index === activeBranch.value
    const center = branchIndexToScreenCenter(index)
    const { startAngle, endAngle } = centerToArcSpan(center)
    return {
      label: isActive
        ? `${branchName} ${BRANCH_TO_MONTH_LABEL[index] ?? ''}`
        : branchName,
      startAngle,
      endAngle,
      color: isActive ? activeColor.value : GREY,
      fontSize: isActive ? 22 : 18,
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
