<script setup lang="ts">
/**
 * DataRing - 数据驱动的通用圆环
 *
 * 取代过去十余个近乎重复的传统圆环组件（地支、天干、纳音……）。
 * 调用方只需传入一个 RingData 数据对象，渲染/布局/旋转全部由本组件
 * 和 CircleRing 处理。布局参数（radius/innerRadius/startDegree/rotationDirection）
 * 可由 RingStack 注入以覆盖 data 中的默认值。
 *
 * 使用 useRingBase composable 消除与 DataPointRing 的重复逻辑。
 */
import CircleRing from '../base/CircleRing.vue'
import { useRingBase } from '@/composables/useRingBase'
import type { RingData, RingItem } from '@/data/rings/types'

interface Props {
  /** 圆环数据（items + 样式默认值） */
  data: RingData
  /** 外半径，覆盖 data.radius（RingStack 注入） */
  radius?: number
  /** 内半径，覆盖 data.innerRadius（RingStack 注入） */
  innerRadius?: number
  /** 起始度数，覆盖 data.startDegree */
  startDegree?: number
  /** 旋转方向（RingStack 注入） */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = defineProps<Props>()

/** 使用通用圆环基础逻辑（与 DataPointRing 共享同一实现） */
const {
  resolvedRadius,
  resolvedInnerRadius,
  resolvedStartDegree,
  itemsWithFontSize: items
} = useRingBase<RingData, RingItem>(props, {
  radius: 200,
  innerRadius: 0,
  startDegree: 0
})
</script>

<template>
  <CircleRing
    :radius="resolvedRadius"
    :inner-radius="resolvedInnerRadius"
    :items="items"
    :start-degree="resolvedStartDegree"
    :rotation-direction="rotationDirection ?? 'clockwise'"
    :show-sectors="data.showSectors ?? false"
    :vertical-two-char="data.verticalTwoChar ?? false"
    :label-color="data.labelColor ?? 'white'"
    :label-position="data.labelPosition ?? 0.5"
    :circle-color="data.circleColor ?? '#888888'"
    :circle-width="data.circleWidth ?? 1"
    :tick-color="data.tickColor ?? '#666666'"
    :tick-width="data.tickWidth ?? 0.5"
    :show-ticks="true"
    :show-circle="true"
    :enable-animation="false"
  />
</template>
