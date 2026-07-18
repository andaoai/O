<script setup lang="ts">
/**
 * 奇门 · 二十四节气段环 —— 与六轮甲子日环严格对齐
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与外层「六轮甲子日环」共享 0° 起点（= 上元甲子日）
 *
 *  一环 360 天 = 360° = 每天 1°，段环模式（DataRing）：
 *   · 每格 [i, i+1) 对应一个具体日期 = upperYuanDate + i 天
 *   · 节气日格（24 格）：亮色（节=绿、中气=蓝、冬至=金）
 *   · 非节气日格（14 天间隔的其余日子）：暗背景
 *   · 当前节气所在的整段 15 天：整段中亮
 *   · 今日格：金色高亮 + 呼吸
 *
 *  这样节气首日与六十甲子日环上对应的干支格严格上下对齐。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import type { RingData, RingItem } from '@/data/rings/types'
import { computeQiMenSolarTerms, findUpperYuanJiaziDay } from '@/utils/qimenDunJia'

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

/** 每天的整日差（正 = later - earlier） */
function diffDays(later: Date, earlier: Date): number {
  const a = new Date(later.getFullYear(), later.getMonth(), later.getDate()).getTime()
  const b = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate()).getTime()
  return Math.floor((a - b) / 86400000)
}

const ringData = computed<RingData>(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const terms = computeQiMenSolarTerms(now)
  const todayInRing = Math.max(0, Math.min(359, diffDays(now, upperYuan)))

  // 建立 dayInRing → term 的快查表；同时构造 [起, 止) 段
  type TermSlot = { name: string; isMidTerm: boolean; isWinter: boolean }
  const startIdxOf = new Map<number, TermSlot>()
  const segStart: number[] = []
  for (const t of terms) {
    startIdxOf.set(t.dayInRing, {
      name: t.name,
      isMidTerm: t.isMidTerm,
      isWinter: t.name === '冬至'
    })
    segStart.push(t.dayInRing)
  }
  segStart.sort((a, b) => a - b)

  // 每格找它所属的节气段（该格 ≥ 段起始日的最大者）
  const findSeg = (i: number): TermSlot | null => {
    let lo = 0, hi = segStart.length - 1, ans = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      const v = segStart[mid]!
      if (v <= i) { ans = mid; lo = mid + 1 } else hi = mid - 1
    }
    if (ans < 0) return null
    return startIdxOf.get(segStart[ans]!) ?? null
  }

  // 当前节气所在段（用今天位置反查）
  const currentSeg = findSeg(todayInRing)

  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    const startInfo = startIdxOf.get(i)      // 该格是不是节气首日
    const seg = findSeg(i)                    // 该格所属的节气段
    const isTermDay = !!startInfo             // 节气日格（15 天区间的首日）
    const isToday = i === todayInRing
    const isCurrentSegDay =
      !!currentSeg && !!seg && seg.name === currentSeg.name

    let bgColor: string
    let color: string
    let fontSize: number
    let label = ''
    let highlightLevel: 0 | 1 | 2 | 3 = 0

    if (isToday) {
      // 今日格：金底黑字，最强呼吸
      bgColor = '#FFD700'
      color = '#1a1a1a'
      fontSize = 8
      highlightLevel = 3
      label = startInfo?.name ?? ''
    } else if (isTermDay) {
      // 节气首日：分色亮显 + 节气名
      const info = startInfo!
      bgColor = info.isWinter
        ? '#8B7500'                            // 冬至 · 深金
        : info.isMidTerm
          ? '#1F4E79'                          // 中气 · 深蓝
          : '#1F5F3A'                          // 节 · 深绿
      color = info.isWinter
        ? '#FFD700'
        : info.isMidTerm
          ? '#5DADE2'
          : '#58D68D'
      fontSize = 7
      highlightLevel = 2
      label = info.name
    } else if (isCurrentSegDay) {
      // 当前节气段的其余 14 天：微微亮，暗示"处在此节气中"
      bgColor = '#2a2a2a'
      color = '#555555'
      fontSize = 3
    } else {
      // 其余 14 天：极暗
      bgColor = '#1a1a1a'
      color = '#333333'
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
