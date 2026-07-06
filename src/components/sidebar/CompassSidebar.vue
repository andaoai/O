<script setup lang="ts">
import { computed } from 'vue'
import { useCompassContext } from '@/composables/useCompassContext'
import { useSidebarLayout } from '@/composables/useSidebarLayout'
import SidebarHeader from './SidebarHeader.vue'
import SidebarToggleHandle from './SidebarToggleHandle.vue'
import TimePanel from './TimePanel.vue'
import ViewportPanel from './ViewportPanel.vue'

// 满足 vue/multi-word-component-names
defineOptions({ name: 'CompassSidebar' })

/**
 * 罗盘左侧嵌入式 Sidebar
 *
 * ════════════════════════════════════════════════════════════════
 *  单点挂载：CompassLayout 里挂一次，所有 /compass/* 页面共享。
 *  View 层通过 provideCompassContext(time, viewport) 注册全局上下文，
 *  Sidebar 通过 useCompassContext 读取。
 *
 *  View 专属工具通过 <Teleport to="#sidebar-view-tools"> 塞进"视图选项"区块。
 *  Teleport 目标常驻 DOM；section 外壳用 CSS `:has(:not(:empty))` 自动显隐。
 * ════════════════════════════════════════════════════════════════
 */

type SectionKey = 'view-tools' | 'time' | 'playback' | 'step' | 'input' | 'viewport' | 'rotation'
const SECTION_KEYS = ['view-tools', 'time', 'playback', 'step', 'input', 'viewport', 'rotation'] as const

const ctx = useCompassContext()

// 派生：便于模板直接使用（避免嵌套 ref 解包问题）
const currentTime = computed<Date | null>(() => ctx.value?.time.value ?? null)
const currentViewport = computed(() => ctx.value?.viewport ?? null)

const { expanded, expand, collapse, collapsed, toggleSection } = useSidebarLayout<SectionKey>({
  sectionKeys: SECTION_KEYS
})

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

// 时间事件转发到 View 侧的 ref（若无 View 挂载则静默）
const onTimeUpdate = (v: Date) => {
  if (ctx.value) ctx.value.time.value = v
}
const onUserTimeChange = (v: Date) => {
  ctx.value?.onUserTimeChange?.(v)
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': !expanded }" aria-label="罗盘控制侧栏">
    <SidebarHeader @collapse="collapse" />

    <div class="sidebar__scroll">
      <!--
        视图选项 section：Teleport 目标 #sidebar-view-tools 常驻 DOM。
        section 有 .section--auto-hide 修饰：当 Teleport 目标为空时整块隐藏（CSS :has(:empty)）
      -->
      <div class="section section--auto-hide">
        <div class="section__header" @click="toggleSection('view-tools')">
          <span class="section__title section__title--gold">视图选项</span>
          <span class="section__toggle">{{ collapsed['view-tools'] ? '▸' : '▾' }}</span>
        </div>
        <div
          class="section__content"
          :class="{ 'section__content--collapsed': collapsed['view-tools'] }"
        >
          <div id="sidebar-view-tools" class="view-tools-slot"></div>
        </div>
      </div>

      <!-- 时间/视口面板：需要 View 挂载后才有意义 -->
      <template v-if="currentTime && currentViewport">
        <TimePanel
          :time="currentTime"
          :collapsed="timeCollapsed"
          @update:time="onTimeUpdate"
          @user-time-change="onUserTimeChange"
          @toggle-section="toggleSection"
        />

        <ViewportPanel
          :viewport="currentViewport"
          :collapsed="viewportCollapsed"
          @toggle-section="toggleSection"
        />
      </template>
    </div>
  </aside>

  <SidebarToggleHandle v-if="!expanded" @expand="expand" />
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  background: #0a0a0a;
  border-right: 1px solid #1f1f1f;
  color: #fff;
  font-family: 'Arial', sans-serif;
  z-index: 100;
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.35);
  user-select: none;
}

.sidebar--collapsed {
  transform: translateX(-100%);
  box-shadow: none;
}

.sidebar__scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}
.sidebar__scroll::-webkit-scrollbar {
  display: none;
}

/* 视图选项 section 结构（内联版；与 SidebarSection 保持一致） */
.section {
  border-bottom: 1px solid #1c1c1c;
}
.section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.section__header:hover {
  background: rgba(255, 255, 255, 0.03);
}
.section__title {
  font-size: 11px;
  color: #bbb;
  font-weight: bold;
  letter-spacing: 1px;
}
.section__title--gold {
  color: #ffcc00;
}
.section__toggle {
  font-size: 10px;
  color: #666;
}
.section__content {
  padding: 4px 12px 12px;
  overflow: hidden;
  max-height: 800px;
  transition: max-height 0.2s ease, padding 0.2s ease;
}
.section__content--collapsed {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* 关键：当 Teleport 目标（子节点）为空时，整块 section 自动隐藏 */
.section--auto-hide:has(.view-tools-slot:empty) {
  display: none;
}

.view-tools-slot {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
