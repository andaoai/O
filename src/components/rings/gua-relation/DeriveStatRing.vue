<script setup lang="ts">
/**
 * DeriveStatRing — 推衍层统计发光环（独立占厚一整环）
 *
 * 卡在每一层推衍环组的外侧，独占一层厚度显示该层 64 个位置里出现的**唯一卦数** K：
 *   K = 64 → 无收敛，全信息保留，发绿光
 *   K < 64 → 存在收敛（多对一映射），发红光
 *
 *   飞伏 R = 8（收敛到八纯卦） → 深红
 *   互卦 R = 16 或更少 → 橙红
 *   对/综/交 R = 64 无收敛 → 绿
 *
 * 环体本身作为文字的背景条（低透明度色带），文字 K/64 沿环身在正上方 270°
 * 独立呈现，永不与相邻卦名/卦符重叠。
 *
 * ⚠️ 圆环组件：接受 radius/innerRadius，无 time 依赖（纯派生自 derivedValues）
 */
import { computed } from 'vue'
import { polarToCartesian } from '@/utils/geometry'
import PolarCanvas from '../../base/PolarCanvas.vue'

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
 * HSL 色相从 120°(绿) 线性过渡到 0°(红)：
 *   hue = 120 × (K - 1) / 63
 */
const glowColor = computed(() => {
  const k = uniqueCount.value
  const t = Math.max(0, Math.min(1, (k - 1) / 63))
  const hue = Math.round(120 * t) // 0..120
  const lightness = hasConvergence.value ? 40 : 45
  return `hsl(${hue}, 70%, ${lightness}%)`
})

// ─── 几何 ───

/** 环的中间半径（文字与环带都居中于此） */
const midRadius = computed(() => (props.radius + props.innerRadius) / 2)
/** 环带 stroke 宽度（占据整个厚度，作为文字底色带） */
const bandWidth = computed(() => Math.max(2, props.radius - props.innerRadius))

/** 文本落在正上方（270°） */
const label = computed(() => `${uniqueCount.value}/64`)
const labelPos = computed(() => polarToCartesian(270, midRadius.value, props.rotationDirection))
/** 文字大小：不超过环厚的 65%，保底 9px */
const labelFontSize = computed(() => Math.max(9, Math.min(14, Math.round(bandWidth.value * 0.65))))

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
        <!-- 发光滤镜（仅作用于顶部数字标签） -->
        <defs>
          <filter :id="filterId" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- 环带：整环低透明度色带（独占厚度，不与相邻环重叠） -->
        <circle
          cx="0"
          cy="0"
          :r="midRadius"
          fill="none"
          :stroke="glowColor"
          :stroke-width="bandWidth"
          :opacity="hasConvergence ? 0.22 : 0.14"
          class="stat-band"
          :class="{ 'stat-band--warn': hasConvergence }"
        />

        <!-- 数值标签：贴环带正中，无背景块（背景已由环带承担） -->
        <text
          :x="labelPos.x"
          :y="labelPos.y"
          text-anchor="middle"
          dominant-baseline="central"
          :fill="glowColor"
          :font-size="labelFontSize"
          font-weight="bold"
          :opacity="hasConvergence ? 0.95 : 0.8"
          :filter="`url(#${filterId})`"
        >
          {{ label }}
        </text>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.derive-stat-ring {
  pointer-events: none;
}
.stat-band {
  animation: derive-stat-band-pulse 3.5s ease-in-out infinite;
}
.stat-band--warn {
  animation: derive-stat-band-warn 1.8s ease-in-out infinite;
}
@keyframes derive-stat-band-pulse {
  0%, 100% { opacity: 0.10; }
  50%      { opacity: 0.18; }
}
@keyframes derive-stat-band-warn {
  0%, 100% { opacity: 0.18; }
  50%      { opacity: 0.32; }
}
</style>
