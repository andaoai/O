<script setup lang="ts">
/**
 * 奇门 · 二十四节气段环 —— 以冬至为岁首、与六轮甲子日环严格对齐
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与外层「六轮甲子日环」共享 0° 起点（= 上元甲子日）
 *  🔑 节气切换以冬至为准：过冬至那天翻页到下一岁 24 节气
 *
 *  一环 360 天 = 360° = 每天 1°，段环模式（DataRing）：
 *   · 每格 [i, i+1) 对应一个具体日期 = upperYuanDate + i 天
 *   · 节气首日格（24 格）：亮色（冬至=金 / 中气=蓝 / 节=绿）
 *   · 节气段内其余 14 天：中灰 #2a2a2a
 *   · 未被 24 节气覆盖的绕环缝隙（一岁 365 - 环 360 = 5 天）：极暗
 *   · 今日格：金色高亮 + 呼吸
 *
 *  节气首日与六十甲子环对应干支格严格径向对齐；冬至位置在
 *  环上每年漂 +5 天，节气整体绕环滑动，最终周期约 72 年一圈。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import type { RingData, RingItem } from '@/data/rings/types'
import {
  computeQiMenSolarTerms,
  findUpperYuanJiaziDay,
  type QiMenSolarTerm
} from '@/utils/qimenDunJia'
import { SolarDay } from 'tyme4ts'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 440,
  innerRadius: 414,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

/** 走 tyme4ts 儒略日整数运算的整日差（抗时区标准化） */
function diffDays(later: Date, earlier: Date): number {
  const a = SolarDay.fromYmd(later.getFullYear(), later.getMonth() + 1, later.getDate())
  const b = SolarDay.fromYmd(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate())
  return a.subtract(b)
}

interface TermSlot {
  name: string
  isMidTerm: boolean
  isWinter: boolean
  isNextWinter: boolean
}

const ringData = computed<RingData>(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const terms: QiMenSolarTerm[] = computeQiMenSolarTerms(now)  // 按冬至起时间序（含下一冬至）
  const todayInRing = ((diffDays(now, upperYuan) % 360) + 360) % 360

  // 拆出「本岁 24 节气」与「下一岁冬至」两部分
  const yearTerms = terms.filter(t => !t.isNextWinter)
  const nextWinter = terms.find(t => t.isNextWinter) ?? null

  // 首日索引表：dayInRing → TermSlot。
  // 下一冬至优先级最高（它会落在冬至段末端某天，用紫色抢占该格）。
  const startIdxOf = new Map<number, TermSlot>()
  for (const t of yearTerms) {
    startIdxOf.set(t.dayInRing, {
      name: t.name,
      isMidTerm: t.isMidTerm,
      isWinter: t.name === '冬至',
      isNextWinter: false
    })
  }
  if (nextWinter) {
    startIdxOf.set(nextWinter.dayInRing, {
      name: '冬至·下岁',
      isMidTerm: true,
      isWinter: true,
      isNextWinter: true
    })
  }

  // 分段填色：按时间序把每个节气段的实际公历跨度沿环填入。
  // 先入者不被覆盖 → 冬至首日永远显示冬至；下一冬至的紫色标签会盖在段内某天。
  const segAssignment = new Map<number, TermSlot>()
  for (let k = 0; k < yearTerms.length; k++) {
    const t = yearTerms[k]!
    const nextT = yearTerms[k + 1]
    const segDays = nextT ? diffDays(nextT.date, t.date) : 15
    const slot: TermSlot = {
      name: t.name,
      isMidTerm: t.isMidTerm,
      isWinter: t.name === '冬至',
      isNextWinter: false
    }
    for (let d = 0; d < segDays; d++) {
      const idx = (t.dayInRing + d) % 360
      if (!segAssignment.has(idx)) segAssignment.set(idx, slot)
    }
  }

  const currentSeg = segAssignment.get(todayInRing) ?? null

  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    const startInfo = startIdxOf.get(i)             // 该格是否为某节气首日（含下一冬至）
    const seg = segAssignment.get(i) ?? null
    const isTermDay = !!startInfo
    const isToday = i === todayInRing
    const isCurrentSegDay =
      !!currentSeg && !!seg && seg.name === currentSeg.name

    let bgColor: string
    let color: string
    let fontSize: number
    let label = ''
    let highlightLevel: 0 | 1 | 2 | 3 = 0

    if (isToday) {
      // 今日格：金底黑字（若今日也是下一冬至，覆盖为紫金相融）
      bgColor = startInfo?.isNextWinter ? '#8E44AD' : '#FFD700'
      color = startInfo?.isNextWinter ? '#FFD700' : '#1a1a1a'
      fontSize = 8
      highlightLevel = 3
      label = startInfo?.name ?? ''
    } else if (startInfo?.isNextWinter) {
      // ⭐ 下一岁冬至：紫色标记（视觉最醒目，仅次于今日）
      bgColor = '#8E44AD'                            // 紫色底
      color = '#F5D0FA'                              // 浅紫字
      fontSize = 7
      highlightLevel = 3
      label = '冬至'
    } else if (isTermDay) {
      const info = startInfo!
      bgColor = info.isWinter
        ? '#8B7500'                                  // 本岁冬至 · 深金
        : info.isMidTerm
          ? '#1F4E79'                                // 中气 · 深蓝
          : '#1F5F3A'                                // 节 · 深绿
      color = info.isWinter
        ? '#FFD700'
        : info.isMidTerm
          ? '#5DADE2'
          : '#58D68D'
      fontSize = 7
      highlightLevel = 2
      label = info.name
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
      highlight: isToday || isTermDay,
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
