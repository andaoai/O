<script setup lang="ts">
/**
 * 奇门 · 三元段环（上元 / 中元 / 下元）
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与外层「六轮甲子日环」共享 0° 起点（= 上元甲子日）
 *
 *  一环 360 天 = 360°，段环模式（DataRing）：
 *   · 每 5 天为一元 → 24 节气 × 3 元 = 72 元
 *   · 每格 [i, i+1) 对应一个具体日期
 *   · 上元 5 天：朱红 #C0392B
 *   · 中元 5 天：赭黄 #B58900
 *   · 下元 5~7 天：靛蓝 #1F4E79（长度浮动 = 超神/接气天数）
 *   · 今日所在元的整段高亮呼吸
 *
 *  ⚠️ 由于 getYuanJuAt 内部沿时间序按每节气实际公历跨度填格，
 *     所以下元的实际长度会自然浮动 5-7 天，不需要置闰。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, type MaybeRef } from 'vue'
import DataRing from '../DataRing.vue'
import type { RingData, RingItem } from '@/data/rings/types'
import { YUAN_COLORS, YUAN_NAMES } from '@/utils/qimenDunJia'
import { useQiMenContext } from '@/composables/useQiMenDunJiaContext'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 400,
  innerRadius: 376,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const ctx = useQiMenContext()

const ringData = computed<RingData>(() => {
  const c = ctx.value
  const todayInRing = c.todayInRing
  const yuanJuAt = c.yuanJuAt

  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    const info = yuanJuAt[i] ?? null
    const isToday = i === todayInRing
    const isYuanFirst = info && info.daysFromTermStart % 5 === 0
      && (info.yuanPos === 0
          ? info.daysFromTermStart === 0
          : info.yuanPos === 1
            ? info.daysFromTermStart === 5
            : info.daysFromTermStart === 10)

    let bgColor: string
    let color: string
    let fontSize: number
    let label = ''
    let highlightLevel: 0 | 1 | 2 | 3 = 0

    if (!info) {
      bgColor = '#0f0f0f'
      color = '#222222'
      fontSize = 3
    } else if (isToday) {
      // 今日格：金底黑字 + 强呼吸
      bgColor = '#FFD700'
      color = '#1a1a1a'
      fontSize = 8
      highlightLevel = 3
      label = YUAN_NAMES[info.yuanPos]!.charAt(0)
    } else {
      // 未到（含过去、当前元段其余日、未来）：统一暗下去，字色用同色系暗色，非白色
      const c = YUAN_COLORS[info.yuanPos]!
      bgColor = darken(c, 0.18)
      color = darken(c, isYuanFirst ? 0.7 : 0.5)
      fontSize = isYuanFirst ? 7 : 4
      label = YUAN_NAMES[info.yuanPos]!.charAt(0)
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

/** 简易 hex 颜色变暗（factor: 0-1，越小越暗） */
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
