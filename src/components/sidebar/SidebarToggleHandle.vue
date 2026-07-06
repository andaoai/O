<script setup lang="ts">
/**
 * 折叠态左中悬浮把手：40 × 80 的胶囊按钮，点击展开侧栏
 */

defineEmits<{ expand: [] }>()
</script>

<template>
  <button class="handle" title="展开侧栏 (Esc 收起)" @click="$emit('expand')">
    <span class="arrow">»</span>
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
  transition: background 0.2s, border-color 0.2s, color 0.2s, width 0.2s;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.4);
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
