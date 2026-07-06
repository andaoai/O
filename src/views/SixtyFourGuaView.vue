<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import GuaRing from '../components/rings/GuaRing.vue'
import JingFangEightPalaceRing from '../components/rings/JingFangEightPalaceRing.vue'
import ShiYingRing from '../components/rings/ShiYingRing.vue'
import RingStack from '../components/base/RingStack.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useAltDragPan } from '@/composables/useAltDragPan'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'
import { XIANTIAN_64_GUA } from '../data/sixtyFourGua'

/**
 * 先天六十四卦盘 + 京房八宫世应盘
 *
 * 由外到内四层：
 *   1. 先天伏羲卦符环 GuaRing（乾南坤北，按二进制位反转）
 *   2. 京房八宫卦名环 JingFangEightPalaceRing（乾坎艮震巽离坤兑各 8 卦，同宫共色）
 *   3. 世应环 ShiYingRing（本宫/一世/…/游魂/归魂，与京房环一一对齐）
 *   4. 中央 8×8 伏羲方图
 *
 * 先天圆图与京房八宫皆是静态易学分类；controlledTime 仅供控制面板显示。
 * ✨ 阶段三：controlledTime 由 URL ?t=... 驱动，与其它罗盘共享时间锚点
 */

// 时间控制（仅供面板显示，盘面结构与时间无关）
const { controlledTime } = useUrlTime()

// 视图控制：缩放 / 平移 / 旋转（单一 composable 打包）
const viewport = useViewport()
// 解构顶层 refs 给模板使用
const { zoom, offsetX, offsetY, rotationDirection, rotationAngle } = viewport

// Alt + 拖拽平移
const svgRef = ref<SVGSVGElement | null>(null)
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })

provideCompassContext({ time: controlledTime, viewport })

// 三层同心环（外→内）
//   GuaRing (先天卦符 + 卦名，隐藏爻线) → thickness 42
//   JingFangEightPalaceRing (京房八宫卦符 + 卦名 + 宫属色) → thickness 60
//   ShiYingRing (双字世位标签) → thickness 26
const rings = [
  {
    component: markRaw(GuaRing),
    thickness: 42,
    props: { showLines: false }
  },
  {
    component: markRaw(JingFangEightPalaceRing),
    thickness: 60
  },
  {
    component: markRaw(ShiYingRing),
    thickness: 26
  }
]

// 中央伏羲方图：8×8 整齐排列，尺寸固定，位于最内环内圆之中
const SQUARE_SIZE = 480
const CELL = SQUARE_SIZE / 8
const HALF = SQUARE_SIZE / 2

// value → 卦数据（卦符 / 卦名）
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
    lines.push({ x1: -HALF, y1: p, x2: HALF, y2: p })
    lines.push({ x1: p, y1: -HALF, x2: p, y2: HALF })
  }
  return lines
})
</script>

<template>
  <div class="container">
    <svg
      ref="svgRef"
      class="compass-svg"
      :class="{ 'alt-hover': isAltPressed && !isDragging, 'alt-dragging': isDragging }"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoom}) rotate(${rotationAngle})`">
        <RingStack
          :outer-radius="560"
          :gap="3"
          :rings="rings"
          :rotation-direction="rotationDirection"
        >
          <!-- 中央伏羲方图：8×8 整齐排列，卦符 + 卦名 -->
          <template #center>
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
                  :y="cell.cy - 9"
                  fill="#F5E8C8"
                  font-size="22"
                  text-anchor="middle"
                  dominant-baseline="central"
                >
                  {{ cell.unicode }}
                </text>
                <text
                  :x="cell.cx"
                  :y="cell.cy + 14"
                  fill="#C8B88A"
                  font-size="11"
                  font-weight="bold"
                  text-anchor="middle"
                  dominant-baseline="central"
                >
                  {{ cell.name }}
                </text>
              </g>
            </g>
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

/* SVG 元素填满容器，viewBox + preserveAspectRatio 自动等比居中，
   放大 / 平移时不再被短边正方形裁出黑边 */
.compass-svg {
  width: 100%;
  height: 100%;
}

/* Alt 按下 → grab；拖拽中 → grabbing */
.compass-svg.alt-hover {
  cursor: grab;
}
.compass-svg.alt-dragging {
  cursor: grabbing;
}
</style>
