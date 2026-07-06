<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'
import SuzhouSkyMap from '../components/centers/SuzhouSkyMap.vue'
import Control from '../components/Control.vue'
import RingStack from '../components/base/RingStack.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useLiveClock } from '@/composables/useLiveClock'

/**
 * 苏州石刻天文图(五层架构 · 时间驱动 · 初版)
 *
 * ═══════════════════════════════════════════════════════════════
 *  南宋淳祐七年(1247)王致远勒石于苏州府学的天文图 · 数字复原
 *  底本:南宋绍熙四年(1193)黄裳绘 · 采用北宋汴京观测(φ≈35°N)
 * ═══════════════════════════════════════════════════════════════
 *
 * 本罗盘的观察焦点:【北斗 ↔ 二十八宿】
 *
 *   古人观察:「斗柄东指天下皆春;斗柄南指天下皆夏;
 *              斗柄西指天下皆秋;斗柄北指天下皆冬。」
 *
 *   BeidouCenter 已经把北斗放在盘心,SuzhouSkyMap 往外扩到二十八宿距星,
 *   三规圆 + 28 根不等宽径向辐条 + 中央拱极北斗 —— 苏图灵魂。
 *
 * ⚠️ 层级配置:仅圆心组件(SuzhouSkyMap),外圈环等待重构。
 *    圆心组件通过 RingStack #center slot 直接接管整个可视区域。
 */

// 唯一时间源(与 URL ?t=... 双向绑定)
const { controlledTime, hasUrlTime } = useUrlTime()

// 实时时钟:URL 未带 t 时每秒推进,斗柄自然旋转
const { onUserTimeChange } = useLiveClock(controlledTime, { paused: hasUrlTime })

// 视口控制
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

// 唯一配置常量:全圆盘外缘半径
const DISK_OUTER_RADIUS = 580

// 观测点(苏图底本采汴京观测,不是南宋首都临安)
const OBSERVER_LAT = 35      // 汴京(开封)
const OBSERVER_LON = 116.4

/**
 * 盘面朝向模式:
 *   · fixed-ground     : 观测者头顶朝上,星宿旋转,地平线不动 —— 观星者实感
 *   · fixed-sky-coord  : 春分点(RA=0)朝上,东在右,星宿静止,地平旋转 —— 现代星图
 *   · fixed-sky-suzhou : 心宿二(大火)朝上 —— 《尧典》「日永星火,以正仲夏」南中天约定
 */
const orientation = ref<'fixed-ground' | 'fixed-sky-coord' | 'fixed-sky-suzhou'>('fixed-ground')

/** 无外圈环:圆心组件 SuzhouSkyMap 直接填满整个可视区 */
const outerRings: never[] = []
</script>

<template>
  <div class="container">
    <!-- 左上工具栏:返回 + 朝向切换 -->
    <div class="topbar">
      <a :href="withBase('/compass/')" class="back-link">← 罗盘列表</a>
      <div class="orientation-toggle">
        <button
          :class="{ active: orientation === 'fixed-ground' }"
          @click="orientation = 'fixed-ground'"
          title="观测者视角:头顶朝上,星宿旋转,地平线固定"
        >固定地平</button>
        <button
          :class="{ active: orientation === 'fixed-sky-coord' }"
          @click="orientation = 'fixed-sky-coord'"
          title="坐标视角:春分点 RA=0 朝上,东在右西在左"
        >赤道·坐标</button>
        <button
          :class="{ active: orientation === 'fixed-sky-suzhou' }"
          @click="orientation = 'fixed-sky-suzhou'"
          title="苏图视角:心宿二(大火)朝上,与《尧典》「日永星火」南中天约定一致"
        >赤道·苏图</button>
      </div>
    </div>

    <!-- 标题浮层 -->
    <!-- <div class="title-overlay">
      <div class="title-main">苏州石刻天文图</div>
      <div class="title-sub">南宋淳祐七年(1247) · 观察北斗与二十八宿</div>
    </div> -->

    <svg viewBox="0 0 1200 1200" preserveAspectRatio="xMidYMid meet" class="sky-svg">
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">
        <RingStack
          :outer-radius="DISK_OUTER_RADIUS"
          :rings="outerRings"
          :rotation-direction="rotationDirection"
        >
          <!-- 🔹 圆心:苏图星图主体 -->
          <template #center="{ innerRadius }">
            <SuzhouSkyMap
              :radius="innerRadius"
              :time="controlledTime"
              :rotation-direction="rotationDirection"
              :observer-lat="OBSERVER_LAT"
              :observer-lon="OBSERVER_LON"
              :orientation="orientation"
            />
          </template>
        </RingStack>
      </g>
    </svg>

    <!-- 控制面板 -->
    <Control
      v-model="controlledTime"
      @time-change="onUserTimeChange"
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

.sky-svg {
  display: block;
  /* SVG 元素填满容器，viewBox + preserveAspectRatio 自动等比居中，
     放大 / 平移时不再被短边正方形裁出黑边 */
  width: 100%;
  height: 100%;
}

.topbar {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.back-link {
  color: #aaa;
  text-decoration: none;
  font-size: 14px;
  padding: 6px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.5);
  display: inline-flex;
  align-items: center;
}

.back-link:hover {
  color: #fff;
  border-color: #888;
}

.orientation-toggle {
  display: flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.6);
}

.orientation-toggle button {
  color: #aaa;
  background: transparent;
  border: none;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;
  letter-spacing: 1px;
  transition: color 0.15s, background-color 0.15s;
}

.orientation-toggle button:hover {
  color: #eee;
}

.orientation-toggle button.active {
  color: #d4af37;
  background-color: rgba(212, 175, 55, 0.12);
}

.title-overlay {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  text-align: center;
  color: #ddd;
  pointer-events: none;
  user-select: none;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.8);
}

.title-main {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 3px;
  color: #d4af37;
}

.title-sub {
  font-size: 11px;
  color: #8899aa;
  margin-top: 2px;
  letter-spacing: 1px;
}
</style>
