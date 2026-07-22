<script setup lang="ts">
/**
 * GuaRelationView — 卦关系图盘
 *
 * 将六十四卦按京房八宫/先天布局排列，圆心绘制有向箭头展示卦间关系。
 * 支持五种关系类型（飞伏/互卦/对卦/综卦/交卦），可在侧栏切换。
 *
 * 关系类型与排序布局互相独立，可任意组合。
 */
import { ref, computed, markRaw, provide } from 'vue'
import RingStack from '@/components/base/RingStack.vue'
import GuaRelationCenter from '@/components/centers/GuaRelationCenter.vue'
import GuaRelationTextRing from '@/components/rings/GuaRelationTextRing.vue'
import type { GuaRelationTextLayer } from '@/components/rings/GuaRelationTextRing.vue'
import { useGuaRelationInteraction, GUA_RELATION_KEY, type GuaRelationMode } from '@/composables/useGuaRelationInteraction'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'
import type { ShiyingType } from '@/data/rings/jingFangEightPalaces'
import { PALACES } from '@/data/rings/jingFangEightPalaces'
import { WENWANG_GUA_BY_VALUE, getUnicodeHexagram } from '@/data/sixtyFourGua'
import {
  RELATION_METAS,
  RELATION_METAS_LIST,
  RELATION_COLORS,
  getArrowColor,
  type FocusRelationEntry,
  type GuaRelationEntry,
  type GuaRelationType,
  type GuaLayout,
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

// ─── 模式切换：全局 / 聚焦 ───

const mode = ref<GuaRelationMode>('global')
/** 聚焦模式下选中的卦 value（点盘上任意卦） */
const focusedValue = ref<number | null>(null)
/** 聚焦模式下要显示的关系类型集合，默认互/综/错/变 */
const focusRelationTypes = ref<Set<GuaRelationType>>(
  new Set<GuaRelationType>(['hugua', 'zonggua', 'duigua', 'biangua'])
)
/** 动爻位（0=初爻…5=上爻），仅在勾选 biangua 时生效 */
const movingLines = ref<Set<number>>(new Set<number>())

function toggleFocusRelation(t: GuaRelationType) {
  const next = new Set(focusRelationTypes.value)
  if (next.has(t)) next.delete(t)
  else next.add(t)
  focusRelationTypes.value = next
}

function toggleMovingLine(line: number) {
  const next = new Set(movingLines.value)
  if (next.has(line)) next.delete(line)
  else next.add(line)
  movingLines.value = next
}

/** 六爻位标签：0=初爻，5=上爻 */
const YAO_LABELS = ['初', '二', '三', '四', '五', '上'] as const

/** 聚焦卦的显示名 */
const focusedGuaLabel = computed(() => {
  if (focusedValue.value === null) return null
  const meta = WENWANG_GUA_BY_VALUE[focusedValue.value]
  if (!meta) return null
  return { unicode: getUnicodeHexagram(meta.wenwangOrder), name: meta.name }
})

// ─── 交互状态 ───

const shiyingFilter = ref<ShiyingType[]>([])
const palaceFilter = ref<string[]>([])
const layout = ref<GuaLayout>('jingfang')

/**
 * 卦象排列元数据 —— 6 种历代圆盘排列
 *
 *   jingfang    — 汉·京房《京氏易传》
 *   xiantian    — 宋·邵雍《皇极经世·观物外篇》
 *   binary      — 自然二进制序（数学序，非古籍）
 *   wenwang     — 通行本《周易·序卦传》
 *   zaguazhuan  — 《周易·杂卦传》
 */
const LAYOUT_OPTIONS: readonly {
  key: GuaLayout
  label: string
  color: string
  tip: string
}[] = [
  {
    key: 'jingfang',
    label: '京房八宫',
    color: '#F1C40F',
    tip: '京房八宫序【汉·京房《京氏易传》】｜八纯卦（乾坎艮震坤离兑巽）各领一宫，每宫下辖 一世→二世→三世→四世→五世→游魂→归魂，共 8 卦。圆盘按宫聚成扇区，同宫同色。',
  },
  {
    key: 'xiantian',
    label: '先天圆图',
    color: '#66CCFF',
    tip: '先天六十四卦圆图【宋·邵雍《皇极经世·观物外篇》，本自伏羲】｜按六爻二进制「位反转」定圆周次序：乾上坤下，右阳仪、左阴仪，对径两卦即互为对卦（错卦）。莱布尼茨 1701 年据白晋寄自北京的先天图写下二进制算术的信，此排序即东方最早的 6 位二进制序。',
  },
  {
    key: 'binary',
    label: '自然二进制',
    color: '#88DDFF',
    tip: '自然二进制序【数学序，非古籍原文】｜六爻二进制 value 直接作为圆周位置（LSB=初爻、MSB=上爻），0=坤起顶、1=复、2=师…63=乾。可与先天圆图对照体察「位反转」的效果。',
  },
  {
    key: 'wenwang',
    label: '文王卦序',
    color: '#E67E22',
    tip: '文王卦序【通行本《周易·序卦传》】｜今本《易经》通行卦序：乾坤屯蒙需讼师比小畜履泰否…既济未济。上经 30 卦、下经 34 卦，成对相反相因（错综），两两相邻。',
  },
  {
    key: 'zaguazhuan',
    label: '杂卦传',
    color: '#9B59B6',
    tip: '杂卦传序【《周易·杂卦传》】｜十翼之末，用协韵散文体重排 64 卦：乾刚坤柔，比乐师忧，临观之义或与或求…将六十四卦两两组配以见反覆之义，卦序独立于序卦传。',
  },
]

const interaction = useGuaRelationInteraction({
  shiyingFilter,
  palaceFilter,
  relationType,
  mode,
  focusedValue,
  focusRelationTypes,
  movingLines,
})

// 提供 GUA_RELATION_KEY 给 GuaRelationCenter / GuaRelationTextRing
provide(GUA_RELATION_KEY, interaction)

// ─── 详情面板派生（HTML 浮层用） ───

/**
 * 全局模式悬停配对：hoveredValue 找到 relationTable 中第一条匹配 entry
 * 聚焦模式此值为 null（改由 focusSummary 展示）
 */
const hoveredPair = computed<GuaRelationEntry | null>(() => {
  if (mode.value !== 'global') return null
  const hv = interaction.hoveredValue.value
  if (hv === null) return null
  return interaction.relationTable.value.find(
    e => e.sourceValue === hv || e.targetValue === hv,
  ) as GuaRelationEntry | null ?? null
})

/** 全局模式当前关系元信息 */
const hoveredRelationMeta = computed(() => RELATION_METAS[relationType.value])

/** 聚焦模式：焦点卦 + 所有目标卦汇总（hover 预览时使用 effectiveFocusedValue） */
const focusSummary = computed(() => {
  if (mode.value !== 'focus') return null
  if (interaction.effectiveFocusedValue.value === null) return null
  const items = interaction.relationTable.value.filter(
    e => 'type' in e,
  ) as FocusRelationEntry[]
  if (items.length === 0) return null
  const source = items[0]!
  const movingList = Array.from(movingLines.value).sort((a, b) => a - b)
  const movingText = movingList.length === 0 ? '无' : movingList.map(i => YAO_LABELS[i]).join('、')
  return {
    sourceUnicode: source.sourceUnicode,
    sourceName: source.sourceName,
    sourcePalace: source.palace,
    sourceColor: source.color,
    sourceShiying: source.shiyingType,
    movingText,
    items,
    /** 是否为固定焦点（true）还是 hover 预览（false） */
    isPinned: focusedValue.value !== null,
  }
})

// ─── 图层显隐 ───

export interface RingVisibility {
  element: boolean
  innerElement: boolean
  outerElement: boolean
  binary: boolean
  decimal: boolean
}

const ringVisibility = ref<RingVisibility>({
  element: true,
  innerElement: true,
  outerElement: true,
  binary: false,
  decimal: false,
})

function toggleRing(key: keyof RingVisibility) {
  ringVisibility.value = { ...ringVisibility.value, [key]: !ringVisibility.value[key] }
}

const RING_OPTIONS: readonly { key: keyof RingVisibility; label: string; color: string; tip: string }[] = [
  { key: 'element',      label: '五行',    color: '#F1C40F', tip: '本宫五行｜按京房八宫，八宫各属一行（乾兑=金、离=火、震巽=木、坎=水、艮坤=土），显示每卦所属本宫的五行' },
  { key: 'innerElement', label: '内卦五',  color: '#2ECC71', tip: '内卦（下卦）五行｜取六爻的初、二、三爻组成八经卦，显示下卦所属五行' },
  { key: 'outerElement', label: '外卦五',  color: '#3498DB', tip: '外卦（上卦）五行｜取六爻的四、五、上爻组成八经卦，显示上卦所属五行' },
  { key: 'binary',       label: '二进制',  color: '#88DDFF', tip: '六爻二进制｜自初爻至上爻共 6 位（LSB=初爻，MSB=上爻），阳爻=1、阴爻=0，即莱布尼茨读到的先天数' },
  { key: 'decimal',      label: '十进制',  color: '#FFD08A', tip: '六爻十进制序号 0–63｜二进制编码的十进制值，坤=0、复=1、姤=62、乾=63' }
]

// ─── 通用 tooltip 状态（Teleport 到 body，脱离 sidebar 的 overflow 裁剪） ───

const tooltip = ref<{ visible: boolean; text: string; x: number; y: number; color: string }>({
  visible: false,
  text: '',
  x: 0,
  y: 0,
  color: '#F1C40F',
})

/** 悬停延迟计时器 */
let tooltipTimer: number | null = null

/**
 * 按钮进入 → 计算 tooltip 位置（右浮，避开 sidebar 左侧裁剪）
 * event.currentTarget 的 --btn-color CSS 变量作为边框色
 */
function showTooltip(event: MouseEvent, text: string) {
  const el = event.currentTarget as HTMLElement | null
  if (!el || !text) return
  const rect = el.getBoundingClientRect()
  const color = getComputedStyle(el).getPropertyValue('--btn-color').trim() || '#F1C40F'
  if (tooltipTimer !== null) window.clearTimeout(tooltipTimer)
  tooltipTimer = window.setTimeout(() => {
    tooltip.value = {
      visible: true,
      text,
      // 放在按钮右侧 12px 处，垂直居中对齐
      x: rect.right + 12,
      y: rect.top + rect.height / 2,
      color,
    }
  }, 250)
}

function hideTooltip() {
  if (tooltipTimer !== null) {
    window.clearTimeout(tooltipTimer)
    tooltipTimer = null
  }
  tooltip.value = { ...tooltip.value, visible: false }
}

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
 *   二进制(binary): 16px — 6 位 0/1 + 内边距
 *   十进制(decimal): 14px — 1~2 位数字 + 内边距
 *   阴阳(yinYang): 18px — 3 字体性 + 内边距
 */
const LAYER_THICKNESS: Record<GuaRelationTextLayer, number> = {
  name: 22,
  element: 16,
  unicode: 30,
  innerElement: 14,
  outerElement: 14,
  binary: 16,
  decimal: 14,
}

type RingLayerConfig = {
  key: keyof RingVisibility | 'always'
  layer: GuaRelationTextLayer
  always: boolean
}

/** 各文本环层级定义（由外到内，RingStack 反向累加） */
const RING_LAYERS: readonly RingLayerConfig[] = [
  { key: 'decimal',       layer: 'decimal',       always: false },
  { key: 'binary',        layer: 'binary',        always: false },
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
    component: markRaw(GuaRelationTextRing),
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
      <!-- ─── 模式切换 ─── -->
      <div class="view-tool-group">
        <label class="view-tool-label">显示模式</label>
        <div class="filter-row">
          <button
            class="filter-btn"
            :class="{ active: mode === 'global' }"
            :style="{ '--btn-color': '#F1C40F' }"
            @click="mode = 'global'"
          >
            全局
          </button>
          <button
            class="filter-btn"
            :class="{ active: mode === 'focus' }"
            :style="{ '--btn-color': '#9B59B6' }"
            @click="mode = 'focus'"
          >
            聚焦
          </button>
        </div>
      </div>

      <!-- ─── 全局模式：卦关系单选 ─── -->
      <div v-if="mode === 'global'" class="view-tool-group">
        <label class="view-tool-label">卦关系</label>
        <div class="filter-row filter-row--wrap">
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
            @mouseenter="showTooltip($event, `${meta.label}｜${meta.description}`)"
            @mouseleave="hideTooltip"
            @click="relationType = meta.type"
          >
            {{ meta.label }}
          </button>
        </div>
      </div>

      <!-- ─── 聚焦模式：焦点卦 + 关系多选 + 动爻 ─── -->
      <template v-if="mode === 'focus'">
        <div class="view-tool-group">
          <label class="view-tool-label">焦点卦</label>
          <div v-if="focusedGuaLabel" class="focus-display">
            <span class="focus-symbol">{{ focusedGuaLabel.unicode }}</span>
            <span class="focus-name">{{ focusedGuaLabel.name }}</span>
            <button
              class="filter-btn filter-btn--sm focus-clear"
              :style="{ '--btn-color': '#888' }"
              @click="focusedValue = null"
            >
              清除
            </button>
          </div>
          <div v-else class="focus-hint">
            点击盘面任意卦名以选中
          </div>
        </div>

        <div class="view-tool-group">
          <label class="view-tool-label">聚焦关系（可多选）</label>
          <div class="filter-row filter-row--wrap">
            <button
              v-for="meta in RELATION_METAS_LIST"
              :key="meta.type"
              class="filter-btn filter-btn--sm"
              :class="{ active: focusRelationTypes.has(meta.type) }"
              :style="{
                '--btn-color': RELATION_COLORS[meta.type],
                borderColor: focusRelationTypes.has(meta.type) ? RELATION_COLORS[meta.type] : '#444',
                color: focusRelationTypes.has(meta.type) ? RELATION_COLORS[meta.type] : '#aaa',
              }"
              @mouseenter="showTooltip($event, `${meta.label}｜${meta.description}`)"
              @mouseleave="hideTooltip"
              @click="toggleFocusRelation(meta.type)"
            >
              {{ meta.label }}
            </button>
          </div>
        </div>

        <div v-if="focusRelationTypes.has('biangua')" class="view-tool-group">
          <label class="view-tool-label">变卦动爻（自初至上，可多选）</label>
          <div class="filter-row filter-row--wrap">
            <button
              v-for="(label, i) in YAO_LABELS"
              :key="i"
              class="filter-btn filter-btn--sm"
              :class="{ active: movingLines.has(i) }"
              :style="{
                '--btn-color': '#9B59B6',
                borderColor: movingLines.has(i) ? '#9B59B6' : '#444',
                color: movingLines.has(i) ? '#9B59B6' : '#aaa',
              }"
              @click="toggleMovingLine(i)"
            >
              {{ label }}
            </button>
          </div>
          <div v-if="movingLines.size === 0" class="focus-hint focus-hint--warn">
            未选动爻 → 变卦即原卦
          </div>
        </div>
      </template>

      <!-- ─── 卦象排列（所有关系类型通用） ─── -->
      <div class="view-tool-group">
        <label class="view-tool-label">卦象排列</label>
        <div class="filter-row filter-row--wrap">
          <button
            v-for="opt in LAYOUT_OPTIONS"
            :key="opt.key"
            class="filter-btn filter-btn--sm"
            :class="{ active: layout === opt.key }"
            :style="{
              '--btn-color': opt.color,
              borderColor: layout === opt.key ? opt.color : '#444',
              color: layout === opt.key ? opt.color : '#aaa',
            }"
            @mouseenter="showTooltip($event, opt.tip)"
            @mouseleave="hideTooltip"
            @click="layout = opt.key"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- ─── 八宫筛选（全局/聚焦均可用） ─── -->
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
            @mouseenter="showTooltip($event, opt.tip)"
            @mouseleave="hideTooltip"
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
            <GuaRelationCenter
              :radius="innerRadius"
              :rotation-direction="rotationDirection"
              :start-degree="0"
              :layout="layout"
              :relation-type="relationType"
              :mode="mode"
              :focused-value="focusedValue"
              :focus-relation-types="focusRelationTypes"
              :moving-lines="movingLines"
            />
          </template>
        </RingStack>
      </g>
    </svg>

    <!-- ─── 详情面板浮层（HTML，固定左上角，不随盘面缩放/平移） ─── -->

    <!-- 全局模式：悬停配对详情 -->
    <div
      v-if="hoveredPair"
      class="detail-panel detail-panel--global"
    >
      <div class="detail-title" :style="{ color: '#FFD700' }">
        {{ hoveredRelationMeta.label }}配对
      </div>
      <div class="detail-row">
        <span class="detail-key">{{ hoveredRelationMeta.label === '飞伏' ? '飞卦' : '源卦' }}：</span>
        <span class="detail-val" :style="{ color: getArrowColor(hoveredPair) }">
          {{ hoveredPair.sourceUnicode }} {{ hoveredPair.sourceName }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-key">{{ hoveredRelationMeta.label === '飞伏' ? '伏卦' : '目标卦' }}：</span>
        <span class="detail-val" style="color: #66CCFF">
          {{ hoveredPair.targetUnicode }} {{ hoveredPair.targetName }}
        </span>
      </div>
      <template v-if="hoveredRelationMeta.type === 'feifu'">
        <div v-if="hoveredPair.palace" class="detail-row detail-row--sm">
          <span class="detail-key">所属宫：</span>
          <span :style="{ color: hoveredPair.color || '#aaa' }">{{ hoveredPair.palace }}</span>
        </div>
        <div v-if="hoveredPair.shiyingType" class="detail-row detail-row--sm">
          <span class="detail-key">世位：</span>
          <span style="color: #F5E8C8">{{ hoveredPair.shiyingType }}</span>
        </div>
      </template>
      <template v-else>
        <div class="detail-row detail-row--sm">
          <span class="detail-key">源卦：</span>
          <span :style="{ color: hoveredPair.color || '#aaa' }">{{ hoveredPair.palace || '—' }}宫</span>
          <span class="detail-sep">世</span>
          <span style="color: #F5E8C8">{{ hoveredPair.shiyingType || '—' }}</span>
        </div>
        <div class="detail-row detail-row--sm">
          <span class="detail-key">目标卦：</span>
          <span style="color: #66CCFF">{{ hoveredPair.targetPalace || '—' }}宫</span>
          <span class="detail-sep">世</span>
          <span style="color: #A29BFE">{{ hoveredPair.targetShiyingType || '—' }}</span>
        </div>
      </template>
      <div class="detail-desc">{{ hoveredRelationMeta.description }}</div>
    </div>

    <!-- 聚焦模式：焦点卦汇总 -->
    <div
      v-else-if="focusSummary"
      class="detail-panel detail-panel--focus"
      :class="{ 'detail-panel--preview': !focusSummary.isPinned }"
    >
      <div class="detail-title" :style="{ color: '#9B59B6' }">
        <span class="detail-tag" :class="{ 'detail-tag--pinned': focusSummary.isPinned }">
          {{ focusSummary.isPinned ? '已固定' : '预览' }}
        </span>
        <span :style="{ color: focusSummary.sourceColor || '#E5D0FF', marginLeft: '4px' }">
          {{ focusSummary.sourceUnicode }} {{ focusSummary.sourceName }}
        </span>
      </div>
      <div class="detail-row detail-row--sm">
        <span v-if="focusSummary.sourcePalace" style="color: #888">{{ focusSummary.sourcePalace }}宫</span>
        <span v-if="focusSummary.sourceShiying" style="color: #F5E8C8; margin-left: 8px">
          {{ focusSummary.sourceShiying }}
        </span>
        <span class="detail-sep">动爻：</span>
        <span style="color: #9B59B6">{{ focusSummary.movingText }}</span>
      </div>
      <div
        v-for="item in focusSummary.items"
        :key="`fs-${item.type}`"
        class="detail-row detail-relation"
      >
        <span class="detail-swatch" :style="{ backgroundColor: RELATION_COLORS[item.type] }"></span>
        <span class="detail-relation-label" :style="{ color: RELATION_COLORS[item.type] }">
          {{ RELATION_METAS[item.type].label }}
        </span>
        <span class="detail-relation-target">
          → {{ item.targetUnicode }} {{ item.targetName }}
          <span v-if="item.targetPalace" style="color: #888; font-size: 10px; margin-left: 6px">
            ({{ item.targetPalace }}宫)
          </span>
        </span>
      </div>
      <div class="detail-hint">
        {{ focusSummary.isPinned ? '再次点击该卦可取消固定' : '点击此卦可固定为焦点' }}
      </div>
    </div>
    <!-- ─── 通用 tooltip（Teleport 到 body，脱离 sidebar 的 overflow 裁剪） ─── -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        class="global-tooltip"
        :style="{
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          borderColor: tooltip.color,
        }"
      >
        {{ tooltip.text }}
      </div>
    </Teleport>
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

/* ─── info-tip：已废弃，改为 JS 驱动的 Teleport tooltip（见文件末尾非 scoped 块） ─── */

/* ─── 聚焦面板 ─── */
.focus-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background-color: rgba(155, 89, 182, 0.08);
  border: 1px solid #9B59B6;
  border-radius: 4px;
}
.focus-symbol {
  font-size: 22px;
  color: #9B59B6;
  line-height: 1;
}
.focus-name {
  color: #E5D0FF;
  font-size: 13px;
  font-weight: bold;
  flex: 1;
}
.focus-clear {
  margin-left: auto;
  padding: 2px 6px;
  font-size: 10px;
}
.focus-hint {
  padding: 6px 8px;
  border: 1px dashed #444;
  border-radius: 4px;
  color: #666;
  font-size: 11px;
  text-align: center;
}
.focus-hint--warn {
  border-color: #9B59B6;
  color: #9B59B6;
  margin-top: 4px;
}

/* ─── 详情面板（HTML 浮层，屏幕坐标固定右上） ─── */
.detail-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 300px;
  padding: 12px 14px;
  background-color: rgba(0, 0, 0, 0.85);
  border-radius: 8px;
  color: #F5E8C8;
  font-size: 12px;
  line-height: 1.5;
  pointer-events: none;  /* 纯展示，不吃鼠标事件 */
  z-index: 10;
}
.detail-panel--global {
  border: 1px solid #FFD700;
}
.detail-panel--focus {
  border: 1px solid #9B59B6;
}
.detail-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 6px;
}
.detail-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
}
.detail-row--sm {
  font-size: 11px;
  color: #aaa;
}
.detail-key { color: #888; }
.detail-val { font-weight: bold; }
.detail-sep { color: #666; margin-left: 8px; }
.detail-desc {
  margin-top: 6px;
  color: #888;
  font-size: 10px;
  font-style: italic;
}
.detail-relation {
  margin-top: 2px;
  font-size: 12px;
}
.detail-swatch {
  display: inline-block;
  width: 8px;
  height: 8px;
  flex-shrink: 0;
}
.detail-relation-label {
  font-weight: bold;
  min-width: 32px;
}
.detail-relation-target {
  color: #F5E8C8;
}
.detail-panel--preview {
  border-style: dashed;
  opacity: 0.9;
}
.detail-tag {
  display: inline-block;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid #9B59B6;
  color: #9B59B6;
  background-color: rgba(155, 89, 182, 0.08);
  vertical-align: middle;
}
.detail-tag--pinned {
  background-color: #9B59B6;
  color: #fff;
}
.detail-hint {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed #333;
  color: #666;
  font-size: 10px;
  text-align: center;
}
</style>

<!--
  非 scoped 样式块：承载 Teleport 到 <body> 的 .global-tooltip。
  scoped 样式的 data-v hash 无法作用于 body 内的元素，故此块必须非 scoped。
-->
<style>
.global-tooltip {
  position: fixed;
  transform: translateY(-50%);
  max-width: 280px;
  padding: 8px 10px;
  background-color: rgba(20, 15, 30, 0.96);
  border: 1px solid #F1C40F;
  border-radius: 4px;
  color: #E8E0D0;
  font-size: 11px;
  line-height: 1.55;
  letter-spacing: 0.3px;
  text-align: left;
  white-space: normal;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  font-family: inherit;
}
</style>
