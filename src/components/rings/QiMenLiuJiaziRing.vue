<script setup lang="ts">
/**
 * 六轮甲子日环（60 甲子 × 6 轮 = 360 天） — 奇门遁甲最外环
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 起点 = 「上元甲子日」（冬至日前含当日最近的甲子日）
 *  ─────────────────────────────────────────────────────────────
 *
 *  奇门排局的传统起点是「冬至上元甲子」。从上元甲子起
 *  60 甲子 × 6 轮 = 360 天，6 个甲子锚（甲子/甲戌/甲申/
 *  甲午/甲辰/甲寅）**必然**落在 0°/60°/120°/180°/240°/300°。
 *
 *  该环独立以「上元甲子」为 0°，与全盘「冬至 0°」并**不同心**——
 *  上元甲子相对冬至的偏移正是「超神/接气」的天文根源，本环恰恰
 *  把这个错位可视化。闰奇门期锚点每 60 天前推，视觉上进入第 7
 *  轮甲子，不跳回第 1 轮。
 *
 *  当日格 index = (今天 - 上元甲子日).days ∈ [0, 360)
 *
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import type { RingData, RingItem } from '@/data/rings/types'
import { getSolarTermPositions } from '@/utils/chineseCalendar'
import { getJiaziIndices } from '@/utils/liushiJiazi'
import { ganzhiName } from '@/utils/constants/ganzhi'
import { getUpperYuanJiaziDay } from '@/utils/qimenDunJia'

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
  '#2a2a3a', '#2a3a2a', '#3a3a2a', '#3a2a2a', '#3a2a3a', '#2a3a3a'
]

/** 6 个甲子日锚的饱和色 */
const ANCHOR_COLORS = ['#3498DB', '#2ECC71', '#F1C40F', '#E67E22', '#E74C3C', '#8E44AD']

/** 计算冬至日在 360 日环上的角度位置（可能有 0-2 个，跨年时会有第二年冬至） */
function getWinterAnglesOn360Ring(upperYuanDay: Date): number[] {
  const angles: number[] = []
  const baseYear = upperYuanDay.getFullYear()
  for (const y of [baseYear, baseYear + 1]) {
    const winter = getSolarTermPositions(y).find(p => p.name === '冬至')
    if (!winter) continue
    const winterDate = new Date(y, 0, 1)
    winterDate.setDate(winter.dayOfYear)
    const offset = Math.floor((winterDate.getTime() - upperYuanDay.getTime()) / 86400000)
    if (offset >= 0 && offset < 360) angles.push(offset)
  }
  return angles
}

const ringData = computed<RingData>(() => {
  const now = timeRef.value
  const upperYuanDay = getUpperYuanJiaziDay(now)

  // 当日在环上的格 index（锚点已处理闰奇门前推，直接使用 0-359）
  const daysSince = Math.floor((now.getTime() - upperYuanDay.getTime()) / 86400000)
  const clampedCurrent = Math.max(0, Math.min(359, daysSince))
  const currentRound = Math.floor(clampedCurrent / 60)
  const winterAngles = getWinterAnglesOn360Ring(upperYuanDay)

  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    const d = new Date(upperYuanDay.getTime() + i * 86400000)
    const jiaziIdx = getJiaziIndices(d).day  // 0-59
    const gzName = ganzhiName(jiaziIdx)

    const roundIdx = Math.floor(i / 60)      // 0-5：第几轮
    const isAnchor = jiaziIdx === 0          // 甲子日（每轮起点）
    const isCurrent = i === clampedCurrent
    const isCurrentRoundAnchor = isAnchor && roundIdx === currentRound
    const isWinter = winterAngles.includes(i)

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
    } else if (isWinter) {
      // 冬至锚点：湛蓝背景 + 白文字 + 强呼吸
      bgColor = '#1E90FF'
      color = '#FFFFFF'
      fontSize = 9
      highlightLevel = 3
    } else if (isCurrentRoundAnchor) {
      // 当前所在轮的甲子日：饱和色 + 白文字 + 强呼吸
      bgColor = ANCHOR_COLORS[roundIdx] ?? '#666666'
      color = '#FFFFFF'
      fontSize = 9
      highlightLevel = 3
    } else if (isAnchor) {
      // 其余轮的甲子日：饱和色 + 白文字 + 中呼吸
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
      label: isWinter ? '冬至' : gzName,
      bgColor,
      color,
      startAngle: i,
      endAngle: i + 1,
      highlight: isCurrent || isAnchor || isWinter,
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

