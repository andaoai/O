<script setup lang="ts">
/**
 * 侧栏统一按钮基元（取代 control/ControlButton）
 * 保持功能等价，样式适配竖栏窄宽度。
 */

interface Props {
  size?: 'xs' | 'sm' | 'md'
  variant?: 'default' | 'accent' | 'negative' | 'highlight'
  active?: boolean
  keyHint?: string
  title?: string
  type?: 'button' | 'submit'
}

withDefaults(defineProps<Props>(), {
  size: 'sm',
  variant: 'default',
  active: false,
  type: 'button'
})

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    :type="type"
    :title="title"
    class="sbtn"
    :class="[`sbtn--${size}`, `sbtn--${variant}`, { 'sbtn--active': active }]"
    @click="$emit('click', $event)"
  >
    <span class="sbtn__label"><slot /></span>
    <span v-if="keyHint" class="sbtn__hint">{{ keyHint }}</span>
  </button>
</template>

<style scoped>
.sbtn {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #ddd;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-family: inherit;
  line-height: 1.2;
  min-width: 0; /* 允许 grid 内部收缩 */
}

.sbtn:hover {
  background: #2a2a2a;
  border-color: #555;
  color: #fff;
}

/* 尺寸 */
.sbtn--xs {
  padding: 3px 2px;
  font-size: 9px;
}
.sbtn--sm {
  padding: 5px 4px;
  font-size: 10px;
}
.sbtn--md {
  padding: 7px 10px;
  font-size: 11px;
}

/* 变体 */
.sbtn--accent {
  color: #ffcc00;
}
.sbtn--negative {
  color: #ff6666;
}
.sbtn--highlight {
  background: #1f1f1f;
  border-color: #3a3a3a;
  color: #ffcc00;
}

.sbtn--active {
  background: #ffcc00;
  color: #000;
  border-color: #ffcc00;
}
.sbtn--active:hover {
  background: #ffcc00;
  border-color: #ffcc00;
  color: #000;
}

.sbtn__hint {
  font-size: 7px;
  color: #ffcc00;
  font-weight: bold;
  background: rgba(0, 0, 0, 0.35);
  padding: 1px 3px;
  border-radius: 2px;
  margin-top: 1px;
}
.sbtn--active .sbtn__hint {
  color: #000;
  background: rgba(255, 255, 255, 0.25);
}

.sbtn__label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}
</style>
