<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import { twentyEightConstellations } from '@/data/rings/twentyEightConstellations'
import { getMansionSpans } from '@/utils/planetMansion'
import { getPlanetMansions } from '@/utils/planetMansion'
import { getMansionEvents } from '@/utils/skyEvents'
import { normalizeAngle } from '@/utils/geometry'

/**
 * 二十八宿环组件（时间驱动）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一使用 unref()
 *
 * 根据传入时间自动计算：
 *   - 各宿的赤经区间（随岁差/时间动态变化）
 *   - 各宿的天象事件分级（合/冲/聚 → 高亮等级）
 *   - 单曜路过的宿（微亮），合冲三星聚（中亮），四星五星聚（强亮）
 *
 * 坐标系对齐：赤经 ra → DataRing 顺时针角度 = 360° - ra
 * 这样外圈宿环与内部 SkyChart 的赤经坐标系完全对齐。
 */
interface Props {
  /** 时间源（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  /** 环外半径 */
  radius?: number
  /** 环内半径 */
  innerRadius?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  rotationDirection: 'clockwise'
})

/** ⚠️ 时间驱动统一范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 角度归一化到 [0,360) */
const norm = normalizeAngle
/** 赤经 → DataRing 顺时针角度 */
const raToAngle = (ra: number) => norm(360 - ra)

/** 当前七曜落宿 */
const planetMansions = computed(() => getPlanetMansions(timeRef.value))

/** 当前各宿的天象事件（合/冲/聚 → 落宿分级） */
const mansionEvents = computed(() => getMansionEvents(timeRef.value))

/** 二十八宿环数据（随时间动态变化） */
const ringData = computed(() => {
  const spans = getMansionSpans(timeRef.value)
  // 单曜路过的宿（常态，仅给微亮）
  const litLabels = new Set(
    planetMansions.value.map((pm) => pm.mansion?.label).filter(Boolean) as string[]
  )
  const events = mansionEvents.value
  return {
    ...twentyEightConstellations,
    startDegree: 0,
    items: spans.map((s) => {
      const evt = events.get(s.label)
      const level = evt ? evt.level : litLabels.has(s.label) ? 1 : 0
      return {
        label: s.label,
        // 不亮=灰白；微亮及以上=宿本色
        color: level >= 1 ? s.color : '#cccccc',
        startAngle: raToAngle(s.endRa),
        endAngle: raToAngle(s.startRa),
        highlightLevel: level as 0 | 1 | 2 | 3
      }
    })
  }
})
</script>

<template>
  <DataRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :rotation-direction="rotationDirection"
  />
</template>
