<script setup lang="ts">
/**
 * 奇门 · 九局数段环（1~9 洛书方位色）
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与外层「六轮甲子日环」共享 0° 起点（= 上元甲子日）
 *
 *  一环 360 天 = 360°，段环模式（DataRing）：
 *   · 每 5 天为一元 → 24 节气 × 3 元 = 72 元
 *   · 每元的局数由 YANG/YIN_YUAN_JU 死表查出（阳遁 1-9 / 阴遁 1-9）
 *   · 每格显示局数数字，用洛书方位色 JU_COLORS[ju]
 *   · 元首日格显示大字局数
 *   · 今日格金色高亮
 *
 *  🔑 阴阳遁分界：
 *   · 冬至→芒种 阳遁 12 节气（红黄暖色系为主）
 *   · 夏至→大雪 阴遁 12 节气（青蓝冷色系为主）
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import { SolarDay } from 'tyme4ts'
import DataRing from './DataRing.vue'
import type { RingData, RingItem } from '@/data/rings/types'
import {
  computeQiMenSolarTerms,
  findUpperYuanJiaziDay,
  getYuanJuAt,
  JU_COLORS
} from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 360,
  innerRadius: 336,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

/** 走 tyme4ts 儒略日的整日差（抗时区标准化） */
function diffDays(later: Date, earlier: Date): number {
  const a = SolarDay.fromYmd(later.getFullYear(), later.getMonth() + 1, later.getDate())
  const b = SolarDay.fromYmd(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate())
  return a.subtract(b)
}

const CHINESE_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

const ringData = computed<RingData>(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const terms = computeQiMenSolarTerms(now)
  const todayInRing = ((diffDays(now, upperYuan) % 360) + 360) % 360
  const todayInfo = getYuanJuAt(todayInRing, terms)

  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    const info = getYuanJuAt(i, terms)
    const isToday = i === todayInRing
    const isYuanFirst = info && (
      info.yuanPos === 0 ? info.daysFromTermStart === 0
      : info.yuanPos === 1 ? info.daysFromTermStart === 5
      : info.daysFromTermStart === 10
    )
    const isCurrentYuan =
      !!info && !!todayInfo &&
      info.termName === todayInfo.termName &&
      info.yuanPos === todayInfo.yuanPos

    let bgColor: string
    let color: string
    let fontSize: number
    let label = ''
    let highlightLevel: 0 | 1 | 2 | 3 = 0

    if (!info) {
      bgColor = '#0f0f0f'
      color = '#222222'
      fontSize = 3
    } else {
      const ju = info.ju
      const juColor = JU_COLORS[ju] ?? '#555'

      if (isToday) {
        bgColor = '#FFD700'
        color = '#1a1a1a'
        fontSize = 9
        highlightLevel = 3
        label = CHINESE_NUM[ju]!
      } else if (isCurrentYuan) {
        bgColor = juColor
        // 判断是否是浅色底 → 用深字
        color = isLightBg(juColor) ? '#1a1a1a' : '#FFFFFF'
        fontSize = isYuanFirst ? 8 : 5
        highlightLevel = 2
        label = isYuanFirst ? CHINESE_NUM[ju]! : ''
      } else if (isYuanFirst) {
        bgColor = juColor
        color = isLightBg(juColor) ? '#1a1a1a' : '#FFFFFF'
        fontSize = 7
        highlightLevel = 1
        label = CHINESE_NUM[ju]!
      } else {
        // 元段中间日：暗化底
        bgColor = darken(juColor, 0.45)
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
      highlight: !!(isToday || isYuanFirst),
      highlightLevel,
      fontSize
    })
  }

  return {
    items,
    showSectors: true,
    verticalTwoChar: true,
    labelPosition: 0.5,
    labelColor: '#888',
    circleColor: '#555',
    circleWidth: 0.5,
    tickColor: '#333',
    tickWidth: 0.2
  }
})

/** 判断颜色是不是浅色（用于选深/浅字） */
function isLightBg(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  const luma = 0.299 * r + 0.587 * g + 0.114 * b
  return luma > 170
}

/** hex 颜色变暗（factor: 0-1） */
function darken(hex: string, factor: number): string {
  const h = hex.replace('#', '')
  const r = Math.floor(parseInt(h.substring(0, 2), 16) * factor)
  const g = Math.floor(parseInt(h.substring(2, 4), 16) * factor)
  const b = Math.floor(parseInt(h.substring(4, 6), 16) * factor)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
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
