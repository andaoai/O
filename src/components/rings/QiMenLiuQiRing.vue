<script setup lang="ts">
/**
 * 奇门 · 五运六气环 —— 一年六气（厥阴风木 / 少阴君火 / 少阳相火 /
 *                                     太阴湿土 / 阳明燥金 / 太阳寒水）
 *
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 与外层「六轮甲子日环 / 24 节气环」共享 0° 起点（= 上元甲子日）
 *
 *  五运六气学说：一年分六气，每气 60 天 = 4 个 15 天节气段
 *    · 初之气 · 厥阴风木：大寒 → 立春 → 雨水 → 惊蛰（止于春分前）
 *    · 二之气 · 少阴君火：春分 → 清明 → 谷雨 → 立夏（止于小满前）
 *    · 三之气 · 少阳相火：小满 → 芒种 → 夏至 → 小暑（止于大暑前）
 *    · 四之气 · 太阴湿土：大暑 → 立秋 → 处暑 → 白露（止于秋分前）
 *    · 五之气 · 阳明燥金：秋分 → 寒露 → 霜降 → 立冬（止于小雪前）
 *    · 终之气 · 太阳寒水：小雪 → 大雪 → 冬至 → 小寒（止于大寒前，跨年）
 *
 *  📍 终之气跨环起点（当岁冬至）：
 *    · 环末 [W1+330°, W1+360°)：小雪+大雪 → 下一岁的终之气「头」
 *    · 环头 [W1+0°, W1+30°)   ：冬至+小寒 → 当岁的终之气「尾」
 *    · 两段合并成同色同标签，视觉上等价于一整段跨年的终之气
 *
 *  与农历环相同的岁首锚定：以「当岁冬至 W1」为环 0° 参照。
 *
 *  只有 6 大段扇形，不再细分 15°/格；每段中心 60° 位置放气名标签。
 * ═══════════════════════════════════════════════════════════════
 */
import { computed, unref, type MaybeRef } from 'vue'
import { SolarDay } from 'tyme4ts'
import PolarCanvas from '../base/PolarCanvas.vue'
import { arcPath, polarToCartesian, radialTextRotation } from '@/utils/geometry'
import {
  computeQiMenSolarTerms,
  findUpperYuanJiaziDay
} from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 356,
  innerRadius: 332,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

/** ⚠️ 范式第一行：统一转换为响应式 timeRef */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 走 tyme4ts 儒略日整数运算的整日差（抗时区标准化） */
function diffDays(later: Date, earlier: Date): number {
  const a = SolarDay.fromYmd(later.getFullYear(), later.getMonth() + 1, later.getDate())
  const b = SolarDay.fromYmd(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate())
  return a.subtract(b)
}

/**
 * 六气定义（起讫节气都用真实公历日期，从 24 节气 term.date 派生 dayInRing）：
 *   · 初：大寒 → 春分
 *   · 二：春分 → 小满
 *   · 三：小满 → 大暑
 *   · 四：大暑 → 秋分
 *   · 五：秋分 → 小雪
 *   · 终：小雪 → 本岁大寒（跨过 W1 冬至）
 *
 * 用 24 节气"真实日期"（不是 15 天网格）保证六气边界与农历环、六轮甲子日环
 * 严格对齐 —— 与 24 节气段环的"网格首日"可能偏 1-2°（正是超神接气偏差）。
 */
interface QiDef {
  key: number
  name: string
  attr: string
  startTermName: string   // 起点节气名（真实日期）
  endTermName: string     // 结束节气名（不含，即下一气起点）
  color: string
  bgColor: string
}

const QI_LIST: readonly QiDef[] = [
  { key: 1, name: '初之气', attr: '厥阴风木', startTermName: '大寒', endTermName: '春分',
    color: '#2ECC71', bgColor: '#1a3a24' },
  { key: 2, name: '二之气', attr: '少阴君火', startTermName: '春分', endTermName: '小满',
    color: '#E74C3C', bgColor: '#3a1a1a' },
  { key: 3, name: '三之气', attr: '少阳相火', startTermName: '小满', endTermName: '大暑',
    color: '#F39C12', bgColor: '#3a2410' },
  { key: 4, name: '四之气', attr: '太阴湿土', startTermName: '大暑', endTermName: '秋分',
    color: '#D35400', bgColor: '#3a1e0a' },
  { key: 5, name: '五之气', attr: '阳明燥金', startTermName: '秋分', endTermName: '小雪',
    color: '#F1C40F', bgColor: '#3a3010' },
  { key: 6, name: '终之气', attr: '太阳寒水', startTermName: '小雪', endTermName: '大寒',
    color: '#3498DB', bgColor: '#0f2438' }
] as const

/**
 * 六气段几何 —— 按真实公历日期计算，跟农历环同源。
 *
 * · 每个气起讫都从 `computeQiMenSolarTerms(today)` 返回的 24 节气 `term.date` 派生
 * · realDayInRing = diffDays(term.date, upperYuan) mod 360
 * · 终之气会跨过 W1（本岁冬至）→ start 的环位置 > end 的环位置 → 拆两段扇形
 * · 无论跨不跨环起点，一个气只画一个标签（在气的几何中心）
 */
interface Qi6 {
  qi: QiDef
  /** 一段或两段扇形（跨环起点时两段） */
  paths: Array<{ startAngle: number, endAngle: number }>
  /** 气几何中心角度，用于标签定位（0-359） */
  labelAngle: number
  isCurrent: boolean
  /** 气实际跨越的天数（用于 debug；一般 60±2 天） */
  spanDays: number
}

const qiList = computed<Qi6[]>(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const terms = computeQiMenSolarTerms(now)
  const yearTerms = terms.filter(t => !t.isNextWinter)

  // 按节气名建索引：term.name → 真实 dayInRing
  const termDayInRing = new Map<string, number>()
  for (const t of yearTerms) {
    const realIdx = ((diffDays(t.date, upperYuan) % 360) + 360) % 360
    // 若同名（跨年出现两次）优先取先出现的 —— yearTerms 已按 daysFromWinter 排序
    if (!termDayInRing.has(t.name)) termDayInRing.set(t.name, realIdx)
  }

  // 冬至（W1）的环位置 —— 只有终之气跨冬至时才拆两段
  const winter = yearTerms.find(t => t.name === '冬至')
  const winterIdx = winter
    ? ((diffDays(winter.date, upperYuan) % 360) + 360) % 360
    : 0

  // 今日在环上的位置（0-359）
  const today = ((diffDays(now, upperYuan) % 360) + 360) % 360
  const results: Qi6[] = []

  for (const qi of QI_LIST) {
    const start = termDayInRing.get(qi.startTermName)
    const end = termDayInRing.get(qi.endTermName)
    if (start === undefined || end === undefined) continue

    // "未 mod 空间"跨度（若 start >= end，说明气跨环起点，补 360）
    const rawSpan = start < end ? end - start : end + 360 - start
    // 气几何中心（未 mod 空间的中点，再 mod）
    const labelAngle = ((start + rawSpan / 2) % 360 + 360) % 360

    // 「今日在此气」判定：相对 start 的偏移落在 [0, rawSpan)
    const delta = ((today - start) % 360 + 360) % 360
    const isCurrent = delta >= 0 && delta < rawSpan

    // 是否跨过冬至 W1（即在 [start, start+rawSpan) 范围内包含 winterIdx）？
    // 只有跨冬至的段（=终之气）才拆两段扇形，其它段一律用一段跨环 arc。
    const crossesWinter =
      qi.key === 6 &&  // 终之气标记
      ((winterIdx - start + 360) % 360) < rawSpan

    const paths: Array<{ startAngle: number, endAngle: number }> = []
    if (crossesWinter) {
      // 终之气：以冬至 W1 为切分点，前半段 [start, winterIdx)、后半段 [winterIdx, end)
      // 若 start < winterIdx 直接切；否则第一段是 [start, 360) 再 [0, winterIdx)
      // 情况一：start < winterIdx < 360，end < start（跨环起点）
      //   → [start, winterIdx) + [winterIdx, 360) + [0, end)  ← 三段？不对
      // 简化：直接以 winterIdx 为切分，两段永远是"start → winterIdx"与"winterIdx → end"
      // 用未 mod 空间画一段，然后 mod 到环上（利用 arcPath 支持 end > 360 的能力）
      paths.push({ startAngle: start, endAngle: winterIdx < start ? winterIdx + 360 : winterIdx })
      paths.push({ startAngle: winterIdx, endAngle: end < winterIdx ? end + 360 : end })
    } else {
      // 非跨冬至：一段 arc path 画完整段（允许 end > 360，SVG arc 会自动跨 360°）
      const arcEnd = start < end ? end : end + 360
      paths.push({ startAngle: start, endAngle: arcEnd })
    }

    results.push({ qi, paths, labelAngle, isCurrent, spanDays: rawSpan })
  }
  return results
})

/**
 * 段中心点在极坐标下的笛卡尔坐标（用于文字定位）
 * 使用径向中线半径
 */
const midRadius = computed(() => (props.radius + props.innerRadius) / 2)

/**
 * 段路径（走 arcPath），处理 startDegree 偏移。
 * arcPath 的角度就是 dayInRing（我们后面用 startDegree 通过外层 <g rotate> 处理起点旋转），
 * 但更直接：把 startDegree 应用到 startAngle/endAngle 里，简单起见先用 svgAngle = start + startDegree。
 * 因为 polarToCartesian 内部已通过 startDegree 偏移，这里传入 dayInRing 直接即可。
 *
 * 但 arcPath 直接用 polarToCartesian，polarToCartesian 需要一个"绝对角度"（0°=正右）。
 * 而 dayInRing 是从 startDegree 起算的相对角度。
 * 参考其他环用法：DataRing → CircleRing 内部把 startDegree 加到每格角度上传给 polarToCartesian。
 *
 * 为保持一致，这里手动做 startDegree 偏移。
 */
function svgArcPath(startAngle: number, endAngle: number): string {
  const absStart = startAngle + props.startDegree
  const absEnd = endAngle + props.startDegree
  return arcPath(props.radius, absStart, absEnd, props.innerRadius, props.rotationDirection)
}

function svgLabelXY(midAngle: number): { x: number, y: number, rot: number } {
  const absMid = midAngle + props.startDegree
  const xy = polarToCartesian(absMid, midRadius.value, props.rotationDirection)
  const rot = radialTextRotation(absMid, props.rotationDirection)
  return { x: xy.x, y: xy.y, rot }
}
</script>

<template>
  <PolarCanvas>
    <g class="qimen-liuqi-ring">
      <!-- 6 气：每气一或两个扇形（跨环起点时拆两段），但只画一个标签 -->
      <g v-for="q in qiList" :key="q.qi.key">
        <!-- 扇形（1 段 or 2 段） -->
        <path
          v-for="(p, pi) in q.paths"
          :key="pi"
          :d="svgArcPath(p.startAngle, p.endAngle)"
          :fill="q.isCurrent ? q.qi.color : q.qi.bgColor"
          :fill-opacity="q.isCurrent ? 0.55 : 1"
          :stroke="q.qi.color"
          :stroke-width="q.isCurrent ? 1.2 : 0.4"
          :stroke-opacity="q.isCurrent ? 1 : 0.4"
          :class="{ 'seg-pulse': q.isCurrent }"
        />

        <!-- 标签：只画一个，放在气的几何中心 -->
        <g
          :transform="`translate(${svgLabelXY(q.labelAngle).x}, ${svgLabelXY(q.labelAngle).y}) rotate(${svgLabelXY(q.labelAngle).rot})`"
        >
          <text
            :fill="q.isCurrent ? '#ffffff' : q.qi.color"
            :font-size="q.isCurrent ? 9 : 8"
            :font-weight="q.isCurrent ? 'bold' : 'normal'"
            text-anchor="middle"
            dominant-baseline="middle"
            letter-spacing="1"
          >
            {{ q.qi.name }} · {{ q.qi.attr }}
          </text>
        </g>
      </g>
    </g>
  </PolarCanvas>
</template>

<style scoped>
.qimen-liuqi-ring {
  pointer-events: none;
}

.seg-pulse {
  animation: seg-pulse 2.4s ease-in-out infinite;
}

@keyframes seg-pulse {
  0%, 100% { fill-opacity: 0.55; }
  50% { fill-opacity: 0.85; }
}
</style>
