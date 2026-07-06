<script setup lang="ts">
import { computed } from 'vue'
import { formatEraDateShort, getDynastyInfo, getUniversalGanzhi } from '@/utils/eraCalendar'
import type { UseViewportReturn } from '@/composables/useViewport'
import { useControlPanel } from '@/composables/useControlPanel'
import TimePanel from './TimePanel.vue'
import ViewportPanel from './ViewportPanel.vue'

// 满足 vue/multi-word-component-names（旧文件文件名就是 Control.vue，此处保持向后兼容）
defineOptions({ name: 'ControlPanel' })

/**
 * 罗盘控制面板（重构版 · 门面组件）
 *
 * ════════════════════════════════════════════════════════════════
 *  设计目标：
 *    · 精简 View 侧挂载 —— 从 6 v-model 降到 2 属性
 *    · 遵循项目时间驱动架构 —— 单向数据流、无内部时间副本
 *    · 领域拆分 —— 时间与视口彻底解耦，各自 composable + Panel
 *
 *  职责：
 *    · 拖拽外壳 / 折叠状态 / 位置持久化（useControlPanel）
 *    · 折叠态时的短日期显示
 *    · 分发时间与视口给两个 Panel 子组件
 *
 *  对外 API：
 *    <Control :time="controlledTime" :viewport="viewport"
 *             @update:time="v => controlledTime = v"
 *             @user-time-change="onUserTimeChange" />
 * ════════════════════════════════════════════════════════════════
 */

type SectionKey = 'time' | 'playback' | 'step' | 'input' | 'viewport' | 'rotation'
const SECTION_KEYS = ['time', 'playback', 'step', 'input', 'viewport', 'rotation'] as const

interface Props {
  time: Date
  viewport: UseViewportReturn
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:time': [value: Date]
  'user-time-change': [value: Date]
}>()

const { collapsed, allCollapsed, toggleSection, toggleAll, isDragging, handleMouseDown, panelStyle } =
  useControlPanel<SectionKey>({ sectionKeys: SECTION_KEYS })

// 折叠态短显示（顶栏）
const eraDateShort = computed(() => formatEraDateShort(props.time))
const universalGanzhi = computed(() => getUniversalGanzhi(props.time))
const dynastyInfo = computed(() => getDynastyInfo(props.time))

// TimePanel / ViewportPanel 各自需要的折叠子集
const timeCollapsed = computed(() => ({
  time: collapsed.value.time,
  playback: collapsed.value.playback,
  step: collapsed.value.step,
  input: collapsed.value.input
}))
const viewportCollapsed = computed(() => ({
  viewport: collapsed.value.viewport,
  rotation: collapsed.value.rotation
}))

const onTimeUpdate = (v: Date) => emit('update:time', v)
const onUserTimeChange = (v: Date) => emit('user-time-change', v)
</script>

<template>
  <div
    class="control"
    :class="{ dragging: isDragging }"
    :style="panelStyle"
    @mousedown="handleMouseDown"
  >
    <!-- 标题栏 ─────────────────────────────────────── -->
    <div class="control-header" :class="{ 'control-header--minimal': allCollapsed }">
      <h3 v-if="!allCollapsed" class="header__title">控制面板</h3>
      <div v-else class="header__mini-time">
        <span class="mini-date">{{ eraDateShort }}</span>
        <span class="mini-ganzhi">{{ universalGanzhi.year.full }}年</span>
        <span v-if="dynastyInfo" class="mini-dynasty" :style="{ color: dynastyInfo.color }">
          {{ dynastyInfo.name }}
        </span>
      </div>

      <button
        class="header__toggle-all"
        :title="allCollapsed ? '展开所有' : '折叠所有'"
        @click.stop="toggleAll"
      >
        {{ allCollapsed ? '⊕' : '⊖' }}
      </button>
    </div>

    <!-- 时间控制（4 个折叠区） -->
    <TimePanel
      :time="time"
      :collapsed="timeCollapsed"
      @update:time="onTimeUpdate"
      @user-time-change="onUserTimeChange"
      @toggle-section="toggleSection"
    />

    <!-- 视口控制（2 个折叠区） -->
    <ViewportPanel
      :viewport="viewport"
      :collapsed="viewportCollapsed"
      @toggle-section="toggleSection"
    />
  </div>
</template>

<style scoped>
.control {
  position: fixed;
  background: #000000;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-family: 'Arial', sans-serif;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
  z-index: 1000;
  transition: transform 0.1s ease;
  user-select: none;
  overflow: hidden;
}

.control.dragging {
  transform: scale(1.02);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.7);
  cursor: move;
}

/* 标题栏 */
.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #000000;
  border-bottom: 1px solid #333;
  cursor: move;
  transition: background 0.3s;
}

.header__title {
  margin: 0;
  font-size: 14px;
  font-weight: bold;
  color: #ffcc00;
}

.header__mini-time {
  flex: 1;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 13px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.mini-date { color: #00ff00; }
.mini-ganzhi { color: #ffcc00; }
.mini-dynasty { font-weight: bold; }

.header__toggle-all {
  width: 24px;
  height: 24px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.header__toggle-all:hover {
  background: #2a2a2a;
  border-color: #444;
  color: #fff;
}

/* 隐藏滚动条但保持滚动功能 */
.control::-webkit-scrollbar {
  display: none;
}

.control {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control {
    width: 220px !important;
    max-width: 90vw;
    right: 10px;
    top: 10px;
  }
}

@media (max-width: 480px) {
  .control {
    width: 200px !important;
    right: 5px;
    top: 5px;
  }

  .control-header {
    padding: 8px 10px;
  }
}
</style>
