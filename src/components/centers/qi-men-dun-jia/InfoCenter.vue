<script setup lang="ts">
/**
 * ⚫ 奇门信息圆心组件 —— 三元九局 + 六运 + 干支四柱 + 节气
 *
 * ⚠️ 圆心组件规范：
 *   - 仅声明 radius，禁止声明 innerRadius
 *   - 通过 RingStack #center slot 注入 radius 自动适配
 *
 * 显示内容（从上到下）：
 *   ① 局数大字（阳/阴遁 · N 局，局数色）
 *   ② 副标（上元/中元/下元 · 节气名 · 超神/接气/正授）
 *   ③ 六运名 + 甲子锚说明
 *   ④ 干支四柱（年/月/日/时，五行配色）
 *   ⑤ 节气进度（距下节气 X 天）
 *   ⑥ 距上元甲子/本运甲子天数 + 两个甲子日日期
 */
import { computed, unref, type MaybeRef } from 'vue'
import { SolarDay } from 'tyme4ts'
import {
  computeSixYun,
  computeQiMenSolarTerms,
  computeChaoshenState,
  findUpperYuanJiaziDay,
  getYuanJuAt,
  YUN_COLORS,
  YUN_NAMES,
  YUAN_NAMES,
  JU_COLORS
} from '@/utils/qimenDunJia'
import { getGanzhiInfo, getSolarTermInfo } from '@/utils/chineseCalendar'
import { WUXING_COLORS, STEM_ELEMENTS } from '@/utils/wuxing'
import { STEMS } from '@/utils/constants/ganzhi'

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

/** 走 tyme4ts 儒略日的整日差 */
function diffDays(later: Date, earlier: Date): number {
  const a = SolarDay.fromYmd(later.getFullYear(), later.getMonth() + 1, later.getDate())
  const b = SolarDay.fromYmd(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate())
  return a.subtract(b)
}

const sixYun = computed(() => computeSixYun(timeRef.value))
const ganzhi = computed(() => getGanzhiInfo(timeRef.value))
const solarTerm = computed(() => getSolarTermInfo(timeRef.value))
const chaoshen = computed(() => computeChaoshenState(timeRef.value))

const yuanJu = computed(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const terms = computeQiMenSolarTerms(now)
  const todayInRing = ((diffDays(now, upperYuan) % 360) + 360) % 360
  return getYuanJuAt(todayInRing, terms)
})

const yunColor = computed(() => YUN_COLORS[sixYun.value.currentYunIndex - 1] ?? '#FFD700')
const yunName = computed(() => YUN_NAMES[sixYun.value.currentYunIndex - 1] ?? '一运')

/** 局数大字色 */
const juColor = computed(() => {
  const info = yuanJu.value
  if (!info) return '#FFD700'
  return JU_COLORS[info.ju] ?? '#FFD700'
})

/** 局数中文数字 */
const CHINESE_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const juText = computed(() => {
  const info = yuanJu.value
  if (!info) return '—'
  return `${info.isYang ? '阳遁' : '阴遁'} · ${CHINESE_NUM[info.ju]}局`
})

/** 三元位 + 节气 副标 */
const yuanTermText = computed(() => {
  const info = yuanJu.value
  if (!info) return '—'
  return `${YUAN_NAMES[info.yuanPos]} · ${info.termName}`
})

/** 超神/接气/正授 */
const chaoshenText = computed(() => {
  const s = chaoshen.value
  if (s.label === '正授') return '正授'
  return `${s.label} ${s.days} 天`
})

const chaoshenColor = computed(() => {
  const s = chaoshen.value
  if (s.label === '正授') return '#F1C40F'
  if (s.label === '超神') return '#E67E22'
  return '#3498DB'
})

/** 干支柱：以天干为主色（五行配色） */
interface Pillar {
  label: string
  stem: string
  branch: string
  color: string
}

const pillars = computed<Pillar[]>(() => {
  const g = ganzhi.value
  const stemColor = (stemName: string): string => {
    const idx = STEMS.indexOf(stemName as (typeof STEMS)[number])
    if (idx < 0) return '#ffffff'
    return WUXING_COLORS[STEM_ELEMENTS[idx]!]
  }
  return [
    { label: '年', stem: g.year.stem, branch: g.year.branch, color: stemColor(g.year.stem) },
    { label: '月', stem: g.month.stem, branch: g.month.branch, color: stemColor(g.month.stem) },
    { label: '日', stem: g.day.stem, branch: g.day.branch, color: stemColor(g.day.stem) },
    { label: '时', stem: g.hour.stem, branch: g.hour.branch, color: stemColor(g.hour.stem) }
  ]
})

const pillarX = computed(() => {
  const half = props.radius * 0.32
  return [-half, -half / 3, half / 3, half]
})

/** yyyy-MM-dd */
function fmt(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const upperYuanText = computed(() => fmt(sixYun.value.upperYuanDate))
const currentJiaziText = computed(() => fmt(sixYun.value.currentJiaziDate))

const termText = computed(() => {
  const t = solarTerm.value
  if (!t) return '节气：—'
  return `距 ${t.nextTermName} ${t.daysToNext} 天`
})
</script>

<template>
  <!-- 🔑 反向旋转：抵消外层 SVG rotate(rotationAngle)，文字始终正向 -->
  <g :transform="`rotate(${-rotationAngle})`">
    <!-- ① 局数大字 -->
    <text
      :x="0"
      :y="-radius * 0.7"
      text-anchor="middle"
      :fill="juColor"
      :font-size="radius * 0.22"
      font-family="serif"
      font-weight="bold"
    >
      {{ juText }}
    </text>

    <!-- ② 三元 · 节气 副标 -->
    <text
      :x="0"
      :y="-radius * 0.54"
      text-anchor="middle"
      fill="#dddddd"
      :font-size="radius * 0.08"
    >
      {{ yuanTermText }}
    </text>

    <!-- ③ 超神 / 接气 / 正授 -->
    <text
      :x="0"
      :y="-radius * 0.44"
      text-anchor="middle"
      :fill="chaoshenColor"
      :font-size="radius * 0.06"
    >
      {{ chaoshenText }}
    </text>

    <!-- 分隔线 1 -->
    <line
      :x1="-radius * 0.5"
      :y1="-radius * 0.38"
      :x2="radius * 0.5"
      :y2="-radius * 0.38"
      stroke="#444"
      stroke-width="0.5"
    />

    <!-- ④ 六运名（小字） -->
    <text
      :x="0"
      :y="-radius * 0.3"
      text-anchor="middle"
      :fill="yunColor"
      :font-size="radius * 0.06"
    >
      {{ yunName }} · 甲子锚
    </text>

    <!-- ⑤ 干支四柱 -->
    <g>
      <g v-for="(p, i) in pillars" :key="p.label" :transform="`translate(${pillarX[i]}, 0)`">
        <text
          :x="0"
          :y="-radius * 0.18"
          text-anchor="middle"
          fill="#888888"
          :font-size="radius * 0.05"
        >
          {{ p.label }}
        </text>
        <text
          :x="0"
          :y="-radius * 0.06"
          text-anchor="middle"
          :fill="p.color"
          :font-size="radius * 0.11"
          font-family="serif"
          font-weight="bold"
        >
          {{ p.stem }}
        </text>
        <text
          :x="0"
          :y="radius * 0.06"
          text-anchor="middle"
          :fill="p.color"
          :font-size="radius * 0.11"
          font-family="serif"
          font-weight="bold"
        >
          {{ p.branch }}
        </text>
      </g>
    </g>

    <!-- 分隔线 2 -->
    <line
      :x1="-radius * 0.5"
      :y1="radius * 0.14"
      :x2="radius * 0.5"
      :y2="radius * 0.14"
      stroke="#444"
      stroke-width="0.5"
    />

    <!-- ⑥ 节气进度 -->
    <text
      :x="0"
      :y="radius * 0.22"
      text-anchor="middle"
      fill="#F1C40F"
      :font-size="radius * 0.055"
    >
      {{ termText }}
    </text>

    <!-- ⑦ 距上元 · 距本运 -->
    <text
      :x="-radius * 0.25"
      :y="radius * 0.34"
      text-anchor="middle"
      fill="#dddddd"
      :font-size="radius * 0.05"
    >
      距上元 {{ sixYun.daysSinceUpperYuan }}天
    </text>
    <text
      :x="radius * 0.25"
      :y="radius * 0.34"
      text-anchor="middle"
      fill="#dddddd"
      :font-size="radius * 0.05"
    >
      距本运 {{ sixYun.daysSinceCurrentJiazi }}天
    </text>

    <!-- ⑧ 本运甲子日期 -->
    <text
      :x="0"
      :y="radius * 0.46"
      text-anchor="middle"
      fill="#888888"
      :font-size="radius * 0.045"
    >
      本运甲子：{{ currentJiaziText }}
    </text>

    <!-- ⑨ 上元甲子日期 -->
    <text
      :x="0"
      :y="radius * 0.56"
      text-anchor="middle"
      fill="#666666"
      :font-size="radius * 0.045"
    >
      上元甲子：{{ upperYuanText }}
    </text>
  </g>
</template>

<style scoped>
/* 纯 SVG 渲染 */
</style>
