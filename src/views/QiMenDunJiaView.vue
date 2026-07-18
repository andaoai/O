<script setup lang="ts">
import { ref, markRaw } from 'vue'
import RingStack from '../components/base/RingStack.vue'
import QiMenLiuJiaziRing from '../components/rings/QiMenLiuJiaziRing.vue'
import QiMenSolarTermsRing from '../components/rings/QiMenSolarTermsRing.vue'
import QiMenSanYuanRing from '../components/rings/QiMenSanYuanRing.vue'
import QiMenJuShuRing from '../components/rings/QiMenJuShuRing.vue'
import QiMenChaoShenRing from '../components/rings/QiMenChaoShenRing.vue'
import QiMenYinYangRing from '../components/rings/QiMenYinYangRing.vue'
import QiMenInfoCenter from '../components/centers/QiMenInfoCenter.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'

/**
 * 阴阳遁九局盘 —— 奇门遁甲可视化
 *
 * ═══════════════════════════════════════════════════════════════
 *  由外到内 4 环 + 圆心：
 *   ① 六轮甲子日环（60 甲子 × 6 轮 = 360 天）—— 时间物理坐标
 *   ② 二十四节气段环（岁首=冬至，本岁 24 节气 + 下岁冬至紫标）
 *   ③ 三元段环（上元/中元/下元，72 元）
 *   ④ 九局数段环（1-9 洛书方位色）
 *   ⑤ QiMenInfoCenter 中央：局数/元位/超神接气/六运/干支四柱
 *
 *  所有环共享 0° 起点 = 「上元甲子日」（1900 固定历元派生），
 *  环上每格 [i, i+1) 严格对应一个具体日期，径向对齐。
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
  // ① 最外：六轮甲子日环（60 × 6 = 360 天，时间物理坐标）
  {
    component: markRaw(QiMenLiuJiaziRing),
    thickness: 30,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  },
  // ② 二十四节气段环（岁首冬至 + 下岁冬至紫色标）
  {
    component: markRaw(QiMenSolarTermsRing),
    thickness: 26,
    gapBefore: 2,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  },
  // ③ 三元段环（上元/中元/下元）
  {
    component: markRaw(QiMenSanYuanRing),
    thickness: 24,
    gapBefore: 2,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  },
  // ④ 九局数段环（1-9 洛书色）
  {
    component: markRaw(QiMenJuShuRing),
    thickness: 24,
    gapBefore: 2,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  },
  // ⑤ 超神/接气/正授段环
  {
    component: markRaw(QiMenChaoShenRing),
    thickness: 22,
    gapBefore: 2,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  },
  // ⑥ 阴阳两遁段环
  {
    component: markRaw(QiMenYinYangRing),
    thickness: 22,
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
