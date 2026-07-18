<script setup lang="ts">
/**
 * ⚫ 奇门信息圆心组件 —— 六运 + 干支四柱 + 节气 信息卡
 *
 * ⚠️ 圆心组件规范：
 *   - 仅声明 radius，禁止声明 innerRadius
 *   - 通过 RingStack #center slot 注入 radius 自动适配
 *
 * 显示内容（从上到下）：
 *   ① 当前运号（大字，用运号饱和色）
 *   ② 干支四柱：年 / 月 / 日 / 时（五行配色，两字纵排）
 *   ③ 节气：当前节气名 · 距下节气天数
 *   ④ 距上元甲子/本运甲子天数 + 两个甲子日的公历日期
 */
import { computed, unref, type MaybeRef } from 'vue'
import { computeSixYun, YUN_COLORS, YUN_NAMES } from '@/utils/qimenDunJia'
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

const info = computed(() => computeSixYun(timeRef.value))
const ganzhi = computed(() => getGanzhiInfo(timeRef.value))
const solarTerm = computed(() => getSolarTermInfo(timeRef.value))

const yunColor = computed(() => YUN_COLORS[info.value.currentYunIndex - 1] ?? '#FFD700')
const yunName = computed(() => YUN_NAMES[info.value.currentYunIndex - 1] ?? '一运')

/** 干支柱：以天干为主色（五行配色） */
interface Pillar {
  label: string    // 年/月/日/时
  stem: string     // 甲/乙/…
  branch: string   // 子/丑/…
  color: string    // 天干五行色
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

/** 4 柱在水平方向的 x 位置（相对圆心） */
const pillarX = computed(() => {
  const half = props.radius * 0.32
  // -half, -half/3, +half/3, +half → 均分四列
  return [-half, -half / 3, half / 3, half]
})

/** yyyy-MM-dd */
function fmt(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const upperYuanText = computed(() => fmt(info.value.upperYuanDate))
const currentJiaziText = computed(() => fmt(info.value.currentJiaziDate))

const termText = computed(() => {
  const t = solarTerm.value
  if (!t) return '节气：—'
  return `节气：${t.name} · 距${t.nextTermName} ${t.daysToNext} 天`
})
</script>

<template>
  <!-- 🔑 反向旋转：抵消外层 SVG rotate(rotationAngle)，文字始终正向 -->
  <g :transform="`rotate(${-rotationAngle})`">
    <!-- ① 顶部：当前运号（大字） -->
    <text
      :x="0"
      :y="-radius * 0.62"
      text-anchor="middle"
      :fill="yunColor"
      :font-size="radius * 0.2"
      font-family="serif"
      font-weight="bold"
    >
      {{ yunName }}
    </text>

    <!-- 副标题：当前所在 · 甲子锚 -->
    <text
      :x="0"
      :y="-radius * 0.46"
      text-anchor="middle"
      fill="#aaaaaa"
      :font-size="radius * 0.06"
    >
      当前所在 · 甲子锚
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

    <!-- ② 干支四柱 -->
    <g>
      <g v-for="(p, i) in pillars" :key="p.label" :transform="`translate(${pillarX[i]}, 0)`">
        <!-- 柱标签 年/月/日/时 -->
        <text
          :x="0"
          :y="-radius * 0.26"
          text-anchor="middle"
          fill="#888888"
          :font-size="radius * 0.055"
        >
          {{ p.label }}
        </text>
        <!-- 天干 -->
        <text
          :x="0"
          :y="-radius * 0.12"
          text-anchor="middle"
          :fill="p.color"
          :font-size="radius * 0.12"
          font-family="serif"
          font-weight="bold"
        >
          {{ p.stem }}
        </text>
        <!-- 地支 -->
        <text
          :x="0"
          :y="radius * 0.02"
          text-anchor="middle"
          :fill="p.color"
          :font-size="radius * 0.12"
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
      :y1="radius * 0.1"
      :x2="radius * 0.5"
      :y2="radius * 0.1"
      stroke="#444"
      stroke-width="0.5"
    />

    <!-- ③ 节气 -->
    <text
      :x="0"
      :y="radius * 0.2"
      text-anchor="middle"
      fill="#F1C40F"
      :font-size="radius * 0.06"
    >
      {{ termText }}
    </text>

    <!-- 分隔线 3 -->
    <line
      :x1="-radius * 0.5"
      :y1="radius * 0.28"
      :x2="radius * 0.5"
      :y2="radius * 0.28"
      stroke="#444"
      stroke-width="0.5"
    />

    <!-- ④ 距上元甲子 · 距本运甲子（同一行左右分列） -->
    <text
      :x="-radius * 0.25"
      :y="radius * 0.4"
      text-anchor="middle"
      fill="#dddddd"
      :font-size="radius * 0.058"
    >
      距上元 {{ info.daysSinceUpperYuan }}天
    </text>
    <text
      :x="radius * 0.25"
      :y="radius * 0.4"
      text-anchor="middle"
      fill="#dddddd"
      :font-size="radius * 0.058"
    >
      距本运 {{ info.daysSinceCurrentJiazi }}天
    </text>

    <!-- 本运甲子日期 -->
    <text
      :x="0"
      :y="radius * 0.52"
      text-anchor="middle"
      fill="#888888"
      :font-size="radius * 0.05"
    >
      本运甲子：{{ currentJiaziText }}
    </text>

    <!-- 上元甲子日期 -->
    <text
      :x="0"
      :y="radius * 0.62"
      text-anchor="middle"
      fill="#666666"
      :font-size="radius * 0.048"
    >
      上元甲子：{{ upperYuanText }}
    </text>
  </g>
</template>

<style scoped>
/* 纯 SVG 渲染 */
</style>
