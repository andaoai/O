<script setup lang="ts">
import { ref, markRaw, computed } from 'vue'
import RingStack from '../components/base/RingStack.vue'
import LiuJiaziDayRing from '../components/rings/qi-men-dun-jia/LiuJiaziDayRing.vue'
import SolarTermsRing from '../components/rings/qi-men-dun-jia/QiMenSolarTermsRing.vue'
import LunarDateRing from '../components/rings/qi-men-dun-jia/LunarDateRing.vue'
import WuYunLiuQiRing from '../components/rings/wuyun-liuqi/WuYunLiuQiRing.vue'
import KeQiRing from '../components/rings/wuyun-liuqi/KeQiRing.vue'
import MainYunRing from '../components/rings/wuyun-liuqi/MainYunRing.vue'
import KeYunRing from '../components/rings/wuyun-liuqi/KeYunRing.vue'
import WuYunInfoCenter from '../components/centers/wuyun-liuqi/WuYunInfoCenter.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'
import { provideDayGridContext } from '@/composables/useDayGridContext'

/**
 * 黄帝内经·五运六气盘
 *
 * ═══════════════════════════════════════════════════════════════
 *  《素问》七篇大论所述五运六气学说的可视化图盘。以日粒度年历
 *  上下文（DayGridContext）为共用坐标系，与奇门盘共享外层三环
 *  （六轮甲子日 / 24 节气 / 农历日期），内嵌五运六气 4 环。
 *
 *  由外到内 7 环 + 圆心：
 *   ① 六轮甲子日环（60 甲子 × 6 轮 = 360 天）—— 时间物理坐标
 *   ② 二十四节气段环（岁首=冬至，本岁 24 节气 + 下岁冬至紫标）
 *   ③ 农历日期环（初一显示月名，其余日号；冬至叠加区径向分上下两层）
 *   ④ 五运六气 · 主气环（六段节气切分，跨冬至走紫渐变）
 *   ⑤ 五运六气 · 客气环（年支推六步，跨冬至向本年终气渐变）
 *   ⑥ 五运 · 主运环（每年木火土金水固定五步，太少交替）
 *   ⑦ 五运 · 客运环（初运=岁运，按相生顺序排五步）
 *   ⑧ WuYunInfoCenter 圆心：年干支 · 岁运 · 司天 · 在泉 ·
 *                            当令主气 / 客气 / 主运 / 客运 · 干支四柱
 *
 *  所有环共享 0° 起点 = 「上元甲子日」（1900 固定历元派生），
 *  环上每格 [i, i+1) 严格对应一个具体日期，径向对齐。
 * ═══════════════════════════════════════════════════════════════
 */
const { controlledTime } = useUrlTime()

const viewport = useViewport()
const { zoom, offsetX, offsetY, rotationDirection, rotationAngle } = viewport

const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })

provideCompassContext({ time: controlledTime, viewport })

/**
 * 🔑 日粒度共享上下文（与奇门盘共用同一份 composable）
 * 5 个五运六气 & 3 个外层环共享，只在跨天时才重算。
 */
provideDayGridContext(controlledTime)

/** 最外环外缘半径 */
const OUTER_RADIUS = 560

/** 六轮甲子日环共享参考点（屏幕正上方） */
const START_DEGREE = -90

/** 圆心信息卡显隐（默认关闭，与其它罗盘图层默认关闭一致） */
const showInfoCenter = ref(false)

/** 由外到内的 7 环配置 */
const rings = computed(() => [
  // ① 六轮甲子日环（60 × 6 = 360 天）
  {
    component: markRaw(LiuJiaziDayRing),
    thickness: 30,
    props: { time: controlledTime, startDegree: START_DEGREE }
  },
  // ② 二十四节气段环
  {
    component: markRaw(SolarTermsRing),
    thickness: 26,
    gapBefore: 2,
    props: { time: controlledTime, startDegree: START_DEGREE }
  },
  // ③ 农历日期环
  {
    component: markRaw(LunarDateRing),
    thickness: 24,
    gapBefore: 2,
    props: { time: controlledTime, startDegree: START_DEGREE }
  },
  // ④ 主气环
  {
    component: markRaw(WuYunLiuQiRing),
    thickness: 26,
    gapBefore: 2,
    props: { time: controlledTime, startDegree: START_DEGREE }
  },
  // ⑤ 客气环
  {
    component: markRaw(KeQiRing),
    thickness: 26,
    gapBefore: 2,
    props: { time: controlledTime, startDegree: START_DEGREE }
  },
  // ⑥ 主运环
  {
    component: markRaw(MainYunRing),
    thickness: 26,
    gapBefore: 2,
    props: { time: controlledTime, startDegree: START_DEGREE }
  },
  // ⑦ 客运环
  {
    component: markRaw(KeYunRing),
    thickness: 26,
    gapBefore: 2,
    props: { time: controlledTime, startDegree: START_DEGREE }
  }
])
</script>

<template>
  <div class="container">
    <!-- 图层切换：通过 Teleport 传入 Sidebar 的"视图选项"区块 -->
    <Teleport to="#sidebar-view-tools">
      <div class="view-tool-group">
        <label class="view-tool-label">图层</label>
        <div class="orientation-toggle">
          <button
            :class="{ active: showInfoCenter }"
            @click="showInfoCenter = !showInfoCenter"
            :title="showInfoCenter ? '关闭五运六气信息卡（年干支·岁运·司天·在泉·当令主客气/运）' : '开启五运六气信息卡（年干支·岁运·司天·在泉·当令主客气/运）'"
          >{{ showInfoCenter ? '✔ 五运六气信息' : '  五运六气信息' }}</button>
        </div>
      </div>
    </Teleport>

    <svg
      ref="svgRef"
      class="compass-svg"
      :class="{ 'alt-hover': isAltPressed && !isDragging, 'alt-dragging': isDragging }"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoom}) rotate(${rotationAngle})`">
        <RingStack
          :outer-radius="OUTER_RADIUS"
          :gap="2"
          :rings="rings"
          :rotation-direction="rotationDirection"
        >
          <template #center="{ innerRadius }">
            <WuYunInfoCenter
              v-if="showInfoCenter"
              :radius="innerRadius * 0.9"
              :time="controlledTime"
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

/* ─── Teleport 到 Sidebar 的图层切换 ─── */
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
