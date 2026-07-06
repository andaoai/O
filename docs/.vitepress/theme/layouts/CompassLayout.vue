<script setup lang="ts">
import CompassSidebar from '@/components/sidebar/CompassSidebar.vue'

/**
 * 罗盘全屏 Layout
 *
 * 用于所有 /compass/* 页面。
 * 隐藏 VitePress 默认的 nav/sidebar/aside/footer/文档主体，只渲染 slot。
 * 页面自身撑满 100vw × 100vh，交由罗盘 View 组件填充。
 *
 * ═══════════════════════════════════════════════════════════════
 *  ✨ 布局：左侧嵌入 CompassSidebar + 右侧罗盘容器（flex）
 *     · Sidebar 挂载点唯一，跨 9 个 View 共享
 *     · View 层通过 provideCompassContext 暴露 time/viewport 给 Sidebar
 *     · 侧栏折叠时通过 transform: translateX(-100%) 移出，罗盘容器 flex:1 撑满
 * ═══════════════════════════════════════════════════════════════
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
    <CompassSidebar />
    <div class="compass-layout__content">
      <Content />
    </div>
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

/*
 * 布局策略：覆盖式（Sidebar 悬浮在罗盘上层）
 *   · 罗盘容器铺满整个视口，视觉中心 = 视口中心
 *   · Sidebar `position: fixed` 独立浮层，覆盖左 260px
 *   · 折叠 / 展开 Sidebar 时罗盘视觉完全不动，无重排、无回跳
 *   · Sidebar 是深色的，覆盖处只压住罗盘外缘留白，不遮盖主体（罗盘半径 = min(vw,vh)/2 ≤ vw/2，左边缘 ≥ vw/2，通常 > 260）
 */
.compass-layout__content {
  width: 100%;
  height: 100%;
  position: relative;
}

/*
 * 关键：VitePress 的 <Content /> 内部会嵌套 wrapper div（例如 md 顶层的 position:relative
 * 容器 + <ClientOnly> 占位 div）。若不显式撑满，View 里的 .container 用 height:100% 相对
 * 的是一个未撑开的父（高度 0），导致 SVG 高度塌陷、罗盘从视口顶端溢出。
 *
 * 让 .compass-layout__content 及其所有后代 block 元素默认撑满，能保证 View 拿到全屏空间。
 */
.compass-layout__content,
.compass-layout__content > *,
.compass-layout__content > * > * {
  width: 100%;
  height: 100%;
}
</style>
