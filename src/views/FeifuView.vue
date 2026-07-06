<script setup lang="ts">
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'
import FeifuArrowOverlay from '../components/feifu/FeifuArrowOverlay.vue'
import Control from '../components/Control.vue'
import { useUrlTime } from '@/composables/useUrlTime'
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

const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

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
    <a :href="withBase('/compass/')" class="back-link">罗盘列表</a>

    <!-- 布局切换按钮 -->
    <div class="layout-toggle">
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

    <!-- 宫位筛选按钮组（仅后天八卦序下显示） -->
    <div v-if="layout === 'houtian'" class="palace-bar">
      <button
        class="filter-btn"
        :class="{ active: palaceFilter.length === 0 }"
        :style="{ '--btn-color': '#FFD700' }"
        @click="palaceFilter = []"
      >
        全部宫
      </button>
      <button
        v-for="p in PALACES"
        :key="p.palace"
        class="filter-btn"
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

    <!-- 世位筛选按钮组 -->
    <div class="filter-bar">
      <button
        v-for="opt in shiyingOptions"
        :key="opt.type"
        class="filter-btn"
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

    <svg class="compass-svg" viewBox="0 0 1200 1200" preserveAspectRatio="xMidYMid meet">
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">
        <FeifuArrowOverlay
          :inner-radius="500"
          :rotation-direction="rotationDirection"
          :shiying-filter="selectedShiying"
          :palace-filter="palaceFilter"
          :layout="layout"
        />
      </g>
    </svg>

    <Control
      v-model="controlledTime"
      v-model:zoom="zoomLevel"
      v-model:offsetX="offsetX"
      v-model:offsetY="offsetY"
      v-model:rotation-direction="rotationDirection"
      v-model:rotation-angle="rotationAngle"
    />
  </div>
</template>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
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

.back-link {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  color: #aaa;
  text-decoration: none;
  font-size: 14px;
  padding: 6px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.5);
}

.back-link:hover {
  color: #fff;
  border-color: #888;
}

/* 布局切换（左上角） */
.layout-toggle {
  position: absolute;
  top: 56px;
  left: 16px;
  z-index: 10;
  display: flex;
  gap: 6px;
}

/* 宫位筛选（布局下方） */
.palace-bar {
  position: absolute;
  top: 96px;
  left: 16px;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-width: calc(100vw - 32px);
}

/* 世位筛选（右上角） */
.filter-bar {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: calc(100vw - 32px);
  justify-content: flex-end;
}

.filter-btn {
  font-size: 13px;
  padding: 6px 12px;
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid #444;
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  min-width: 48px;
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