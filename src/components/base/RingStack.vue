<script setup lang="ts">
/**
 * 🏛 RingStack - 五层架构 · 同心圆环自动布局容器
 *
 * ═══════════════════════════════════════════════════════════════
 *  完整架构体系：【圆环区 + 圆心区】二分法
 * ═══════════════════════════════════════════════════════════════
 *
 * 解决的核心问题：
 *   过去每个圆环组件的半径都要在父组件里手动写死，叠加时极易重叠。
 *   RingStack 让调用方只声明每个环的"径向厚度"，容器从外向内自动累加分配
 *   radius / innerRadius，叠加时永不重叠。
 *
 * ┌─────────────────────────────────────────────────────────────┐
 *  │  架构分层（从外到内）                                        │
 *  ├─────────────────────────────────────────────────────────────┤
 *  │  【圆环区】outerRings 数组                                   │
 *  │    ↳ 段环：SixtyJiaziRing / BranchesRing / ...             │
 *  │    ↳ 点环：SolarTermsRing / DegreeScale / ...              │
 *  │    ↳ 体环：SevenLuminariesRing / MansionDegreeRing / ...   │
 *  │    ↳ 复合环：SkyChart (自动填充剩余空间)                    │
 *  │                                                             │
 *  │  【圆心区】#center slot (BaseCenter 统一管理)               │
 *  │    ↳ 圆心组件：BeidouCenter / HelioOrbits / ...            │
 *  │    ↳ 支持多层嵌套：SuzhouSkyMap 叠 WorldMapCenter            │
 *  └─────────────────────────────────────────────────────────────┘
 *
 * 🔹 核心特性：
 *   1. 自动计算：所有圆环 radius / innerRadius 100% 自动分配，永不重叠
 *   2. 自动填充：最内环省略 thickness 时，自动填满剩余到圆心的全部空间
 *   3. 内缘暴露：通过 #center slot 暴露 innerRadius 给圆心组件自动适配
 *   4. 统一注入：rotationDirection 自动注入所有子环
 *
 * 📐 使用约定：
 *   - rings 数组按"由外到内"的顺序声明
 *   - 每个环组件需支持 radius / innerRadius / rotationDirection props
 *   - 圆心组件使用 BaseCenter 包裹，自动计算安全边距与缩放
 *   - 本组件不输出 <svg>/<g>，沿用项目约定由父级 <g transform> 定位
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
    <!-- 🔹 圆心组件区 Slot：自动暴露核心半径
         ══════════════════════════════════════════
         使用方式：
         <template #center="{ innerRadius }">
           <BeidouCenter :radius="innerRadius * 0.8" :time="controlledTime" />
         </template>

         设计原则：
         1. 圆环 → outerRings 数组（RingStack 自动布局）
         2. 圆心 → #center slot（自动填充剩余空间）
         3. 圆心组件只接收 radius 参数，自动适配大小
         ══════════════════════════════════════════ -->
    <slot name="center" :inner-radius="innerRadius" />
  </g>
</template>
