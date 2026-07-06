<script setup lang="ts">
/**
 * 面板可折叠区块基元
 *
 * 替代旧 Control.vue 里 9 组重复的 `.module` + `.module-header` + `.module-content` 结构。
 * 折叠状态由父组件（Control）通过 useControlPanel 统一管理。
 */

interface Props {
  title: string
  collapsed: boolean
}

defineProps<Props>()

defineEmits<{ toggle: [] }>()
</script>

<template>
  <div class="section" :class="{ 'section--collapsed': collapsed }">
    <div class="section__header" @click="$emit('toggle')">
      <span class="section__title">{{ title }}</span>
      <span class="section__toggle">{{ collapsed ? '▶' : '▼' }}</span>
    </div>
    <div v-if="!collapsed" class="section__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.section {
  border-bottom: 1px solid #222;
  transition: background 0.2s;
}

.section:last-child {
  border-bottom: none;
}

.section--collapsed {
  background: #0a0a0a;
}

.section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.section__header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.section__title {
  font-size: 12px;
  color: #ccc;
  font-weight: bold;
}

.section__toggle {
  font-size: 10px;
  color: #888;
}

.section__content {
  padding: 8px 12px;
  border-top: 1px solid #222;
  animation: slideDown 0.25s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
