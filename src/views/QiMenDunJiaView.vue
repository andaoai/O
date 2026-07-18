<script setup lang="ts">
import { ref, markRaw } from 'vue'
import QiMenSolarTermsRing from '../components/rings/QiMenSolarTermsRing.vue'
import QiMenLiuJiaziRing from '../components/rings/QiMenLiuJiaziRing.vue'
import RingStack from '../components/base/RingStack.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'

/**
 * 阴阳遁九局盘 —— 奇门遁甲可视化（🚧 重构中，最小观察态）
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 当前仅保留两个基础环用于对齐观察：
 *
 *   环1  30px QiMenLiuJiaziRing     六轮甲子日环（360 段，60 甲子 × 6 轮）
 *   环2  16px QiMenSolarTermsRing   24 节气点环（每节气 1 tick，落在具体那一天）
 *
 *  其余环（九局数 / 三元 / 超神接气 / 后天八卦 / 四象 / 阴阳两遁）
 *  以及圆心信息卡均已暂时移除，等待逐个添加回来验证对齐关系。
 * ═══════════════════════════════════════════════════════════════
 */

const { controlledTime } = useUrlTime()

const viewport = useViewport()
const { zoom, offsetX, offsetY, rotationDirection, rotationAngle } = viewport

const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })

provideCompassContext({ time: controlledTime, viewport })

const rings = [
  // 最外：六轮甲子日环（360 段）
  { component: markRaw(QiMenLiuJiaziRing),   thickness: 30, props: { time: controlledTime } },
  // 24 节气点环（每节气 1 tick，落在具体那一天）
  { component: markRaw(QiMenSolarTermsRing), thickness: 16, props: { time: controlledTime } }
]
</script>

<template>
  <div class="container">
    <svg
      ref="svgRef"
      class="compass-svg"
      :class="{ 'alt-hover': isAltPressed && !isDragging, 'alt-dragging': isDragging }"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoom}) rotate(${rotationAngle})`">
        <RingStack
          :outer-radius="480"
          :gap="2"
          :rings="rings"
          :rotation-direction="rotationDirection"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  background-color: black;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

svg {
  display: block;
}

.compass-svg {
  width: 100%;
  height: 100%;
}

.compass-svg.alt-hover {
  cursor: grab;
}
.compass-svg.alt-dragging {
  cursor: grabbing;
}
</style>
