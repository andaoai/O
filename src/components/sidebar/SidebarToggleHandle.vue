<script setup lang="ts">
/**
 * 侧栏展开 / 收起常驻悬浮把手
 *
 * ─ 桌面端（> 768px）：左中垂直胶囊
 *   · 折叠 → left: 0，显示 »
 *   · 展开 → left: 260px（贴侧栏右缘），显示 «
 *
 * ─ 移动端（≤ 768px）：底部中央横向胶囊
 *   · 折叠 → bottom: 0，显示 ▲
 *   · 展开 → bottom: 60vh（贴面板顶缘），显示 ▼
 *
 * 展开 / 收起始终是同一按钮、同一视觉锚点，仅方向 / 图标切换。
 */

interface Props {
  expanded: boolean
  isMobile?: boolean
}
withDefaults(defineProps<Props>(), { isMobile: false })
defineEmits<{ toggle: [] }>()

/** 图标：移动端上下，桌面端左右 */
function iconFor(expanded: boolean, isMobile: boolean): string {
  if (isMobile) return expanded ? '▼' : '▲'
  return expanded ? '«' : '»'
}
</script>

<template>
  <button
    class="handle"
    :class="{ 'handle--expanded': expanded, 'handle--mobile': isMobile }"
    :title="expanded ? '收起面板 (Esc)' : '展开面板'"
    @click="$emit('toggle')"
  >
    <span class="arrow">{{ iconFor(expanded, isMobile) }}</span>
  </button>
</template>

<style scoped>
/* ═══════ 桌面端：左中垂直胶囊 ═══════ */
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
  transition:
    left 0.25s ease,
    bottom 0.25s ease,
    background 0.2s,
    border-color 0.2s,
    color 0.2s,
    width 0.2s,
    height 0.2s;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.4);
}

.handle--expanded {
  left: 260px;
}

.handle:hover {
  background: rgba(255, 204, 0, 0.15);
  border-color: #ffcc00;
  color: #fff;
}
.handle:not(.handle--mobile):hover {
  width: 34px;
}

.arrow {
  font-weight: bold;
  line-height: 1;
}

/* ═══════ 移动端：底部中央横向胶囊 ═══════
   与 CompassSidebar 的 .sidebar--mobile height (60vh) + useMediaQuery.MOBILE_MEDIA 保持同步 */
.handle--mobile {
  top: auto;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 72px;
  height: 28px;
  border: 1px solid #333;
  border-bottom: none;
  border-radius: 0;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.4);
}

.handle--mobile.handle--expanded {
  left: 50%;
  bottom: 60vh;
}

.handle--mobile:hover {
  height: 34px;
}
</style>
