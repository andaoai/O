<script setup lang="ts">
import { computed } from 'vue'
import DataRing from './DataRing.vue'
import type { RingData } from '@/data/rings/types'
import { JING_FANG_64_GUA, JING_FANG_EIGHT_PALACE_STEP } from '@/data/rings/jingFangEightPalaces'

/**
 * 京房八宫世应环
 *
 * 与外层 `JingFangEightPalaceRing` 一一对齐：每一格显示对应卦的世位类型
 * （本宫/一世/二世/三世/四世/五世/游魂/归魂），文字竖排两字，颜色沿用宫属色。
 *
 * 角度约定：jingFangOrder=0 位于顶部（centerAngle=270°），顺时针铺展。
 * 通过给每个 item 显式指定 startAngle/endAngle，保证与外层环格严格对齐。
 *
 * 无需 time prop —— 世应是静态的易学分类，不随时间变化。
 */
interface Props {
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  startDegree: 0,
  rotationDirection: 'clockwise'
})

/**
 * 世应环数据：每卦一格，label = 世位类型（双字），color = 宫属色。
 * 每格 5.625°，第 i 格中心角 = 270 + i * 5.625，
 *   startAngle = 270 + (i - 0.5) * step，endAngle = 270 + (i + 0.5) * step。
 * 该角度已是 SVG 绝对角度（DataRing 内部会再叠加 startDegree，此处 startDegree=0 即可）。
 */
const ringData = computed<RingData>(() => ({
  circleColor: '#666666',
  circleWidth: 1,
  tickColor: '#555555',
  tickWidth: 0.5,
  labelPosition: 0.5,
  verticalTwoChar: true,
  items: JING_FANG_64_GUA.map(gua => {
    const centerAngle = 270 + gua.jingFangOrder * JING_FANG_EIGHT_PALACE_STEP
    return {
      label: gua.shiyingType,
      color: gua.color,
      fontSize: 8,
      startAngle: centerAngle - JING_FANG_EIGHT_PALACE_STEP / 2,
      endAngle: centerAngle + JING_FANG_EIGHT_PALACE_STEP / 2
    }
  })
}))
</script>

<template>
  <DataRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :start-degree="startDegree"
    :rotation-direction="rotationDirection"
  />
</template>
