<script setup lang="ts">
import { ref, computed } from 'vue'
import GuaRing from '../components/GuaRing.vue'
import Control from '../components/Control.vue'
import { XIANTIAN_64_GUA } from '../data/sixtyFourGua'

/**
 * 先天六十四卦盘（伏羲 / 邵雍方圆图）
 *
 * 外圈 64 卦主环（先天圆图，卦符 + 卦名，阴阳两仪淡背景）+ 中央 8×8 方图（伏羲方图）。
 * 圆图卦序、角度来自 @/data/sixtyFourGua，由 GuaRing 渲染。
 * 方图：行=上卦(自上而下 乾→坤)、列=下卦(自左而右 乾→坤)，乾乾居左上、坤坤居右下，
 *   对角线为八纯卦，与圆图同源（皆按经卦二进制排布）。
 * 先天图是静态结构，不随时间变化；controlledTime 仅供控制面板显示。
 */

// 时间控制（仅供面板显示，盘面结构与时间无关）
const controlledTime = ref(new Date())

// 视图控制：缩放 / 平移 / 旋转
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

const OUTER_RADIUS = 300

// 中央伏羲方图：8×8 整齐排列。边长内接于圆环内圆（半对角 < 内半径）。
const SQUARE_SIZE = 350
const CELL = SQUARE_SIZE / 8
const HALF = SQUARE_SIZE / 2

// value → 卦数据（卦符 / 卦名），供方图按格取用
const guaByValue = new Map(XIANTIAN_64_GUA.map(g => [g.value, g]))

// 方图 64 格：value = 下卦 + 上卦*8；行(上卦)自上而下 乾(7)→坤(0)，列(下卦)自左而右 乾(7)→坤(0)
const squareCells = computed(() => {
  const cells: { value: number; name: string; unicode: string; cx: number; cy: number }[] = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const upper = 7 - row
      const lower = 7 - col
      const value = lower + upper * 8
      const g = guaByValue.get(value)!
      cells.push({
        value,
        name: g.name,
        unicode: g.unicode,
        cx: -HALF + (col + 0.5) * CELL,
        cy: -HALF + (row + 0.5) * CELL
      })
    }
  }
  return cells
})

// 方图网格分隔线（9 横 9 纵）
const gridLines = computed(() => {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = 0; i <= 8; i++) {
    const p = -HALF + i * CELL
    lines.push({ x1: -HALF, y1: p, x2: HALF, y2: p }) // 横线
    lines.push({ x1: p, y1: -HALF, x2: p, y2: HALF }) // 纵线
  }
  return lines
})
</script>

<template>
  <div class="container">
    <RouterLink to="/" class="back-link">← 罗盘列表</RouterLink>

    <svg class="compass-svg" viewBox="0 0 1200 1200" preserveAspectRatio="xMidYMid meet">
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">
        <!-- 先天六十四卦主环：仅显示卦符 + 卦名，隐藏六爻线；环带宽度由组件按字号自动计算 -->
        <GuaRing
          :radius="OUTER_RADIUS"
          :rotation-direction="rotationDirection"
          :show-lines="false"
        />

        <!-- 中央伏羲方图：8×8 整齐排列，卦符 + 卦名 -->
        <g class="gua-square">
          <!-- 网格分隔线 -->
          <line
            v-for="(l, i) in gridLines"
            :key="`grid-${i}`"
            :x1="l.x1"
            :y1="l.y1"
            :x2="l.x2"
            :y2="l.y2"
            stroke="#666"
            stroke-width="0.6"
          />
          <!-- 每格：卦符（上）+ 卦名（下） -->
          <g v-for="cell in squareCells" :key="`cell-${cell.value}`">
            <text
              :x="cell.cx"
              :y="cell.cy - 7"
              fill="#F5E8C8"
              font-size="17"
              text-anchor="middle"
              dominant-baseline="central"
            >
              {{ cell.unicode }}
            </text>
            <text
              :x="cell.cx"
              :y="cell.cy + 11"
              fill="#C8B88A"
              font-size="9"
              font-weight="bold"
              text-anchor="middle"
              dominant-baseline="central"
            >
              {{ cell.name }}
            </text>
          </g>
        </g>
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
