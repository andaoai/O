<script setup lang="ts">
import { ref, markRaw, onMounted, onUnmounted } from 'vue'
import { withBase } from 'vitepress'
import Control from '../components/Control.vue'
import RingStack from '../components/base/RingStack.vue'
import SixtyJiaziRing from '../components/rings/SixtyJiaziRing.vue'
import StemsRing from '../components/rings/StemsRing.vue'
import BranchesRing from '../components/rings/BranchesRing.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { type PillarId } from '../utils/liushiJiazi'

// ═══════════════════════════════════════════════════════════════
//  🔑 时间驱动架构：唯一时间源
//  ─────────────────────────────────────────────────────────────
//  整个罗盘只有这一个 controlledTime，所有环都从这里驱动。
//  父组件不传 data，只传 time ref，子组件内部自己计算渲染数据。
//
//  ✨ 阶段三：controlledTime 与 URL ?t=... 双向绑定
//     · URL 无 t 参数 → 启动实时时钟，六环随真实时间推进
//     · URL 有 t 参数 → 用户明确指定时刻，不启动实时时钟（liveMode=false）
// ═══════════════════════════════════════════════════════════════
const { controlledTime, hasUrlTime } = useUrlTime()

// 实时时钟：默认每秒推进 controlledTime → 六环随真实时间自动跳。
// 一旦用户用控制面板播放/手动调时/选时，停掉实时跟随，把控制权交还给用户。
// 若 URL 已带 t，则从一开始就不进入 liveMode。
let tickTimer: number | null = null
const liveMode = ref(!hasUrlTime.value)

function startLiveClock() {
  if (tickTimer !== null) return
  tickTimer = window.setInterval(() => {
    controlledTime.value = new Date()
  }, 1000)
}

function stopLiveClock() {
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

// 控制面板触发的时间变化 = 用户接管，停掉实时跟随
function onUserTimeChange() {
  if (liveMode.value) {
    liveMode.value = false
    stopLiveClock()
  }
}

onMounted(() => {
  // URL 无 t → 进入 live 模式；有 t → 保持用户指定的时刻不动
  if (liveMode.value) startLiveClock()
})
onUnmounted(stopLiveClock)

// 视图控制：缩放 / 平移 / 旋转
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

// ═══════════════════════════════════════════════════════════════
//  六柱元信息：由外到内，每环径向厚度交给 RingStack 自动分配半径。
//  color = 该柱专属身份色（低饱和暗调，用于环内外边线）
//  borderWidth = 主环边线粗细。年/月/时为「主时辰」三环，边线更粗。
//  月/日/时各自的「天干环 / 地支环」与其六十甲子同属一组，共用此柱色。
// ═══════════════════════════════════════════════════════════════
const PILLARS: {
  id: PillarId
  name: string
  thickness: number
  color: string
  borderWidth: number
  vertical?: boolean
}[] = [
  { id: 'year', name: '年柱', thickness: 24, color: '#9C8420', borderWidth: 1.8 },
  { id: 'month', name: '月柱', thickness: 24, color: '#9C6B22', borderWidth: 1.8 },
  { id: 'day', name: '日柱', thickness: 24, color: '#9C4848', borderWidth: 1 },
  { id: 'hour', name: '时柱', thickness: 24, color: '#357E78', borderWidth: 1.8 },
  // 分、秒柱在最内圈，半径小、60格每格仅6°，双字横排必重叠 → 竖排省切向空间
  { id: 'minute', name: '分柱', thickness: 28, color: '#2F7286', borderWidth: 1, vertical: true },
  { id: 'second', name: '秒柱', thickness: 28, color: '#5E4A8A', borderWidth: 1, vertical: true }
]

const OUTER_RADIUS = 560

// 六十甲子环与十二时辰环共享同一参考点（屏幕正上方）
const JIAZI_START_DEGREE = -90

// ═══════════════════════════════════════════════════════════════
//  ✨ 时间驱动架构：RingStack 只传 time ref，不传 data
//  ─────────────────────────────────────────────────────────────
//  所有计算逻辑都封装在各 Ring 组件内部，父组件彻底解放。
//  controlledTime 变化 → 所有子组件自动响应，重新计算渲染数据。
// ═══════════════════════════════════════════════════════════════
const rings = [
  // ─── 年柱 ───────────────────────────────────────────────
  {
    component: markRaw(SixtyJiaziRing),
    thickness: PILLARS[0]!.thickness,
    props: {
      time: controlledTime,
      pillarId: 'year' as const,
      circleColor: PILLARS[0]!.color,
      circleWidth: PILLARS[0]!.borderWidth,
      startDegree: JIAZI_START_DEGREE
    }
  },
  // ─── 月柱 ───────────────────────────────────────────────
  {
    component: markRaw(SixtyJiaziRing),
    thickness: PILLARS[1]!.thickness,
    props: {
      time: controlledTime,
      pillarId: 'month' as const,
      circleColor: PILLARS[1]!.color,
      circleWidth: PILLARS[1]!.borderWidth,
      startDegree: JIAZI_START_DEGREE
    }
  },
  {
    component: markRaw(StemsRing),
    thickness: 28,
    gapBefore: 0,
    props: {
      time: controlledTime,
      pillarId: 'month' as const,
      circleColor: PILLARS[1]!.color,
      circleWidth: Math.max(0.8, PILLARS[1]!.borderWidth - 0.8),
      startDegree: JIAZI_START_DEGREE
    }
  },
  {
    component: markRaw(BranchesRing),
    thickness: 28,
    gapBefore: 0,
    props: {
      time: controlledTime,
      pillarId: 'month' as const,
      circleColor: PILLARS[1]!.color,
      circleWidth: Math.max(0.8, PILLARS[1]!.borderWidth - 0.8),
      startDegree: JIAZI_START_DEGREE
    }
  },
  // ─── 日柱 ───────────────────────────────────────────────
  {
    component: markRaw(SixtyJiaziRing),
    thickness: PILLARS[2]!.thickness,
    props: {
      time: controlledTime,
      pillarId: 'day' as const,
      circleColor: PILLARS[2]!.color,
      circleWidth: PILLARS[2]!.borderWidth,
      startDegree: JIAZI_START_DEGREE
    }
  },
  {
    component: markRaw(StemsRing),
    thickness: 28,
    gapBefore: 0,
    props: {
      time: controlledTime,
      pillarId: 'day' as const,
      circleColor: PILLARS[2]!.color,
      circleWidth: Math.max(0.8, PILLARS[2]!.borderWidth - 0.8),
      startDegree: JIAZI_START_DEGREE
    }
  },
  {
    component: markRaw(BranchesRing),
    thickness: 28,
    gapBefore: 0,
    props: {
      time: controlledTime,
      pillarId: 'day' as const,
      circleColor: PILLARS[2]!.color,
      circleWidth: Math.max(0.8, PILLARS[2]!.borderWidth - 0.8),
      startDegree: JIAZI_START_DEGREE
    }
  },
  // ─── 时柱 ───────────────────────────────────────────────
  {
    component: markRaw(SixtyJiaziRing),
    thickness: PILLARS[3]!.thickness,
    props: {
      time: controlledTime,
      pillarId: 'hour' as const,
      circleColor: PILLARS[3]!.color,
      circleWidth: PILLARS[3]!.borderWidth,
      startDegree: JIAZI_START_DEGREE
    }
  },
  {
    component: markRaw(StemsRing),
    thickness: 28,
    gapBefore: 0,
    props: {
      time: controlledTime,
      pillarId: 'hour' as const,
      circleColor: PILLARS[3]!.color,
      circleWidth: Math.max(0.8, PILLARS[3]!.borderWidth - 0.8),
      startDegree: JIAZI_START_DEGREE
    }
  },
  {
    component: markRaw(BranchesRing),
    thickness: 28,
    gapBefore: 0,
    props: {
      time: controlledTime,
      pillarId: 'hour' as const,
      circleColor: PILLARS[3]!.color,
      circleWidth: Math.max(0.8, PILLARS[3]!.borderWidth - 0.8),
      startDegree: JIAZI_START_DEGREE
    }
  },
  // ─── 分柱 ───────────────────────────────────────────────
  {
    component: markRaw(SixtyJiaziRing),
    thickness: PILLARS[4]!.thickness,
    props: {
      time: controlledTime,
      pillarId: 'minute' as const,
      verticalTwoChar: true,
      circleColor: PILLARS[4]!.color,
      circleWidth: PILLARS[4]!.borderWidth,
      startDegree: JIAZI_START_DEGREE
    }
  },
  // ─── 秒柱 ───────────────────────────────────────────────
  {
    component: markRaw(SixtyJiaziRing),
    thickness: PILLARS[5]!.thickness,
    props: {
      time: controlledTime,
      pillarId: 'second' as const,
      verticalTwoChar: true,
      circleColor: PILLARS[5]!.color,
      circleWidth: PILLARS[5]!.borderWidth,
      startDegree: JIAZI_START_DEGREE
    }
  }
]
</script>

<template>
  <div class="container">
    <a :href="withBase('/compass/')" class="back-link">← 罗盘列表</a>

    <svg
      class="compass-svg"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">

        <!-- 六十甲子六环：由外到内，年月日时分秒；半径由 RingStack 自动分配 -->
        <RingStack
          :outer-radius="OUTER_RADIUS"
          :gap="2"
          :rings="rings"
          :rotation-direction="rotationDirection"
        />
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
