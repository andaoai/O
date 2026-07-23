<script setup lang="ts">
/**
 * 奇门 · 二十四节气段环 —— 以冬至为岁首、与六轮甲子日环严格对齐
 *
 * ⚠️ 时间状态从 useQiMenContext 共享上下文读取（跨天才重算）。
 *    time prop 保留仅供架构兼容 —— 实际数据源来自 View 侧的
 *    provideQiMenContext(controlledTime)。
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与外层「六轮甲子日环」共享 0° 起点（= 上元甲子日）
 *  🔑 节气切换以冬至为准：过冬至那天翻页到下一岁 24 节气
 *
 *  一环 360 天 = 360° = 每天 1°，段环模式（DataRing）：
 *   · 24 节气首日格 = 每节气的「上元第一天」= 符头位置（网格节气日）
 *   · 符头颜色由「网格 vs 真实天文」偏差决定：
 *       对齐（正授，diff=0） → 绿色符头
 *       不对齐（超神/接气） → 符头保持灰色，
 *         真实天文节气日那一格另外标色：
 *           超神（天文提前，diff<0） → 红色
 *           接气（天文延后，diff>0） → 蓝色
 *       特殊：本岁冬至永远正授 → 金色（岁首标）
 *              下一岁冬至锚点 → 紫色（提前预告）
 *   · 节气段内其余 14 天：中灰 #2a2a2a
 *   · 未被 24 节气覆盖的绕环缝隙（一岁 365 - 环 360 = 5 天）：极暗
 *   · 今日格：金色高亮 + 呼吸
 *
 *  节气首日与六十甲子环对应干支格严格径向对齐；冬至位置在
 *  环上每年漂 +5 天，节气整体绕环滑动，最终周期约 72 年一圈。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, type MaybeRef } from 'vue'
import DataRing from '../DataRing.vue'
import type { RingData, RingItem } from '@/data/rings/types'
import { useQiMenContext } from '@/composables/useQiMenDunJiaContext'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

withDefaults(defineProps<Props>(), {
  radius: 440,
  innerRadius: 414,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

/** 共享上下文（跨天才变） */
const ctx = useQiMenContext()

const ringData = computed<RingData>(() => {
  const c = ctx.value
  const todayInRing = c.todayInRing
  const startIdxOf = c.startIdxOf
  const realTermIdxOf = c.realTermIdxOf
  const segAssignment = c.segAssignment

  const currentSeg = segAssignment.get(todayInRing) ?? null

  // 🎯 冬至颜色恒定，与农历环的年头金/年尾紫方向一致：
  //   · 本岁冬至（W1）恒金色  —— 岁首锚点
  //   · 下一岁冬至（W2）恒紫色 —— 岁末终点
  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    const startInfo = startIdxOf.get(i)             // 该格是否为某节气首日（含下一冬至）
    const realMark = realTermIdxOf.get(i)           // 该格是否为某节气真实天文日（错位标记）
    const seg = segAssignment.get(i) ?? null
    const isTermDay = !!startInfo
    const isRealTermDay = !!realMark && !isTermDay
    const isToday = i === todayInRing
    const isCurrentSegDay =
      !!currentSeg && !!seg && seg.name === currentSeg.name

    let bgColor: string
    let color: string
    let fontSize: number
    let label = ''
    let highlightLevel: 0 | 1 | 2 | 3 = 0

    if (isToday) {
      // 今日格：W2 恒紫，其余恒金
      if (startInfo?.isNextWinter) {
        bgColor = '#8E44AD'
        color = '#FFD700'
      } else {
        bgColor = '#FFD700'
        color = '#1a1a1a'
      }
      fontSize = 8
      highlightLevel = 3
      label = startInfo?.name ?? realMark?.name ?? ''
    } else if (startInfo?.isNextWinter) {
      bgColor = '#8E44AD'
      color = '#F5D0FA'
      fontSize = 7
      highlightLevel = 3
      label = '冬至'
    } else if (isTermDay) {
      const info = startInfo!
      if (info.isWinter) {
        bgColor = '#8B7500'
        color = '#FFD700'
        fontSize = 7
        highlightLevel = 2
        label = info.name
      } else if (info.chaoshenLabel === 'zhengshou') {
        bgColor = '#1F5F3A'
        color = '#58D68D'
        fontSize = 7
        highlightLevel = 2
        label = info.name
      } else {
        bgColor = '#3a3a3a'
        color = '#9a9a9a'
        fontSize = 7
        highlightLevel = 1
        label = info.name
      }
    } else if (isRealTermDay) {
      const mark = realMark!
      if (mark.chaoshenLabel === 'chaoshen') {
        bgColor = '#7B241C'
        color = '#F1948A'
      } else {
        bgColor = '#1F4E79'
        color = '#5DADE2'
      }
      fontSize = 7
      highlightLevel = 2
      label = mark.name
    } else if (isCurrentSegDay) {
      bgColor = '#2a2a2a'
      color = '#555555'
      fontSize = 3
    } else if (seg) {
      bgColor = '#1a1a1a'
      color = '#333333'
      fontSize = 3
    } else {
      bgColor = '#0f0f0f'
      color = '#222222'
      fontSize = 3
    }

    items.push({
      label,
      bgColor,
      color,
      startAngle: i,
      endAngle: i + 1,
      highlight: isToday || isTermDay || isRealTermDay,
      highlightLevel,
      fontSize
    })
  }

  return {
    items,
    showSectors: true,
    verticalTwoChar: true,
    labelPosition: 0.5,
    labelColor: '#666',
    circleColor: '#444',
    circleWidth: 0.5,
    tickColor: '#222',
    tickWidth: 0.2
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
