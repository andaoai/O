<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import {
  getLunarMonthsOfYear,
  getCurrentLunarInfo,
  isGregorianLeapYear
} from '@/utils/chineseCalendar'
import type { RingData } from '@/data/rings/types'

/**
 * 农历月份环（段环）—— 公历年逐日填充，无空洞无 wrap-around + 闰月高亮
 *
 * 🟠 类型：段环 → DataRing → CircleRing → PolarCanvas
 *
 * 🌕 数据源：getLunarMonthsOfYear（逐日扫描公历年）
 *    返回该公历年内所有农历月片段（含跨农历年的腊月/正月边界）
 *    所有日序数在 [1, 365/366] 内，无跨年溢出，无 wrap-around
 *
 * 🔑 农历年身份模型：
 *    yearOffset=0  → 农历年覆盖当前日期的那一年
 *    yearOffset=-1 → 上一个农历年（正月始于去年公历年）
 *    yearOffset=-2 → 再上一个农历年 …以此类推
 *
 * 🔍 当前月检测（核心改进）：
 *    通过 tyme4ts LunarMonth.getIndexInYear() + LunarYear.getYear()
 *    精确比对，无论日期在正月前（属上年腊月）还是正月后，均正确。
 *
 * 十二月份四象五行配色（跨年固定，便于追踪同月位移）：
 *   春·青龙(正月→三月) 绿系 | 夏·朱雀(四月→六月) 红系
 *   秋·白虎(七月→九月) 金系 | 冬·玄武(十月→十二月) 蓝紫系
 *   闰月 = 同月色 + 3 级快速闪烁
 *
 * yearOffset: 0=今年, -1=去年, … -9=九年前
 * 越老旧亮度越低，上年起用白色文字
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

// 🔑 当前日期所属的农历月/年定位
// 使用 tyme4ts API 直接获取，无论日期在正月前还是正月后均正确
const currentLunarInfo = computed(() => getCurrentLunarInfo(timeRef.value))

const ringData = computed((): RingData => {
  const year = targetYear.value
  const daysInYear = isGregorianLeapYear(year) ? 366 : 365
  const anglePerDay = 360 / daysInYear
  const o = offset.value

  // 🌕 获取该公历年内的所有农历月片段（逐日扫描，含跨年边界月）
  const lunarMonths = getLunarMonthsOfYear(year)

  // 🔍 当前月检测：通过农历年序号 + 月序号精确匹配
  // 正月前（1月）→ 当前属上年腊月 → yearOffset=0 环无匹配 → yearOffset=-1 环的腊月高亮 ✓
  // 正月后 → 当前属今年正月 → yearOffset=0 环正月高亮 ✓
  const cur = currentLunarInfo.value

  const items = lunarMonths.map((m) => {
    // 日序在 [1, daysInYear] 内，角度始终在 [0, 360]，无需 wrap
    const startAngle = (m.startDayOfYear - 1) * anglePerDay
    const endAngle = m.endDayOfYear * anglePerDay

    // 通过农历年序号 + 月序号精确匹配
    const isCurrentMonth =
      cur.lunarYearNumber === m.lunarYearNumber &&
      cur.monthIndex === m.index

    const mn = monthNumber(m.name)
    const baseColor = MONTH_COLORS[(mn - 1 + 12) % 12]!

    const opacity = m.isLeap
      ? Math.max(0.40, 0.80 - o * 0.04)
      : Math.max(0.22, 0.58 - o * 0.04)

    return {
      label: m.name,
      startAngle,
      endAngle,
      color: alpha(baseColor, opacity),
      fontSize: Math.max(8, 10 - o * 0.3),
      highlight: isCurrentMonth,
      highlightLevel: (m.isLeap ? 3 : (isCurrentMonth ? 2 : 0)) as 0 | 1 | 2 | 3
    }
  })

  const brightness = Math.max(0.55, 1 - o * 0.06)
  const labelBright = Math.floor(255 * brightness)
  const tickBright = Math.floor(140 * brightness)
  const circleBright = Math.floor(120 * brightness)

  // 🔑 主导农历年名：环上可能包含两个农历年的月份片段（年头上年腊月+年尾本年），
  // 按日数加权取多数作为该环的「名义农历年」
  const nameDays = new Map<string, number>()
  for (const m of lunarMonths) {
    const days = m.endDayOfYear - m.startDayOfYear + 1
    nameDays.set(m.lunarYearName, (nameDays.get(m.lunarYearName) ?? 0) + days)
  }
  let dominantName = lunarMonths[0]?.lunarYearName ?? ''
  let maxDays = 0
  for (const [name, days] of nameDays) {
    if (days > maxDays) {
      maxDays = days
      dominantName = name
    }
  }

  const boxed = {
    radius: props.radius,
    innerRadius: props.innerRadius,
    startDegree: props.startDegree,
    // 当前年用灰度标签色，历史年用纯白保持可读性
    labelColor: offset.value === 0
      ? `rgb(${labelBright},${labelBright},${labelBright})`
      : `rgb(255,255,255)`,
    labelPosition: 0.5,
    showSectors: true,
    tickWidth: 0.5,
    tickColor: `rgb(${tickBright},${tickBright},${tickBright})`,
    verticalTwoChar: false,
    circleColor: `rgb(${circleBright},${circleBright},${circleBright})`,
    circleWidth: 0.5,
    items,
    // 自定义扩展：该环所属农历年名（供上层组件 tooltip/图例使用）
    lunarYearName: dominantName
  }

  return boxed as RingData & { lunarYearName: string }
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
