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
 *   闰月 = 同月色 + 2 级慢呼吸 | 当前月 = 3 级快速闪烁
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
// 🔑 拆出当前公历年，让 targetYear 只依赖 year 而非整个 timeRef —— 年不变时下游布局不重算
const currentYear = computed(() => timeRef.value.getFullYear())
const targetYear = computed(() => currentYear.value + (props.yearOffset ?? 0))
const offset = computed(() => Math.abs(props.yearOffset ?? 0))

// ── 四象五行配色（由外向内：春青·夏赤·秋白·冬玄）──
// 同一季内"浅→中→深"三档跳变，12个月各自可辨；季间强对比
const MONTH_COLORS = [
  // 春·青龙·木（正月→三月）绿系：浅绿 → 中绿 → 深绿
  '#80FFB0', // 正月 亮浅绿
  '#00D060', // 二月 中绿
  '#007828', // 三月 深翠绿
  // 夏·朱雀·火（四月→六月）红系：浅红 → 中橙红 → 深橙
  '#FF6B6B', // 四月 浅烈红
  '#FF4018', // 五月 中朱红
  '#D03000', // 六月 深赤橙
  // 秋·白虎·金（七月→九月）金系：亮黄 → 中金 → 深琥珀
  '#FFF050', // 七月 亮浅金
  '#FFB000', // 八月 中金
  '#D07800', // 九月 深暖金
  // 冬·玄武·水（十月→十二月）蓝系：亮蓝 → 中蓝 → 深靛
  '#70C8FF', // 十月 亮浅蓝
  '#3058FF', // 十一月 中靛蓝
  '#3818B0', // 十二月 深紫蓝
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

// 🔑 性能关键：年内农历月布局只依赖 year，不依赖 timeRef
// 按住 D 键快速拖时间时，year 大多数时候不变 → getLunarMonthsOfYear 不重算，
// 12 圈 × 365 天 tyme4ts 扫描的开销被消除。
const yearLayout = computed(() => {
  const year = targetYear.value
  const daysInYear = isGregorianLeapYear(year) ? 366 : 365
  const anglePerDay = 360 / daysInYear
  const o = offset.value
  const lunarMonths = getLunarMonthsOfYear(year)

  // 预计算每个月的静态几何/样式属性（除 highlight 外全部固定）
  const staticItems = lunarMonths.map((m) => {
    const startAngle = (m.startDayOfYear - 1) * anglePerDay
    const endAngle = m.endDayOfYear * anglePerDay
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
      isLeap: m.isLeap,
      lunarYearNumber: m.lunarYearNumber,
      monthIndex: m.index
    }
  })

  // 主导农历年名（该环名义农历年）
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

  const brightness = Math.max(0.55, 1 - o * 0.06)
  const labelBright = Math.floor(255 * brightness)
  const tickBright = Math.floor(140 * brightness)
  const circleBright = Math.floor(120 * brightness)

  return {
    staticItems,
    dominantName,
    labelBright,
    tickBright,
    circleBright
  }
})

const ringData = computed((): RingData => {
  const cur = currentLunarInfo.value
  const { staticItems, dominantName, labelBright, tickBright, circleBright } =
    yearLayout.value

  // 仅叠加 highlight 位（当前月判定），几何/颜色/字号从缓存布局取
  const items = staticItems.map((si) => {
    const isCurrentMonth =
      cur.lunarYearNumber === si.lunarYearNumber &&
      cur.monthIndex === si.monthIndex

    return {
      label: si.label,
      startAngle: si.startAngle,
      endAngle: si.endAngle,
      color: si.color,
      fontSize: si.fontSize,
      highlight: isCurrentMonth,
      highlightLevel: (isCurrentMonth ? 3 : (si.isLeap ? 2 : 0)) as 0 | 1 | 2 | 3
    }
  })

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
/* 当前月快速闪动 0.35s（覆盖 CircleRing 默认 1.2s 强闪） */
.highlight-sector-strong {
  animation: leap-blink 0.35s ease-in-out infinite !important;
}
@keyframes leap-blink {
  0%, 100% { opacity: 0.30; }
  50%        { opacity: 0.88; }
}
</style>
