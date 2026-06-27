<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import { getLunarMonthsOfYear, isGregorianLeapYear, getDayOfYear } from '@/utils/chineseCalendar'
import type { RingData } from '@/data/rings/types'

/**
 * 农历月份环（段环）—— 12月固定色 + 闰月高亮
 *
 * 🟠 类型：段环 → DataRing → CircleRing → PolarCanvas
 *
 * 十二月份专属色（跨年固定，便于追踪同月位移）：
 *   正月红、二月橙、三月金、四月绿、五月青、六月蓝
 *   七月紫、八月粉、九月天蓝、十月琥珀、十一月黄绿、十二月蓝灰
 *   闰月 = 同月色 + 白色边框 + 加强不透明度
 *
 * yearOffset: 0=今年, -1=去年, … -7=七年前
 * 越老旧亮度越低（标签/圆线逐级变暗）
 */
interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  yearOffset?: number
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 170,
  startDegree: 0,
  rotationDirection: 'clockwise',
  yearOffset: 0
})

const timeRef = computed(() => unref(props.time) ?? new Date())
const targetYear = computed(() => timeRef.value.getFullYear() + (props.yearOffset ?? 0))
const isCurrentYearRing = computed(() => (props.yearOffset ?? 0) === 0)
const offset = computed(() => Math.abs(props.yearOffset ?? 0))

// ── 四象五行配色（由外向内：春青·夏赤·秋白·冬玄）──
// 每季三月同色系，逐月微调区分
const MONTH_COLORS = [
  // 春·青龙·木（正月→三月）绿系
  '#4CFF88', // 正月 明绿
  '#2EFFAD', // 二月 青绿
  '#00E5A0', // 三月 翠绿
  // 夏·朱雀·火（四月→六月）红系
  '#FF5E5E', // 四月 明红
  '#FF8833', // 五月 朱红
  '#FFAA22', // 六月 橙红
  // 秋·白虎·金（七月→九月）金白系
  '#FFE066', // 七月 明金
  '#FFD700', // 八月 金
  '#FFC107', // 九月 暖金
  // 冬·玄武·水（十月→十二月）蓝紫系
  '#66B2FF', // 十月 天蓝
  '#8899FF', // 十一月 蓝紫
  '#AA88DD', // 十二月 紫
]

/**
 * 从"正月"这样的名称提取月份数字 (1-12)
 * 闰月名如"闰六月"→ 提取 6
 */
function monthNumber(name: string): number {
  const m = name.replace('闰', '')
  const map: Record<string, number> = {
    '正月': 1, '二月': 2, '三月': 3, '四月': 4, '五月': 5, '六月': 6,
    '七月': 7, '八月': 8, '九月': 9, '十月': 10, '十一月': 11, '十二月': 12
  }
  return map[m] || 1
}

/** 将 hex 颜色转 rgba(带透明度) */
function alpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

const ringData = computed((): RingData => {
  const time = timeRef.value
  const year = targetYear.value
  const daysInYear = isGregorianLeapYear(year) ? 366 : 365
  const anglePerDay = 360 / daysInYear
  const currentDay = isCurrentYearRing.value ? getDayOfYear(time) : -1
  const o = offset.value

  const lunarMonths = getLunarMonthsOfYear(year)

  const items = lunarMonths.map((m) => {
    const startAngle = (Math.max(1, m.startDayOfYear) - 1) * anglePerDay
    const endAngle = Math.min(daysInYear, m.endDayOfYear) * anglePerDay
    const isCurrentMonth = currentDay >= m.startDayOfYear && currentDay <= m.endDayOfYear
    const mn = monthNumber(m.name)
    const baseColor = MONTH_COLORS[(mn - 1 + 12) % 12]!

    // 大幅提亮透明度
    const opacity = m.isLeap
      ? Math.max(0.45, 0.80 - o * 0.04)   // 闰月：0.80 → 0.52
      : Math.max(0.25, 0.58 - o * 0.04)   // 正常：0.58 → 0.30

    return {
      label: m.name,
      startAngle,
      endAngle,
      color: alpha(baseColor, opacity),
      fontSize: Math.max(8, 10 - o * 0.3),
      highlight: isCurrentMonth,
      // 所有闰月都用 3 级强闪，正常月当前月 2 级
      highlightLevel: (m.isLeap ? 3 : (isCurrentMonth ? 2 : 0)) as 0 | 1 | 2 | 3
    }
  })

  const brightness = Math.max(0.55, 1 - o * 0.06)
  const labelBright = Math.floor(255 * brightness)
  const tickBright = Math.floor(140 * brightness)
  const circleBright = Math.floor(120 * brightness)

  return {
    radius: props.radius,
    innerRadius: props.innerRadius,
    startDegree: props.startDegree,
    labelColor: `rgb(${labelBright},${labelBright},${labelBright})`,
    labelPosition: 0.5,
    showSectors: true,
    tickWidth: 0.5,
    tickColor: `rgb(${tickBright},${tickBright},${tickBright})`,
    verticalTwoChar: false,
    circleColor: `rgb(${circleBright},${circleBright},${circleBright})`,
    circleWidth: 0.5,
    items
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

<style>
/* 闰月快速闪动 0.35s（覆盖 CircleRing 默认 1.2s 强闪） */
.highlight-sector-strong {
  animation: leap-blink 0.35s ease-in-out infinite !important;
}
@keyframes leap-blink {
  0%, 100% { opacity: 0.30; }
  50%        { opacity: 0.88; }
}
</style>
