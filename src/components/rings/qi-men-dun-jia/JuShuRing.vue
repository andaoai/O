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
import DataRing from '../DataRing.vue'
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

  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    const info = getYuanJuAt(i, terms)
    const isToday = i === todayInRing
    const isYuanFirst = info && (
      info.yuanPos === 0 ? info.daysFromTermStart === 0
      : info.yuanPos === 1 ? info.daysFromTermStart === 5
      : info.daysFromTermStart === 10
    )

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
        // 今日格：金底黑字 + 强呼吸
        bgColor = '#FFD700'
        color = '#1a1a1a'
        fontSize = 9
        highlightLevel = 3
        label = CHINESE_NUM[ju]!
      } else {
        // 未到（含过去、未来）：统一暗下去，字色用同色系暗色，非白色
        bgColor = darken(juColor, 0.15)
        color = darken(juColor, isYuanFirst ? 0.7 : 0.5)
        fontSize = isYuanFirst ? 7 : 4
        label = CHINESE_NUM[ju]!
      }
    }

    items.push({
      label,
      bgColor,
      color,
      startAngle: i,
      endAngle: i + 1,
      highlight: !!isToday,
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
