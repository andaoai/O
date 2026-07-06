<script setup lang="ts">
import { useViewportShortcuts } from '@/composables/useViewportShortcuts'
import type { UseViewportReturn } from '@/composables/useViewport'
import PanelSection from './PanelSection.vue'
import ControlButton from './ControlButton.vue'

/**
 * 视口控制面板：缩放 / 平移 / 旋转
 *
 * ════════════════════════════════════════════════════════════════
 *  接收 viewport 对象（useViewport 返回值）：所有状态和动作已封装好，
 *  面板只负责渲染 UI 和绑定 click。父组件通过 useViewport 拥有状态。
 *
 *  子模块（2 个折叠区）：
 *    · viewport      缩放 + 平移
 *    · rotation      旋转方向 + 旋转角度
 *
 *  合并原因：旧面板 zoom/offset 分两块 + rotation 分两块 = 4 个 header 太碎。
 * ════════════════════════════════════════════════════════════════
 */

interface Props {
  viewport: UseViewportReturn
  collapsed: Record<'viewport' | 'rotation', boolean>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'toggle-section': [key: 'viewport' | 'rotation']
}>()

// 视口快捷键（键盘）
useViewportShortcuts({
  zoomIn: props.viewport.zoomIn,
  zoomOut: props.viewport.zoomOut,
  resetZoom: props.viewport.resetZoom,
  setZoom: props.viewport.setZoom,
  moveUp: props.viewport.moveUp,
  moveDown: props.viewport.moveDown,
  moveLeft: props.viewport.moveLeft,
  moveRight: props.viewport.moveRight,
  resetOffset: props.viewport.resetOffset,
  toggleRotationDirection: props.viewport.toggleRotationDirection,
  rotateLeft: props.viewport.rotateLeft,
  rotateRight: props.viewport.rotateRight,
  resetRotationAngle: props.viewport.resetRotationAngle
})
</script>

<template>
  <!-- ═══════ 缩放 + 平移 ═══════ -->
  <PanelSection
    title="缩放 · 平移"
    :collapsed="collapsed.viewport"
    @toggle="emit('toggle-section', 'viewport')"
  >
    <!-- 缩放显示 -->
    <div class="numeric-display">{{ Math.round(viewport.zoom.value * 100) }}%</div>

    <!-- 缩放按钮 -->
    <div class="zoom-row">
      <ControlButton key-hint="-" title="- 键" @click="viewport.zoomOut()">−</ControlButton>
      <ControlButton key-hint="0" title="0 键" @click="viewport.resetZoom()">重置</ControlButton>
      <ControlButton key-hint="+" title="+ 键" @click="viewport.zoomIn()">+</ControlButton>
    </div>

    <!-- 缩放预设 -->
    <div class="zoom-presets">
      <ControlButton size="xs" key-hint="5" @click="viewport.setZoom(0.5)">50%</ControlButton>
      <ControlButton size="xs" key-hint="6" @click="viewport.setZoom(0.75)">75%</ControlButton>
      <ControlButton size="xs" key-hint="7" @click="viewport.setZoom(1)">100%</ControlButton>
      <ControlButton size="xs" key-hint="8" @click="viewport.setZoom(1.25)">125%</ControlButton>
      <ControlButton size="xs" key-hint="9" @click="viewport.setZoom(1.5)">150%</ControlButton>
    </div>

    <div class="section-divider" />

    <!-- 平移状态 -->
    <div class="numeric-display small">
      X: {{ viewport.offsetX.value }} &nbsp; Y: {{ viewport.offsetY.value }}
    </div>

    <!-- 平移十字方向键 -->
    <div class="offset-cross">
      <div class="offset-row">
        <ControlButton key-hint="↑" title="方向键↑" @click="viewport.moveUp()">↑</ControlButton>
      </div>
      <div class="offset-row">
        <ControlButton key-hint="←" title="方向键←" @click="viewport.moveLeft()">←</ControlButton>
        <ControlButton key-hint="Del" title="Delete/Backspace" @click="viewport.resetOffset()">重置</ControlButton>
        <ControlButton key-hint="→" title="方向键→" @click="viewport.moveRight()">→</ControlButton>
      </div>
      <div class="offset-row">
        <ControlButton key-hint="↓" title="方向键↓" @click="viewport.moveDown()">↓</ControlButton>
      </div>
    </div>
  </PanelSection>

  <!-- ═══════ 旋转 ═══════ -->
  <PanelSection
    title="旋转"
    :collapsed="collapsed.rotation"
    @toggle="emit('toggle-section', 'rotation')"
  >
    <!-- 方向切换 -->
    <div class="numeric-display small">
      方向：{{ viewport.rotationDirection.value === 'clockwise' ? '顺时针' : '逆时针' }}
    </div>
    <div class="rotation-row">
      <ControlButton
        :active="viewport.rotationDirection.value === 'clockwise'"
        title="顺时针"
        @click="viewport.setRotationDirection('clockwise')"
      >
        ↻ 顺时针
      </ControlButton>
      <ControlButton
        :active="viewport.rotationDirection.value === 'counterclockwise'"
        key-hint="C"
        title="逆时针（C 切换）"
        @click="viewport.setRotationDirection('counterclockwise')"
      >
        ↺ 逆时针
      </ControlButton>
    </div>

    <div class="section-divider" />

    <!-- 角度 -->
    <div class="numeric-display small">角度：{{ viewport.rotationAngle.value }}°</div>
    <div class="rotation-row">
      <ControlButton key-hint="Q" title="左转 90° (Q 键)" @click="viewport.rotateLeft()">
        ↺ -90°
      </ControlButton>
      <ControlButton variant="highlight" key-hint="W" title="重置 (W 键)" @click="viewport.resetRotationAngle()">
        重置
      </ControlButton>
      <ControlButton key-hint="E" title="右转 90° (E 键)" @click="viewport.rotateRight()">
        ↻ +90°
      </ControlButton>
    </div>
  </PanelSection>
</template>

<style scoped>
.numeric-display {
  font-size: 14px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 6px;
  text-align: center;
  font-family: 'Courier New', monospace;
}
.numeric-display.small {
  font-size: 11px;
}

.zoom-row,
.rotation-row {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}
.zoom-row > *,
.rotation-row > * {
  flex: 1;
}

.zoom-presets {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
}

.section-divider {
  border-top: 1px solid #222;
  margin: 8px 0 8px;
}

.offset-cross {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.offset-row {
  display: flex;
  gap: 3px;
  justify-content: center;
}
.offset-row > * {
  min-width: 40px;
}
</style>
