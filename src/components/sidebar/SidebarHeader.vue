<script setup lang="ts">
import { withBase } from 'vitepress'
import { useCompassMeta } from '@/composables/useCompassMeta'

/**
 * 侧栏顶部：返回入口 + 罗盘名
 *
 * 收起 / 展开由左中常驻悬浮把手 SidebarToggleHandle 承担，
 * 这里不再重复放置收起按钮，避免"两个按钮两处位置"的割裂感。
 */

const { meta } = useCompassMeta()
</script>

<template>
  <header class="s-header">
    <div class="s-header__top">
      <a :href="withBase('/compass/')" class="back-link" title="返回罗盘列表">
        <span class="back-arrow">←</span>
        <span class="back-text">罗盘列表</span>
      </a>
    </div>
    <div v-if="meta" class="s-header__title">
      <div class="compass-name">{{ meta.name }}</div>
      <div v-if="meta.category" class="compass-cat">{{ meta.category }}</div>
    </div>
  </header>
</template>

<style scoped>
.s-header {
  padding: 12px 14px 10px;
  border-bottom: 1px solid #1f1f1f;
  background: linear-gradient(180deg, rgba(255, 204, 0, 0.04), transparent);
}

.s-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #aaa;
  text-decoration: none;
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid #333;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.back-link:hover {
  color: #ffcc00;
  border-color: #ffcc00;
  background: rgba(255, 204, 0, 0.08);
}
.back-arrow {
  font-size: 13px;
}

.s-header__title {
  margin-top: 10px;
}

.compass-name {
  font-size: 15px;
  font-weight: bold;
  color: #ffcc00;
  letter-spacing: 1px;
  line-height: 1.3;
}

.compass-cat {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
  letter-spacing: 2px;
}
</style>
