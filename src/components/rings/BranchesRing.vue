<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import { twelveShichen } from '@/data/rings'
import { getJiaziIndices, branchOf, type PillarId } from '@/utils/liushiJiazi'
import { colorOfBranch } from '@/utils/wuxing'

/**
 * 十二地支环组件
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一使用 unref()
 *
 * 根据传入的时间自动计算当前柱（年/月/日/时/分/秒）所在的地支位置，
 * 并高亮该格。
 */

interface Props {
  /** 时间源（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  /** 环外半径 */
  radius?: number
  /** 环内半径 */
  innerRadius?: number
  /** 柱类型：年/月/日/时/分/秒 */
  pillarId?: PillarId
  /** 高亮色（默认按地支五行自动配色） */
  highlightColor?: string
  /** 圈边颜色 */
  circleColor?: string
  /** 圈边宽度 */
  circleWidth?: number
  /** 起始度数（RingStack 注入，覆盖 data 默认值） */
  startDegree?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  pillarId: 'day',
  radius: 200,
  innerRadius: 180,
  circleColor: '#555555',
  circleWidth: 1,
  startDegree: 0,
  rotationDirection: 'clockwise'
})

/** ⚠️ 时间驱动统一范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 当前各柱的六十甲子序号 */
const currentIndices = computed(() => getJiaziIndices(timeRef.value))

/** 当前柱的甲子序号 */
const jiaziIndex = computed(() => currentIndices.value[props.pillarId])

/** 当前柱的地支序号 */
const activeBranch = computed(() => branchOf(jiaziIndex.value))

/** 当前柱的高亮色（按地支五行自动配色） */
const activeColor = computed(() => {
  if (props.highlightColor) return props.highlightColor
  return colorOfBranch(activeBranch.value)
})

/** 非当前格统一灰色 */
const GREY = '#555'

/** 十二地支环数据（随时间变化自动高亮） */
const ringData = computed(() => ({
  ...twelveShichen,
  circleColor: props.circleColor,
  circleWidth: props.circleWidth,
  items: twelveShichen.items.map((item, index) => ({
    ...item,
    color: index === activeBranch.value ? activeColor.value : GREY,
    fontSize: index === activeBranch.value ? 14 : 11,
    highlight: index === activeBranch.value
  }))
}))
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
