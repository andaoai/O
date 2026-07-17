<script setup lang="ts">
/**
 * ⚫ 奇门遁甲圆心信息卡
 *
 * ⚠️ 圆心组件规范：
 *   - 仅需 radius（由 RingStack #center slot 注入）
 *   - 支持 MaybeRef<Date> 时间驱动
 *   - 手写 SVG <g> 渲染（文字栅格 + 局数超大字）
 *
 * 显示（由上到下）：
 *   1. 阳遁/阴遁 · 节气 · 三元
 *   2. 【局数超大字】＋副标签（如"一 白局"）
 *   3. 超神/接气/正授 徽章
 *   4. 公历日期 + 时刻（YYYY-MM-DD HH:MM）
 *   5. 农历日期（完整：农历甲午年闰四月初三）
 *   6. 四柱干支（年月日时）
 *   7. 距下节气天数
 *   8. 奇门置闰状态
 */
import { computed, unref, type MaybeRef } from 'vue'
import {
  getSolarTermName, getYinYangDunLabel,
  getCurrentYuan, getBureauNumber, getChaoShenJieQi,
  getDayGanzhi, getDaysToNextTerm, getQimenLeapStatus,
  JU_HANZI, JIU_XING_COLORS, JIU_XING_NAMES
} from '@/utils/qimenDunJia'
import {
  getCurrentLunarInfo, getLunarMonthsOfYear, getGanzhiInfo
} from '@/utils/chineseCalendar'
import { SolarDay } from 'tyme4ts'

interface Props {
  radius?: number
  time?: MaybeRef<Date>
  rotationDirection?: 'clockwise' | 'counterclockwise'
  rotationAngle?: number
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  rotationDirection: 'clockwise',
  rotationAngle: 0
})

const timeRef = computed(() => unref(props.time) ?? new Date())

// ── 奇门遁甲状态 ─────────────────────────────
const yinYang = computed(() => getYinYangDunLabel(timeRef.value))
const termName = computed(() => getSolarTermName(timeRef.value))
const yuan = computed(() => getCurrentYuan(timeRef.value))
const juNum = computed(() => getBureauNumber(timeRef.value))
const juHz = computed(() => JU_HANZI[juNum.value] ?? '一')
const juStar = computed(() => JIU_XING_NAMES[juNum.value] ?? '')
const juColor = computed(() => JIU_XING_COLORS[juNum.value] ?? '#F1C40F')

const status = computed(() => getChaoShenJieQi(timeRef.value))
const statusColor = computed(() => (
  status.value === '超神' ? '#E74C3C'
  : status.value === '接气' ? '#3498DB' : '#2ECC71'
))

const dayGz = computed(() => getDayGanzhi(timeRef.value))
const daysToNext = computed(() => getDaysToNextTerm(timeRef.value))

// ── 公历日期 + 时刻 ─────────────────────────
function pad(n: number): string { return n.toString().padStart(2, '0') }
const solarDate = computed(() => {
  const d = timeRef.value
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})
const solarTime = computed(() => {
  const d = timeRef.value
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

// ── 农历完整日期 ────────────────────────────
const lunarFull = computed(() => {
  try {
    const d = timeRef.value
    const sd = SolarDay.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate())
    return sd.getLunarDay().toString()  // 例："农历闰四月初三"
  } catch {
    return ''
  }
})

// ── 四柱干支 ────────────────────────────────
const ganzhi = computed(() => {
  try {
    return getGanzhiInfo(timeRef.value)
  } catch {
    return null
  }
})

// ── 农历年 + 闰月 ───────────────────────────
const lunar = computed(() => getCurrentLunarInfo(timeRef.value))
const lunarMonths = computed(() => getLunarMonthsOfYear(timeRef.value.getFullYear()))
const leapMonthName = computed(() => lunarMonths.value.find(m => m.isLeap)?.name ?? '')

const qimenLeap = computed(() => getQimenLeapStatus(timeRef.value.getFullYear()))

const yinYangColor = computed(() => yinYang.value === '阳遁' ? '#E74C3C' : '#3498DB')
</script>

<template>
  <g :transform="`rotate(${-rotationAngle})`">
    <!-- 1. 阴阳遁 · 节气 · 三元 -->
    <text
      :x="0"
      :y="-radius * 0.72"
      text-anchor="middle"
      :fill="yinYangColor"
      :font-size="radius * 0.075"
      font-family="serif"
      font-weight="bold"
    >
      {{ yinYang }} · {{ termName }} · {{ yuan }}
    </text>

    <!-- 分隔线 -->
    <line
      :x1="-radius * 0.5" :y1="-radius * 0.65"
      :x2="radius * 0.5"  :y2="-radius * 0.65"
      stroke="#555" stroke-width="0.5"
    />

    <!-- 2. 局数超大字 -->
    <text
      :x="0"
      :y="-radius * 0.32"
      text-anchor="middle"
      :fill="juColor"
      :font-size="radius * 0.34"
      font-family="serif"
      font-weight="bold"
      style="filter: drop-shadow(0 0 8px rgba(255,215,0,0.5))"
    >
      {{ juHz }}
    </text>

    <!-- 局数副标签 -->
    <text
      :x="0"
      :y="-radius * 0.19"
      text-anchor="middle"
      fill="#CCCCCC"
      :font-size="radius * 0.06"
      font-family="serif"
    >
      {{ juStar }}局
    </text>

    <!-- 3. 状态徽章 -->
    <g :transform="`translate(0, ${-radius * 0.08})`">
      <rect
        :x="-radius * 0.13" :y="-radius * 0.05"
        :width="radius * 0.26" :height="radius * 0.09"
        :fill="statusColor" opacity="0.18"
        :rx="radius * 0.015"
      />
      <text
        :x="0" :y="radius * 0.015"
        text-anchor="middle"
        :fill="statusColor"
        :font-size="radius * 0.07"
        font-weight="bold"
        dominant-baseline="central"
      >
        {{ status }}
      </text>
    </g>

    <!-- 分隔线 -->
    <line
      :x1="-radius * 0.5" :y1="radius * 0.02"
      :x2="radius * 0.5"  :y2="radius * 0.02"
      stroke="#555" stroke-width="0.5"
    />

    <!-- 4. 公历日期 -->
    <text
      :x="0" :y="radius * 0.11"
      text-anchor="middle"
      fill="#EEEEEE"
      :font-size="radius * 0.065"
      font-family="ui-monospace, monospace"
      font-weight="bold"
    >
      {{ solarDate }}
    </text>

    <!-- 4b. 公历时刻 -->
    <text
      :x="0" :y="radius * 0.185"
      text-anchor="middle"
      fill="#AAAAAA"
      :font-size="radius * 0.055"
      font-family="ui-monospace, monospace"
    >
      {{ solarTime }}
    </text>

    <!-- 5. 农历完整日期 -->
    <text
      :x="0" :y="radius * 0.27"
      text-anchor="middle"
      :fill="leapMonthName ? '#FFD700' : '#DDDDDD'"
      :font-size="radius * 0.06"
    >
      {{ lunarFull }}
    </text>

    <!-- 6. 四柱干支 -->
    <g v-if="ganzhi" :transform="`translate(0, ${radius * 0.36})`">
      <text
        :x="0" :y="0"
        text-anchor="middle"
        fill="#AAAAAA"
        :font-size="radius * 0.048"
      >
        年 <tspan fill="#F1C40F">{{ ganzhi.year.full }}</tspan>
        · 月 <tspan fill="#F1C40F">{{ ganzhi.month.full }}</tspan>
      </text>
      <text
        :x="0" :y="radius * 0.065"
        text-anchor="middle"
        fill="#AAAAAA"
        :font-size="radius * 0.048"
      >
        日 <tspan fill="#FFD700" font-weight="bold">{{ ganzhi.day.full }}</tspan>
        · 时 <tspan fill="#F1C40F">{{ ganzhi.hour.full }}</tspan>
      </text>
    </g>

    <!-- 7. 距下节气 -->
    <text
      :x="0" :y="radius * 0.53"
      text-anchor="middle"
      fill="#888888"
      :font-size="radius * 0.048"
    >
      距下节气 {{ daysToNext }} 天
    </text>

    <!-- 8. 奇门置闰 -->
    <text
      :x="0" :y="radius * 0.61"
      text-anchor="middle"
      :fill="qimenLeap.hasLeap ? '#8E44AD' : '#666666'"
      :font-size="radius * 0.045"
    >
      奇门置闰: {{ qimenLeap.hasLeap ? qimenLeap.leapName : '无' }}
    </text>
  </g>
</template>

<style scoped>
/* 纯 SVG 渲染 */
</style>

