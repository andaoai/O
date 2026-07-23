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
 *   · 24 节气首日格 = 每节气的「上元第一天」= 符头位置（网格节气日）
 *   · 符头颜色由「网格 vs 真实天文」偏差决定：
 *       对齐（正授，diff=0） → 绿色符头
 *       不对齐（超神/接气） → 符头保持灰色，
 *         真实天文节气日那一格另外标色：
 *           超神（天文提前，diff<0） → 红色
 *           接气（天文延后，diff>0） → 蓝色
 *       特殊：本岁冬至永远正授 → 金色（岁首标）
 *              下一岁冬至锚点 → 紫色（提前预告）
 *   · 节气段内其余 14 天：中灰 #2a2a2a
 *   · 未被 24 节气覆盖的绕环缝隙（一岁 365 - 环 360 = 5 天）：极暗
 *   · 今日格：金色高亮 + 呼吸
 *
 *  节气首日与六十甲子环对应干支格严格径向对齐；冬至位置在
 *  环上每年漂 +5 天，节气整体绕环滑动，最终周期约 72 年一圈。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from '../DataRing.vue'
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
  /**
   * 网格 vs 天文偏差判定的符头状态：
   *   'zhengshou' 正授（对齐）→ 绿
   *   'chaoshen'  超神（天文提前）→ 红
   *   'jieqi'     接气（天文延后）→ 蓝
   */
  chaoshenLabel: 'zhengshou' | 'chaoshen' | 'jieqi'
}

const ringData = computed<RingData>(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const terms: QiMenSolarTerm[] = computeQiMenSolarTerms(now)  // 按冬至起时间序（含下一冬至）
  const todayInRing = ((diffDays(now, upperYuan) % 360) + 360) % 360

  // 拆出「本岁 24 节气」与「下一岁冬至」两部分
  const yearTerms = terms.filter(t => !t.isNextWinter)
  const nextWinter = terms.find(t => t.isNextWinter) ?? null

  // 本岁冬至真实日期 = yearTerms[0].date（网格锚点，永远正授）
  const winterRealDate = yearTerms[0]?.date ?? null

  /**
   * 计算某节气的符头状态：
   *   网格节气日 = 本岁冬至日 + n × 15 天
   *   真实天文节气日 = t.date
   *   diff = real - grid（天）
   *   diff > 0 → 接气（网格已到、天文尚未到 = 天文延后）
   *   diff < 0 → 超神（网格未到、天文已到 = 天文提前）
   *   diff = 0 → 正授
   */
  const computeChaoshenLabel = (
    idx: number,
    real: Date
  ): 'zhengshou' | 'chaoshen' | 'jieqi' => {
    if (!winterRealDate) return 'zhengshou'
    if (idx === 0) return 'zhengshou'  // 冬至本身作锚点，恒正授
    const gridDate = new Date(
      winterRealDate.getFullYear(),
      winterRealDate.getMonth(),
      winterRealDate.getDate() + idx * 15
    )
    const diff = diffDays(real, gridDate)
    if (diff > 0) return 'jieqi'
    if (diff < 0) return 'chaoshen'
    return 'zhengshou'
  }

  // 首日索引表：dayInRing → TermSlot。
  // 下一冬至优先级最高（它会落在冬至段末端某天，用紫色抢占该格）。
  const startIdxOf = new Map<number, TermSlot>()
  for (let n = 0; n < yearTerms.length; n++) {
    const t = yearTerms[n]!
    startIdxOf.set(t.dayInRing, {
      name: t.name,
      isMidTerm: t.isMidTerm,
      isWinter: t.name === '冬至',
      isNextWinter: false,
      chaoshenLabel: computeChaoshenLabel(n, t.date)
    })
  }
  if (nextWinter) {
    startIdxOf.set(nextWinter.dayInRing, {
      name: '冬至·下岁',
      isMidTerm: true,
      isWinter: true,
      isNextWinter: true,
      chaoshenLabel: 'zhengshou'
    })
  }

  /**
   * 🎯 真实节气日索引表：dayInRing → 该节气在天文真实日期落到的环格。
   *   ── 与符头（网格首日）区分开：
   *      · 符头是 winter + n × 15 的固定网格格（是否对齐 → 绿或灰）
   *      · 真实节气日 = t.date 换算到环上，可能与符头错开若干天
   *   ── 用于把超神红 / 接气蓝色画到「天文真实位置」那一格上，
   *      而不是错误地染到符头。
   *
   *   跳过 chaoshenLabel === 'zhengshou' 的节气（正授时真实日 = 符头日，
   *   由符头绿色代表；也跳过冬至锚点，冬至符头恒为岁首金色不覆盖）。
   */
  interface RealTermMark {
    name: string
    chaoshenLabel: 'chaoshen' | 'jieqi'
  }
  const realTermIdxOf = new Map<number, RealTermMark>()
  for (let n = 0; n < yearTerms.length; n++) {
    const t = yearTerms[n]!
    if (t.name === '冬至') continue
    const label = computeChaoshenLabel(n, t.date)
    if (label === 'zhengshou') continue
    const realDayInRing = ((diffDays(t.date, upperYuan) % 360) + 360) % 360
    // 该格若已被某节气符头占用则让位（符头优先），只染剩余段内格
    if (startIdxOf.has(realDayInRing)) continue
    if (!realTermIdxOf.has(realDayInRing)) {
      realTermIdxOf.set(realDayInRing, { name: t.name, chaoshenLabel: label })
    }
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
      isNextWinter: false,
      chaoshenLabel: computeChaoshenLabel(k, t.date)
    }
    for (let d = 0; d < segDays; d++) {
      const idx = (t.dayInRing + d) % 360
      if (!segAssignment.has(idx)) segAssignment.set(idx, slot)
    }
  }

  const currentSeg = segAssignment.get(todayInRing) ?? null

  // 🎯 冬至颜色恒定，与农历环的年头金/年尾紫方向一致：
  //   · 本岁冬至（W1）恒金色  —— 岁首锚点
  //   · 下一岁冬至（W2）恒紫色 —— 岁末终点

  const items: RingItem[] = []
  for (let i = 0; i < 360; i++) {
    const startInfo = startIdxOf.get(i)             // 该格是否为某节气首日（含下一冬至）
    const realMark = realTermIdxOf.get(i)           // 该格是否为某节气真实天文日（错位标记）
    const seg = segAssignment.get(i) ?? null
    const isTermDay = !!startInfo
    const isRealTermDay = !!realMark && !isTermDay
    const isToday = i === todayInRing
    const isCurrentSegDay =
      !!currentSeg && !!seg && seg.name === currentSeg.name

    let bgColor: string
    let color: string
    let fontSize: number
    let label = ''
    let highlightLevel: 0 | 1 | 2 | 3 = 0

    if (isToday) {
      // 今日格：W2 恒紫，其余恒金
      if (startInfo?.isNextWinter) {
        bgColor = '#8E44AD'                            // 紫底
        color = '#FFD700'
      } else {
        bgColor = '#FFD700'                            // 金底
        color = '#1a1a1a'
      }
      fontSize = 8
      highlightLevel = 3
      label = startInfo?.name ?? realMark?.name ?? ''
    } else if (startInfo?.isNextWinter) {
      // 下一岁冬至：恒紫，岁末终点
      bgColor = '#8E44AD'                            // 紫底
      color = '#F5D0FA'
      fontSize = 7
      highlightLevel = 3
      label = '冬至'
    } else if (isTermDay) {
      const info = startInfo!
      if (info.isWinter) {
        // 本岁冬至（W1）：恒金，岁首锚点
        bgColor = '#8B7500'
        color = '#FFD700'
        fontSize = 7
        highlightLevel = 2
        label = info.name
      } else if (info.chaoshenLabel === 'zhengshou') {
        // 🎯 符头对齐真实节气 → 正授 · 绿
        bgColor = '#1F5F3A'                            // 深绿底
        color = '#58D68D'                              // 亮绿字
        fontSize = 7
        highlightLevel = 2
        label = info.name
      } else {
        // 🎯 符头未对齐（超神 / 接气）→ 符头本身灰色，
        //    红 / 蓝色画在真实节气日那一格（见下方 isRealTermDay 分支）
        bgColor = '#3a3a3a'                            // 中灰底
        color = '#9a9a9a'                              // 淡灰字
        fontSize = 7
        highlightLevel = 1
        label = info.name
      }
    } else if (isRealTermDay) {
      // 🎯 真实节气日格（与符头错开的天文位置）→ 超神红 / 接气蓝
      const mark = realMark!
      if (mark.chaoshenLabel === 'chaoshen') {
        bgColor = '#7B241C'                            // 超神 · 深红底
        color = '#F1948A'                              // 亮红字
      } else {
        bgColor = '#1F4E79'                            // 接气 · 深蓝底
        color = '#5DADE2'                              // 亮蓝字
      }
      fontSize = 7
      highlightLevel = 2
      label = mark.name
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
      highlight: isToday || isTermDay || isRealTermDay,
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
