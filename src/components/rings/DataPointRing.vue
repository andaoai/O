<script setup lang="ts">
/**
 * DataPointRing - 数据驱动的点圆环
 *
 * 类似于 DataRing，但用于点导向的数据（如二十四节气）。
 * 调用方传入 PointRingData 数据对象，渲染逻辑由 PointRing 处理。
 *
 * 使用 useRingBase composable 消除与 DataRing 的重复逻辑。
 */
import PointRing from '../base/PointRing.vue'
import { useRingBase } from '@/composables/useRingBase'
import type { PointRingData, PointItem } from '@/data/rings/types'

interface Props {
  /** 点圆环数据 */
  data: PointRingData
  /** 半径，覆盖 data.radius（RingStack 注入） */
  radius?: number
  /** 内半径，覆盖 data.innerRadius（RingStack 注入） */
  innerRadius?: number
  /** 起始度数，覆盖 data.startDegree */
  startDegree?: number
  /** 旋转方向（RingStack 注入） */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = defineProps<Props>()

/** 使用通用圆环基础逻辑（与 DataRing 共享同一实现） */
const {
  resolvedRadius,
  resolvedInnerRadius,
  resolvedStartDegree,
  itemsWithFontSize: items
} = useRingBase<PointRingData, PointItem>(props, {
  radius: 200,
  innerRadius: 0,
  startDegree: 0
})
</script>

<template>
  <PointRing
    :radius="resolvedRadius"
    :inner-radius="resolvedInnerRadius"
    :items="items"
    :start-degree="resolvedStartDegree"
    :rotation-direction="rotationDirection ?? 'clockwise'"
    :label-color="data.labelColor ?? 'white'"
    :label-offset="data.labelOffset ?? 15"
    :label-offset-base="data.labelOffsetBase ?? 'outer'"
    :label-angle-offset="data.labelAngleOffset ?? 0"
    :point-size="data.pointSize ?? 4"
    :point-color="data.pointColor ?? '#ffffff'"
    :point-symbol="data.pointSymbol ?? 'circle'"
    :tick-inner-ratio="data.tickInnerRatio ?? 0.75"
    :tick-outer-ratio="data.tickOuterRatio ?? 1.0"
    :tick-width="data.tickWidth ?? 1"
    :circle-color="data.circleColor ?? '#888888'"
    :circle-width="data.circleWidth ?? 1"
    :show-points="true"
    :show-labels="true"
    :show-circle="true"
    :enable-animation="false"
  />
</template>
