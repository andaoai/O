<script setup lang="ts">
/**
 * FeifuView — 卦关系图盘
 *
 * 将六十四卦按后天/先天布局排列，圆心绘制有向箭头展示卦间关系。
 * 支持五种关系类型（飞伏/互卦/对卦/综卦/交卦），可在侧栏切换。
 *
 * 关系类型与排序布局互相独立，可任意组合。
 */
import { ref, computed, markRaw, provide } from 'vue'
import RingStack from '@/components/base/RingStack.vue'
import FeifuCenter from '@/components/centers/FeifuCenter.vue'
import FeifuTextRing from '@/components/rings/FeifuTextRing.vue'
import type { FeifuTextLayer } from '@/components/rings/FeifuTextRing.vue'
import { useFeifuInteraction, FEIFU_KEY } from '@/composables/useFeifuInteraction'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'
import type { ShiyingType } from '@/data/rings/jingFangEightPalaces'
import { PALACES } from '@/data/rings/jingFangEightPalaces'
import {
  RELATION_METAS_LIST,
  RELATION_COLORS,
  type GuaRelationType,
} from '@/utils/guaRelations'

/**
 * 卦关系可视化
 *
 * 五层架构重构版：
 *   RingStack 布局文字环层（卦名/卦符/五行/阴阳）围绕圆心关系箭头。
 *   五种关系类型可切换，箭头动态重绘。
 *
 * ✨ 纯静态易学可视化
 */
const { controlledTime } = useUrlTime()

// 视口控制
const viewport = useViewport()
const { zoom, offsetX, offsetY, rotationDirection, rotationAngle } = viewport

// Alt + 拖拽平移
const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })

provideCompassContext({ time: controlledTime, viewport })

// ─── 关系类型（默认飞伏） ───

const relationType = ref<GuaRelationType>('feifu')

// ─── 交互状态 ───

const shiyingFilter = ref<ShiyingType[]>([])
const palaceFilter = ref<string[]>([])
const layout = ref<'houtian' | 'xiantian'>('houtian')

const feifuInteraction = useFeifuInteraction({
  shiyingFilter,
  palaceFilter,
  relationType,
})

// 提供 FEIFU_KEY 给 FeifuCenter / FeifuTextRing
provide(FEIFU_KEY, feifuInteraction)

// ─── 图层显隐 ───

export interface RingVisibility {
  element: boolean
  innerElement: boolean
  outerElement: boolean
}

const ringVisibility = ref<RingVisibility>({
  element: true,
  innerElement: true,
  outerElement: true,
})

function toggleRing(key: keyof RingVisibility) {
  ringVisibility.value = { ...ringVisibility.value, [key]: !ringVisibility.value[key] }
}

const RING_OPTIONS: readonly { key: keyof RingVisibility; label: string; color: string }[] = [
  { key: 'element', label: '五行', color: '#F1C40F' },
  { key: 'innerElement', label: '内卦五', color: '#2ECC71' },
  { key: 'outerElement', label: '外卦五', color: '#3498DB' }
]

// ─── RingStack 配置 ───

/** 基础罗盘外缘半径（由缩放比例控制整体大小） */
const BASE_OUTER_RADIUS = 600
/** 整体缩放百分比 (30~100) — 外缘、环、圆心同步缩放 */
const centerPercent = ref(100)
/** 环间间隙 */
const GAP = 1

/**
 * 每层文本环的固定径向厚度（px）
 *
 * 以 OUTER_RADIUS 为外边界，由外向内累加环厚，
 * 余下的自然成为圆心空间。隐藏的环不占空间，圆心自动扩大。
 *   卦名(name): 22px — 2 字卦名 + 内边距
 *   五行(element): 16px — 2 字五行 + 内边距
 *   卦符(unicode): 30px — 魁字卦符 + 内边距
 *   内卦五行(innerElement): 14px — 1 字五行 + 内边距
 *   外卦五行(outerElement): 14px — 1 字五行 + 内边距
 *   阴阳(yinYang): 18px — 3 字体性 + 内边距
 */
const LAYER_THICKNESS: Record<FeifuTextLayer, number> = {
  name: 22,
  element: 16,
  unicode: 30,
  innerElement: 14,
  outerElement: 14,
}

type RingLayerConfig = {
  key: keyof RingVisibility | 'always'
  layer: FeifuTextLayer
  always: boolean
}

/** 各文本环层级定义（由外到内，RingStack 反向累加） */
const RING_LAYERS: readonly RingLayerConfig[] = [
  { key: 'outerElement',  layer: 'outerElement',  always: false },
  { key: 'innerElement',  layer: 'innerElement',  always: false },
  { key: 'always',        layer: 'unicode',       always: true  },
  { key: 'element',       layer: 'element',       always: false },
  { key: 'always',        layer: 'name',          always: true  },
] as const

/** 外缘半径 = 基础半径 × 缩放比例，环与圆心同步缩放 */
const outerRadius = computed(() => BASE_OUTER_RADIUS * (centerPercent.value / 100))

const rings = computed(() => {
  const visible = RING_LAYERS.filter(
    r => r.always || ringVisibility.value[r.key as keyof RingVisibility]
  )
  return visible.map(r => ({
    component: markRaw(FeifuTextRing),
    thickness: LAYER_THICKNESS[r.layer],
    gapBefore: GAP,
    props: {
      layer: r.layer,
      layout: layout.value,
      relationType: relationType.value,
      startDegree: 0,
      // 五行环隐藏时，name/unicode 回退到宫色补偿
      usePaletteColorFallback: (r.layer === 'name' || r.layer === 'unicode') && !ringVisibility.value.element,
    }
  }))
})

// ─── 世位筛选（仅 feifu 模式有效） ───

const shiyingOptions: readonly { type: ShiyingType | 'all'; label: string; color: string }[] = [
  { type: 'all',  label: '全部', color: '#FFD700' },
  { type: '本宫', label: '本宫', color: '#F1C40F' },
  { type: '一世', label: '一世', color: '#E67E22' },
  { type: '二世', label: '二世', color: '#E74C3C' },
  { type: '三世', label: '三世', color: '#9B59B6' },
  { type: '四世', label: '四世', color: '#3498DB' },
  { type: '五世', label: '五世', color: '#1ABC9C' },
  { type: '游魂', label: '游魂', color: '#7F8C8D' },
  { type: '归魂', label: '归魂', color: '#95A5A6' }
]

const activeType = computed<ShiyingType | 'all'>(() => {
  if (shiyingFilter.value.length === 0) return 'all'
  if (shiyingFilter.value.length === 1) return shiyingFilter.value[0]!
  return 'all'
})

function selectShiying(type: ShiyingType | 'all') {
  if (type === 'all') {
    shiyingFilter.value = []
  } else {
    shiyingFilter.value = shiyingFilter.value.length === 1 && shiyingFilter.value[0] === type
      ? []
      : [type]
  }
}

function selectPalace(palace: string) {
  const idx = palaceFilter.value.indexOf(palace)
  if (idx >= 0) {
    palaceFilter.value = palaceFilter.value.filter(p => p !== palace)
  } else {
    palaceFilter.value = [...palaceFilter.value, palace]
  }
}

</script>

<template>
  <div class="container">
    <!-- 筛选器 Teleport 到 Sidebar 的"视图选项"区块 -->
    <Teleport to="#sidebar-view-tools">
      <!-- ─── 卦关系类型选择 ─── -->
      <div class="view-tool-group">
        <label class="view-tool-label">卦关系</label>
        <div class="filter-row">
          <button
            v-for="meta in RELATION_METAS_LIST"
            :key="meta.type"
            class="filter-btn"
            :class="{ active: relationType === meta.type }"
            :style="{
              '--btn-color': RELATION_COLORS[meta.type],
              borderColor: relationType === meta.type ? RELATION_COLORS[meta.type] : '#444',
              color: relationType === meta.type ? RELATION_COLORS[meta.type] : '#aaa',
            }"
            @click="relationType = meta.type"
          >
            {{ meta.label }}
          </button>
        </div>
      </div>

      <!-- ─── 卦象排列（所有关系类型通用） ─── -->
      <div class="view-tool-group">
        <label class="view-tool-label">卦象排列</label>
        <div class="filter-row">
          <button
            class="filter-btn"
            :class="{ active: layout === 'houtian' }"
            :style="{ '--btn-color': '#F1C40F' }"
            @click="layout = 'houtian'"
          >
            后天八卦
          </button>
          <button
            class="filter-btn"
            :class="{ active: layout === 'xiantian' }"
            :style="{ '--btn-color': '#66CCFF' }"
            @click="layout = 'xiantian'"
          >
            先天八卦
          </button>
        </div>
      </div>

      <!-- ─── 八宫筛选（所有关系类型通用） ─── -->
        <div class="view-tool-group">
          <label class="view-tool-label">八宫筛选</label>
          <div class="filter-row filter-row--wrap">
            <button
              class="filter-btn filter-btn--sm"
              :class="{ active: palaceFilter.length === 0 }"
              :style="{ '--btn-color': '#FFD700' }"
              @click="palaceFilter = []"
            >
              全部
            </button>
            <button
              v-for="p in PALACES"
              :key="p.palace"
              class="filter-btn filter-btn--sm"
              :class="{ active: palaceFilter.includes(p.palace) }"
              :style="{
                '--btn-color': p.color,
                borderColor: palaceFilter.includes(p.palace) ? p.color : '#444',
                color: palaceFilter.includes(p.palace) ? p.color : '#aaa'
              }"
              @click="selectPalace(p.palace)"
            >
              {{ p.palace }}
            </button>
          </div>
        </div>

        <div class="view-tool-group">
          <label class="view-tool-label">世位筛选</label>
          <div class="filter-row filter-row--wrap">
            <button
              v-for="opt in shiyingOptions"
              :key="opt.type"
              class="filter-btn filter-btn--sm"
              :class="{ active: activeType === opt.type }"
              :style="{
                '--btn-color': opt.color,
                borderColor: activeType === opt.type ? opt.color : '#444',
                color: activeType === opt.type ? opt.color : '#aaa'
              }"
              @click="selectShiying(opt.type)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      <!-- ─── 图层显示 ─── -->
      <div class="view-tool-group">
        <label class="view-tool-label">图层显示</label>
        <div class="filter-row filter-row--wrap">
          <button
            v-for="opt in RING_OPTIONS"
            :key="opt.key"
            class="filter-btn filter-btn--sm"
            :class="{ active: ringVisibility[opt.key] }"
            :style="{
              '--btn-color': opt.color,
              borderColor: ringVisibility[opt.key] ? opt.color : '#444',
              color: ringVisibility[opt.key] ? opt.color : '#555'
            }"
            @click="toggleRing(opt.key)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- ─── 整体缩放 ─── -->
      <div class="view-tool-group">
        <label class="view-tool-label">整体缩放 {{ centerPercent }}%</label>
        <input
          type="range"
          min="30"
          max="100"
          step="1"
          v-model.number="centerPercent"
          class="scale-slider"
        />
      </div>
    </Teleport>

    <svg
      ref="svgRef"
      class="compass-svg"
      :class="{ 'alt-hover': isAltPressed && !isDragging, 'alt-dragging': isDragging }"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoom}) rotate(${rotationAngle})`"
      >
        <RingStack
          :outer-radius="outerRadius"
          :rings="rings"
          :rotation-direction="rotationDirection"
        >
          <template #center="{ innerRadius }">
            <FeifuCenter
              :radius="innerRadius"
              :rotation-direction="rotationDirection"
              :start-degree="0"
              :layout="layout"
              :relation-type="relationType"
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

svg {
  display: block;
}

.compass-svg {
  width: 100%;
  height: 100%;
}

/* Alt 按下 → grab；拖拽中 → grabbing */
.compass-svg.alt-hover {
  cursor: grab;
}
.compass-svg.alt-dragging {
  cursor: grabbing;
}

/* ─── Teleport 到 Sidebar 的筛选器 ─── */
.view-tool-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.view-tool-label {
  font-size: 10px;
  color: #888;
  letter-spacing: 1px;
  padding-left: 2px;
}

.filter-row {
  display: flex;
  gap: 4px;
}
.filter-row > .filter-btn:not(.filter-btn--sm) {
  flex: 1;
}
.filter-row--wrap {
  flex-wrap: wrap;
}

.scale-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #333;
  border-radius: 2px;
  outline: none;
  margin: 4px 0;
  cursor: pointer;
}
.scale-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #F1C40F;
  cursor: pointer;
  border: none;
}

.filter-btn {
  font-size: 12px;
  padding: 5px 8px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid #444;
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background-color 0.15s;
  font-family: inherit;
}

.filter-btn--sm {
  font-size: 11px;
  padding: 4px 8px;
  min-width: 34px;
}

.filter-btn:hover {
  color: var(--btn-color);
  border-color: var(--btn-color);
}

.filter-btn.active {
  background-color: rgba(255, 215, 0, 0.08);
  font-weight: bold;
}
</style>
