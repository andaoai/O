<script setup lang="ts">
import { ref, markRaw } from 'vue'
import RingStack from '../components/base/RingStack.vue'
import QiMenLiuJiaziRing from '../components/rings/QiMenLiuJiaziRing.vue'
import QiMenSolarTermsRing from '../components/rings/QiMenSolarTermsRing.vue'
import QiMenInfoCenter from '../components/centers/QiMenInfoCenter.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'

/**
 * 阴阳遁九局盘 —— 奇门遁甲可视化
 *
 * ═══════════════════════════════════════════════════════════════
 *  当前第一环：六轮甲子日环（60 甲子 × 6 轮 = 360 天）
 *  0° 起点 = 「上元甲子日」（冬至前后最近的甲子日）
 *  360° 均匀 6 段 = 一运 / 二运 / … / 六运
 *
 *  中央 QiMenInfoCenter 显示当前所在的运号、距上元甲子/本运
 *  甲子的天数、以及两个甲子的公历日期。
 * ═══════════════════════════════════════════════════════════════
 */
const { controlledTime } = useUrlTime()

const viewport = useViewport()
const { zoom, offsetX, offsetY, rotationDirection, rotationAngle } = viewport

const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })

provideCompassContext({ time: controlledTime, viewport })

/** 最外环外缘半径 */
const OUTER_RADIUS = 560

/** 六轮甲子日环共享参考点（屏幕正上方） */
const START_DEGREE = -90

/** 由外到内的环配置 */
const rings = [
  {
    component: markRaw(QiMenLiuJiaziRing),
    thickness: 30,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  },
  {
    component: markRaw(QiMenSolarTermsRing),
    thickness: 26,
    gapBefore: 2,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  }
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
          :outer-radius="OUTER_RADIUS"
          :gap="2"
          :rings="rings"
          :rotation-direction="rotationDirection"
        >
          <template #center="{ innerRadius }">
            <QiMenInfoCenter
              :radius="innerRadius * 0.85"
              :time="controlledTime"
              :rotation-angle="rotationAngle"
            />
          </template>
        </RingStack>
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
