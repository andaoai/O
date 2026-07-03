<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { withBase } from 'vitepress'
import SolarTermsPointRing from '../components/rings/SolarTermsPointRing.vue'
import DayScaleRing from '../components/rings/DayScaleRing.vue'
import LiuRiQiFenScaleRing from '../components/rings/LiuRiQiFenScaleRing.vue'
import JingFangGuaRing from '../components/rings/JingFangGuaRing.vue'
import NajiaRing from '../components/rings/NajiaRing.vue'
import Control from '../components/Control.vue'
import RingStack from '../components/base/RingStack.vue'
import { useUrlTime } from '@/composables/useUrlTime'

/**
 * 京房十二消息卦盘（重构中）
 *
 * =============================================================
 *  架构：唯一时间源 controlledTime，京房卦气体系
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
 * 京房卦气核心：
 *   64 - 4(四正卦) = 60卦
 *   60卦 x 6爻 = 360爻位 -> 装载 365.25 天
 *   365.25 / 60 ~ 6.0875 天/卦 = "六日七分"
 *   365.25 / 360 ~ 1.0146 天/爻
 *
 * 时间对齐：所有环均 originMode='winterSolstice'，以当年冬至日为 0° 基准。
 */

// --- 唯一时间源（阶段三：与 URL ?t=... 双向绑定）---
const { controlledTime } = useUrlTime()

// --- 视图控制 ---
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

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
    <!-- 返回首页 -->
    <a :href="withBase('/compass/')" class="back-link">罗盘列表</a>

    <svg
      class="compass-svg"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">
        <RingStack
          :outer-radius="580"
          :gap="3"
          :rings="rings"
          :rotation-direction="rotationDirection"
        />
      </g>
    </svg>

    <!-- 控制面板 -->
    <Control
      v-model="controlledTime"
      v-model:zoom="zoomLevel"
      v-model:offsetX="offsetX"
      v-model:offsetY="offsetY"
      v-model:rotation-direction="rotationDirection"
      v-model:rotation-angle="rotationAngle"
    />
  </div>
</template>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
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
  width: min(100vw, 100vh);
  height: min(100vw, 100vh);
}

.back-link {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  color: #aaa;
  text-decoration: none;
  font-size: 14px;
  padding: 6px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.5);
}

.back-link:hover {
  color: #fff;
  border-color: #888;
}
</style>
