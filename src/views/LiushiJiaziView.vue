<script setup lang="ts">
import { ref, computed, markRaw, onMounted, onUnmounted } from 'vue'
import DataRing from '../components/DataRing.vue'
import Control from '../components/Control.vue'
import RingStack from '../components/base/RingStack.vue'
import { sixtyJiazi, twelveShichen, twentyFourSolarTerms, seventyTwoHou } from '../data/rings'
import {
  getJiaziIndices,
  ganzhiName,
  shichenIndex,
  shichenName,
  branchOf,
  xunInfo,
  STEMS,
  type PillarId
} from '../utils/liushiJiazi'
import { getTermHouInfo } from '../utils/chineseCalendar'

// 时间控制（与控制面板双向绑定）
const controlledTime = ref(new Date())

// 实时时钟：默认每秒推进 controlledTime → 六环随真实时间自动跳。
// 一旦用户用控制面板播放/手动调时/选时，停掉实时跟随，把控制权交还给用户。
let tickTimer: number | null = null
const liveMode = ref(true)

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

onMounted(startLiveClock)
onUnmounted(stopLiveClock)

// 视图控制：缩放 / 平移 / 旋转
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

// 六柱元信息：由外到内，每环径向厚度交给 RingStack 自动分配半径
const PILLARS: { id: PillarId; name: string; thickness: number; color: string }[] = [
  { id: 'year', name: '年柱', thickness: 24, color: '#FFD700' },
  { id: 'month', name: '月柱', thickness: 24, color: '#FFA500' },
  { id: 'day', name: '日柱', thickness: 24, color: '#FF6B6B' },
  { id: 'hour', name: '时柱', thickness: 24, color: '#4ECDC4' },
  { id: 'minute', name: '分柱', thickness: 24, color: '#45B7D1' },
  { id: 'second', name: '秒柱', thickness: 24, color: '#9370DB' }
]

const OUTER_RADIUS = 460
const DataRingComp = markRaw(DataRing)

// 当前各柱的六十甲子序号（0-59）
const currentIndices = computed(() => getJiaziIndices(controlledTime.value))

// 非当前格统一灰色，仅当前时间点所在格高亮放大
const GREY = '#555'

// 为某一环构造带高亮的数据：当前所在格高亮放大，其余灰色。
// source 默认六十甲子（六柱用），时辰环传入 twelveShichen。
function buildRingData(activeIndex: number, highlightColor: string, source = sixtyJiazi) {
  return {
    ...source,
    items: source.items.map((it, i) => ({
      ...it,
      color: i === activeIndex ? highlightColor : GREY,
      fontSize: i === activeIndex ? 14 : 10,
      highlight: i === activeIndex
    }))
  }
}

// RingStack 的环配置：六柱甲子环 + 日柱/时柱内侧各插入「天干空亡 + 十二地支」两环。
// 整体随 currentIndices 重算，避免在模板里逐帧重建。
const SHICHEN_COLOR = '#7FFFD4'  // 时辰/日支高亮色
const KONGWANG_COLOR = '#888'    // 空亡格底色
const TIANGAN_HL = '#FFE066'     // 当前柱天干高亮色

// 天干五行配色（与天文盘天干环一致）
const STEM_COLORS = [
  '#2ECC71', '#28B463', '#E74C3C', '#C0392B', '#D35400',
  '#F39C12', '#F1C40F', '#BDC3C7', '#3498DB', '#2980B9'
]

// 天干空亡环：12 个地支位，随旬把十天干贴到 10 位、余 2 位空亡。
// 与地支环同骨架（子位心对齐正上方），当前柱所在地支那格天干高亮。
// 日柱、时柱通用——传入对应柱的六十甲子序号即可。
function buildTianganRing(jiaziIndex: number) {
  const { stems, kongwang } = xunInfo(jiaziIndex)
  const activeBranch = branchOf(jiaziIndex)
  return {
    ...twelveShichen,
    items: twelveShichen.items.map((it, branch) => {
      const stem = stems[branch]
      const isKong = stem === null
      const isActive = branch === activeBranch
      return {
        ...it,
        label: isKong ? (kongwang[0] === branch ? '空' : '亡') : STEMS[stem!]!,
        color: isActive ? TIANGAN_HL : isKong ? KONGWANG_COLOR : STEM_COLORS[stem!]!,
        fontSize: isActive ? 14 : 11,
        highlight: isActive
      }
    })
  }
}

// 十二地支环：高亮当前柱所在地支。日柱、时柱通用。
function buildBranchRing(jiaziIndex: number, highlightColor: string) {
  return buildRingData(branchOf(jiaziIndex), highlightColor, twelveShichen)
}

// 一柱拆「天干空亡环 + 十二地支环」两环（外干内支），日柱/时柱共用此模板。
function pillarSubRings(jiaziIndex: number, branchHL: string) {
  return [
    {
      component: DataRingComp,
      thickness: 28,
      gapBefore: 0,
      props: { data: buildTianganRing(jiaziIndex) }
    },
    {
      component: DataRingComp,
      thickness: 28,
      gapBefore: 0,
      props: { data: buildBranchRing(jiaziIndex, branchHL) }
    }
  ]
}

// 节气 / 候：立春起序号，高亮当前格。两环与六十甲子同为「边对齐」
// （立春格 0°~15° 起跑线压参考点），故共用 JIAZI_START_DEGREE。
const TERM_HL = '#FF8C42'   // 当前节气高亮
const HOU_HL = '#FFB677'    // 当前候高亮
const TERM_HOU_GREY = '#555'

// 七十二候名（供计算层回填候名）
const houNames = seventyTwoHou.items.map(it => it.label)

// 当前节气 / 候信息（随时间重算）
const termHou = computed(() => getTermHouInfo(controlledTime.value, houNames))

// 构造「立春起」环数据：高亮 activeIndex 那格，其余灰。source=节气环/候环。
function buildTermRing(source: typeof twentyFourSolarTerms, activeIndex: number, hl: string) {
  return {
    ...source,
    items: source.items.map((it, i) => ({
      ...it,
      color: i === activeIndex ? hl : TERM_HOU_GREY,
      highlight: i === activeIndex
    }))
  }
}

// 六十甲子环与十二时辰环共享同一参考点（屏幕正上方），但用两种对齐约定：
//   · 六十甲子 = 边对齐：甲子格 0°~6°，起跑线压在参考点上；
//   · 十二时辰 = 心对齐：子时格 -15°~15°，格中心压在参考点上（午夜=子时正中）。
// 差异已编码在各自 items 的 startAngle 里，故两环共用同一 startDegree=-90：
// 它把 base 0° 旋到屏幕正上方(270°)——甲子起跑线与子时中心都落在那里。
const JIAZI_START_DEGREE = -90

const rings = computed(() => {
  const out = []
  for (const p of PILLARS) {
    out.push({
      component: DataRingComp,
      thickness: p.thickness,
      props: {
        data: buildRingData(currentIndices.value[p.id], p.color),
        startDegree: JIAZI_START_DEGREE
      }
    })
    // 年柱之后、月柱之前：插入 24 节气环 + 72 候环（由粗到细，立春起对齐）
    if (p.id === 'year') {
      out.push({
        component: DataRingComp,
        thickness: 22,
        gapBefore: 2,
        props: {
          data: buildTermRing(twentyFourSolarTerms, termHou.value.termIndex, TERM_HL),
          startDegree: JIAZI_START_DEGREE
        }
      })
      out.push({
        component: DataRingComp,
        thickness: 18,
        gapBefore: 1,
        props: {
          data: buildTermRing(seventyTwoHou, termHou.value.houIndex, HOU_HL),
          startDegree: JIAZI_START_DEGREE
        }
      })
    }
    // 月/日/时柱后各紧贴「天干空亡 + 十二地支」两环（外干内支），同一模板复用
    if (p.id === 'month' || p.id === 'day' || p.id === 'hour') {
      out.push(...pillarSubRings(currentIndices.value[p.id], SHICHEN_COLOR))
    }
  }
  return out
})

// 当前六柱干支名（用于右上角面板显示）
const pillarNames = computed(
  () =>
    Object.fromEntries(
      PILLARS.map(p => [p.id, ganzhiName(currentIndices.value[p.id])])
    ) as Record<PillarId, string>
)

// 当前时辰名（十二时辰，由时柱地支推得）
const currentShichen = computed(() => shichenName(shichenIndex(currentIndices.value.hour)))
</script>

<template>
  <div class="container">
    <RouterLink to="/" class="back-link">← 罗盘列表</RouterLink>

    <!-- 六柱当前值显示 -->
    <div class="pillars-panel">
      <div class="pillar-title">六柱</div>
      <div class="pillar-items">
        <div class="pillar-item" v-for="p in PILLARS" :key="p.id">
          <span class="pillar-name" :style="{ color: p.color }">{{ p.name }}</span>
          <span class="pillar-value" :style="{ color: p.color }">{{ pillarNames[p.id] }}</span>
        </div>
        <div class="pillar-item">
          <span class="pillar-name" :style="{ color: '#7FFFD4' }">时辰</span>
          <span class="pillar-value" :style="{ color: '#7FFFD4' }">{{ currentShichen }}</span>
        </div>
      </div>
    </div>

    <svg
      :width="1200"
      :height="1200"
      viewBox="0 0 1200 1200"
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

.pillars-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid #333;
  border-radius: 6px;
  padding: 12px 16px;
}

.pillar-title {
  color: #888;
  font-size: 12px;
  text-align: center;
  margin-bottom: 8px;
  letter-spacing: 0.1em;
}

.pillar-items {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 6px 18px;
}

.pillar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.pillar-name {
  font-size: 11px;
  opacity: 0.7;
}

.pillar-value {
  font-size: 17px;
  font-weight: bold;
}
</style>
