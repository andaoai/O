<script setup lang="ts">
/**
 * ⚫ 五运六气信息卡 —— 黄帝内经·素问·七篇大论所述岁运结构总览
 *
 * ⚠️ 圆心组件规范：
 *   - 仅声明 radius，禁止声明 innerRadius
 *   - 通过 RingStack #center slot 注入 radius 自动适配
 *
 * ═══════════════════════════════════════════════════════════════
 *  显示内容（从上到下）：
 *   ① 主标：年干支 + 岁运名（如「乙巳 · 太商金运」）
 *   ② 副标：司天 / 在泉（司天=客气三之气；在泉=客气终之气）
 *   ③ 当令主气 · 客气（依 todayInRing 判定六步中哪一步）
 *   ④ 当令主运 · 客运（依 todayInRing 判定五步中哪一步）
 *   ⑤ 干支四柱（年 / 月 / 日 / 时，天干五行配色）
 *   ⑥ 距下一节气天数
 *
 *  数据全部从 useDayGridContext() 派生，不再另跑 tyme4ts —
 *  秒级 tick 不触发重算。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import { useDayGridContext } from '@/composables/useDayGridContext'
import { getGanzhiInfo, getSolarTermInfo } from '@/utils/chineseCalendar'
import { WUXING_COLORS, STEM_ELEMENTS } from '@/utils/wuxing'
import { STEMS } from '@/utils/constants/ganzhi'

interface Props {
  radius?: number
  time?: MaybeRef<Date>
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 外层 SVG 旋转角度，圆心反向旋转保持文字正向可读 */
  rotationAngle?: number
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  rotationDirection: 'clockwise',
  rotationAngle: 0
})

const timeRef = computed(() => unref(props.time) ?? new Date())
const ctx = useDayGridContext()

const ganzhi = computed(() => getGanzhiInfo(timeRef.value))
const solarTerm = computed(() => getSolarTermInfo(timeRef.value))

/** 岁运（如「太商金运」） */
const suiYunText = computed(() => {
  const s = ctx.value.suiYun
  return `${s.fullName}${s.element}运`
})

/** 岁运五行主色 */
const suiYunColor = computed(() => {
  const el = ctx.value.suiYun.element as keyof typeof WUXING_COLORS
  return WUXING_COLORS[el] ?? '#F1C40F'
})

/** 司天 = 客气三之气；在泉 = 客气终之气 */
const sitianText = computed(() => ctx.value.keQi[2] ?? '—')
const zaiquanText = computed(() => ctx.value.keQi[5] ?? '—')

/* ══════════════════════════════════════════════════════════════
 *  当令主气 / 客气 —— 依 today 落在哪一段（六气段边界与 QI_LIST 一致）
 *  段边界：初 [大寒,春分) / 二 [春分,小满) / 三 [小满,大暑) /
 *          四 [大暑,秋分) / 五 [秋分,小雪) / 终 [小雪,大寒)
 * ══════════════════════════════════════════════════════════════ */
const QI_BOUNDARIES: readonly { seg: number; start: string; end: string }[] = [
  { seg: 0, start: '大寒', end: '春分' },
  { seg: 1, start: '春分', end: '小满' },
  { seg: 2, start: '小满', end: '大暑' },
  { seg: 3, start: '大暑', end: '秋分' },
  { seg: 4, start: '秋分', end: '小雪' },
  { seg: 5, start: '小雪', end: '大寒' }
] as const

const MAIN_QI_NAMES: readonly string[] = [
  '厥阴风木', '少阴君火', '少阳相火', '太阴湿土', '阳明燥金', '太阳寒水'
] as const

const QI_ORDER_SHORT: readonly string[] = ['初', '二', '三', '四', '五', '终'] as const

/** 当前落在第几步（0..5） */
const currentQiSeg = computed<number>(() => {
  const c = ctx.value
  const today = c.todayInRing
  const termDayInRing = c.termDayInRing

  for (const b of QI_BOUNDARIES) {
    const s = termDayInRing.get(b.start)
    const e = termDayInRing.get(b.end)
    if (s === undefined || e === undefined) continue
    const rawSpan = s < e ? e - s : e + 360 - s
    const delta = ((today - s) % 360 + 360) % 360
    if (delta >= 0 && delta < rawSpan) return b.seg
  }
  return 5 // 兜底：跨冬至段
})

const currentMainQiText = computed(() =>
  `${QI_ORDER_SHORT[currentQiSeg.value]}主 · ${MAIN_QI_NAMES[currentQiSeg.value]}`
)

const currentKeQiText = computed(() => {
  const seg = currentQiSeg.value
  const name = ctx.value.keQi[seg] ?? '—'
  return `${QI_ORDER_SHORT[seg]}客 · ${name}`
})

/* ══════════════════════════════════════════════════════════════
 *  当令主运 / 客运 —— 五运每步 72°，起点在大寒
 * ══════════════════════════════════════════════════════════════ */
const YUN_ORDER_SHORT: readonly string[] = ['初', '二', '三', '四', '终'] as const
const RUN_LEN = 72

const currentYunSeg = computed<number>(() => {
  const c = ctx.value
  const daHanRing = c.termDayInRing.get('大寒')
  if (daHanRing === undefined) return 0
  const today = c.todayInRing
  for (let i = 0; i < 5; i++) {
    const start = (daHanRing + i * RUN_LEN) % 360
    const delta = ((today - start) % 360 + 360) % 360
    if (delta >= 0 && delta < RUN_LEN) return i
  }
  return 0
})

const currentMainYunText = computed(() => {
  const step = ctx.value.mainYun[currentYunSeg.value]
  if (!step) return '—'
  return `${YUN_ORDER_SHORT[currentYunSeg.value]}主 · ${step.fullName}`
})

const currentKeYunText = computed(() => {
  const step = ctx.value.keYun[currentYunSeg.value]
  if (!step) return '—'
  return `${YUN_ORDER_SHORT[currentYunSeg.value]}客 · ${step.fullName}`
})

/* ══════════════════════════════════════════════════════════════
 *  干支四柱（沿用 InfoCenter 的天干五行配色）
 * ══════════════════════════════════════════════════════════════ */
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

const termText = computed(() => {
  const t = solarTerm.value
  if (!t) return '—'
  return `距 ${t.nextTermName} ${t.daysToNext} 天`
})

/** 年干支 · 岁运 主标 */
const yearGanzhiText = computed(() => `${ganzhi.value.year.stem}${ganzhi.value.year.branch}`)
</script>

<template>
  <!-- 🔑 反向旋转：抵消外层 SVG rotate(rotationAngle)，文字始终正向 -->
  <g :transform="`rotate(${-rotationAngle})`">
    <!-- ① 主标：年干支 · 岁运 -->
    <text
      :x="0"
      :y="-radius * 0.7"
      text-anchor="middle"
      :fill="suiYunColor"
      :font-size="radius * 0.19"
      font-family="serif"
      font-weight="bold"
    >
      {{ yearGanzhiText }} · {{ suiYunText }}
    </text>

    <!-- ② 司天 / 在泉 -->
    <text
      :x="0"
      :y="-radius * 0.54"
      text-anchor="middle"
      fill="#dddddd"
      :font-size="radius * 0.075"
    >
      司天 {{ sitianText }} · 在泉 {{ zaiquanText }}
    </text>

    <!-- 分隔线 1 -->
    <line
      :x1="-radius * 0.5"
      :y1="-radius * 0.44"
      :x2="radius * 0.5"
      :y2="-radius * 0.44"
      stroke="#444"
      stroke-width="0.5"
    />

    <!-- ③ 当令主气 · 当令客气 -->
    <text
      :x="-radius * 0.25"
      :y="-radius * 0.34"
      text-anchor="middle"
      fill="#AED6F1"
      :font-size="radius * 0.065"
    >
      {{ currentMainQiText }}
    </text>
    <text
      :x="radius * 0.25"
      :y="-radius * 0.34"
      text-anchor="middle"
      fill="#F5CBA7"
      :font-size="radius * 0.065"
    >
      {{ currentKeQiText }}
    </text>

    <!-- ④ 当令主运 · 当令客运 -->
    <text
      :x="-radius * 0.25"
      :y="-radius * 0.24"
      text-anchor="middle"
      fill="#7ED6A4"
      :font-size="radius * 0.065"
    >
      {{ currentMainYunText }}
    </text>
    <text
      :x="radius * 0.25"
      :y="-radius * 0.24"
      text-anchor="middle"
      fill="#F9E79F"
      :font-size="radius * 0.065"
    >
      {{ currentKeYunText }}
    </text>

    <!-- 分隔线 2 -->
    <line
      :x1="-radius * 0.5"
      :y1="-radius * 0.14"
      :x2="radius * 0.5"
      :y2="-radius * 0.14"
      stroke="#444"
      stroke-width="0.5"
    />

    <!-- ⑤ 干支四柱 -->
    <g>
      <g v-for="(p, i) in pillars" :key="p.label" :transform="`translate(${pillarX[i]}, 0)`">
        <text
          :x="0"
          :y="-radius * 0.02"
          text-anchor="middle"
          fill="#888888"
          :font-size="radius * 0.05"
        >
          {{ p.label }}
        </text>
        <text
          :x="0"
          :y="radius * 0.1"
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
          :y="radius * 0.22"
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

    <!-- 分隔线 3 -->
    <line
      :x1="-radius * 0.5"
      :y1="radius * 0.32"
      :x2="radius * 0.5"
      :y2="radius * 0.32"
      stroke="#444"
      stroke-width="0.5"
    />

    <!-- ⑥ 距下一节气 -->
    <text
      :x="0"
      :y="radius * 0.42"
      text-anchor="middle"
      fill="#F1C40F"
      :font-size="radius * 0.06"
    >
      {{ termText }}
    </text>

    <!-- 岁运五行标签（辅助定位） -->
    <text
      :x="0"
      :y="radius * 0.54"
      text-anchor="middle"
      fill="#666666"
      :font-size="radius * 0.045"
    >
      黄帝内经·素问·七篇大论
    </text>
  </g>
</template>

<style scoped>
/* 纯 SVG 渲染 */
</style>
