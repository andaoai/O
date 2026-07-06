<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { withBase } from 'vitepress'
import SkyChart from '../components/rings/SkyChart.vue'
import MansionDegreeRing from '../components/rings/MansionDegreeRing.vue'
import SevenLuminariesRing from '../components/rings/SevenLuminariesRing.vue'
import ConstellationsRing from '../components/rings/ConstellationsRing.vue'
import SiXiangRing from '../components/rings/SiXiangRing.vue'
import SolarTermsSkyRing from '../components/rings/SolarTermsSkyRing.vue'
import Control from '../components/Control.vue'
import DegreeScale from '../components/rings/DegreeScale.vue'
import RingStack from '../components/base/RingStack.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useLiveClock } from '@/composables/useLiveClock'
import { useAltDragPan } from '@/composables/useAltDragPan'

/**
 * 七曜入宿天象盘（五层架构 · 纯时间驱动）
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 架构成就：零手动半径计算 · 全自动化布局
 *  ─────────────────────────────────────────────────────────────
 *
 *  ┌─ DISK_OUTER_RADIUS = 580（唯一配置常量）
 *  │
 *  ├── RingStack 自动分配：7 个同心环，永不重叠
 *  │   1. 360°赤经刻度    (22px) · 每一度有刻度线，每隔五度显示数字
 *  │   2. 七曜入宿度标记  (28px + 6px gap)
 *  │   3. 二十八星宿      (40px + 6px gap)
 *  │   4. 七曜天体标记    (30px + 2px gap)
 *  │   5. 二十四节气      (30px + 8px gap)
 *  │   6. 四象           (34px + 4px gap)
 *  │   7. SkyChart 星图  (剩余全部空间)
 *  │
 *  └── SkyChart 内部自动计算
 *      ├── 赤道半径 = (内缘半径 - gap) / OUTER_BULGE_RATIO
 *      ├── 日心盘半径 = skyRadius * INNER_GAP_RATIO - gap
 *      └── 日心盘内半径 = max(20, helioRadius * 0.16)
 *
 *  ═══════════════════════════════════════════════════════════════
 *  所有组件均为标准时间驱动环：
 *    - 接受 MaybeRef<Date>
 *    - 内部 computed 派生所有数据
 *    - 父组件不做任何计算，只传 time ref
 *  ═══════════════════════════════════════════════════════════════
 */

// 唯一时间源（阶段三：与 URL ?t=... 双向绑定）
const { controlledTime, hasUrlTime } = useUrlTime()

// 实时时钟：每秒推进 controlledTime，七曜随真实时间移动
// URL 带 t 时不进入 live 模式（用户明确指定了时刻）
const { onUserTimeChange } = useLiveClock(controlledTime, { paused: hasUrlTime })

// 视口控制
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

// Alt + 拖拽平移
const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, offsetX, offsetY, zoomLevel })

/**
 * 🔹 唯一配置常量：全圆盘外缘半径
 * 所有内层半径由 RingStack + 各环组件自动计算，零手动配置
 */
const DISK_OUTER_RADIUS = 580

/* ──────────────────────────────────────────────────────────────
 * RingStack 全圆盘配置（由外到内，7 个环 + 中心 SkyChart）
 *
 * ═══════════════════════════════════════════════════════════════
 *  🔑 架构成就：零手动半径计算 · 全自动化布局
 *  ═══════════════════════════════════════════════════════════════
 *
 *  所有组件均为标准时间驱动环：
 *    - 接受 MaybeRef<Date>
 *    - 内部 computed 派生所有数据
 *    - 父组件不做任何计算，只传 time ref
 *
 *  环类型分布：6 × Segment + 1 × Body + 1 × 复杂可视化
 *  ────────────────────────────────────────────────────────────── */
const outerRings = [
  // 1. 360°赤经刻度（静态间隔，不随时间）
  //    每一度有刻度线，每隔五度显示数字
  //    tickDirection = outward：刻度从内圆向外画（刻度靠近内圆）
  {
    component: markRaw(DegreeScale),
    thickness: 22,
    props: {
      scaleInterval: 1,        // 每一度一条刻度线
      labelInterval: 5,        // 每隔五度显示一个数字
      tickDirection: 'outward', // 刻度从内圆向外画
      startDegree: 0,
      rotationDirection: 'counterclockwise',
      showSectors: false,
      showLabels: true,
      labelColor: '#666666',  // 主要刻度文字暗一点
      circleColor: '#555555'
    }
  },
  // 2. 七曜入宿度标记环（时间驱动 · Body · 径向刻线反映运动状态）
  {
    component: markRaw(MansionDegreeRing),
    thickness: 28,
    gapBefore: 6,
    props: { time: controlledTime }
  },
  // 3. 七曜天体标记环（时间驱动 · Body · 统一 Body 环渲染器）
  {
    component: markRaw(SevenLuminariesRing),
    thickness: 30,
    gapBefore: 2,
    props: { time: controlledTime }
  },
  // 4. 二十八宿环（时间驱动 · Segment · 动态赤经区间 + 天象事件高亮）
  {
    component: markRaw(ConstellationsRing),
    thickness: 40,
    gapBefore: 6,
    props: { time: controlledTime }
  },

  // 5. 二十四节气环（时间驱动 · Point · 赤经动态对齐）
  {
    component: markRaw(SolarTermsSkyRing),
    thickness: 30,
    gapBefore: 8,
    props: { time: controlledTime }
  },
  // 6. 四象环（时间驱动 · Segment · 按宿赤经动态合并）
  {
    component: markRaw(SiXiangRing),
    thickness: 34,
    gapBefore: 4,
    props: { time: controlledTime }
  },
  // 7. 🔹 天极投影星图（时间驱动 · 复杂可视化 · 最内环）
  //    内嵌日心轨道盘，赤道/黄道/白道半径全部自动计算
  {
    component: markRaw(SkyChart),
    // thickness: 自动填充剩余全部中心空间
    gapBefore: 8,
    props: {
      time: controlledTime,
      showEquator: true,
      showEcliptic: true,
      showWhiteWay: true,
      showMansions: false,
      showNodes: true,
      showCenters: true,
      showHelioOrbits: true
    }
  }
]
</script>

<template>
  <div class="container">
    <!-- 返回首页 -->
    <a :href="withBase('/compass/')" class="back-link">← 罗盘列表</a>

    <svg
      ref="svgRef"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
      class="sky-svg"
      :class="{ 'alt-hover': isAltPressed && !isDragging, 'alt-dragging': isDragging }"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">
        <!-- ═══════════════════════════════════════════════════════════════
             🔑 五层架构 · 圆环 + 圆心 二分规范
             ──────────────────────────────────────────────────────────────
             【圆环区】outerRings 数组：7 个同心环，RingStack 自动布局
             【圆心区】#center slot：自动暴露 innerRadius，圆心组件自动适配

             架构分层：
               1. 外环：DegreeScale (赤经刻度)
               2. 中环：MansionDegreeRing → ConstellationsRing → SevenLuminariesRing
                         SolarTermsSkyRing → SiXiangRing
               3. 内环：SkyChart (自动填充剩余空间)
               4. 圆心：#center slot (HelioOrbits / TaiChi 等)

             设计原则：
               - 所有圆环 → outerRings 数组，永不手动计算半径
               - 所有圆心 → #center slot，自动适配剩余空间
               - 单向数据流：controlledTime 唯一真理源
             ═══════════════════════════════════════════════════════════════ -->
        <RingStack
          :outer-radius="DISK_OUTER_RADIUS"
          :rings="outerRings"
          rotation-direction="clockwise"
        >
          <!-- 🔹 圆心区：自动接收最内环的 innerRadius -->
          <template #center="{ innerRadius }">
            <!--
              圆心组件使用规范：
              1. radius = innerRadius * 缩放系数 (0.7 ~ 0.9 推荐)
              2. 只传 time ref，不手动解包
              3. 自动适配，永不与外层环碰撞

              当前示例：HelioOrbits 已内置于 SkyChart
              如需替换为太极：<TaiChi :radius="innerRadius * 0.75" :time="controlledTime" />
            -->
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
  /* SVG 元素填满容器，viewBox + preserveAspectRatio 自动等比居中；
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
