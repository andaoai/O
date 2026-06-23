<script setup lang="ts">
import { ref, computed, markRaw, onMounted, onUnmounted } from 'vue'
import DataRing from '../components/DataRing.vue'
import Control from '../components/Control.vue'
import RingStack from '../components/base/RingStack.vue'
import { sixtyJiazi, twelveShichen, twentyFourSolarTerms, seventyTwoHou, sixtyJiaziNayin } from '../data/rings'
import {
  getJiaziIndices,
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
const PILLARS: { id: PillarId; name: string; thickness: number; color: string; vertical?: boolean }[] = [
  { id: 'year', name: '年柱', thickness: 24, color: '#FFD700' },
  { id: 'month', name: '月柱', thickness: 24, color: '#FFA500' },
  { id: 'day', name: '日柱', thickness: 24, color: '#FF6B6B' },
  { id: 'hour', name: '时柱', thickness: 24, color: '#4ECDC4' },
  // 分、秒柱在最内圈，半径小、60格每格仅6°，双字横排必重叠 → 竖排省切向空间
  { id: 'minute', name: '分柱', thickness: 28, color: '#45B7D1', vertical: true },
  { id: 'second', name: '秒柱', thickness: 28, color: '#9370DB', vertical: true }
]

const OUTER_RADIUS = 560
const DataRingComp = markRaw(DataRing)

// 当前各柱的六十甲子序号（0-59）
const currentIndices = computed(() => getJiaziIndices(controlledTime.value))

// 非当前格统一灰色，仅当前时间点所在格高亮放大
const GREY = '#555'

// 五行配色（与纳音环 sixtyJiaziNayin 同款色值，保证全盘一致）：
// 高亮时不再用单一色，而是让发光的那一格携带其五行属性——灰=背景，亮=此刻+五行。
const WUXING_COLOR: Record<string, string> = {
  木: '#2ECC71',
  火: '#E74C3C',
  土: '#D35400',
  金: '#F1C40F',
  水: '#3498DB'
}
// 十天干五行：甲乙木、丙丁火、戊己土、庚辛金、壬癸水
const STEM_ELEMENTS = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
// 十二地支五行：子水丑土寅木卯木辰土巳火午火未土申金酉金戌土亥水
const BRANCH_ELEMENTS = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水']

/** 某天干(0-9)的五行高亮色 */
function stemColorOf(stemIndex: number): string {
  return WUXING_COLOR[STEM_ELEMENTS[stemIndex]!]!
}
/** 某地支(0-11)的五行高亮色 */
function branchColorOf(branchIndex: number): string {
  return WUXING_COLOR[BRANCH_ELEMENTS[branchIndex]!]!
}
/** 某六十甲子格(0-59)对应纳音的五行高亮色（纳音环 item 颜色已是五行色，直接取） */
function nayinColorOf(jiaziIndex: number): string {
  return sixtyJiaziNayin.items[Math.floor(jiaziIndex / 2)]!.color!
}

// 为某一环构造带高亮的数据：当前所在格高亮放大，其余灰色。
// source 默认六十甲子（六柱用），时辰环传入 twelveShichen。
// vertical=true 时双字标签竖排（内圈窄环防重叠）。
function buildRingData(activeIndex: number, highlightColor: string, source = sixtyJiazi, vertical = false) {
  return {
    ...source,
    verticalTwoChar: vertical,
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
const KONGWANG_COLOR = '#777'    // 空亡格底色（略亮灰，使「空/亡」二字可辨）

// 天干空亡环：12 个地支位，随旬把十天干贴到 10 位、余 2 位空亡。
// 与地支环同骨架（子位心对齐正上方），当前柱所在地支那格天干高亮。
// 日柱、时柱通用——传入对应柱的六十甲子序号即可。
// 配色遵循全盘统一语言：灰=背景，亮=此刻——非当前格一律压灰，只当前格发亮。
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
        // 天干高亮 → 取该天干的五行色
        color: isActive ? stemColorOf(stem!) : isKong ? KONGWANG_COLOR : GREY,
        fontSize: isActive ? 14 : 11,
        highlight: isActive
      }
    })
  }
}

// 十二地支环：高亮当前柱所在地支，高亮色取该地支五行色。日柱、时柱通用。
function buildBranchRing(jiaziIndex: number) {
  const activeBranch = branchOf(jiaziIndex)
  return buildRingData(activeBranch, branchColorOf(activeBranch), twelveShichen)
}

// 一柱拆「天干空亡环 + 十二地支环」两环（外干内支），日柱/时柱共用此模板。
function pillarSubRings(jiaziIndex: number) {
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
      props: { data: buildBranchRing(jiaziIndex) }
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

// 五行纳音环：30 格，每格 12°，纳音 i 对应六十甲子 [2i, 2i+1]。
// 与六十甲子同源同转（startDegree 共用 JIAZI_START_DEGREE），故紧贴年柱内侧成对呈现。
// 高亮格 = floor(年柱甲子序号 / 2)；高亮时保留原五行色，其余压灰。
const NAYIN_GREY = '#555'
function buildNayinRing(jiaziIndex: number) {
  const activeNayin = Math.floor(jiaziIndex / 2)
  return {
    ...sixtyJiaziNayin,
    items: sixtyJiaziNayin.items.map((it, i) => ({
      ...it,
      color: i === activeNayin ? it.color : NAYIN_GREY,
      highlight: i === activeNayin
    }))
  }
}

// 六十甲子环与十二时辰环共享同一参考点（屏幕正上方），但用两种对齐约定：
//   · 六十甲子 = 边对齐：甲子格 0°~6°，起跑线压在参考点上；
//   · 十二时辰 = 心对齐：子时格 -15°~15°，格中心压在参考点上（午夜=子时正中）。
// 差异已编码在各自 items 的 startAngle 里，故两环共用同一 startDegree=-90：
// 它把 base 0° 旋到屏幕正上方(270°)——甲子起跑线与子时中心都落在那里。
const JIAZI_START_DEGREE = -90

// 节气 / 候环要与「十二月建（月支环）」对齐，而非与正上方对齐：
// 月支环心对齐——子月格心在正上方(270°)，故月建格边界落在 255°/285°/315°…(每 30° 一界)。
// 「节」是月建起始边：立春=寅月首、大雪=子月首…。立春格(base 0°)的起跑线须压在
// 寅月起始边 315° 上 → startDegree = -45。于是：
//   立春+雨水 = 315°~345° = 寅月格；大雪+冬至 = 255°~285° = 子月格(正上方)；
//   候环每 5° 三等分，正好嵌进对应节气格。
const TERM_START_DEGREE = -45

const rings = computed(() => {
  const out = []
  for (const p of PILLARS) {
    out.push({
      component: DataRingComp,
      thickness: p.thickness,
      props: {
        // 六十甲子高亮 → 取该格纳音的五行色（与纳音环呼应）
        data: buildRingData(
          currentIndices.value[p.id],
          nayinColorOf(currentIndices.value[p.id]),
          sixtyJiazi,
          p.vertical
        ),
        startDegree: JIAZI_START_DEGREE
      }
    })
    // 年柱之后：先紧贴五行纳音环（与年柱同源），再插入 24 节气环 + 72 候环（立春起对齐）
    if (p.id === 'year') {
      out.push({
        component: DataRingComp,
        thickness: 22,
        gapBefore: 0,
        props: {
          data: buildNayinRing(currentIndices.value.year),
          startDegree: JIAZI_START_DEGREE
        }
      })
      out.push({
        component: DataRingComp,
        thickness: 22,
        gapBefore: 2,
        props: {
          data: buildTermRing(twentyFourSolarTerms, termHou.value.termIndex, TERM_HL),
          startDegree: TERM_START_DEGREE
        }
      })
      out.push({
        component: DataRingComp,
        thickness: 18,
        gapBefore: 1,
        props: {
          data: buildTermRing(seventyTwoHou, termHou.value.houIndex, HOU_HL),
          startDegree: TERM_START_DEGREE
        }
      })
    }
    // 月/日/时柱后各紧贴「天干空亡 + 十二地支」两环（外干内支），同一模板复用
    if (p.id === 'month' || p.id === 'day' || p.id === 'hour') {
      out.push(...pillarSubRings(currentIndices.value[p.id]))
    }
  }
  return out
})
</script>

<template>
  <div class="container">
    <RouterLink to="/" class="back-link">← 罗盘列表</RouterLink>

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
