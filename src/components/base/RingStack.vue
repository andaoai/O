<script setup lang="ts">
/**
 * RingStack - 同心圆环自动布局容器
 *
 * 解决的问题：
 *   过去每个圆环组件的半径都要在 App.vue 里手动写死，叠加时极易重叠。
 *   RingStack 让调用方只声明每个环的"径向厚度"，容器从外向内自动累加分配
 *   radius / innerRadius，叠加时永不重叠。
 *
 * 🔹 扩展：中心填充环 + Slot 暴露内缘半径
 *   - 所有环渲染完成后，通过 default slot 暴露 innerRadius（最内圈的内缘半径）
 *   - 父组件可在 slot 中放置 SkyChart / HelioOrbits 等中心组件，自动适配半径
 *   - 实现：单一来源 → 全圆盘半径自动计算，零手动配置
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
  /**
   * 该环的径向厚度（外半径 - 内半径）
   * - 若不指定：自动填充从当前位置到圆心的全部剩余空间
   * - 通常用于最内环（如 SkyChart），零手动配置
   */
  thickness?: number
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
 *
 * 🔹 自动填充模式：thickness 省略时，从当前位置填充到圆心
 * 用于最内环（如 SkyChart），零手动半径配置
 */
const resolvedRings = computed(() => {
  let cursor = props.outerRadius
  return props.rings.map((ring, index) => {
    if (index > 0) {
      cursor -= ring.gapBefore ?? props.gap
    }
    const radius = cursor
    // thickness 省略时：自动填充到圆心（innerRadius = 0）
    const innerRadius = ring.thickness !== undefined ? cursor - ring.thickness : 0
    cursor = innerRadius
    return {
      component: ring.component,
      radius,
      innerRadius,
      extraProps: ring.props ?? {}
    }
  })
})

/**
 * 🔹 内缘半径：所有环渲染完成后的最内侧半径
 * 暴露给 default slot，供中心组件（SkyChart/HelioOrbits）自动适配
 */
const innerRadius = computed(() => {
  const last = resolvedRings.value[resolvedRings.value.length - 1]
  return last ? last.innerRadius : props.outerRadius
})
</script>

<template>
  <g class="ring-stack">
    <!-- 外圈同心环 -->
    <component
      :is="ring.component"
      v-for="(ring, index) in resolvedRings"
      :key="index"
      :radius="ring.radius"
      :inner-radius="ring.innerRadius"
      :rotation-direction="rotationDirection"
      v-bind="ring.extraProps"
    />
    <!-- 🔹 中心填充区 Slot：暴露内缘半径，供 SkyChart 等中心组件自动适配 -->
    <slot name="center" :inner-radius="innerRadius" />
  </g>
</template>
