<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import SuzhouSkyMap from '../components/centers/SuzhouSkyMap.vue'
import WorldMapCenter from '../components/centers/WorldMapCenter.vue'
import RingStack from '../components/base/RingStack.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useLiveClock } from '@/composables/useLiveClock'
import { useGeolocation } from '@/composables/useGeolocation'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'
import { reverseGeocode } from '@/utils/reverseGeocode'

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
 *   三规圆 + 28 根不等宽径向辐条 + 中央拱极北斗 —— 苏图灵魂。
 *
 * 层级配置:
 *   圆心:SuzhouSkyMap + WorldMapCenter 叠加（无外环 —— 二十八宿直接看中心辐条）
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

// 全圆盘外缘半径(全星官模式放大 3 倍)
const DISK_OUTER_RADIUS = computed(() => 580 * canvasScale.value)

/**
 * 观测点：优先浏览器定位,失败则回退到苏图底本汴京(北宋首都)。
 *
 * 苏图石刻底本采用汴京观测(φ=35°,λ=116.4°),不是南宋首都临安 ——
 * 因此"默认"用汴京最能还原石刻原图。授权定位后自动切换到当前位置,
 * 观测者红十字会漂到你所在的经纬度,子午线也跟着重定向。
 */
const { latitude, longitude, status: geoStatus } = useGeolocation({
  lat: 35,         // 汴京(开封) —— 苏图底本
  lon: 116.4,
  watch: false
})

/**
 * 观测点显示名:
 *   · 未授权定位 → "汴京(默认)"
 *   · 授权成功  → 通过离线反向地理编码找到最近城市,分级显示:
 *       · 城内     → "上海"
 *       · 城郊     → "上海附近"
 *       · 省域内   → "上海一带"
 *       · 极远     → 退回国家名(如"日本")
 */
const locationLabel = computed(() => {
  if (geoStatus.value !== 'success') return '汴京(默认)'
  return reverseGeocode(latitude.value, longitude.value).label
})

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

/** 星官显示模式:经典版仅 28 宿,全星官版显示全部 283 星官 */
const detailMode = ref<'classic' | 'full'>('classic')

/** 是否显示附属星官(仅 full 模式有效) */
const showSubAsterisms = ref(true)

/** 是否显示三垣墙(仅 full 模式有效) */
const showEnclosures = ref(true)

/** 视口缩放倍数(全星官模式放大画布) */
const canvasScale = computed(() => detailMode.value === 'full' ? 3 : 1)

/** 切换模式时重置视口，防止之前模式的 zoom/offset 在新画布下"丢失"星图 */
watch(detailMode, () => {
  viewport.resetZoom()
  viewport.resetOffset()
})

/** 已移除二十八宿外环：环的距星间距宿度与苏图传统古度宿度冲突，待厘清入度概念后再重新设计。 */
</script>

<template>
  <div class="container">
    <!-- 朝向切换：通过 Teleport 传入 Sidebar 的"视图选项"区块 -->
    <Teleport to="#sidebar-view-tools">
      <!-- 观测点信息:显示当前定位状态 + 经纬度 -->
      <div class="view-tool-group">
        <label class="view-tool-label">观测点</label>
        <div class="observer-info">
          <span class="observer-badge" :class="{ live: geoStatus === 'success' }">{{ locationLabel }}</span>
          <span class="observer-coord">
            φ {{ latitude.toFixed(2) }}° · λ {{ longitude.toFixed(2) }}°
          </span>
        </div>
      </div>

      <!-- 🔹 显示模式切换：经典版 / 全星官版 -->
      <div class="view-tool-group">
        <label class="view-tool-label">星官密度</label>
        <div class="orientation-toggle">
          <button
            :class="{ active: detailMode === 'classic' }"
            @click="detailMode = 'classic'"
            title="经典版：仅显示 28 宿主星官（~165 星）"
          >28 宿</button>
          <button
            :class="{ active: detailMode === 'full' }"
            @click="detailMode = 'full'"
            title="全星官版：显示全部 283 星官（~1395 星），画布放大三倍"
          >全星官</button>
        </div>
      </div>

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
      :viewBox="`0 0 ${1200 * canvasScale} ${1200 * canvasScale}`"
      preserveAspectRatio="xMidYMid meet"
      class="sky-svg"
      :class="{ 'alt-hover': isAltPressed && !isDragging, 'alt-dragging': isDragging }"
    >
      <g :transform="`translate(${600 * canvasScale + offsetX}, ${600 * canvasScale + offsetY}) scale(${zoom}) rotate(${rotationAngle})`">
        <RingStack
          :outer-radius="DISK_OUTER_RADIUS"
          :rings="[]"
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
              :observer-lat="latitude"
              :observer-lon="longitude"
              :orientation="orientation"
              :show-meridian="showMeridian"
            />
            <!-- ⬆ 上层:三规圆 + 二十八宿 + 北斗紫微 + 日月五星 -->
            <SuzhouSkyMap
              :radius="innerRadius"
              :time="controlledTime"
              :rotation-direction="rotationDirection"
              :observer-lat="latitude"
              :observer-lon="longitude"
              :orientation="orientation"
              :show-horizon="showHorizon"
              :detail-mode="detailMode"
              :show-sub-asterisms="showSubAsterisms"
              :show-enclosures="showEnclosures"
              :canvas-scale="canvasScale"
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

/* ─── 观测点信息条(单行:地名 badge + 坐标) ─── */
.observer-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid #333;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.4);
}

.observer-badge {
  flex-shrink: 0;
  font-size: 11px;
  color: #aaa;
  letter-spacing: 1px;
  padding: 2px 6px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.05);
}

.observer-badge.live {
  color: #d4af37;
  background: rgba(212, 175, 55, 0.15);
}

.observer-coord {
  font-size: 10px;
  color: #888;
  font-family: 'Consolas', 'Menlo', monospace;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
</style>
