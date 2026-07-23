<script setup lang="ts">
/**
 * ⚫ 奇门洛书九宫圆心组件 —— 河图洛书 · 后天八卦 · 三元上元节气总览
 *
 * ⚠️ 圆心组件规范：
 *   - 仅声明 radius，禁止声明 innerRadius
 *   - 通过 RingStack #center slot 注入 radius 自动适配
 *
 * 九宫布局（洛书 · 后天八卦方位）：
 *   ┌─────────┬─────────┬─────────┐
 *   │ 巽4 SE  │ 离9 S   │ 坤2 SW  │
 *   ├─────────┼─────────┼─────────┤
 *   │ 震3 E   │ 中5     │ 兑7 W   │
 *   ├─────────┼─────────┼─────────┤
 *   │ 艮8 NE  │ 坎1 N   │ 乾6 NW  │
 *   └─────────┴─────────┴─────────┘
 *
 * 每格显示：方位 · 宫名 · 洛书数（大字）· 八卦符号 · 上元起于此宫的节气列表。
 * 当前局数所在的宫会高亮点亮，随时间自动切换。
 */
import { computed, unref, type MaybeRef } from 'vue'
import { SolarDay } from 'tyme4ts'
import {
  computeQiMenSolarTerms,
  findUpperYuanJiaziDay,
  getYuanJuAt,
  JU_COLORS
} from '@/utils/qimenDunJia'

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

/** 当前所在的三元九局信息 */
const yuanJu = computed(() => {
  const now = timeRef.value
  const upperYuan = findUpperYuanJiaziDay(now)
  const terms = computeQiMenSolarTerms(now)
  const todayInRing = ((diffDays(now, upperYuan) % 360) + 360) % 360
  return getYuanJuAt(todayInRing, terms)
})

/** 当前局数（洛书数） */
const currentJu = computed(() => yuanJu.value?.ju ?? 0)

/**
 * 当前节气三元三局：[上元局, 中元局, 下元局]
 * 整个节气 15 天里三元轮转，故这三宫都要点亮；
 * 当前所在元的宫为「主亮」，其余两宫为「副亮」。
 */
const termJuTriple = computed<readonly number[]>(() => {
  const info = yuanJu.value
  return info?.triple ?? []
})

/**
 * 单个宫的高亮级别：
 *   2 = 当前元（主亮，强色）
 *   1 = 同节气三元里的其它两元（副亮，弱色）
 *   0 = 未点亮
 */
function highlightLevel(ju: number): 0 | 1 | 2 {
  if (ju === currentJu.value) return 2
  if (termJuTriple.value.includes(ju)) return 1
  return 0
}

/**
 * 九宫定义（洛书数字 → 宫属性）
 *   gx / gy: 0-2 的九宫格坐标（左上到右下）
 *   terms:   上元起于此宫的节气列表（从 YANG_YUAN_JU / YIN_YUAN_JU 反向汇总）
 */
interface Palace {
  key: number      // 洛书数 1-9
  name: string     // 宫名
  dir: string      // 方位
  trigram: string  // 八卦符号
  gx: 0 | 1 | 2
  gy: 0 | 1 | 2
  terms: readonly string[]
}

const PALACES: readonly Palace[] = [
  { key: 4, name: '巽', dir: '东南', trigram: '☴', gx: 0, gy: 0, terms: ['清明', '立夏', '大雪'] },
  { key: 9, name: '离', dir: '南',   trigram: '☲', gx: 1, gy: 0, terms: ['雨水', '夏至', '白露'] },
  { key: 2, name: '坤', dir: '西南', trigram: '☷', gx: 2, gy: 0, terms: ['小寒', '立秋'] },
  { key: 3, name: '震', dir: '东',   trigram: '☳', gx: 0, gy: 1, terms: ['大寒', '春分'] },
  { key: 5, name: '中', dir: '中',   trigram: '',  gx: 1, gy: 1, terms: ['谷雨', '小满', '霜降', '小雪'] },
  { key: 7, name: '兑', dir: '西',   trigram: '☱', gx: 2, gy: 1, terms: ['大暑', '秋分'] },
  { key: 8, name: '艮', dir: '东北', trigram: '☶', gx: 0, gy: 2, terms: ['小暑', '立春'] },
  { key: 1, name: '坎', dir: '北',   trigram: '☵', gx: 1, gy: 2, terms: ['冬至', '惊蛰', '处暑'] },
  { key: 6, name: '乾', dir: '西北', trigram: '☰', gx: 2, gy: 2, terms: ['芒种', '寒露', '立冬'] }
] as const

/**
 * 网格几何：让方形九宫内接于圆心圆
 *  - 内接方形对角线 = 2 × radius → 边长 = √2 × radius
 *  - 收缩系数留呼吸边，让整体紧凑一些
 */
const GRID_SIZE = computed(() => props.radius * Math.SQRT2 * 0.55)
const CELL_SIZE = computed(() => GRID_SIZE.value / 3)
const HALF_GRID = computed(() => GRID_SIZE.value / 2)

/** 单元格中心坐标 (gx, gy) → SVG (x, y) */
function cellCenter(gx: number, gy: number): { x: number, y: number } {
  const c = CELL_SIZE.value
  const half = HALF_GRID.value
  return {
    x: -half + c * (gx + 0.5),
    y: -half + c * (gy + 0.5)
  }
}
</script>

<template>
  <!-- 🔑 反向旋转：抵消外层 SVG rotate(rotationAngle)，文字始终正向 -->
  <g :transform="`rotate(${-rotationAngle})`" class="luoshu-center">
    <!-- 外圈参考圆（微弱边框） -->
    <circle cx="0" cy="0" :r="radius" fill="none" stroke="#333" stroke-width="0.5" opacity="0.5" />

    <!-- 九宫格背景 + 网格线 -->
    <g>
      <!-- 3×3 单元格背景 -->
      <rect
        v-for="p in PALACES"
        :key="`bg-${p.key}`"
        :x="-HALF_GRID + CELL_SIZE * p.gx"
        :y="-HALF_GRID + CELL_SIZE * p.gy"
        :width="CELL_SIZE"
        :height="CELL_SIZE"
        :fill="highlightLevel(p.key) > 0 ? JU_COLORS[p.key] : 'rgba(0, 0, 0, 0.35)'"
        :fill-opacity="highlightLevel(p.key) === 2 ? 0.42 : highlightLevel(p.key) === 1 ? 0.18 : 1"
        :stroke="highlightLevel(p.key) > 0 ? JU_COLORS[p.key] : '#555'"
        :stroke-width="highlightLevel(p.key) === 2 ? 2 : highlightLevel(p.key) === 1 ? 1 : 0.6"
        :opacity="highlightLevel(p.key) > 0 ? 1 : 0.85"
      />
    </g>

    <!-- 每宫内容 -->
    <g v-for="p in PALACES" :key="p.key">
      <g :transform="`translate(${cellCenter(p.gx, p.gy).x}, ${cellCenter(p.gx, p.gy).y})`">
        <!-- ① 顶部：方位 + 宫名（如「东南 巽」） -->
        <text
          :y="-CELL_SIZE * 0.36"
          text-anchor="middle"
          :fill="highlightLevel(p.key) === 2 ? '#ffffff' : highlightLevel(p.key) === 1 ? '#dddddd' : '#aaaaaa'"
          :font-size="CELL_SIZE * 0.11"
          :font-weight="highlightLevel(p.key) === 2 ? 'bold' : 'normal'"
          letter-spacing="1"
        >
          {{ p.dir }} · {{ p.name || '中' }}
        </text>

        <!-- ② 中央：洛书数字（大字） -->
        <text
          :y="CELL_SIZE * 0.02"
          text-anchor="middle"
          :fill="highlightLevel(p.key) === 2 ? '#FFD700' : (JU_COLORS[p.key] ?? '#888')"
          :font-size="CELL_SIZE * 0.36"
          font-weight="bold"
          font-family="serif"
        >
          {{ p.key }}
        </text>

        <!-- ③ 中央右侧：八卦符号 -->
        <text
          v-if="p.trigram"
          :x="CELL_SIZE * 0.32"
          :y="CELL_SIZE * 0.02"
          text-anchor="middle"
          :fill="highlightLevel(p.key) === 2 ? '#ffffff' : '#dddddd'"
          :font-size="CELL_SIZE * 0.18"
          font-family="serif"
        >
          {{ p.trigram }}
        </text>

        <!-- ④ 底部：上元起于此宫的节气 -->
        <g :transform="`translate(0, ${CELL_SIZE * 0.24})`">
          <text
            v-for="(term, i) in p.terms"
            :key="term"
            :y="i * CELL_SIZE * 0.08"
            text-anchor="middle"
            :fill="highlightLevel(p.key) === 2 ? '#ffffff' : highlightLevel(p.key) === 1 ? '#cccccc' : '#888888'"
            :font-size="CELL_SIZE * 0.075"
            :opacity="highlightLevel(p.key) > 0 ? 1 : 0.85"
          >
            {{ term }}
          </text>
        </g>
      </g>
    </g>

    <!-- 当前元宫的呼吸虚线边框（主亮）+ 同节气其它两元的静态虚线（副亮） -->
    <template v-for="p in PALACES" :key="`hl-${p.key}`">
      <rect
        v-if="highlightLevel(p.key) === 2"
        :x="-HALF_GRID + CELL_SIZE * p.gx + 1.5"
        :y="-HALF_GRID + CELL_SIZE * p.gy + 1.5"
        :width="CELL_SIZE - 3"
        :height="CELL_SIZE - 3"
        fill="none"
        :stroke="JU_COLORS[p.key]"
        stroke-width="1.5"
        stroke-dasharray="3 3"
        class="pulse"
      />
      <rect
        v-else-if="highlightLevel(p.key) === 1"
        :x="-HALF_GRID + CELL_SIZE * p.gx + 1.5"
        :y="-HALF_GRID + CELL_SIZE * p.gy + 1.5"
        :width="CELL_SIZE - 3"
        :height="CELL_SIZE - 3"
        fill="none"
        :stroke="JU_COLORS[p.key]"
        stroke-width="0.8"
        stroke-dasharray="2 4"
        opacity="0.7"
      />
    </template>
  </g>
</template>

<style scoped>
.luoshu-center {
  pointer-events: none;
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
</style>
