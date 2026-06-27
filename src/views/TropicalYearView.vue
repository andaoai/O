<script setup lang="ts">
import { ref, markRaw } from 'vue'
import DayScaleRing from '../components/rings/DayScaleRing.vue'
import SolarTermsPointRing from '../components/rings/SolarTermsPointRing.vue'
import LunarMonthsRing from '../components/rings/LunarMonthsRing.vue'
import LeapInfoCenter from '../components/centers/LeapInfoCenter.vue'
import Control from '../components/Control.vue'
import RingStack from '../components/base/RingStack.vue'

/**
 * 回归年 × 农历闰月 可视化罗盘
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 架构：唯一时间源 controlledTime → 10环 + 圆心
 *  ─────────────────────────────────────────────────────────────
 *
 *   环1  22px DayScaleRing         365天刻度（三级）
 *   环2  14px SolarTermsPointRing  24节气（绿节/蓝中气）
 *   环3  13px 今年  农历月
 *   环4  13px 去年  农历月
 *   …    …                        （12月固定色，逐年变淡）
 *   环12 13px 九年前 农历月
 *   圆心  ~292px LeapInfoCenter    年中信息
 *
 *  ═══════════════════════════════════════════════════════════════
 */

// 唯一时间源
const controlledTime = ref(new Date())

// 视图控制
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

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
  // 3. 今年（最亮）
  {
    component: markRaw(LunarMonthsRing),
    thickness: 13,
    props: { time: controlledTime, yearOffset: 0 }
  },
  // 4-12. 去年 → 九年前
  ...Array.from({ length: 9 }, (_, i) => ({
    component: markRaw(LunarMonthsRing),
    thickness: 13,
    props: { time: controlledTime, yearOffset: -(i + 1) }
  }))
]
</script>

<template>
  <div class="container">
    <!-- 返回首页 -->
    <RouterLink to="/" class="back-link">← 罗盘列表</RouterLink>

    <svg
      :width="1200"
      :height="1200"
      viewBox="0 0 1200 1200"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">
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
            />
          </template>
        </RingStack>
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
