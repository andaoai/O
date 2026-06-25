<script setup lang="ts">
import { computed } from 'vue'
import { polarToCartesian, radialTextRotation } from '@/utils/geometry'

/**
 * 七曜入宿度环
 *
 * 七曜是「点」天体（非区间），故本环不分格，而是在环上按各自赤经位置打 7 个标记：
 * 每个标记 = 径向刻线 + 七曜符号 + 入宿度数。入宿度 = 该曜距所入宿距星的度数。
 *
 * 由 RingStack 注入 radius / innerRadius；标记的屏幕角由父级按赤经算好传入，
 * 坐标与朝向严格对齐 CircleRing（clockwise：(cosθ,sinθ)·r，文字 rotation = θ+90 顶部朝心）。
 */
interface Marker {
  /** 屏幕角（度，clockwise，0°在正右） */
  angle: number
  /** 七曜符号（日月水金火木土） */
  symbol: string
  /** 颜色 */
  color: string
  /** 入宿度数（度） */
  degree: number
}

interface Props {
  radius?: number
  innerRadius?: number
  markers?: Marker[]
  /** RingStack 会注入，本环无方向概念，声明以避免透传到 DOM */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 170,
  markers: () => [],
  rotationDirection: 'clockwise'
})

/** clockwise/counterclockwise 统一走 geometry，修复此前写死 clockwise 的逆时针错位 bug */
const polar = (angle: number, r: number) => polarToCartesian(angle, r, props.rotationDirection)

const items = computed(() =>
  props.markers.map((m, i) => {
    const inner = polar(m.angle, props.innerRadius)
    const outer = polar(m.angle, props.radius)
    // 文字放在环径向中点
    const textR = props.innerRadius + (props.radius - props.innerRadius) * 0.5
    const pos = polar(m.angle, textR)
    return {
      key: `${m.symbol}-${i}`,
      x1: inner.x,
      y1: inner.y,
      x2: outer.x,
      y2: outer.y,
      tx: pos.x,
      ty: pos.y,
      rotation: radialTextRotation(m.angle, props.rotationDirection), // 顶部指向圆心，与宿名朝向一致
      color: m.color,
      text: `${m.symbol}${m.degree.toFixed(0)}°`
    }
  })
)

/** 环的内外边线圆 */
const circles = computed(() => [props.radius, props.innerRadius])
</script>

<template>
  <g class="planet-degree-ring">
    <!-- 内外边线 -->
    <circle
      v-for="r in circles"
      :key="r"
      cx="0"
      cy="0"
      :r="r"
      fill="none"
      stroke="#555555"
      stroke-width="1"
      opacity="0.6"
    />
    <!-- 七曜标记：径向刻线 + 符号度数 -->
    <g v-for="it in items" :key="it.key">
      <line :x1="it.x1" :y1="it.y1" :x2="it.x2" :y2="it.y2" :stroke="it.color" stroke-width="1.5" opacity="0.85" />
      <text
        :x="it.tx"
        :y="it.ty"
        :fill="it.color"
        font-size="12"
        font-weight="bold"
        text-anchor="middle"
        dominant-baseline="middle"
        paint-order="stroke"
        stroke="#000"
        stroke-width="2.5"
        :transform="`rotate(${it.rotation} ${it.tx} ${it.ty})`"
      >{{ it.text }}</text>
    </g>
  </g>
</template>

<style scoped>
.planet-degree-ring text {
  font-family: 'Microsoft YaHei', sans-serif;
  pointer-events: none;
}
</style>
