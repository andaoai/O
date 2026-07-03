<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { withBase } from 'vitepress'
import DayScaleRing from '../components/rings/DayScaleRing.vue'
import SolarTermsPointRing from '../components/rings/SolarTermsPointRing.vue'
import MoonPhaseRing from '../components/rings/MoonPhaseRing.vue'
import LunarMonthsRing from '../components/rings/LunarMonthsRing.vue'
import LeapInfoCenter from '../components/centers/LeapInfoCenter.vue'
import Control from '../components/Control.vue'
import RingStack from '../components/base/RingStack.vue'
import { useUrlTime } from '@/composables/useUrlTime'

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
    <!-- 返回首页 -->
    <a :href="withBase('/compass/')" class="back-link">← 罗盘列表</a>

    <svg
      class="compass-svg"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
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
              :rotation-angle="rotationAngle"
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

/* 罗盘填满视口较短边，保持正方形等比 */
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
