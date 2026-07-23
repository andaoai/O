<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import {
  getChineseCalendarInfo,
  getLunarMonthsOfYear,
  getDayOfYear,
  isGregorianLeapYear,
  type ChineseCalendarInfo
} from '@/utils/chineseCalendar'

/**
 * ⚫ 闰月信息圆心组件
 *
 * ⚠️ 圆心组件规范：
 *   - 仅需 radius（由 RingStack #center slot 自动注入）
 *   - 支持 MaybeRef<Date> 时间驱动
 *   - 手写 SVG <g> 渲染（文字+进度条，不需要复用底层渲染器）
 *
 * 显示内容：
 *   - 农历年份名 + 公历年
 *   - 闰月状态（有/无、闰几月）
 *   - 农历年进度条
 *   - 当前农历日期 + 节气
 *   - 364天 vs 365天对照
 *
 * @example
 * ```vue
 * <template #center="{ innerRadius }">
 *   <LeapInfoCenter :radius="innerRadius * 0.7" :time="controlledTime" />
 * </template>
 * ```
 */
interface Props {
  radius?: number
  time?: MaybeRef<Date>
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 外层 SVG 旋转角度，圆心区反向旋转保持文字正向可读 */
  rotationAngle?: number
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  rotationDirection: 'clockwise',
  rotationAngle: 0
})

const timeRef = computed(() => unref(props.time) ?? new Date())

/** 当前公历年（先拆出来，让 lunarMonths 只依赖年份变化） */
const currentYear = computed(() => timeRef.value.getFullYear())

/** 完整历法信息 */
const calendarInfo = computed<ChineseCalendarInfo>(() =>
  getChineseCalendarInfo(timeRef.value)
)

/** 农历月份列表 —— 只依赖 currentYear，year 不变时不重算逐日扫描 */
const lunarMonths = computed(() => getLunarMonthsOfYear(currentYear.value))

/** 是否有闰月 */
const hasLeapMonth = computed(() =>
  lunarMonths.value.some(m => m.isLeap)
)

/** 闰月名称 */
const leapMonthName = computed(() => {
  const lm = lunarMonths.value.find(m => m.isLeap)
  return lm?.name ?? ''
})

/** 农历年进度 */
const lunarYearProgress = computed(() => {
  const months = lunarMonths.value
  if (months.length === 0) return { current: 0, total: 12 }
  const totalDays = months.reduce((sum, m) => sum + m.dayCount, 0)
  // 计算从正月首日到今天的偏移天数
  const firstMonth = months[0]
  let passedDays = 0
  for (const m of months) {
    const day = getDayOfYear(timeRef.value)
    if (day >= m.startDayOfYear && day <= m.endDayOfYear) {
      passedDays += (day - m.startDayOfYear + 1)
      break
    } else if (day > m.endDayOfYear) {
      passedDays += m.dayCount
    }
  }
  return { current: Math.min(passedDays, totalDays), total: totalDays }
})

/** 当前年天数 */
const daysInYear = computed(() =>
  isGregorianLeapYear(timeRef.value.getFullYear()) ? 366 : 365
)

/** 当前日序数 */
const currentDayOfYear = computed(() =>
  getDayOfYear(timeRef.value)
)

/** 19年七闰周期计算 */
const leapCycleInfo = computed(() => {
  const year = timeRef.value.getFullYear()
  // 19年周期：以1984年（甲子年）为基准
  const baseYear = 1984
  const yearInCycle = ((year - baseYear) % 19 + 19) % 19
  return {
    yearInCycle: yearInCycle + 1,  // 1-19
    total: 19
  }
})
</script>

<template>
  <!-- 🔑 反向旋转：抵消外层 SVG rotate(rotationAngle)，保持文字始终正向 -->
  <g :transform="`rotate(${-rotationAngle})`">
    <!-- 年份信息 -->
    <text
      :x="0"
      :y="-radius * 0.35"
      text-anchor="middle"
      :fill="hasLeapMonth ? '#FFD700' : '#FFFFFF'"
      :font-size="radius * 0.1"
      font-family="serif"
    >
      {{ calendarInfo.lunarDate.replace('农历', '').replace(/[年月]/g, ' ').trim() || '农历' }}
    </text>

    <!-- 闰月状态 -->
    <text
      :x="0"
      :y="-radius * 0.15"
      text-anchor="middle"
      :fill="hasLeapMonth ? '#FF6B6B' : '#888888'"
      :font-size="radius * 0.12"
      font-weight="bold"
    >
      {{ hasLeapMonth ? '闰' + leapMonthName : '平年无闰' }}
    </text>

    <!-- 分隔线 -->
    <line
      :x1="-radius * 0.3"
      :y1="0"
      :x2="radius * 0.3"
      :y2="0"
      stroke="#555555"
      stroke-width="0.5"
    />

    <!-- 当前节气 -->
    <text
      :x="0"
      :y="radius * 0.18"
      text-anchor="middle"
      fill="#aaa"
      :font-size="radius * 0.06"
    >
      节气: {{ calendarInfo.solarTerm?.name ?? '-' }}
      <template v-if="calendarInfo.solarTerm?.daysToNext">
        · 距{{ calendarInfo.solarTerm?.nextTermName }}{{ calendarInfo.solarTerm?.daysToNext }}天
      </template>
    </text>

    <!-- 公历日期 -->
    <text
      :x="0"
      :y="radius * 0.32"
      text-anchor="middle"
      fill="#888"
      :font-size="radius * 0.055"
    >
      {{ calendarInfo.solarDate }}
    </text>

    <!-- 农历年进度条 -->
    <g :transform="`translate(0, ${radius * 0.48})`">
      <rect
        :x="-radius * 0.3"
        y="0"
        :width="radius * 0.6"
        :height="radius * 0.04"
        fill="#333"
        stroke="#555"
        stroke-width="0.5"
        rx="2"
      />
      <rect
        :x="-radius * 0.3"
        y="0"
        :width="radius * 0.6 * (lunarYearProgress.current / lunarYearProgress.total)"
        :height="radius * 0.04"
        :fill="hasLeapMonth ? '#FF6B6B' : '#3498DB'"
        rx="2"
      />
      <text
        :x="0"
        :y="radius * 0.09"
        text-anchor="middle"
        fill="#888"
        :font-size="radius * 0.045"
      >
        农历年 {{ lunarYearProgress.current }}/{{ lunarYearProgress.total }}天
      </text>
    </g>

    <!-- 355天 vs 365天对照 -->
    <g :transform="`translate(0, ${radius * 0.65})`">
      <text
        :x="0"
        :y="0"
        text-anchor="middle"
        fill="#666"
        :font-size="radius * 0.045"
      >
        公历 {{ currentDayOfYear }}/{{ daysInYear }}天
      </text>
      <text
        :x="0"
        :y="radius * 0.09"
        text-anchor="middle"
        fill="#555"
        :font-size="radius * 0.04"
      >
        19年7闰周期：第 {{ leapCycleInfo.yearInCycle }}/19 年
      </text>
    </g>
  </g>
</template>

<style scoped>
/* ⚠️ 纯SVG渲染，无需CSS */
</style>
