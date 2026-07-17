<script setup lang="ts">
/**
 * 六轮甲子日环（60 甲子 × 6 轮 = 360 天） — 奇门遁甲最外环
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 起点 = 「上元甲子日」（冬至前后最近的甲子日）
 *  ─────────────────────────────────────────────────────────────
 *
 *  奇门排局的传统起点是「冬至上元甲子」——冬至节气最近的甲子日。
 *  从这个甲子日开始 60 甲子 × 6 轮 = 360 天完整循环，
 *  6 个甲子锚（甲子/甲戌/甲申/甲午/甲辰/甲寅）**必然**
 *  整齐地落在 0°/60°/120°/180°/240°/300°。
 *
 *  这与全盘「冬至 0°」基准并**不完全同心**——上元甲子日
 *  相对冬至的偏移正是「超神/接气」的天文根源，此环独立
 *  以「上元甲子」为 0° 起点，恰恰把这个错位可视化。
 *
 *  当日格位置 = (今天 - 上元甲子日).days ∈ [0, 360)
 *
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import type { RingData, RingItem } from '@/data/rings/types'
import { getSolarTermPositions } from '@/utils/chineseCalendar'
import { getJiaziIndices } from '@/utils/liushiJiazi'
import { ganzhiName } from '@/utils/constants/ganzhi'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 480,
  innerRadius: 452,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

/** 6 轮甲子微差背景色（每轮 60 天） */
const ROUND_COLORS = [
  '#2a2a3a',  // 轮 1
  '#2a3a2a',  // 轮 2
  '#3a3a2a',  // 轮 3
  '#3a2a2a',  // 轮 4
  '#3a2a3a',  // 轮 5
  '#2a3a3a'   // 轮 6
]

/** 6 个甲子日锚的饱和色 */
const ANCHOR_COLORS = ['#3498DB', '#2ECC71', '#F1C40F', '#E67E22', '#E74C3C', '#8E44AD']

/** 在 [center - 30, center + 30] 天内找最近的甲子日（干支索引 = 0） */
function findNearestJiaziDay(center: Date): Date {
  let best = center
  let minAbs = Infinity
  for (let offset = -30; offset <= 30; offset++) {
    const d = new Date(center.getTime() + offset * 86400000)
    if (getJiaziIndices(d).day === 0) {
      const abs = Math.abs(offset)
      if (abs < minAbs) {
        minAbs = abs
        best = d
      }
    }
  }
  return best
}

/** 找到「上元甲子日」：today 前 360 天内最近的、且 today 尚在其周期内（0-359）的甲子日 */
function findCurrentUpperYuanJiaziDay(today: Date): Date {
  // 遍历本年、去年冬至，取上元甲子后 today 落在 [0, 360) 内的那个
  const year = today.getFullYear()
  for (const y of [year, year - 1]) {
    const positions = getSolarTermPositions(y)
    const winter = positions.find(p => p.name === '冬至')
    if (!winter) continue
    const winterDate = new Date(y, 0, 1)
    winterDate.setDate(winter.dayOfYear)
    const upperYuan = findNearestJiaziDay(winterDate)
    const daysSince = Math.floor((today.getTime() - upperYuan.getTime()) / 86400000)
    if (daysSince >= 0 && daysSince < 360) return upperYuan
  }
  // 兜底：用 today 最近的甲子日
  return findNearestJiaziDay(today)
}

const ringData = computed<RingData>(() => {
  const now = timeRef.value

  // 上元甲子日 = 该环 0° 位置
  const upperYuanDay = findCurrentUpperYuanJiaziDay(now)

  // 当日在环上的格 index
  const currentIdx = Math.floor((now.getTime() - upperYuanDay.getTime()) / 86400000)
  const clampedCurrent = Math.max(0, Math.min(359, currentIdx))

  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    // 该格对应日期 = 上元甲子日 + i 天
    const d = new Date(upperYuanDay.getTime() + i * 86400000)
    const jiaziIdx = getJiaziIndices(d).day  // 0-59
    const gzName = ganzhiName(jiaziIdx)

    const roundIdx = Math.floor(i / 60)      // 0-5：第几轮
    const isAnchor = jiaziIdx === 0           // 甲子日（每轮起点）
    const isCurrent = i === clampedCurrent

    let bgColor: string
    let color: string
    let fontSize: number
    let highlightLevel: 0 | 1 | 2 | 3 = 0

    if (isCurrent) {
      // 当日：金背景 + 深文字 + 强呼吸
      bgColor = '#FFD700'
      color = '#1a1a1a'
      fontSize = 9
      highlightLevel = 3
    } else if (isAnchor) {
      // 甲子日：轮次饱和色 + 白文字（6 个甲子必然在 0/60/120/180/240/300 格）
      bgColor = ANCHOR_COLORS[roundIdx] ?? '#666666'
      color = '#FFFFFF'
      fontSize = 7
      highlightLevel = 2
    } else {
      // 普通日：轮次微差背景 + 浅色文字
      bgColor = ROUND_COLORS[roundIdx] ?? '#2a2a2a'
      color = '#888888'
      fontSize = 4
    }

    items.push({
      label: gzName,
      bgColor,
      color,
      startAngle: i,
      endAngle: i + 1,
      highlight: isCurrent || isAnchor,
      highlightLevel,
      fontSize
    })
  }

  return {
    items,
    showSectors: true,
    verticalTwoChar: true,
    labelPosition: 0.5,
    labelColor: '#888888',
    circleColor: '#555555',
    circleWidth: 0.5,
    tickColor: '#333333',
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

