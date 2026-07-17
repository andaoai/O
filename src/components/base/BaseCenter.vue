<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'

/**
 * ⚫ BaseCenter - 圆心基础组件（与 Ring 基础组件对应）
 *
 * 五层架构规范：所有圆心组件的统一基类
 * ════════════════════════════════════════════════════
 *
 * 设计原则：
 *   1. 自动适配：接收 RingStack #center slot 提供的 innerRadius
 *   2. 安全边距：自动计算缩放系数，不与外层环碰撞
 *   3. 统一接口：所有圆心组件共享相同的 Props 规范
 *   4. 时间驱动：内置 MaybeRef<Date> 响应式支持
 *
 * 使用方式：
 *   <template #center="{ innerRadius }">
 *     <BaseCenter :radius="innerRadius" :scale="0.8">
 *       <BeidouCenter :time="controlledTime" />
 *     </BaseCenter>
 *   </template>
 *
 * 架构对应关系：
 *   RingStack → 圆环自动布局容器
 *   CircleRing → 圆环渲染基础
 *   BaseCenter → 圆心渲染基础 ✅
 */
interface Props {
  /** 圆心区的最大可用半径（由 RingStack #center slot 注入） */
  radius?: number
  /** 缩放系数 (0.1 ~ 1.0)，自动留出安全边距 */
  scale?: number
  /** 背景填充色 */
  fill?: string
  /** 边框颜色 */
  stroke?: string
  /** 边框宽度 */
  strokeWidth?: number
  /** 统一旋转方向控制 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 时间源（支持 ref 或 plain value，透传给插槽内容） */
  time?: MaybeRef<Date>
}

const props = withDefaults(defineProps<Props>(), {
  radius: 100,
  scale: 0.8,
  fill: 'transparent',
  stroke: 'none',
  strokeWidth: 0,
  rotationDirection: 'clockwise'
})

/** ⚠️ 五层架构范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 实际渲染半径 = 最大可用半径 × 缩放系数（自动留出安全边距） */
const actualRadius = computed(() => props.radius * Math.max(0.1, Math.min(1.0, props.scale)))

/** 安全边距宽度（圆心区与最内环之间的留白） */
const safeMargin = computed(() => props.radius - actualRadius.value)
</script>

<template>
  <g class="base-center">
    <!-- 圆心区背景边框（调试时可显示，确认安全边距） -->
    <circle
      v-if="stroke !== 'none'"
      cx="0"
      cy="0"
      :r="actualRadius"
      :fill="fill"
      :stroke="stroke"
      :stroke-width="strokeWidth"
      opacity="0.3"
    />

    <!-- 🔹 圆心内容插槽
         子组件接收：
           - actualRadius：实际可用半径（已缩放）
           - safeMargin：安全边距宽度
           - timeRef：响应式时间引用
           - rotationDirection：旋转方向
    -->
    <slot
      :actual-radius="actualRadius"
      :safe-margin="safeMargin"
      :time="timeRef"
      :rotation-direction="rotationDirection"
    />
  </g>
</template>

<style scoped>
.base-center {
  /* 圆心组件默认无额外样式，内容居中于 (0, 0) */
  transform-origin: center;
}
</style>
