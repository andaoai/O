<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import { polarToCartesian, radialTextRotation } from '@/utils/geometry'
import { useSevenLuminaries } from '@/composables/useSevenLuminaries'
import type { LuminaryKey } from '@/data/rings/types'

/**
 * 七曜入宿度标记环
 *
 * ⚠️ 使用统一架构：内部调用 useSevenLuminaries composable
 * 自动计算赤经和入宿度，保持与 SkyChart / RingStack 视觉一致
 *
 * 每个标记 = 径向刻线 + 七曜符号 + 入宿度数
 *
 * 可直接放入 RingStack，与 SevenLuminariesRing 配对使用：
 *   - 外层：MansionDegreeRing（刻线+度数）
 *   - 内层：SevenLuminariesRing（发光天体本体）
 */
interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 仅显示指定天体（默认全部显示） */
  only?: LuminaryKey[]
  /** 刻线宽度 */
  lineWidth?: number
  /** 字体大小 */
  fontSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  radius: 230,
  innerRadius: 200,
  rotationDirection: 'clockwise',
  lineWidth: 1.5,
  fontSize: 12
})

/** 确保时间参数始终是响应式的（与 SkyChart/HelioOrbits 保持一致的模式） */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 调用统一的七曜计算 composable */
const { all, raToScreenAngle } = useSevenLuminaries(timeRef)

/** 标记列表（随时间自动更新） */
const markers = computed(() => {
  const filterKeys = props.only || unref(all).map(x => x.key)

  return unref(all)
    .filter(x => filterKeys.includes(x.key))
    .map((luminary) => {
      const angle = raToScreenAngle(luminary.equatorial.ra)
      const inner = polarToCartesian(angle, props.innerRadius, props.rotationDirection)
      const outer = polarToCartesian(angle, props.radius, props.rotationDirection)
      const textRadius = props.innerRadius + (props.radius - props.innerRadius) * 0.5
      const textPos = polarToCartesian(angle, textRadius, props.rotationDirection)

      return {
        key: luminary.key,
        symbol: luminary.symbol,
        color: luminary.color,
        angle,
        degreeInMansion: luminary.mansion?.degreeInMansion ?? 0,
        mansionLabel: luminary.mansion?.label ?? '',
        inner,
        outer,
        textPos,
        textRotation: radialTextRotation(angle, props.rotationDirection)
      }
    })
})
</script>

<template>
  <g class="mansion-degree-ring">
    <!-- 内外边线 -->
    <circle cx="0" cy="0" :r="innerRadius" fill="none" stroke="#555555" stroke-width="1" opacity="0.6" />
    <circle cx="0" cy="0" :r="radius" fill="none" stroke="#555555" stroke-width="1" opacity="0.6" />

    <!-- 七曜标记：径向刻线 + 符号度数 -->
    <g v-for="m in markers" :key="m.key">
      <line
        :x1="m.inner.x"
        :y1="m.inner.y"
        :x2="m.outer.x"
        :y2="m.outer.y"
        :stroke="m.color"
        :stroke-width="lineWidth"
        opacity="0.85"
      />
      <text
        :x="m.textPos.x"
        :y="m.textPos.y"
        :fill="m.color"
        :font-size="fontSize"
        font-weight="bold"
        text-anchor="middle"
        dominant-baseline="middle"
        paint-order="stroke"
        stroke="#000"
        stroke-width="2.5"
        :transform="`rotate(${m.textRotation} ${m.textPos.x} ${m.textPos.y})`"
      >{{ m.symbol }}{{ m.degreeInMansion.toFixed(0) }}°</text>
    </g>
  </g>
</template>

<style scoped>
.mansion-degree-ring text {
  font-family: 'Microsoft YaHei', sans-serif;
  pointer-events: none;
}
</style>
