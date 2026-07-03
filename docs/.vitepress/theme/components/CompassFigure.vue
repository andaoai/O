<script setup lang="ts">
/**
 * 乙巳观 · md 内嵌罗盘插图容器
 *
 * ════════════════════════════════════════════════════════════════
 *  用途：在书籍/概念/罗盘说明的 md 里插入一枚"活的罗盘图"
 *
 *  设计约束：
 *  1. 主项目所有 Ring 组件渲染 SVG 片段（<g>），必须外套 <svg viewBox>
 *  2. md 段落文字环境色浅，罗盘默认配色偏白，需要深色底衬托
 *  3. VitePress dev/build 用 SSR；罗盘依赖 astronomy-engine/tyme4ts
 *     的实时计算，走 <ClientOnly> 避免 hydration 时的日期不一致
 *  4. 时间入参：默认 new Date()，也接受 md 里传入的 ISO 字符串
 *
 *  用法（推荐）：
 *    <CompassFigure caption="二十八宿分布" time="0665-01-01">
 *      <ConstellationsRing :radius="240" />
 *    </CompassFigure>
 *
 *  参数：
 *    - caption?  图题（可选，附在下方 figcaption）
 *    - time?     ISO 字符串或 Date；默认 undefined，由子组件用 new Date()
 *    - size?     方形边长（px），默认 520
 *    - viewBox?  SVG viewBox，默认自动居中的 640×640
 * ════════════════════════════════════════════════════════════════
 */
import { computed } from 'vue'

interface Props {
  caption?: string
  time?: string | Date
  size?: number
  viewBox?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 520,
  viewBox: '-300 -300 600 600',
})

/**
 * time 归一化：接受 ISO 字符串或 Date；给子组件用 provide 或 slot props？
 * 这里选最省事的方案 —— 用 slot props 暴露 resolvedTime，md 里可选择使用。
 * 大部分 Ring 组件默认 new Date()，不传 time 也能工作。
 */
const resolvedTime = computed(() => {
  if (!props.time) return undefined
  if (props.time instanceof Date) return props.time
  const d = new Date(props.time)
  return Number.isNaN(d.getTime()) ? undefined : d
})
</script>

<template>
  <figure class="compass-figure">
    <div class="compass-figure__frame" :style="{ maxWidth: `${size}px` }">
      <ClientOnly>
        <svg
          class="compass-figure__svg"
          :viewBox="viewBox"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          :aria-label="caption || '罗盘插图'"
        >
          <slot :time="resolvedTime" />
        </svg>
        <template #fallback>
          <div class="compass-figure__placeholder">
            <span>· 罗盘加载中 ·</span>
          </div>
        </template>
      </ClientOnly>
    </div>
    <figcaption v-if="caption" class="compass-figure__caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>

<style scoped>
.compass-figure {
  margin: 1.8rem auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.compass-figure__frame {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: radial-gradient(
    circle at center,
    var(--ysg-purple-800) 0%,
    var(--ysg-ink-black) 100%
  );
  border: 1px solid var(--vp-c-brand-soft);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 24px var(--ysg-brand-glow-dim);
  overflow: hidden;
}

.compass-figure__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.compass-figure__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ysg-paper-400);
  font-family: var(--ysg-font-serif);
  font-size: 0.95rem;
  letter-spacing: 0.15em;
  opacity: 0.6;
}

.compass-figure__caption {
  color: var(--ysg-paper-300);
  font-family: var(--ysg-font-serif);
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-align: center;
  opacity: 0.85;
}

.compass-figure__caption::before {
  content: '图 · ';
  color: var(--ysg-gold-400);
}
</style>
