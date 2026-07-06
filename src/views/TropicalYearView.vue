<script setup lang="ts">
import { ref, markRaw } from 'vue'
import DayScaleRing from '../components/rings/DayScaleRing.vue'
import SolarTermsPointRing from '../components/rings/SolarTermsPointRing.vue'
import MoonPhaseRing from '../components/rings/MoonPhaseRing.vue'
import LunarMonthsRing from '../components/rings/LunarMonthsRing.vue'
import LeapInfoCenter from '../components/centers/LeapInfoCenter.vue'
import RingStack from '../components/base/RingStack.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'

/**
 * 回归年 × 农历闰月 可视化罗盘
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 架构：唯一时间源 controlledTime → 15环 + 圆心
 *  ─────────────────────────────────────────────────────────────
 *
 *   环1  22px DayScaleRing         365天刻度（三级）
 *   环2  14px SolarTermsPointRing  24节气（绿节/蓝中气）
 *   环3  22px MoonPhaseRing        月亮月相（每日月牙 + 朔望弦标注）
 *   环4  13px 今年   农历月
 *   环5  13px 去年   农历月
 *   …    …                        （12月固定色，逐年变淡）
 *   环15 13px 十一年前 农历月
 *   圆心  ~238px LeapInfoCenter    年中信息
 *
 *  ═══════════════════════════════════════════════════════════════
 */

// 唯一时间源（阶段三：与 URL ?t=... 双向绑定）
const { controlledTime } = useUrlTime()

// 视图控制（单一 composable 打包）
const viewport = useViewport()
// 解构顶层 refs 给模板使用
const { zoom, offsetX, offsetY, rotationDirection, rotationAngle } = viewport

// Alt + 拖拽平移
const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })

provideCompassContext({ time: controlledTime, viewport })

/**
 * 同心环配置（由外到内）
 */
const rings = [
  // 1. 365天回归年刻度
  {
    component: markRaw(DayScaleRing),
    thickness: 22,
    props: { time: controlledTime }
  },
  // 2. 二十四节气参照（节/中气双色刻度）
  {
    component: markRaw(SolarTermsPointRing),
    thickness: 14,
    props: { time: controlledTime }
  },
  // 3. 月亮月相变化（每日月牙 + 朔/上弦/望/下弦标注）
  {
    component: markRaw(MoonPhaseRing),
    thickness: 22,
    props: { time: controlledTime }
  },
  // 4. 今年（最亮）
  {
    component: markRaw(LunarMonthsRing),
    thickness: 13,
    props: { time: controlledTime, yearOffset: 0 }
  },
  // 5-15. 去年 → 十一年前
  ...Array.from({ length: 11 }, (_, i) => ({
    component: markRaw(LunarMonthsRing),
    thickness: 13,
    props: { time: controlledTime, yearOffset: -(i + 1) }
  }))
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
        >
          <!-- 圆心区：闰月信息 -->
          <template #center="{ innerRadius }">
            <LeapInfoCenter
              :radius="innerRadius * 0.85"
              :time="controlledTime"
              :rotation-direction="rotationDirection"
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

/* SVG 元素填满容器，viewBox + preserveAspectRatio 自动等比居中，
   放大 / 平移时不再被短边正方形裁出黑边 */
.compass-svg {
  width: 100%;
  height: 100%;
}

/* Alt 按下 → grab；拖拽中 → grabbing */
.compass-svg.alt-hover {
  cursor: grab;
}
.compass-svg.alt-dragging {
  cursor: grabbing;
}
</style>
