<script setup lang="ts">
import { ref, markRaw } from 'vue'
import SixtyJiaziRing from '../components/rings/SixtyJiaziRing.vue'
import BranchesRing from '../components/rings/BranchesRing.vue'
import SolarTermsRing from '../components/rings/SolarTermsRing.vue'
import DataRing from '../components/rings/DataRing.vue'
import DegreeScale from '../components/rings/DegreeScale.vue'
import SolarEcliptic from '../components/SolarEcliptic.vue'
import TaiChi from '../components/TaiChi.vue'
import Control from '../components/Control.vue'
import RingStack from '../components/base/RingStack.vue'
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
 *  🔑 架构原则：唯一时间源 controlledTime
 *  ─────────────────────────────────────────────────────────────
 *  所有时间驱动的组件都直接传 time ref，整条链路响应式。
 *  静态数据的环（二十八宿、纳音、八门等）保持数据驱动即可。
 * ═══════════════════════════════════════════════════════════════
 */

// 唯一时间源
const controlledTime = ref(new Date())

// 视图控制
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

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
  // 二十四节气（✅ 时间驱动：当前节气高亮）
  {
    component: markRaw(SolarTermsRing),
    thickness: 24,
    props: { time: controlledTime }
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
    <!-- 返回首页 -->
    <RouterLink to="/" class="back-link">← 罗盘列表</RouterLink>

    <svg
      :width="1200"
      :height="1200"
      viewBox="0 0 1200 1200"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">

        <!-- 同心圆环带：由外到内自动布局，不重叠 -->
        <RingStack
          :outer-radius="480"
          :gap="2"
          :rings="rings"
          :rotation-direction="rotationDirection"
        />

        <!-- 太阳黄道圆环（中心区 · ✅ 时间驱动） -->
        <SolarEcliptic
          :radius="150"
          :time="controlledTime"
          :enable-animation="false"
          :show-sun-label="true"
          :rotation-direction="rotationDirection"
        />

        <!-- 太极图（中心 · ✅ 时间驱动） -->
        <TaiChi
          :radius="80"
          :time="controlledTime"
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
