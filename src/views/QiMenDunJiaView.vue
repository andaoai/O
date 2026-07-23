<script setup lang="ts">
import { ref, markRaw } from 'vue'
import RingStack from '../components/base/RingStack.vue'
import QiMenLiuJiaziRing from '../components/rings/QiMenLiuJiaziRing.vue'
import QiMenSolarTermsRing from '../components/rings/QiMenSolarTermsRing.vue'
import QiMenLunarRing from '../components/rings/QiMenLunarRing.vue'
import QiMenSanYuanRing from '../components/rings/QiMenSanYuanRing.vue'
import QiMenJuShuRing from '../components/rings/QiMenJuShuRing.vue'
import QiMenInfoCenter from '../components/centers/QiMenInfoCenter.vue'
import QiMenLuoshuCenter from '../components/centers/QiMenLuoshuCenter.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'

/**
 * 阴阳遁九局盘 —— 奇门遁甲可视化
 *
 * ═══════════════════════════════════════════════════════════════
 *  由外到内 5 环 + 圆心：
 *   ① 六轮甲子日环（60 甲子 × 6 轮 = 360 天）—— 时间物理坐标
 *   ② 二十四节气段环（岁首=冬至，本岁 24 节气 + 下岁冬至紫标）
 *   ③ 农历日期环（初一显示月名，其余日号；冬至叠加区径向分上下两层）
 *   ④ 三元段环（上元/中元/下元，72 元）
 *   ⑤ 九局数段环（1-9 洛书方位色）
 *   ⑥ QiMenInfoCenter 中央：局数/元位/超神接气/六运/干支四柱
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

/** 最外环外缘半径 */
const OUTER_RADIUS = 560

/** 六轮甲子日环共享参考点（屏幕正上方） */
const START_DEGREE = -90

/** 圆心信息卡显隐（默认关闭，与其它罗盘图层默认关闭一致） */
const showInfoCenter = ref(false)

/** 洛书九宫圆心显隐（默认关闭） */
const showLuoshuCenter = ref(false)

/** 由外到内的环配置 */
const rings = [
  // ① 最外：六轮甲子日环（60 × 6 = 360 天，时间物理坐标）
  {
    component: markRaw(QiMenLiuJiaziRing),
    thickness: 30,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  },
  // ② 二十四节气段环（岁首冬至 + 下岁冬至紫色标）
  {
    component: markRaw(QiMenSolarTermsRing),
    thickness: 26,
    gapBefore: 2,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  },
  // ③ 农历日期环（初一显示月名，其他显示日号；冬至叠加区径向上下分层）
  {
    component: markRaw(QiMenLunarRing),
    thickness: 24,
    gapBefore: 2,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  },
  // ④ 三元段环（上元/中元/下元）
  {
    component: markRaw(QiMenSanYuanRing),
    thickness: 24,
    gapBefore: 2,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  },
  // ⑤ 九局数段环（1-9 洛书色）
  {
    component: markRaw(QiMenJuShuRing),
    thickness: 24,
    gapBefore: 2,
    props: {
      time: controlledTime,
      startDegree: START_DEGREE
    }
  }
]
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
            :title="showInfoCenter ? '关闭圆心信息卡（阴阳遁·节气·三元·局数）' : '开启圆心信息卡（阴阳遁·节气·三元·局数）'"
          >{{ showInfoCenter ? '✔ 阴阳遁信息' : '  阴阳遁信息' }}</button>
          <button
            :class="{ active: showLuoshuCenter }"
            @click="showLuoshuCenter = !showLuoshuCenter"
            :title="showLuoshuCenter ? '关闭洛书九宫图（河图洛书 · 后天八卦 · 当前局所在宫高亮）' : '开启洛书九宫图（河图洛书 · 后天八卦 · 当前局所在宫高亮）'"
          >{{ showLuoshuCenter ? '✔ 洛书九宫' : '  洛书九宫' }}</button>
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
            <QiMenLuoshuCenter
              v-if="showLuoshuCenter"
              :radius="innerRadius * 0.95"
              :time="controlledTime"
              :rotation-angle="rotationAngle"
            />
            <QiMenInfoCenter
              v-if="showInfoCenter"
              :radius="innerRadius * 0.85"
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
