<script setup lang="ts">
/**
 * 奇门 · 阴阳两遁段环
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与外层「六轮甲子日环」共享 0° 起点（= 上元甲子日）
 *
 *  一岁 24 节气分两遁：
 *   · 阳遁 12 节气：冬至 → 芒种（含）—— 朱红 #C0392B（阳气升发）
 *   · 阴遁 12 节气：夏至 → 大雪（含）—— 玄青 #1F2A44（阴气凝敛）
 *
 *  每格 1° = 1 天，按其所在节气归属染色。
 *  阳遁段首（冬至那格）显示「阳」大字，阴遁段首（夏至那格）显示「阴」大字。
 *  今日格金色高亮。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import { SolarDay } from 'tyme4ts'
import DataRing from './DataRing.vue'
import type { RingData, RingItem } from '@/data/rings/types'
import {
  computeQiMenSolarTerms,
  findUpperYuanJiaziDay,
  isYangDun,
  YIN_YANG_COLORS
} from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 280,
  innerRadius: 256,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

function diffDays(later: Date, earlier: Date): number {
  const a = SolarDay.fromYmd(later.getFullYear(), later.getMonth() + 1, later.getDate())
  const b = SolarDay.fromYmd(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate())
  return a.subtract(b)
}

const TERM_DAYS = 15
const CYCLE_DAYS = 360

const ringData = computed<RingData>(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const terms = computeQiMenSolarTerms(now)
  const todayInRing = ((diffDays(now, upperYuan) % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS

  const yearTerms = terms.filter(t => !t.isNextWinter)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  if (yearTerms.length === 0) {
    return {
      items: [], showSectors: true, verticalTwoChar: true,
      labelPosition: 0.5, labelColor: '#666',
      circleColor: '#444', circleWidth: 0.5,
      tickColor: '#222', tickWidth: 0.2
    }
  }
  const winterDayInRing = yearTerms[0]!.dayInRing

  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    const offsetFromWinter = ((i - winterDayInRing) % CYCLE_DAYS + CYCLE_DAYS) % CYCLE_DAYS
    const termIdx = Math.floor(offsetFromWinter / TERM_DAYS)
    const offsetInSeg = offsetFromWinter - termIdx * TERM_DAYS
    const term = yearTerms[termIdx] ?? null
    const isToday = i === todayInRing

    let bgColor: string
    let color: string
    let fontSize: number
    let label = ''
    let highlightLevel: 0 | 1 | 2 | 3 = 0

    if (!term) {
      bgColor = '#0f0f0f'
      color = '#222222'
      fontSize = 3
    } else {
      const yang = isYangDun(term.name)
      const baseColor = yang ? YIN_YANG_COLORS.yang : YIN_YANG_COLORS.yin
      // 遁首：冬至（第 0 个节气段首日）或夏至（第 12 个节气段首日）
      const isDunFirst =
        offsetInSeg === 0 && (termIdx === 0 || termIdx === 12)

      if (isToday) {
        bgColor = '#FFD700'
        color = '#1a1a1a'
        fontSize = 9
        highlightLevel = 3
        label = yang ? '阳' : '阴'
      } else if (isDunFirst) {
        // 遁首（冬至/夏至）：饱和底大字
        bgColor = baseColor
        color = '#FFD700'
        fontSize = 10
        highlightLevel = 2
        label = yang ? '阳' : '阴'
      } else {
        // 遁段内其它日：饱和底 + 无字
        bgColor = baseColor
        color = '#888888'
        fontSize = 3
      }
    }

    items.push({
      label,
      bgColor,
      color,
      startAngle: i,
      endAngle: i + 1,
      highlight: isToday,
      highlightLevel,
      fontSize
    })
  }

  return {
    items,
    showSectors: false,          // 阴阳两遁只有两段，不需要每格分割线
    verticalTwoChar: false,
    labelPosition: 0.5,
    labelColor: '#888',
    circleColor: '#555',
    circleWidth: 0.5,
    tickColor: '#333',
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
