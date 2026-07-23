<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from '../DataRing.vue'
import {
  MONTH_ESTABLISH,
  getCurrentGeneralIndex,
  generalIndexToScreenCenter,
  centerToArcSpan
} from '@/utils/jianJiang'

/**
 * 月将环组件（段环 · 时间驱动）
 *
 * ⚠️ 五层架构：接受 MaybeRef<Date>，内部统一为 timeRef computed。
 *
 * 「月将」体系：太阳所在的黄道十二次，一年转一圈。
 *   正月太阳在娵訾 → 二月在降娄 → ……
 * 高亮取 sunLongitude(time) 所在的十二次格。
 *
 * ⚠️ 方位约定：与 MonthEstablishRing 同用「面朝北仰望」坐标，
 *   每格与其对应月建地支同轴（娵訾↔寅、降娄↔卯、…、玄枵↔丑）。
 *   角度派生自 utils/jianJiang.ts 的 generalIndexToScreenCenter()。
 */

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  /** 高亮色（默认金色，象征日缠） */
  highlightColor?: string
  /** 圈边颜色（金蓝，与月建环深金色形成阴阳对比） */
  circleColor?: string
  circleWidth?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  highlightColor: '#FFD54A',
  circleColor: '#3F6B8C',
  circleWidth: 1.6,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

const activeIndex = computed(() => getCurrentGeneralIndex(timeRef.value))

const GREY = '#888'

/**
 * 月将环数据（面朝北仰望约定，与月建环每格同轴）
 */
const ringData = computed(() => ({
  startDegree: 0,
  circleColor: props.circleColor,
  circleWidth: props.circleWidth,
  tickColor: '#666666',
  tickWidth: 0.8,
  fontSize: 16,
  items: MONTH_ESTABLISH.map((item, index) => {
    const isActive = index === activeIndex.value
    const center = generalIndexToScreenCenter(index)
    const { startAngle, endAngle } = centerToArcSpan(center)
    return {
      label: item.general,
      startAngle,
      endAngle,
      color: isActive ? props.highlightColor : GREY,
      fontSize: isActive ? 20 : 16,
      highlight: isActive
    }
  })
}))
</script>

<template>
  <DataRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :rotation-direction="rotationDirection"
  />
</template>
