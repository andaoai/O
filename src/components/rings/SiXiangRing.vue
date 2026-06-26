<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import { getMansionSpans } from '@/utils/planetMansion'
import { normalizeAngle } from '@/utils/geometry'

/**
 * 四象环组件（时间驱动）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一使用 unref()
 *
 * 四象是二十八宿的四个分组，不另取角度，直接按各象名下七宿的
 * 赤经区间合并而成。随岁差/时间一起动态转动，无需手设起始度数。
 *   东·青龙 角→箕(0-6)，北·玄武 斗→壁(7-13)
 *   西·白虎 奎→参(14-20)，南·朱雀 井→轸(21-27)
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

/** 四象分组定义 */
const SI_XIANG_GROUPS = [
  { label: '青龙', color: '#2ECC71', start: 0, end: 6 },
  { label: '玄武', color: '#5DADE2', start: 7, end: 13 },
  { label: '白虎', color: '#D4AF37', start: 14, end: 20 },
  { label: '朱雀', color: '#E74C3C', start: 21, end: 27 }
] as const

/** 四象环数据（随时间动态变化） */
const ringData = computed(() => {
  const spans = getMansionSpans(timeRef.value)
  return {
    startDegree: 0,
    circleColor: '#555555',
    circleWidth: 1,
    tickColor: '#444444',
    tickWidth: 1,
    fontSize: 18,
    items: SI_XIANG_GROUPS.map((g) => ({
      label: g.label,
      color: g.color,
      // 该象首宿起点 → 末宿终点（与宿环同样 endRa→startAngle 的方向约定）
      startAngle: raToAngle(spans[g.end]!.endRa),
      endAngle: raToAngle(spans[g.start]!.startRa)
    }))
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
