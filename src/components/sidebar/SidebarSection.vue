<script setup lang="ts">
/**
 * 侧栏可折叠 section（取代 control/PanelSection）
 * 竖栏版：header 更紧凑，内容默认无左右 padding，由子组件自行控制。
 */

interface Props {
  title: string
  collapsed?: boolean
  /** 强调色（可选，如 View 工具区用金色标题） */
  accent?: 'gold' | 'default'
  /** 是否隐藏（供空 slot 时自动隐藏） */
  hidden?: boolean
}

withDefaults(defineProps<Props>(), {
  collapsed: false,
  accent: 'default',
  hidden: false
})

defineEmits<{ toggle: [] }>()
</script>

<template>
  <div v-if="!hidden" class="section" :class="{ 'section--collapsed': collapsed }">
    <div class="section__header" @click="$emit('toggle')">
      <span class="section__title" :class="`section__title--${accent}`">
        {{ title }}
      </span>
      <span class="section__toggle">{{ collapsed ? '▸' : '▾' }}</span>
    </div>
    <div v-if="!collapsed" class="section__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.section {
  border-bottom: 1px solid #1c1c1c;
}
.section:last-child {
  border-bottom: none;
}

.section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
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
  animation: sectionSlide 0.2s ease;
}

@keyframes sectionSlide {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
