<script setup lang="ts">
import { computed, markRaw, ref } from 'vue'
import DegreeScale from '@/components/rings/DegreeScale.vue'
import BranchZodiacRing from '@/components/rings/conjunction-cycles/BranchZodiacRing.vue'
import SolarTermsSkyRing from '@/components/rings/planet-mansion/SolarTermsSkyRing.vue'
import MansionDegreeRing from '@/components/rings/MansionDegreeRing.vue'
import SevenLuminariesRing from '@/components/rings/SevenLuminariesRing.vue'
import RingStack from '@/components/base/RingStack.vue'
import ConjunctionCanvas from '@/components/centers/conjunction-cycles/ConjunctionCanvas.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useLiveClock } from '@/composables/useLiveClock'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'
import { PLANET_PAIRS, pairKey } from '@/utils/conjunctions'

/**
 * 会合周期盘（Conjunction Cycles）
 *
 * ═══════════════════════════════════════════════════════════════
 *  五星 10 对两两会合的赤经序列可视化：
 *    - 起点 = 当前时间之后最近一次会合（跨全体 10 对）
 *    - 向未来 windowYears 内的相邻会合两点连线
 *    - opacity 随距起点时间衰减：起点最亮 → 窗口末端最暗
 *
 *  ┌─ 外径 480
 *  │
 *  ├── RingStack 自动布局：
 *  │   1. BranchZodiacRing    (24px) · 十二地支宫（按黄经分宫，卯=春分、午=夏至、酉=秋分、子=冬至）
 *  │   2. SolarTermsSkyRing   (24px + 2px gap) · 24 节气刻度（黄经→赤经映射，与地支宫紧邻对齐）
 *  │   3. DegreeScale         (22px + 2px gap) · 360° 赤经刻度
 *  │   4. MansionDegreeRing   (28px + 6px gap) · 七曜入宿度径向刻线 + 度数标签
 *  │   5. SevenLuminariesRing (30px + 2px gap) · 七曜天体本体（发光符号）
 *  │   6. #center: ConjunctionCanvas (剩余全部空间) · 会合点 + 连线
 *  │
 *  └── 复用 PlanetMansionView 的外三环 + 12 地支宫 + 24 节气环（赤经坐标系统一）
 * ═══════════════════════════════════════════════════════════════
 */

// 唯一时间源
const { controlledTime, hasUrlTime } = useUrlTime()
const { onUserTimeChange } = useLiveClock(controlledTime, { paused: hasUrlTime })

// 视口控制
const viewport = useViewport()
const { zoom, offsetX, offsetY, rotationDirection, rotationAngle } = viewport

const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })

provideCompassContext({ time: controlledTime, viewport, onUserTimeChange })

/** 唯一配置常量：全圆盘外缘半径 */
const DISK_OUTER_RADIUS = 480

// ──────────────────────────────────────────────────────────
// View 专属状态：观察方向（过去 / 未来）、窗口宽度、勾选的行星对
// ──────────────────────────────────────────────────────────
const WINDOW_OPTIONS = [50, 100, 200, 500] as const
const windowYears = ref<number>(200)

/** 观察方向开关：可同时开（双向观察），未来蓝、过去红 */
const showFuture = ref(true)
const showPast = ref(true)

/** 方向色（覆盖每对独立配色，让方向语义压过行星对语义） */
const FUTURE_COLOR = '#4a9eff'  // 未来 · 蓝
const PAST_COLOR = '#ff5a5a'    // 过去 · 红

/** 默认全 10 对开启（用 pair 稳定 key） */
const enabledPairs = ref<Set<string>>(new Set(PLANET_PAIRS.map(pairKey)))
const showPoints = ref(true)
const showLines = ref(true)

const togglePair = (key: string) => {
  const s = new Set(enabledPairs.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  enabledPairs.value = s
}
const selectAll = () => {
  enabledPairs.value = new Set(PLANET_PAIRS.map(pairKey))
}
const clearAll = () => {
  enabledPairs.value = new Set()
}
const onlyOuter = () => {
  enabledPairs.value = new Set(
    PLANET_PAIRS.filter(p => p[0] !== 'mercury' && p[0] !== 'venus' && p[1] !== 'mercury' && p[1] !== 'venus')
      .map(pairKey)
  )
}
const onlyInner = () => {
  enabledPairs.value = new Set(
    PLANET_PAIRS.filter(p => (p[0] === 'mercury' || p[0] === 'venus') && (p[1] === 'mercury' || p[1] === 'venus'))
      .map(pairKey)
  )
}

// 侧栏 UI：10 对配色（Tab10 定性色板，避免多对撞色）
const PAIR_COLORS: Record<string, string> = {
  'mercury-venus': '#1f77b4',
  'mercury-mars': '#ff7f0e',
  'mercury-jupiter': '#2ca02c',
  'mercury-saturn': '#d62728',
  'venus-mars': '#9467bd',
  'venus-jupiter': '#8c564b',
  'venus-saturn': '#e377c2',
  'mars-jupiter': '#7f7f7f',
  'mars-saturn': '#bcbd22',
  'jupiter-saturn': '#17becf'
}

const PAIR_LABEL: Record<string, string> = {
  mercury: '水', venus: '金', mars: '火', jupiter: '木', saturn: '土'
}

const pairEntries = computed(() =>
  PLANET_PAIRS.map(p => ({
    key: pairKey(p),
    label: `${PAIR_LABEL[p[0]]}-${PAIR_LABEL[p[1]]}`,
    color: PAIR_COLORS[pairKey(p)] ?? '#888'
  }))
)

// ──────────────────────────────────────────────────────────
// RingStack 配置：五环由外到内
//   1. BranchZodiacRing    (24px) · 12 地支宫（按黄经分宫，与节气对齐）
//   2. SolarTermsSkyRing   (24px + 2px gap) · 24 节气刻度（黄经→赤经，紧邻地支宫）
//   3. DegreeScale         (22px + 2px gap) · 360° 赤经刻度
//   4. MansionDegreeRing   (28px + 6px gap) · 七曜入宿度径向刻线 + 度数标签
//   5. SevenLuminariesRing (30px + 2px gap) · 七曜天体本体（发光符号）
//
// 全环共享赤经坐标系：屏幕角 = (360 − RA)，春分在屏幕正右
// ──────────────────────────────────────────────────────────
const outerRings = [
  {
    component: markRaw(BranchZodiacRing),
    thickness: 24,
    props: {}
  },
  {
    component: markRaw(SolarTermsSkyRing),
    thickness: 24,
    gapBefore: 2,
    props: { time: controlledTime }
  },
  {
    component: markRaw(DegreeScale),
    thickness: 22,
    gapBefore: 2,
    props: {
      scaleInterval: 1,
      labelInterval: 5,
      tickDirection: 'outward',
      startDegree: 0,
      rotationDirection: 'counterclockwise',
      showSectors: false,
      showLabels: true,
      labelColor: '#666666',
      circleColor: '#555555'
    }
  },
  {
    component: markRaw(MansionDegreeRing),
    thickness: 28,
    gapBefore: 6,
    props: { time: controlledTime }
  },
  {
    component: markRaw(SevenLuminariesRing),
    thickness: 30,
    gapBefore: 2,
    props: { time: controlledTime }
  }
]
</script>

<template>
  <div class="container">
    <!-- ══════════════════════════════════════════════════════
         侧栏专属工具位（Teleport 到 CompassSidebar 挂载点）
         ══════════════════════════════════════════════════════ -->
    <Teleport to="#sidebar-view-tools">
      <!-- 观察方向 -->
      <div class="view-tool-group">
        <label class="view-tool-label">观察方向</label>
        <div class="window-toggle">
          <button
            :class="{ active: showFuture }"
            :style="showFuture ? { color: FUTURE_COLOR, borderColor: FUTURE_COLOR } : {}"
            title="向未来观察（蓝色）"
            @click="showFuture = !showFuture"
          >
            {{ showFuture ? '✔ 未来' : '  未来' }}
          </button>
          <button
            :class="{ active: showPast }"
            :style="showPast ? { color: PAST_COLOR, borderColor: PAST_COLOR } : {}"
            title="向过去观察（红色）"
            @click="showPast = !showPast"
          >
            {{ showPast ? '✔ 过去' : '  过去' }}
          </button>
        </div>
      </div>

      <!-- 观察窗口宽度 -->
      <div class="view-tool-group">
        <label class="view-tool-label">观察窗口</label>
        <div class="window-toggle">
          <button
            v-for="opt in WINDOW_OPTIONS"
            :key="opt"
            :class="{ active: windowYears === opt }"
            :title="`向前/后各延伸 ${opt} 年`"
            @click="windowYears = opt"
          >
            {{ opt }} 年
          </button>
        </div>
      </div>

      <!-- 显示层 -->
      <div class="view-tool-group">
        <label class="view-tool-label">显示层</label>
        <div class="window-toggle">
          <button :class="{ active: showPoints }" @click="showPoints = !showPoints">
            {{ showPoints ? '✔ 会合点' : '  会合点' }}
          </button>
          <button :class="{ active: showLines }" @click="showLines = !showLines">
            {{ showLines ? '✔ 连线' : '  连线' }}
          </button>
        </div>
      </div>

      <!-- 行星对勾选 -->
      <div class="view-tool-group">
        <label class="view-tool-label">显示行星对</label>
        <div class="pair-list">
          <label
            v-for="e in pairEntries"
            :key="e.key"
            class="pair-item"
            :class="{ 'pair-item--off': !enabledPairs.has(e.key) }"
          >
            <input
              type="checkbox"
              :checked="enabledPairs.has(e.key)"
              @change="togglePair(e.key)"
            />
            <span class="pair-dot" :style="{ background: e.color }"></span>
            <span class="pair-label">{{ e.label }}</span>
          </label>
        </div>
        <div class="pair-actions">
          <button @click="selectAll">全选</button>
          <button @click="clearAll">全不选</button>
          <button @click="onlyOuter">仅外行星</button>
          <button @click="onlyInner">仅内行星</button>
        </div>
      </div>
    </Teleport>

    <svg
      ref="svgRef"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
      class="compass-svg"
      :class="{ 'alt-hover': isAltPressed && !isDragging, 'alt-dragging': isDragging }"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoom}) rotate(${rotationAngle})`">
        <RingStack
          :outer-radius="DISK_OUTER_RADIUS"
          :rings="outerRings"
          :rotation-direction="rotationDirection"
        >
          <!-- 圆心画布：会合点 + 折线 -->
          <template #center="{ innerRadius }">
            <ConjunctionCanvas
              :time="controlledTime"
              :radius="innerRadius"
              :rotation-direction="rotationDirection"
              :window-years="windowYears"
              :enabled-pairs="enabledPairs"
              :pair-colors="PAIR_COLORS"
              :show-points="showPoints"
              :show-lines="showLines"
              :show-future="showFuture"
              :show-past="showPast"
              :future-color="FUTURE_COLOR"
              :past-color="PAST_COLOR"
            />
          </template>
        </RingStack>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  background-color: black;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.compass-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.compass-svg.alt-hover {
  cursor: grab;
}
.compass-svg.alt-dragging {
  cursor: grabbing;
}

/* ────── 侧栏工具位样式 ────── */
.view-tool-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.view-tool-group:last-of-type {
  border-bottom: none;
}
.view-tool-label {
  font-size: 11px;
  color: #888;
  letter-spacing: 0.05em;
}
.window-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.window-toggle button {
  flex: 1 1 auto;
  min-width: 48px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #aaa;
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s;
}
.window-toggle button:hover {
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}
.window-toggle button.active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.6);
  color: #ddd;
}
.pair-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 8px;
  margin-top: 2px;
}
.pair-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ccc;
  cursor: pointer;
  user-select: none;
}
.pair-item--off {
  color: #555;
}
.pair-item input {
  cursor: pointer;
}
.pair-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pair-label {
  letter-spacing: 0.02em;
}
.pair-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}
.pair-actions button {
  flex: 1;
  padding: 3px 6px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #999;
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px;
}
.pair-actions button:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.25);
}
</style>
