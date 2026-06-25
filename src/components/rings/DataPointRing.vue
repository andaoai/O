<script setup lang="ts">
/**
 * DataPointRing - 数据驱动的点圆环
 *
 * 类似于 DataRing，但用于点导向的数据（如二十四节气）。
 * 调用方传入 PointRingData 数据对象，渲染逻辑由 PointRing 处理。
 */
import { computed } from 'vue'
import PointRing from '../base/PointRing.vue'
import type { PointRingData } from '@/data/rings/types'

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

/** 半径：优先用注入值，回退到数据默认值 */
const resolvedRadius = computed(() => props.radius ?? props.data.radius ?? 200)
const resolvedInnerRadius = computed(() => props.innerRadius ?? props.data.innerRadius ?? 0)
const resolvedStartDegree = computed(() => props.startDegree ?? props.data.startDegree ?? 0)

/** 把 data.fontSize 下发到没有单独指定字号的 item */
const items = computed(() => {
  const fontSize = props.data.fontSize
  if (fontSize === undefined) return props.data.items
  return props.data.items.map(item =>
    item.fontSize === undefined ? { ...item, fontSize } : item
  )
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
    :label-angle-offset="(data as any).labelAngleOffset ?? 0"
    :point-size="data.pointSize ?? 4"
    :point-color="data.pointColor ?? '#ffffff'"
    :point-symbol="data.pointSymbol ?? 'circle'"
    :circle-color="data.circleColor ?? '#888888'"
    :circle-width="data.circleWidth ?? 1"
    :show-points="true"
    :show-labels="true"
    :show-circle="true"
    :enable-animation="false"
  />
</template>
