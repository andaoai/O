<script setup lang="ts">
/**
 * 侧栏左中常驻悬浮把手：28 × 72 的胶囊按钮，点击切换展开 / 折叠
 *
 * ─ 折叠时：贴在视口左边缘（left: 0），显示 »
 * ─ 展开时：贴在侧栏右边缘（left: 260px），显示 «
 *
 * 两种状态共用同一个视觉位置（垂直居中），保证「展开 / 收起」是同一个按钮、同一个位置。
 */

interface Props {
  expanded: boolean
}
defineProps<Props>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    class="handle"
    :class="{ 'handle--expanded': expanded }"
    :title="expanded ? '收起侧栏 (Esc)' : '展开侧栏'"
    @click="$emit('toggle')"
  >
    <span class="arrow">{{ expanded ? '«' : '»' }}</span>
  </button>
</template>

<style scoped>
.handle {
  position: fixed;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 28px;
  height: 72px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid #333;
  border-left: none;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  color: #ffcc00;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.25s ease, background 0.2s, border-color 0.2s, color 0.2s, width 0.2s;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.4);
}

/* 展开时移动到侧栏右缘。侧栏宽度 260px，与 CompassSidebar 里的 .sidebar width 保持一致 */
.handle--expanded {
  left: 260px;
}

.handle:hover {
  background: rgba(255, 204, 0, 0.15);
  border-color: #ffcc00;
  color: #fff;
  width: 34px;
}

.arrow {
  font-weight: bold;
  line-height: 1;
}
</style>
