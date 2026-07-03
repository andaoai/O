<script setup lang="ts">
/**
 * 罗盘一览（/compass/ 主页）
 *
 * ⚠️ 架构定位：本组件不是全屏罗盘 View，而是「站点主题下的内容区块」。
 *   - 由 docs/compass/index.md 用 `layout: page` 承载
 *   - 顶部导航、底部页脚由 VitePress 主题提供（可直接回 `/O/`）
 *   - 本组件只负责渲染 logo header + 罗盘卡片网格
 */
import { withBase } from 'vitepress'
import { compasses } from '@/compasses'
import logoUrl from '@/assets/andaoai-logo-dark.svg'
</script>

<template>
  <div class="compass-index">
    <header class="compass-index-header">
      <img :src="logoUrl" alt="乙巳观 · AnDaoAi" class="compass-index-logo" />
      <p class="compass-index-subtitle">道由天观 · 罗盘一览</p>
    </header>

    <div class="compass-grid">
      <a
        v-for="c in compasses"
        :key="c.id"
        :href="withBase(`/compass/${c.id}`)"
        class="compass-card"
      >
        <span v-if="c.category" class="card-category">{{ c.category }}</span>
        <h2 class="card-name">{{ c.name }}</h2>
        <p class="card-desc">{{ c.description }}</p>
      </a>
    </div>
  </div>
</template>

<style scoped>
.compass-index {
  max-width: 1100px;
  margin: 0 auto;
  padding: 48px 24px 96px;
  box-sizing: border-box;
}

.compass-index-header {
  text-align: center;
  margin-bottom: 48px;
}

.compass-index-logo {
  width: 140px;
  height: 140px;
  display: block;
  margin: 0 auto;
  transition: transform 0.4s ease;
}

.compass-index-logo:hover {
  transform: rotate(2deg) scale(1.02);
}

.compass-index-subtitle {
  margin-top: 12px;
  color: var(--vp-c-text-2);
  font-size: 15px;
  letter-spacing: 0.1em;
}

.compass-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.compass-card {
  display: block;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 24px;
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.2s,
    transform 0.2s,
    background-color 0.2s;
}

.compass-card:hover {
  border-color: var(--ysg-gold-600, #c8a2e8);
  background-color: var(--vp-c-bg-elv);
  transform: translateY(-2px);
}

.card-category {
  display: inline-block;
  font-size: 12px;
  color: var(--ysg-gold-600, #c8a2e8);
  border: 1px solid var(--ysg-gold-600, #c8a2e8);
  border-radius: 4px;
  padding: 2px 8px;
  margin-bottom: 12px;
}

.card-name {
  font-size: 20px;
  font-weight: 400;
  color: var(--vp-c-text-1);
  margin: 0 0 10px;
  padding: 0;
  border: none;
}

.card-desc {
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0;
}
</style>
