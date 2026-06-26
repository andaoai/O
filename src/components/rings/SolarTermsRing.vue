<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataPointRing from './DataPointRing.vue'
import { twentyFourSolarTerms } from '@/data/rings/twentyFourSolarTerms'
import { sunLongitude } from '@/utils/celestial'

/**
 * 二十四节气环组件（传统罗盘版本 · 时间驱动高亮）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一使用 unref()
 *
 * 传统罗盘版本：节气角度是固定的（按黄经），不随岁差变化。
 * 春分黄经0°，每个节气间隔15°。
 * 根据传入时间自动高亮当前节气。
 *
 * 与 PlanetMansionView 使用的 SolarTermsSkyRing 不同，
 * 那个是天星盘版本（赤经动态对齐），不要混淆。
 */
interface Props {
  /** 时间源（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  /** 环外半径 */
  radius?: number
  /** 环内半径 */
  innerRadius?: number
  /** 起始度数偏移 */
  startDegree?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

/** ⚠️ 时间驱动统一范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 角度归一化到 [0,360) */
const norm = (a: number) => ((a % 360) + 360) % 360

/** 二十四节气环数据（角度固定，仅高亮随时间变化） */
const ringData = computed(() => {
  // 当前太阳所在节气（黄经从立春 315° 起、每 15° 一气）
  const sunLon = sunLongitude(timeRef.value)
  const currentIndex = Math.floor(norm(sunLon - 315) / 15)

  return {
    ...twentyFourSolarTerms,
    items: twentyFourSolarTerms.items.map((item, i) => {
      const isSpecial = item.label === '春分' || item.label === '夏至' ||
                        item.label === '秋分' || item.label === '冬至'
      const isCurrent = i === currentIndex
      return {
        ...item,
        fontSize: isCurrent ? 14 : (isSpecial ? 12 : 10),
        pointSize: isCurrent ? 12 : 8,
        pointColor: isCurrent ? '#ffdd00' : (isSpecial ? '#88ccff' : '#66aadd'),
        color: isCurrent ? '#ffdd00' : '#ffffff',
        highlight: isCurrent,
        highlightLevel: (isCurrent ? 2 : 0) as 0 | 1 | 2 | 3
      }
    })
  }
})
</script>

<template>
  <DataPointRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :start-degree="startDegree"
    :rotation-direction="rotationDirection"
  />
</template>
