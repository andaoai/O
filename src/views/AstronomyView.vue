<script setup lang="ts">
import { ref, markRaw } from 'vue'
import SixtyJiaziRing from '../components/rings/SixtyJiaziRing.vue'
import BranchesRing from '../components/rings/BranchesRing.vue'
import SolarTermsRing from '../components/rings/SolarTermsRing.vue'
import DataRing from '../components/rings/DataRing.vue'
import DegreeScale from '../components/rings/DegreeScale.vue'
import SolarEcliptic from '../components/centers/SolarEcliptic.vue'
import TaiChi from '../components/centers/TaiChi.vue'
import RingStack from '../components/base/RingStack.vue'
import BaseCenter from '../components/base/BaseCenter.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'
import {
  twentyEightConstellations,
  sixtyJiaziNayin,
  heavenlyStems,
  tianganKongwang,
  twelveLongevity,
  eightGates,
  siXiang
} from '../data/rings'

/**
 * 中华天文圆环（时间驱动统一架构）
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 架构原则：唯一时间源 controlledTime（现由 useUrlTime 提供）
 *  ─────────────────────────────────────────────────────────────
 *  所有时间驱动的组件都直接传 time ref，整条链路响应式。
 *  静态数据的环（二十八宿、纳音、八门等）保持数据驱动即可。
 *
 *  ✨ 阶段三新增：controlledTime 与 URL ?t=... 双向绑定
 *     ?t=0665-01-15T12:00 → 打开即定位到麟德二年
 *     用户拖时间条 → URL 自动同步（防抖 500ms，分钟精度）
 * ═══════════════════════════════════════════════════════════════
 */

// 唯一时间源（由 URL 参数驱动，无 URL 参数则用当前时间）
const { controlledTime } = useUrlTime()

// 视口控制：缩放 / 平移 / 旋转（单一 composable 打包）
const viewport = useViewport()
// 解构顶层 refs 给模板使用（Vue 3 只对 setup 顶层变量自动解包）
const { zoom, offsetX, offsetY, rotationDirection, rotationAngle } = viewport

// Alt + 拖拽平移
const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })

// 向 CompassLayout 里的 <CompassSidebar> 暴露时间/视口状态
provideCompassContext({ time: controlledTime, viewport })

/* ──────────────────────────────────────────────────────────────
 * 同心圆环自动布局配置（由外到内）
 *
 * 时间驱动的环（✅）：传 controlledTime ref，内部计算
 * 数据驱动的环（📌）：传静态数据
 * ────────────────────────────────────────────────────────────── */
const rings = [
  // 360°度数刻度（📌 静态间隔）
  {
    component: markRaw(DegreeScale),
    thickness: 20,
    props: {
      showSectors: true,
      sectorColor: '#666666',
      sectorOpacity: 0.1,
      showLabels: true,
      labelColor: '#888888',
      scaleInterval: 6,
      showCircle: true,
      circleColor: '#666666',
      circleWidth: 1
    }
  },
  // 二十八星宿（📌 静态数据，传统罗盘角度固定）
  { component: markRaw(DataRing), thickness: 30, props: { data: twentyEightConstellations } },
  // 六十甲子（✅ 时间驱动：年柱高亮 + 五行配色）
  {
    component: markRaw(SixtyJiaziRing),
    thickness: 30,
    props: {
      time: controlledTime,
      pillarId: 'year' as const
    }
  },
  // 五行纳音（📌 静态数据，与六十甲子同源）
  { component: markRaw(DataRing), thickness: 26, gapBefore: 0, props: { data: sixtyJiaziNayin } },
  // 十天干（📌 静态数据）
  { component: markRaw(DataRing), thickness: 28, props: { data: heavenlyStems } },
  // 天干空亡（📌 静态数据）
  { component: markRaw(DataRing), thickness: 30, props: { data: tianganKongwang } },
  // 十二长生（📌 静态数据）
  { component: markRaw(DataRing), thickness: 38, props: { data: twelveLongevity } },
  // 十二地支（✅ 时间驱动：年支高亮 + 五行配色）
  {
    component: markRaw(BranchesRing),
    thickness: 28,
    props: {
      time: controlledTime,
      pillarId: 'year' as const
    }
  },
  // 八门（📌 静态数据）
  { component: markRaw(DataRing), thickness: 28, props: { data: eightGates } },
  // 四象（📌 静态数据）
  { component: markRaw(DataRing), thickness: 34, props: { data: siXiang } }
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
        <!-- ═══════════════════════════════════════════════════════════════
             🔑 五层架构 · 圆环 + 圆心 二分规范 【范例】
             ──────────────────────────────────────────────────────────────
             【圆环区】rings 数组：12 个同心环，RingStack 自动布局
             【圆心区】#center slot：自动暴露 innerRadius，零手动配置

             架构分层：
               1. 外环：DegreeScale (360° 刻度)
               2. 中环：SolarTermsRing → ConstellationsRing → SixtyJiaziRing
                         NayinRing → HeavenlyStemsRing → ...
               3. 内环：SiXiangRing (四象)
               4. 圆心：#center slot (SolarEcliptic + TaiChi 自动嵌套)

             设计亮点：
               ✅ 所有圆环半径 100% 自动计算，永不重叠
               ✅ 圆心组件自动接收 innerRadius 并自适应缩放
               ✅ 单一时间源 controlledTime 贯穿全链路
               ✅ 圆心可多层嵌套（黄道环包裹太极）
             ═══════════════════════════════════════════════════════════════ -->
        <RingStack
          :outer-radius="480"
          :gap="2"
          :rings="rings"
          :rotation-direction="rotationDirection"
        >
          <!-- 🔹 圆心区：自动接收最内环的 innerRadius
               使用 BaseCenter 统一管理：安全边距 + 自动缩放 + 插槽分发 -->
          <template #center="{ innerRadius }">
            <BaseCenter
              :radius="innerRadius"
              :scale="0.85"
              :time="controlledTime"
              :rotation-direction="rotationDirection"
            >
              <!-- 插槽内容接收 actualRadius 自动适配 -->
              <template #default="{ actualRadius, time }">
                <!-- 太阳黄道圆环（圆心外层 · 占满整个圆心区） -->
                <SolarEcliptic
                  :radius="actualRadius"
                  :time="time"
                  :enable-animation="false"
                  :show-sun-label="true"
                  :rotation-direction="rotationDirection"
                />
                <!-- 太极图（圆心内层 · 占圆心区的 50%） -->
                <TaiChi
                  :radius="actualRadius * 0.53"
                  :time="time"
                  :rotation-direction="rotationDirection"
                />
              </template>
            </BaseCenter>
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
