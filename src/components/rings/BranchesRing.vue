<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import { twelveShichen } from '@/data/rings'
import { getJiaziIndices, branchOf } from '@/utils/liushiJiazi'

/**
 * 十二地支环组件
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一使用 unref()
 *
 * 根据传入的时间自动计算当前柱（年/月/日/时/分/秒）所在的地支位置，
 * 并高亮该格。
 */
type PillarId = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'

/** 五行配色（与纳音环同款色值，保证全盘一致） */
const WUXING_COLORS: Record<string, string> = {
  木: '#2ECC71',
  火: '#E74C3C',
  土: '#D35400',
  金: '#F1C40F',
  水: '#3498DB'
}

/** 十二地支五行：子水丑土寅木卯木辰土巳火午火未土申金酉金戌土亥水 */
const BRANCH_ELEMENTS = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水']

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
  return WUXING_COLORS[BRANCH_ELEMENTS[activeBranch.value]!]!
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
