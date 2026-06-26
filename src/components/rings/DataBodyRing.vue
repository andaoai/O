<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from '../base/PolarCanvas.vue'
import BodyMarker from '../celestial/BodyMarker.vue'
import { radialTextRotation, polarToCartesian, normalizeAngle } from '@/utils/geometry'
import type { BodyRingData, Halo } from '@/data/rings/types'

/**
 * 数据驱动天体圆环（BodyRing）
 *
 * 第三类圆环：段导向（CircleRing）/ 点导向（PointRing）/ 体导向（BodyRing）
 *
 * 把七曜等天体统一纳入 RingStack 布局体系：
 * - 接收 BodyRingData 数据（含角度、类型、状态、光晕等）
 * - 渲染：光晕 + 本体 + 符号 + 逆行环 + 黄纬指示线
 * - 由 RingStack 注入 radius/innerRadius/rotationDirection
 * - 与 DataRing / DataPointRing 平级，可任意混用堆叠
 *
 * 典型用法：
 *   - 单行星研究盘：仅含一个 BodyItem
 *   - 双行星合冲对照：含两个 BodyItem
 *   - 七曜全图盘：含 7 个 BodyItem
 *   - 五星聚可视化：分级高亮聚合度
 */
interface Props {
  /** 天体环数据 */
  data: BodyRingData
  /** 环的外半径（由 RingStack 注入） */
  radius?: number
  /** 环的内半径（由 RingStack 注入） */
  innerRadius?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 环带中线偏移（默认 0 = 正中间，正值向外） */
  bandOffset?: number
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 140,
  rotationDirection: 'clockwise',
  bandOffset: 0
})

/** 环带中线半径（天体基准位置） */
const bandMidRadius = computed(() => {
  const mid = (props.radius + props.innerRadius) / 2
  return mid + props.bandOffset
})

/** 默认光晕配置（按 haloLevel 映射） */
const getDefaultHalos = (level: number): Halo[] => {
  switch (level) {
    case 1: return [{ radius: 8, opacity: 0.2 }]
    case 2: return [{ radius: 12, opacity: 0.2 }, { radius: 8, opacity: 0.4 }]
    case 3: return [{ radius: 16, opacity: 0.3 }, { radius: 12, opacity: 0.5 }, { radius: 8, opacity: 0.7 }]
    default: return []
  }
}

/** 处理后的天体列表（合并默认值） */
const processedItems = computed(() => {
  return props.data.items.map((item) => {
    // 光晕来源：item.haloLevel > item.highlightLevel > 默认 2
    const hl = item.haloLevel ?? (item.highlightLevel || (item.highlight ? 2 : 0))
    // 默认尺寸：14px
    const size = item.size ?? 14
    // 光晕配置：data.defaultHalos 优先，否则按 haloLevel 生成
    const halos = props.data.defaultHalos ?? getDefaultHalos(hl)

    return {
      ...item,
      angle: normalizeAngle(item.angle),
      size,
      halos,
      symbolColor: item.symbolColor ?? '#fff'
    }
  })
})

/** 计算天体实际坐标（含黄纬偏移） */
const getBodyCoordinates = (longitude: number, latitude: number | undefined, latScale: number | undefined) => {
  const base = polarToCartesian(longitude, bandMidRadius.value, props.rotationDirection)
  if (!latScale || !latitude || Math.abs(latitude) < 0.5) {
    return { base, actual: base, hasOffset: false }
  }

  // 沿径向方向偏移
  const perpX = base.x / bandMidRadius.value
  const perpY = base.y / bandMidRadius.value
  const offset = Math.sin((latitude * Math.PI) / 180) * latScale

  // 约束到环带内
  const haloMargin = 16
  const minR = props.innerRadius + haloMargin
  const maxR = props.radius - haloMargin
  const targetR = Math.min(Math.max(bandMidRadius.value + offset, minR), maxR)
  const actualOffset = targetR - bandMidRadius.value

  return {
    base,
    actual: {
      x: base.x + perpX * actualOffset,
      y: base.y + perpY * actualOffset
    },
    hasOffset: true
  }
}
</script>

<template>
  <PolarCanvas
    :enable-animation="false"
    :rotation-direction="rotationDirection"
    :center-x="0"
    :center-y="0"
  >
    <template #default="slotProps">
      <g class="data-body-ring">
        <!-- 环带边界（可选，辅助调试） -->
        <circle
          v-if="data.circleColor"
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="radius"
          fill="none"
          :stroke="data.circleColor"
          :stroke-width="data.circleWidth || 1"
          opacity="0.3"
        />
        <circle
          v-if="data.circleColor"
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="innerRadius"
          fill="none"
          :stroke="data.circleColor"
          :stroke-width="data.circleWidth || 1"
          opacity="0.3"
        />

        <!-- 逐个渲染天体 -->
        <g
          v-for="(item, i) in processedItems"
          :key="i"
          class="body-item"
          :class="{ retrograde: item.state?.retrograde }"
        >
          <!-- 坐标计算 -->
          <template v-for="coord in [getBodyCoordinates(item.angle, item.state?.latitude, data.latScale)]" :key="'coord'">
            <!-- 黄纬偏移指示线 -->
            <line
              v-if="data.showLatLine && coord.hasOffset"
              :x1="slotProps.centerX + coord.base.x"
              :y1="slotProps.centerY + coord.base.y"
              :x2="slotProps.centerX + coord.actual.x"
              :y2="slotProps.centerY + coord.actual.y"
              :stroke="item.color"
              stroke-width="1"
              opacity="0.3"
              stroke-dasharray="2,2"
            />

            <!-- 逆行标记环 -->
            <circle
              v-if="data.showRetrogradeRing && item.state?.retrograde"
              :cx="slotProps.centerX + coord.actual.x"
              :cy="slotProps.centerY + coord.actual.y"
              :r="item.size + 4"
              fill="none"
              :stroke="item.color"
              stroke-width="2"
              stroke-dasharray="4,2"
              opacity="0.8"
            />

            <!-- 天体本体（光晕 + 圆 + 符号） -->
            <BodyMarker
              :x="slotProps.centerX + coord.actual.x"
              :y="slotProps.centerY + coord.actual.y"
              :radius="item.size"
              :color="item.color"
              :halos="item.halos"
              :symbol="item.symbol"
              :symbol-color="item.symbolColor"
              :symbol-font-size="item.fontSize || data.fontSize || Math.max(10, item.size * 0.8)"
              :symbol-rotation="radialTextRotation(item.angle, rotationDirection)"
            />

            <!-- 标签（可选，通常用于标注入宿度等） -->
            <text
              v-if="item.label && data.labelOffset !== undefined"
              :x="slotProps.centerX + coord.actual.x"
              :y="slotProps.centerY + coord.actual.y"
              :fill="item.color || data.labelColor || '#ffffff'"
              :font-size="item.fontSize || data.fontSize || 10"
              font-weight="bold"
              text-anchor="middle"
              dominant-baseline="middle"
              :transform="`translate(0, ${data.labelOffset}) rotate(${radialTextRotation(item.angle, rotationDirection)} ${slotProps.centerX + coord.actual.x} ${slotProps.centerY + coord.actual.y})`"
            >{{ item.label }}</text>
          </template>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.data-body-ring {
  pointer-events: none;
}

.body-item {
  transition: all 0.3s ease;
}

.body-item:hover {
  filter: brightness(1.2);
}
</style>
