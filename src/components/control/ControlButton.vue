<script setup lang="ts">
/**
 * 控制面板统一按钮基元
 *
 * 替代旧 Control.vue 里 8 种散落按钮样式：
 *   .step-btn / .zoom-btn / .offset-btn / .rotation-btn / .rotation-angle-btn
 *   .header-btn / .control-btn / .preset-btn
 * 通过 size × variant 组合表达所有需求，样式集中在这里。
 */

interface Props {
  /** 尺寸预设 */
  size?: 'xs' | 'sm' | 'md'
  /** 视觉变体：default 灰底、accent 金字（月/年）、negative 红字（后退）、danger 红边、highlight 金底 */
  variant?: 'default' | 'accent' | 'negative' | 'highlight'
  /** active 态（黄底黑字） */
  active?: boolean
  /** 快捷键提示（右下角） */
  keyHint?: string
  /** button HTML title */
  title?: string
  /** button 类型 */
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
    class="cbtn"
    :class="[`cbtn--${size}`, `cbtn--${variant}`, { 'cbtn--active': active }]"
    @click="$emit('click', $event)"
  >
    <span class="cbtn__label"><slot /></span>
    <span v-if="keyHint" class="cbtn__hint">{{ keyHint }}</span>
  </button>
</template>

<style scoped>
.cbtn {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-family: inherit;
  line-height: 1.2;
}

.cbtn:hover {
  background: #2a2a2a;
  border-color: #444;
}

/* ─── 尺寸 ─── */
.cbtn--xs {
  padding: 3px 2px;
  font-size: 8px;
}
.cbtn--sm {
  padding: 4px 6px;
  font-size: 10px;
}
.cbtn--md {
  padding: 6px 10px;
  font-size: 11px;
}

/* ─── 变体 ─── */
.cbtn--accent {
  background: #2a2a2a;
  border-color: #444;
  color: #ffcc00;
}
.cbtn--negative {
  color: #ff6666;
}
.cbtn--highlight {
  background: #1f1f1f;
  border-color: #3a3a3a;
  color: #ffcc00;
}

.cbtn--active {
  background: #ffcc00;
  color: #000;
  border-color: #ffcc00;
}
.cbtn--active:hover {
  background: #ffcc00;
  border-color: #ffcc00;
}

/* ─── 快捷键提示 ─── */
.cbtn__hint {
  font-size: 7px;
  color: #ffcc00;
  font-weight: bold;
  background: rgba(0, 0, 0, 0.35);
  padding: 1px 2px;
  border-radius: 2px;
  margin-top: 1px;
}
.cbtn--active .cbtn__hint {
  color: #000;
  background: rgba(255, 255, 255, 0.25);
}

.cbtn__label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
</style>
