<script setup lang="ts">
import { ref, markRaw } from 'vue'
import SolarTermsPointRing from '../components/rings/SolarTermsPointRing.vue'
import DayScaleRing from '../components/rings/DayScaleRing.vue'
import LiuRiQiFenScaleRing from '../components/rings/jingfang/LiuRiQiFenScaleRing.vue'
import JingFangGuaRing from '../components/rings/JingFangGuaRing.vue'
import NajiaRing from '../components/rings/NajiaRing.vue'
import RingStack from '../components/base/RingStack.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'

/**
 * 京房六日七分纳甲盘
 *
 * =============================================================
 *  架构：唯一时间源 controlledTime，京房卦气 · 六日七分法核心
 *  -------------------------------------------------------------
 *
 *   外环  16px  SolarTermsPointRing        24节气（节/中气双色，冬至=0°）
 *   环2   36px  DayScaleRing               365天三级刻度 + 日干支（月首/甲子日锚点，当日显示干支两字，冬至=0°）
 *   环3   18px  LiuRiQiFenScaleRing        六日七分 360爻刻度（每爻1°，当日高亮）
 *   环4   80px  JingFangGuaRing            京房 60 卦爻线图形环（当前爻红色高亮）
 *   环5   80px  NajiaRing                  60 卦浑天纳甲环（每爻竖排干支，当前爻金色高亮）
 *
 * =============================================================
 *
 * 🔑 角度基准全统一：冬至 = 0° 顺时针
 *
 *     0° = 冬至
 *    90° = 春分
 *   180° = 夏至
 *   270° = 秋分
 *
 * 六日七分法核心：
 *   64 - 4(四正卦：坎/震/离/兑) = 60卦
 *   60卦 × 6爻 = 360 爻位  →  装载 365.25 天
 *   365.25 / 60 ≈ 6.0875 天/卦  ⇒ 「六日七分」（六又七十三分之一日）
 *   365.25 / 360 ≈ 1.0146 天/爻
 *
 * 观察重点：
 *   · 当日落在哪一卦？（值日之卦）
 *   · 当日落在该卦的第几爻？（值爻）
 *   · 值爻的纳甲干支为何？
 *   · 60 卦 × 6 爻 铺满一个回归年的对应关系
 *
 * 时间对齐：所有环均 originMode='winterSolstice'，以当年冬至日为 0° 基准。
 */

// --- 唯一时间源（阶段三：与 URL ?t=... 双向绑定）---
const { controlledTime } = useUrlTime()

// --- 视图控制（单一 composable 打包）---
const viewport = useViewport()
// 解构出 refs 给模板使用：Vue 3 只对 setup 顶层变量自动解包，viewport.zoom 需要 .value
const { zoom, offsetX, offsetY, rotationDirection, rotationAngle } = viewport

// Alt + 拖拽平移
const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })

provideCompassContext({ time: controlledTime, viewport })

/**
 * 同心环配置（由外到内）
 * 🔑 所有环统一使用 originMode='winterSolstice' 确保冬至=0° 对齐
 */
const rings = [
  // 1. 二十四节气（最外环，节/中气双色，冬至=0° 基准）
  {
    component: markRaw(SolarTermsPointRing),
    thickness: 16,
    props: { time: controlledTime, originMode: 'winterSolstice' as const }
  },
  // 2. 365天回归年刻度 + 日干支叠加（冬至=0° 基准，月首/甲子日锚点，当日显示干支两字）
  {
    component: markRaw(DayScaleRing),
    thickness: 36,
    props: { time: controlledTime, originMode: 'winterSolstice' as const, showGanzhi: true }
  },
  // 3. 六日七分 360爻位刻度环（每爻1°，当日高亮）
  {
    component: markRaw(LiuRiQiFenScaleRing),
    thickness: 18,
    props: { time: controlledTime }
  },
  // 4. 京房 60 卦爻线图形环（60卦×6爻，当前爻红色高亮 + 卦名标签 + 内外经卦标签）
  //    thickness=110：需容纳 6 条爻线堆叠 + 卦名(18px) + 内外卦标签(~12px)三层径向元素，
  //    低于 100 时卦名与内外卦标签的径向 bounding box 会重叠。
  {
    component: markRaw(JingFangGuaRing),
    thickness: 110,
    props: { time: controlledTime }
  },
  // 5. 浑天纳甲环（60卦×6爻纳甲干支，径向由内向外排布，当前爻金色高亮）
  {
    component: markRaw(NajiaRing),
    thickness: 80,
    props: { time: controlledTime }
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
          :outer-radius="580"
          :gap="3"
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
  /* SVG 元素填满容器，viewBox + preserveAspectRatio 自动等比居中，
     放大 / 平移时不再被短边正方形裁出黑边 */
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
