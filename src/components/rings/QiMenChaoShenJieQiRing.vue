<script setup lang="ts">
/**
 * 超神接气环 —— 每节气独立判定 24 段状态
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一为 timeRef computed
 *
 * 【核心语义】一整年 24 个节气各自独立判定自己的超神/接气/正授：
 *   - 找该节气日前后最近的甲/己日（符头日）
 *   - 符头日 = 节气日 → 正授（绿）
 *   - 符头日在节气日之前 → 超神（红）
 *   - 符头日在节气日之后 → 接气（蓝）
 *
 * label 显示"状态+天数"（如"超5"表示超神 5 天）。
 * 当前节气段 highlightLevel:3 呼吸；其他节气段静态展示，形成
 * 一整年错落分布的状态图。
 *
 * 闰奇门段：累积超神 ≥ 9 天时，追加紫色 5° 段。
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import type { RingData, RingItem } from '@/data/rings/types'
import {
  getSolarTermIndex, getChaoShenJieQiForTerm, getQimenLeapStatus,
  getSolarTermAnglesFromUpperYuan
} from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 320,
  innerRadius: 300,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

const currentTermIdx = computed(() => getSolarTermIndex(timeRef.value))
const leap = computed(() => getQimenLeapStatus(timeRef.value.getFullYear()))

const STATUS_COLOR: Record<string, string> = {
  超神: '#E74C3C',
  接气: '#3498DB',
  正授: '#2ECC71'
}

const ringData = computed<RingData>(() => {
  const now = timeRef.value
  const year = now.getFullYear()
  const termAngles = getSolarTermAnglesFromUpperYuan(now)

  const items: RingItem[] = termAngles.map((t, arrIdx) => {
    const info = getChaoShenJieQiForTerm(t.name, year)
    const isCurrent = t.termIndex === currentTermIdx.value
    const bg = STATUS_COLOR[info.status] ?? '#666666'
    const next = termAngles[arrIdx + 1]
    const endAngle = next ? next.angle : t.angle + 15

    // 段中标签：状态首字 + 差异天数（正授=0 天，不加数字）
    // 例："超5" / "接3" / "正"
    const label = info.status === '正授'
      ? '正'
      : (info.status[0] ?? '') + Math.abs(info.diffDays)

    return {
      label,
      bgColor: bg,
      color: isCurrent ? '#1a1a1a' : '#FFFFFF',
      startAngle: t.angle,
      endAngle,
      highlight: isCurrent,
      highlightLevel: (isCurrent ? 3 : 0) as 0 | 1 | 2 | 3,
      fontSize: isCurrent ? 11 : 8
    }
  })

  // 闰奇门段
  if (leap.value.hasLeap && leap.value.leapName) {
    const targetTermIdx = leap.value.leapName === '闰芒种' ? 11 : 23
    const targetTerm = termAngles.find(t => t.termIndex === targetTermIdx)
    if (targetTerm) {
      const startA = targetTerm.angle + 5
      items.push({
        label: leap.value.leapName,
        bgColor: '#8E44AD',
        color: '#FFFFFF',
        startAngle: startA,
        endAngle: startA + 5,
        highlight: true,
        highlightLevel: 3,
        fontSize: 10
      })
    }
  }

  return {
    items,
    showSectors: true,
    labelPosition: 0.5,
    labelColor: '#FFFFFF',
    circleColor: '#444444',
    circleWidth: 0.5
  }
})
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


