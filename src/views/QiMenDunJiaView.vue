<script setup lang="ts">
import { ref, markRaw } from 'vue'
import QiMenYinYangRing from '../components/rings/QiMenYinYangRing.vue'
import QiMenFourSymbolsRing from '../components/rings/QiMenFourSymbolsRing.vue'
import QiMenEightTrigramsRing from '../components/rings/QiMenEightTrigramsRing.vue'
import QiMenSolarTermsRing from '../components/rings/QiMenSolarTermsRing.vue'
import QiMenSanYuanRing from '../components/rings/QiMenSanYuanRing.vue'
import QiMenJuShuRing from '../components/rings/QiMenJuShuRing.vue'
import QiMenChaoShenJieQiRing from '../components/rings/QiMenChaoShenJieQiRing.vue'
import QiMenLiuJiaziRing from '../components/rings/QiMenLiuJiaziRing.vue'
import QiMenInfoCenter from '../components/centers/QiMenInfoCenter.vue'
import RingStack from '../components/base/RingStack.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'

/**
 * 阴阳遁九局盘 —— 奇门遁甲可视化
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 架构：唯一时间源 controlledTime → 8 环 + 圆心信息卡
 *  角度基准：冬至 = 0°（顶部）
 *  嵌套结构：24 节气 15° × 3 元 5° × 5 天 1°
 *
 *  排列思想（由外到内 = 由天象细节到易理浓缩）：
 *    最外层是 360 天日刻度（宇宙具体运行的一天一天）
 *    向内逐层归纳 → 24 节气 → 8 卦 → 4 象
 *    最内层是阴阳两遁（一阴一阳之谓道），紧贴圆心信息卡
 *  ─────────────────────────────────────────────────────────────
 *
 *   环1  30px QiMenLiuJiaziRing       六轮甲子日环（360 段，60 甲子 × 6 轮）
 *   环2  26px QiMenJuShuRing          九局数（72 段 × 5°，每 5 天切换，紧贴甲子日）
 *   环3  22px QiMenSanYuanRing        上中下三元（72 段 × 5°，紧贴局数）
 *   环4  16px QiMenSolarTermsRing     24 节气**点环**（每节气 1 tick，落在具体那一天）
 *   环5  20px QiMenChaoShenJieQiRing  超神/接气/正授 段环（与节气紧邻）
 *   环6  32px QiMenEightTrigramsRing  后天八卦（8 段）
 *   环7  30px QiMenFourSymbolsRing    四象（4 段）
 *   环8  30px QiMenYinYangRing        阴阳两遁（2 段）
 *   圆心 QiMenInfoCenter              阳/阴遁 · 节气 · 三元 · 局 · 状态
 *
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
  { component: markRaw(QiMenLiuJiaziRing),      thickness: 30, props: { time: controlledTime } },
  // 紧贴甲子日 → 局数（每 5 天切换，与甲子日 5 格严格对齐）
  { component: markRaw(QiMenJuShuRing),         thickness: 26, props: { time: controlledTime } },
  // 紧贴局数 → 三元
  { component: markRaw(QiMenSanYuanRing),       thickness: 22, props: { time: controlledTime } },
  // 24 节气点环 & 超神接气段 —— 相邻成对
  { component: markRaw(QiMenSolarTermsRing),    thickness: 16, props: { time: controlledTime } },
  { component: markRaw(QiMenChaoShenJieQiRing), thickness: 20, props: { time: controlledTime } },
  { component: markRaw(QiMenEightTrigramsRing), thickness: 32, props: { time: controlledTime } },
  { component: markRaw(QiMenFourSymbolsRing),   thickness: 30, props: { time: controlledTime } },
  // 最内：阴阳两遁（一阴一阳之谓道，紧贴圆心）
  { component: markRaw(QiMenYinYangRing),       thickness: 30, props: { time: controlledTime } }
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
          <template #center="{ innerRadius }">
            <QiMenInfoCenter
              :radius="innerRadius * 0.9"
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
