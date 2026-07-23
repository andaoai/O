<script setup lang="ts">
/**
 * 六轮甲子日环（60 甲子 × 6 轮 = 360 天） — 奇门遁甲最外环
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 环 0° 起点 = 「上元甲子日」（冬至前后最近的甲子日）
 *
 *  60 天 × 6 轮 = 360 天 = 360°，6 个甲子日锚必然落在
 *  0° / 60° / 120° / 180° / 240° / 300°，分别对应
 *  一运 / 二运 / 三运 / 四运 / 五运 / 六运。
 *
 *  当日格 = (today - 上元甲子日).days ∈ [0, 360)
 *  当前运的甲子锚（今日所属段的起点）额外加金色描边高亮。
 *
 *  「今天在第几运」每年不同——上元甲子相对冬至的偏移
 *  即是「超神/接气/正授」的天文根源。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from '../DataRing.vue'
import type { RingData, RingItem } from '@/data/rings/types'
import { ganzhiName } from '@/utils/constants/ganzhi'
import { computeSixYun, YUN_COLORS, jiaziIndexAt } from '@/utils/qimenDunJia'

interface Props {
  /** 时间源（MaybeRef<Date>） */
  time?: MaybeRef<Date>
  /** 环外半径 */
  radius?: number
  /** 环内半径 */
  innerRadius?: number
  /** 起始度数（RingStack 注入） */
  startDegree?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 480,
  innerRadius: 452,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

/** ⚠️ 范式第一行：统一转换为响应式 timeRef */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 6 轮微差背景色（每轮 60 天普通日，一运深→六运浅） */
const ROUND_BG_COLORS = [
  '#2a2a3a', // 一运
  '#2a3a2a', // 二运
  '#3a3a2a', // 三运
  '#3a2a2a', // 四运
  '#3a2a3a', // 五运
  '#2a3a3a'  // 六运
]

/** ⚠️ 范式第二行：所有业务逻辑派生自 timeRef */
const ringData = computed<RingData>(() => {
  const now = timeRef.value
  const info = computeSixYun(now)
  const currentIdx = info.dayInRing
  const currentYunIdx0 = info.currentYunIndex - 1  // 0-5

  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    // ★ 关键修复：干支索引直接由环位置计算，不再逐日调用 tyme4ts。
    //   EPOCH 是甲子（index=0）+ 360 是 60 的整数倍 ⇒ 环第 i 天 = (i % 60)。
    //   彻底消除因 Date + 86400000 累加穿越时区标准化导致的丢日 bug
    //   （原症状：癸亥格永远不出现）。
    const jiaziIdx = jiaziIndexAt(i)              // 0-59
    const gzName = ganzhiName(jiaziIdx)
    const roundIdx = Math.floor(i / 60)           // 0-5：该格所属运
    const isAnchor = jiaziIdx === 0               // 甲子日 = 每段起点
    const isCurrentDay = i === currentIdx
    const isCurrentAnchor = isAnchor && roundIdx === currentYunIdx0

    let bgColor: string
    let color: string
    let fontSize: number
    let highlightLevel: 0 | 1 | 2 | 3 = 0

    if (isCurrentDay) {
      // 当日格：金底 + 深字（最强呼吸）
      bgColor = '#FFD700'
      color = '#1a1a1a'
      fontSize = 9
      highlightLevel = 3
    } else if (isCurrentAnchor) {
      // 当前运的甲子锚：饱和色底 + 白字 + 金描边（强呼吸）
      bgColor = YUN_COLORS[roundIdx] ?? '#666666'
      color = '#FFFFFF'
      fontSize = 8
      highlightLevel = 3
    } else if (isAnchor) {
      // 其他 5 个甲子锚：饱和色底 + 白字（中亮）
      bgColor = YUN_COLORS[roundIdx] ?? '#666666'
      color = '#FFFFFF'
      fontSize = 7
      highlightLevel = 2
    } else {
      // 普通日：轮次微差背景 + 浅色文字
      bgColor = ROUND_BG_COLORS[roundIdx] ?? '#2a2a2a'
      color = '#888888'
      fontSize = 4
    }

    items.push({
      label: gzName,
      bgColor,
      color,
      startAngle: i,
      endAngle: i + 1,
      highlight: isCurrentDay || isAnchor,
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
