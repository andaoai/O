<script setup lang="ts">
import { ref, computed } from 'vue'
import FeifuArrowOverlay from '../components/feifu/FeifuArrowOverlay.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'
import type { ShiyingType } from '@/data/rings/jingFangEightPalaces'
import { PALACES } from '@/data/rings/jingFangEightPalaces'
import type { FeifuLayout } from '@/utils/feifu'

/**
 * 飞伏图盘
 *
 * 64 条箭头从各卦指向 8 个纯卦（伏卦端），呈放射状收敛。
 * 飞者显、伏者隐，阴阳互藏其宅。
 *
 * ✨ 纯静态易学可视化
 */
const { controlledTime } = useUrlTime()

// 视口控制（单一 composable 打包）
const viewport = useViewport()
// 解构顶层 refs 给模板使用
const { zoom, offsetX, offsetY, rotationDirection, rotationAngle } = viewport

// Alt + 拖拽平移
const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })

provideCompassContext({ time: controlledTime, viewport })

// 世位筛选：默认全部（空数组表示不筛）
const selectedShiying = ref<ShiyingType[]>([])

// 卦象排列方式：后天八卦（京房八宫序）/ 先天八卦（伏羲圆图序）
const layout = ref<FeifuLayout>('houtian')

// 宫位筛选：空数组 = 全部（支持多选，仅在后天八卦序下生效）
const palaceFilter = ref<string[]>([])

/** 各世位选项 */
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

/** 当前选中的类型（用于 UI 高亮）；'all' 表示无筛选 */
const activeType = computed<ShiyingType | 'all'>(() => {
  if (selectedShiying.value.length === 0) return 'all'
  if (selectedShiying.value.length === 1) return selectedShiying.value[0]!
  return 'all'
})

function selectShiying(type: ShiyingType | 'all') {
  if (type === 'all') {
    selectedShiying.value = []
  } else {
    if (selectedShiying.value.length === 1 && selectedShiying.value[0] === type) {
      selectedShiying.value = []
    } else {
      selectedShiying.value = [type]
    }
  }
}

function selectPalace(palace: string) {
  // 已选中 → 取消（多选下的移除）；未选中 → 追加
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

      <div v-if="layout === 'houtian'" class="view-tool-group">
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
    </Teleport>

    <svg
      ref="svgRef"
      class="compass-svg"
      :class="{ 'alt-hover': isAltPressed && !isDragging, 'alt-dragging': isDragging }"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoom}) rotate(${rotationAngle})`">
        <FeifuArrowOverlay
          :inner-radius="500"
          :rotation-direction="rotationDirection"
          :shiying-filter="selectedShiying"
          :palace-filter="palaceFilter"
          :layout="layout"
        />
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
  /* SVG 元素填满容器，viewBox + preserveAspectRatio 自动等比居中，
     放大 / 平移时不再被短边正方形裁出黑边 */
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