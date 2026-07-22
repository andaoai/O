<script setup lang="ts">
/**
 * GuaRelationDeriveStatRing — 推衍层统计发光环
 *
 * 卡在每一层推衍环组的外侧，显示该层 64 个位置里出现的**唯一卦数** K：
 *   K = 64 → 无收敛，全信息保留，发金绿光
 *   K < 64 → 存在收敛（多对一映射），发红光
 *
 *   飞伏 R = 8（收敛到八纯卦） → 深红
 *   互卦 R = 16 或更少 → 橙红
 *   对/综/交 R = 64 无收敛 → 金绿
 *
 * 数值 K 显示在环的顶端（270° 位置），环体是一条渐变发光的窄圈。
 *
 * ⚠️ 圆环组件：接受 radius/innerRadius，无 time 依赖（纯派生自 derivedValues）
 */
import { computed } from 'vue'
import { polarToCartesian } from '@/utils/geometry'
import PolarCanvas from '../base/PolarCanvas.vue'

// ─── Props ───

interface Props {
  radius: number
  innerRadius: number
  /**
   * 该层每个位置显示的卦 value 数组（长度 64）
   *   - 第 0 层（源卦）：[0..63]，唯一数 = 64
   *   - 第 k 层：链式派生，可能存在收敛
   */
  derivedValues: readonly number[]
  /** 推衍层号（0=源卦，1..n=派生），仅用于文本显示 */
  layerIndex: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  startDegree?: number
}

const props = withDefaults(defineProps<Props>(), {
  rotationDirection: 'clockwise',
  startDegree: 0,
})

// ─── 唯一卦数计算 ───

/** 该层出现的唯一 value 集合大小 (1..64) */
const uniqueCount = computed(() => new Set(props.derivedValues).size)

/** 是否有收敛（丢失卦） */
const hasConvergence = computed(() => uniqueCount.value < 64)

/**
 * 发光色：绿(64) → 黄(48) → 橙(24) → 红(8)
 *
 * 使用 HSL 插值，色相从 120°(绿) 线性过渡到 0°(红)：
 *   hue = 120 × (K - 1) / 63
 *
 * 亮度整体压暗（避免抢占卦名文字视线）：
 *   有收敛 → 更暗（35% 亮度）
 *   无收敛 → 中暗（40% 亮度）
 */
const glowColor = computed(() => {
  const k = uniqueCount.value
  const t = Math.max(0, Math.min(1, (k - 1) / 63))
  const hue = Math.round(120 * t) // 0..120
  const lightness = hasConvergence.value ? 35 : 40
  return `hsl(${hue}, 70%, ${lightness}%)`
})

// ─── 几何 ───

/** 环的中间半径（用于放文字与描边圆） */
const midRadius = computed(() => (props.radius + props.innerRadius) / 2)
const strokeWidth = computed(() => Math.max(1.5, props.radius - props.innerRadius))

/** 文本落在正上方（270°），随 rotationDirection 处理坐标 */
const label = computed(() => `${uniqueCount.value}/64`)
const labelPos = computed(() => polarToCartesian(270, midRadius.value, props.rotationDirection))
const labelFontSize = computed(() => Math.max(9, Math.round(midRadius.value * 0.024)))

/** 唯一滤镜 id（避免多层实例冲突） */
const filterId = computed(() => `derive-stat-glow-${props.layerIndex}-${Math.round(props.radius)}`)
</script>

<template>
  <PolarCanvas
    :rotation-direction="rotationDirection"
    :enable-animation="false"
    :center-x="0"
    :center-y="0"
  >
    <template #default>
      <g class="derive-stat-ring">
        <!-- 发光滤镜（轻量光晕，不过度晕染） -->
        <defs>
          <filter :id="filterId" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- 环体：低亮度圆 -->
        <circle
          cx="0"
          cy="0"
          :r="midRadius"
          fill="none"
          :stroke="glowColor"
          :stroke-width="strokeWidth"
          :opacity="hasConvergence ? 0.55 : 0.32"
          :filter="`url(#${filterId})`"
          class="stat-arc"
          :class="{ 'stat-arc--warn': hasConvergence }"
        />

        <!-- 数值标签（在环顶正上方，配衬底色块） -->
        <g :transform="`translate(${labelPos.x}, ${labelPos.y})`">
          <rect
            :x="-labelFontSize * 1.6"
            :y="-labelFontSize * 0.7"
            :width="labelFontSize * 3.2"
            :height="labelFontSize * 1.4"
            rx="3"
            fill="rgba(0, 0, 0, 0.8)"
            :stroke="glowColor"
            stroke-width="0.6"
            :opacity="0.7"
          />
          <text
            x="0"
            y="0"
            text-anchor="middle"
            dominant-baseline="central"
            :fill="glowColor"
            :font-size="labelFontSize"
            font-weight="bold"
            :opacity="0.85"
          >
            {{ label }}
          </text>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.derive-stat-ring {
  pointer-events: none;
}
.stat-arc {
  animation: derive-stat-glow-pulse 3.5s ease-in-out infinite;
}
.stat-arc--warn {
  animation: derive-stat-glow-warn 1.6s ease-in-out infinite;
}
@keyframes derive-stat-glow-pulse {
  0%, 100% { opacity: 0.22; }
  50%      { opacity: 0.4;  }
}
@keyframes derive-stat-glow-warn {
  0%, 100% { opacity: 0.38; }
  50%      { opacity: 0.62; }
}
</style>
