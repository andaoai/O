<script setup lang="ts">
/**
 * 罗盘全屏 Layout
 *
 * 用于所有 /compass/* 页面。
 * 隐藏 VitePress 默认的 nav/sidebar/aside/footer/文档主体，只渲染 slot。
 * 页面自身撑满 100vw × 100vh，交由罗盘 View 组件填充。
 *
 * frontmatter 声明：
 *   layout: compass    ← 指向本组件
 *
 * 罗盘 md 里的推荐结构：
 *   ---
 *   layout: compass
 *   ---
 *   <ClientOnly>
 *     <AstronomyView />
 *   </ClientOnly>
 */
</script>

<template>
  <div class="compass-layout">
    <Content />
  </div>
</template>

<style>
/* 全局强制：罗盘页整个铺满视口，覆盖 VitePress 默认的 padding / max-width */
html:has(.compass-layout),
body:has(.compass-layout) {
  margin: 0;
  padding: 0;
  height: 100vh;
  overflow: hidden;
  background-color: black;
}

.compass-layout {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background-color: black;
  z-index: 1;
}

.compass-layout :deep(> *) {
  width: 100%;
  height: 100%;
}
</style>
