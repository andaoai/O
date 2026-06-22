<script setup lang="ts">
/**
 * RingStack - 同心圆环自动布局容器
 *
 * 解决的问题：
 *   过去每个圆环组件的半径都要在 App.vue 里手动写死，叠加时极易重叠。
 *   RingStack 让调用方只声明每个环的"径向厚度"，容器从外向内自动累加分配
 *   radius / innerRadius，叠加时永不重叠。
 *
 * 约定：
 *   - rings 数组按"由外到内"的顺序声明。
 *   - 每个环组件需支持 radius / innerRadius / rotationDirection props
 *     （本项目所有分格圆环组件已统一此接口）。
 *   - 本组件不输出 <svg>/<g>，沿用项目约定由父级 <g transform> 定位。
 */
import { computed, type Component } from 'vue'

interface RingConfig {
  /** 环组件（建议用 markRaw 包裹，避免被响应式代理） */
  component: Component
  /** 该环的径向厚度（外半径 - 内半径） */
  thickness: number
  /** 与外侧相邻环的间隙，覆盖默认 gap */
  gapBefore?: number
  /** 透传给该环的额外 props（如 startDegree、scaleInterval 等） */
  props?: Record<string, unknown>
}

interface Props {
  /** 最外环的外缘半径 */
  outerRadius: number
  /** 环间默认间隙 */
  gap?: number
  /** 由外到内的环配置列表 */
  rings: RingConfig[]
  /** 统一注入所有环的旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  gap: 2,
  rotationDirection: 'clockwise'
})

/**
 * 从 outerRadius 起向内累加，为每个环计算 radius / innerRadius。
 * 第一个环外侧不留间隙，后续环之间使用 gapBefore ?? gap。
 */
const resolvedRings = computed(() => {
  let cursor = props.outerRadius
  return props.rings.map((ring, index) => {
    if (index > 0) {
      cursor -= ring.gapBefore ?? props.gap
    }
    const radius = cursor
    const innerRadius = cursor - ring.thickness
    cursor = innerRadius
    return {
      component: ring.component,
      radius,
      innerRadius,
      extraProps: ring.props ?? {}
    }
  })
})
</script>

<template>
  <g class="ring-stack">
    <component
      :is="ring.component"
      v-for="(ring, index) in resolvedRings"
      :key="index"
      :radius="ring.radius"
      :inner-radius="ring.innerRadius"
      :rotation-direction="rotationDirection"
      v-bind="ring.extraProps"
    />
  </g>
</template>
