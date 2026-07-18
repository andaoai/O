<script setup lang="ts">
/**
 * 奇门 · 超神 / 接气 / 正授段环
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与外层「六轮甲子日环」共享 0° 起点（= 上元甲子日）
 *
 *  本环观察的是**真实节气日**驱动的「60 时辰 = 5 天」三元循环 ——
 *  外层节气/三元环走 15 天固定网格，本环走天文节气实际日，
 *  两者错位即为「超神 / 接气 / 正授」现象。
 *
 *   真实节气日 = tyme4ts 天文节气 ↓
 *   ┌────────────────────────────────────────────
 *   │ [真实节气日,      +5 天)     本节气 上元
 *   │ [+5,              +10)       本节气 中元
 *   │ [+10, 下节气真实日)         本节气 下元（可能不足或超过 5 天）
 *   └────────────────────────────────────────────
 *
 *   · 下元 < 5 天：新节气提前到  → **超神**（超 N 天：舍下元）
 *   · 下元 > 5 天：新节气滞后到  → **接气**（接 N 天：延用下元）
 *   · 下元 = 5 天：**正授**（罕遇）
 *
 *  ⚠️ 关键点：本环的节气段起点跟外层节气环**不一样**——
 *   外层节气环按 15 天网格排布，本环按天文节气实际日排布，
 *   两者错开的天数就是「超/接」的天数。
 *
 *  节气段首格（真实节气日那格）标注「超N / 接N / 正授」；
 *  今日所在的 60 时辰段（5 天）整段脉冲高亮；
 *  正授不额外染色。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import { SolarDay } from 'tyme4ts'
import DataRing from './DataRing.vue'
import type { RingData, RingItem } from '@/data/rings/types'
import {
  computeQiMenSolarTerms,
  findUpperYuanJiaziDay,
  getChaoshenAtTerm
} from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 320,
  innerRadius: 296,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

/** tyme4ts 儒略日整日差（抗时区标准化） */
function diffDays(later: Date, earlier: Date): number {
  const a = SolarDay.fromYmd(later.getFullYear(), later.getMonth() + 1, later.getDate())
  const b = SolarDay.fromYmd(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate())
  return a.subtract(b)
}

const YUAN_DAYS = 5              // 60 时辰 = 5 天 = 一元
const CYCLE_DAYS = 360

/** 状态字简写：超/接/正 */
const SHORT: Readonly<Record<'超神' | '接气' | '正授', string>> = {
  '超神': '超',
  '接气': '接',
  '正授': '正'
}

/** 环上区间判断：i 是否落在 [start, end) 内（支持跨 0° 绕环） */
function isInWrap(i: number, start: number, end: number): boolean {
  const s = ((start % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
  const e = ((end % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
  if (s === e) return false
  if (s < e) return i >= s && i < e
  return i >= s || i < e
}

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

  // 🔑 每个节气的「真实首日」在环上的位置（绕环 mod 360）
  //    与外环网格 dayInRing 不同：真实首日随天文时刻自然错位。
  const realStarts = yearTerms.map((t, idx) => {
    const days = diffDays(t.date, upperYuan)
    return {
      idx,
      name: t.name,
      realDayInRing: ((days % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
    }
  })

  // 每个节气段的天数 = 下一节气真实日 - 本节气真实日
  // 最后一个节气延伸到下一岁冬至（若能得知真实日）
  const nextWinterReal = terms.find(t => t.isNextWinter)
  const nextWinterDayInRing = nextWinterReal
    ? ((diffDays(nextWinterReal.date, upperYuan) % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
    : null

  function segEndOf(k: number): number {
    if (k + 1 < realStarts.length) return realStarts[k + 1]!.realDayInRing
    // 最后节气（大雪）→ 下一岁冬至
    if (nextWinterDayInRing !== null) return nextWinterDayInRing
    // 兜底：15 天
    return (realStarts[k]!.realDayInRing + 15) % CYCLE_DAYS
  }

  /** 反查 i 属于哪个真实节气段 */
  function findRealTermAt(i: number) {
    for (let k = 0; k < realStarts.length; k++) {
      const start = realStarts[k]!.realDayInRing
      const end = segEndOf(k)
      if (isInWrap(i, start, end)) {
        const offset = ((i - start) % CYCLE_DAYS + CYCLE_DAYS) % CYCLE_DAYS
        const segDays = ((end - start) % CYCLE_DAYS + CYCLE_DAYS) % CYCLE_DAYS || 15
        return { idx: k, offsetFromRealStart: offset, segDays }
      }
    }
    return null
  }

  // 今日所在的 60 时辰段（5 天段）：以真实节气首日为基准滚动
  const todayReal = findRealTermAt(todayInRing)
  let todayYuanStart = -1
  let todayYuanEnd = -1
  if (todayReal) {
    const segStart = realStarts[todayReal.idx]!.realDayInRing
    const yuanOffset = Math.floor(todayReal.offsetFromRealStart / YUAN_DAYS) * YUAN_DAYS
    todayYuanStart = (segStart + yuanOffset) % CYCLE_DAYS
    // 元段不能越出节气边界（下元可能不足 5 天 → 超神；也可能超过 5 天 → 下元实际就到新节气首日为止）
    const segEnd = (segStart + todayReal.segDays) % CYCLE_DAYS
    const uncappedEnd = todayYuanStart + YUAN_DAYS
    todayYuanEnd = (yuanOffset + YUAN_DAYS <= todayReal.segDays)
      ? uncappedEnd % CYCLE_DAYS
      : segEnd
  }

  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    const real = findRealTermAt(i)
    const isRealFirst = !!real && real.offsetFromRealStart === 0
    const isToday = i === todayInRing
    const inTodayYuan = todayReal
      ? isInWrap(i, todayYuanStart, todayYuanEnd)
      : false

    let bgColor: string
    let color: string
    let fontSize: number
    let label = ''
    let highlightLevel: 0 | 1 | 2 | 3 = 0

    if (!real) {
      bgColor = '#0f0f0f'
      color = '#222222'
      fontSize = 3
    } else {
      const state = getChaoshenAtTerm(real.idx, terms)
      const fullLabel = state
        ? (state.label === '正授' ? '正授' : SHORT[state.label]! + String(state.days))
        : ''

      if (isToday) {
        // 今日格：金底黑字 + 强呼吸
        bgColor = '#FFD700'
        color = '#1a1a1a'
        fontSize = 6
        highlightLevel = 3
        label = fullLabel
      } else if (inTodayYuan) {
        // 今日所在的 60 时辰段（真实节气驱动的 5 天段）：暗金脉冲
        bgColor = '#4A3A00'
        color = '#FFD700'
        fontSize = isRealFirst ? 6 : 3
        highlightLevel = 2
        label = isRealFirst ? fullLabel : ''
      } else if (isRealFirst) {
        // 其它节气真实首日：暗底 + 灰白字，仅显示「超N/接N/正授」
        bgColor = '#1a1a1a'
        color = state?.label === '正授' ? '#666666' : '#BFBFBF'
        fontSize = 6
        highlightLevel = 0
        label = fullLabel
      } else {
        // 段内其它日：纯暗底
        bgColor = '#1a1a1a'
        color = '#333333'
        fontSize = 3
      }
    }

    items.push({
      label,
      bgColor,
      color,
      startAngle: i,
      endAngle: i + 1,
      highlight: isToday || inTodayYuan,
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
