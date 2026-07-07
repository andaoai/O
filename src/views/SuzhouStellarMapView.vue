<script setup lang="ts">
import { ref } from 'vue'
import SuzhouSkyMap from '../components/centers/SuzhouSkyMap.vue'
import WorldMapCenter from '../components/centers/WorldMapCenter.vue'
import RingStack from '../components/base/RingStack.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useLiveClock } from '@/composables/useLiveClock'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'

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

// 视口控制（单一 composable 打包）
const viewport = useViewport()
// 解构顶层 refs 给模板使用
const { zoom, offsetX, offsetY, rotationDirection, rotationAngle } = viewport

// Alt + 拖拽平移
const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })

provideCompassContext({ time: controlledTime, viewport, onUserTimeChange })

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

/** 是否显示世界地图底图(默认开) */
const showWorldMap = ref(true)

/** 是否显示地平线 + 东南西北四字(默认开) */
const showHorizon = ref(true)

/** 是否显示子午线 + 「子/午」标签(默认开) */
const showMeridian = ref(true)

/** 无外圈环:圆心组件 SuzhouSkyMap 直接填满整个可视区 */
const outerRings: never[] = []
</script>

<template>
  <div class="container">
    <!-- 朝向切换：通过 Teleport 传入 Sidebar 的"视图选项"区块 -->
    <Teleport to="#sidebar-view-tools">
      <div class="view-tool-group">
        <label class="view-tool-label">观察坐标系</label>
        <div class="orientation-toggle">
          <button
            :class="{ active: orientation === 'fixed-ground' }"
            @click="orientation = 'fixed-ground'"
            title="观测者视角：头顶朝上，星宿旋转，地平线固定"
          >固定地平</button>
          <button
            :class="{ active: orientation === 'fixed-sky-coord' }"
            @click="orientation = 'fixed-sky-coord'"
            title="坐标视角：春分点 RA=0 朝上，东在右西在左"
          >赤道·坐标</button>
          <button
            :class="{ active: orientation === 'fixed-sky-suzhou' }"
            @click="orientation = 'fixed-sky-suzhou'"
            title="苏图视角：心宿二（大火）朝上，与《尧典》「日永星火」南中天约定一致"
          >赤道·苏图</button>
        </div>
      </div>

      <div class="view-tool-group">
        <label class="view-tool-label">图层</label>
        <div class="orientation-toggle">
          <button
            :class="{ active: showWorldMap }"
            @click="showWorldMap = !showWorldMap"
            :title="showWorldMap ? '关闭底层世界地图海岸线' : '开启底层世界地图海岸线'"
          >{{ showWorldMap ? '✔ 世界地图' : '  世界地图' }}</button>
          <button
            :class="{ active: showHorizon }"
            @click="showHorizon = !showHorizon"
            :title="showHorizon ? '关闭地平线及东南西北方位标注' : '开启地平线及东南西北方位标注'"
          >{{ showHorizon ? '✔ 地平线 · 东南西北' : '  地平线 · 东南西北' }}</button>
          <button
            :class="{ active: showMeridian }"
            @click="showMeridian = !showMeridian"
            :title="showMeridian ? '关闭子午线及子午标签' : '开启子午线及子午标签'"
          >{{ showMeridian ? '✔ 子午线 · 子午' : '  子午线 · 子午' }}</button>
        </div>
      </div>
    </Teleport>

    <svg
      ref="svgRef"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
      class="sky-svg"
      :class="{ 'alt-hover': isAltPressed && !isDragging, 'alt-dragging': isDragging }"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoom}) rotate(${rotationAngle})`">
        <RingStack
          :outer-radius="DISK_OUTER_RADIUS"
          :rings="outerRings"
          :rotation-direction="rotationDirection"
        >
          <!-- 🔹 圆心:世界地图底图 + 苏图星图主体(两层叠加,共享投影管道) -->
          <template #center="{ innerRadius }">
            <!-- ⬇ 底层:世界地图海岸线,scale 与 SuzhouSkyMap 完全一致 -->
            <WorldMapCenter
              v-if="showWorldMap"
              :radius="innerRadius"
              :time="controlledTime"
              :rotation-direction="rotationDirection"
              :observer-lat="OBSERVER_LAT"
              :observer-lon="OBSERVER_LON"
              :orientation="orientation"
              :show-meridian="showMeridian"
            />
            <!-- ⬆ 上层:三规圆 + 二十八宿 + 北斗紫微 + 日月五星 -->
            <SuzhouSkyMap
              :radius="innerRadius"
              :time="controlledTime"
              :rotation-direction="rotationDirection"
              :observer-lat="OBSERVER_LAT"
              :observer-lon="OBSERVER_LON"
              :orientation="orientation"
              :show-horizon="showHorizon"
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

.sky-svg {
  display: block;
  /* SVG 元素填满容器，viewBox + preserveAspectRatio 自动等比居中，
     放大 / 平移时不再被短边正方形裁出黑边 */
  width: 100%;
  height: 100%;
}

/* Alt 按下 → grab；拖拽中 → grabbing */
.sky-svg.alt-hover {
  cursor: grab;
}
.sky-svg.alt-dragging {
  cursor: grabbing;
}

/* ─── Teleport 到 Sidebar 的朝向切换 ─── */
.view-tool-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.view-tool-label {
  font-size: 10px;
  color: #888;
  letter-spacing: 1px;
  padding-left: 2px;
}

.orientation-toggle {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 3px;
  border: 1px solid #333;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.4);
}

.orientation-toggle button {
  color: #aaa;
  background: transparent;
  border: none;
  padding: 6px 8px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px;
  letter-spacing: 1px;
  transition: color 0.15s, background-color 0.15s;
  font-family: inherit;
}

.orientation-toggle button:hover {
  color: #eee;
  background: rgba(255, 255, 255, 0.05);
}

.orientation-toggle button.active {
  color: #d4af37;
  background: rgba(212, 175, 55, 0.15);
}
</style>
